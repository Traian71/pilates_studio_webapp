'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type DayPickerSingleProps } from 'react-day-picker';

// Define interfaces based on your schema
interface Session {
  id: string;
  instructor_id: string;
  class_type_id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  spots_available: number;
  current_attendees?: number;
  instructor?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  class_type?: {
    id: string;
    name: string;
  };
  bookings?: {
    id: string;
  }[];
}

interface Booking {
  id: string;
  client_id: string;
  session_id: string;
  booking_time?: string;
  status?: string;
  session?: Session;
};

// Time slot generation function
const generateTimeSlots = (date: Date) => {
  const timeSlots: { time: string; selected: boolean }[] = [];
  const startTime = new Date(date);
  startTime.setHours(9, 0, 0, 0); // Start at 9:00
  const endTime = new Date(date);
  endTime.setHours(21, 0, 0, 0); // End at 21:00

  let currentTime = new Date(startTime);
  while (currentTime <= endTime) {
    timeSlots.push({
      time: format(currentTime, 'HH:mm'),
      selected: false
    });
    currentTime.setMinutes(currentTime.getMinutes() + 60); // Add 1 hour
  }

  return timeSlots;
};

export default function InstructorReschedulePage() {
  const router = useRouter();
  const { sessionId: bookingId } = useParams(); // This is actually a booking ID
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);

  // Time slots for the day
  const TIME_SLOTS = [
    '08:00', '09:15', '10:30', '11:45', 
    '13:00', '14:15', '15:30', '16:45', '18:00'
  ];

  // Session duration in minutes
  const getSessionDuration = (): number => {
    return 60;
  };

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
  };

  const handleDateSelect: DayPickerSingleProps['onSelect'] = async (date) => {
    if (date) {
      setSelectedDate(date);
      setSelectedTimeSlot(null); // Clear time slot when date changes
      setAvailableSessions([]); // Clear sessions when date changes
    }
  };

  // Removed original functions as they're now defined with useCallback above

  // Function to get session availability information for a time slot - memoized to prevent recalculations
  const getSessionForTimeSlot = useCallback((time: string) => {
    if (!selectedDate || !availableSessions || !availableSessions.length) return null;

    const [hours, minutes] = time.split(':').map(Number);
    const targetTime = new Date(selectedDate);
    targetTime.setHours(hours, minutes, 0, 0);
    
    const duration = getSessionDuration();
    const targetEndTime = new Date(targetTime.getTime() + duration * 60000);
    
    // Find sessions that start at exactly this time
    // This is more precise than checking for overlaps
    const exactMatch = availableSessions.find(session => {
      const sessionStartTime = new Date(session.start_time);
      return (
        sessionStartTime.getHours() === hours && 
        sessionStartTime.getMinutes() === minutes
      );
    });
    
    if (exactMatch) {
      console.log('Found exact time match for session:', exactMatch.id);
      return exactMatch;
    }
    
    // As a fallback, find sessions that overlap with this time slot
    return availableSessions.find(session => {
      const sessionStartTime = new Date(session.start_time);
      const sessionEndTime = new Date(session.end_time);
      
      const overlaps = (
        (targetTime >= sessionStartTime && targetTime < sessionEndTime) ||
        (targetEndTime > sessionStartTime && targetEndTime <= sessionEndTime) ||
        (targetTime <= sessionStartTime && targetEndTime >= sessionEndTime)
      );
      
      if (overlaps) {
        console.log('Found overlapping session:', session.id);
      }
      
      return overlaps;
    }) || null;
  }, [selectedDate, availableSessions]);

  // Function to check if a session is compatible with the current booking
  const isSessionCompatible = useCallback((session: Session) => {
    if (!currentSession || !currentSession.instructor_id || !currentSession.class_type_id) {
      console.log('Current session data is incomplete for compatibility check:', currentSession);
      return false;
    }

    if (!session || !session.instructor_id || !session.class_type_id) {
      console.log('Target session data is incomplete for compatibility check:', session);
      return false;
    }

    // Debug logs
    console.log('Checking compatibility between sessions:', {
      currentSession: {
        id: currentSession.id,
        instructor_id: currentSession.instructor_id,
        class_type_id: currentSession.class_type_id,
      },
      targetSession: {
        id: session.id,
        instructor_id: session.instructor_id,
        class_type_id: session.class_type_id,
      }
    });

    // Check if the session is the same as the current session
    if (session.id === currentSession.id) {
      console.log('Same session, not compatible for reschedule');
      return false;
    }

    // Check if the session has the same instructor and class type
    const isCompatible = 
      session.instructor_id === currentSession.instructor_id && 
      session.class_type_id === currentSession.class_type_id;

    console.log('Session compatibility result:', {
      isCompatible,
      reason: isCompatible ? 
        'Same instructor and class type' : 
        `Mismatch - Instructor: ${session.instructor_id === currentSession.instructor_id ? 'match' : 'different'}, ` +
        `Class Type: ${session.class_type_id === currentSession.class_type_id ? 'match' : 'different'}`,
      session_data: session,
      current_session_data: currentSession
    });
    
    return isCompatible;
  }, [currentSession]);

  // Memoized TimeSlot component to prevent unnecessary re-renders
  const TimeSlot = React.memo(({ 
    time, 
    isSelected, 
    onSelect, 
    feedbackText,
    isSelectable = true
  }: { 
    time: string, 
    isSelected: boolean, 
    onSelect: (time: string) => void, 
    feedbackText: string,
    isSelectable?: boolean
  }) => {
    // Determine button styling based on selection state and availability
    const buttonStyle = isSelected
      ? 'bg-[#E57F84] hover:bg-[#E57F84]/90 text-white'
      : !isSelectable
        ? 'bg-[#EBCECE] text-gray-500 opacity-80 cursor-not-allowed'
        : '';
    
    return (
      <Button
        variant={isSelected ? "default" : "outline"}
        className={`text-xs py-1 px-2 h-auto ${buttonStyle}`}
        onClick={() => isSelectable && onSelect(time)}
        disabled={!isSelectable}
      >
        <div className="flex flex-col items-center">
          <span>{time}</span>
          <span className="text-[10px] mt-1">{feedbackText}</span>
        </div>
      </Button>
    );
  });

  TimeSlot.displayName = 'TimeSlot';

  // Function to render the feedback text for a time slot
  const renderTimeSlotFeedback = useCallback((time: string) => {
    const session = getSessionForTimeSlot(time);
    
    // If no session exists at this time, it's a new session slot
    if (!session) return 'Ședință Nouă';
    
    // Current session being rescheduled
    if (currentSession && session.id === currentSession.id) return 'Ocupat';
    
    // Check if session is compatible (same instructor and class type)
    const isCompatible = isSessionCompatible(session);
    
    if (!isCompatible) {
      // Show "Ocupat" for sessions with different class type or instructor
      return 'Ocupat';
    }
    
    // For compatible sessions, calculate available spots
    const spotsTotal = session.capacity || 4; // Default to 4 if capacity is not specified
    const spotsBooked = session.bookings?.length || 0;
    const spotsAvailable = spotsTotal - spotsBooked;
    
    if (spotsAvailable <= 0) {
      // Show "Ocupat" for full sessions
      return 'Ocupat';
    }
    
    // Show available spots for compatible sessions with space
    return `${spotsAvailable} locuri rămase`;
  }, [getSessionForTimeSlot, currentSession, isSessionCompatible]);

  // Fetch sessions for the selected date using our secure function
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedDate || !currentSession) return;

      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      try {
        // First fetch the sessions data using our secure function
        const { data: sessionsData, error: sessionsError } = await supabase
          .rpc('get_instructor_sessions', {
            start_date_param: dayStart.toISOString(),
            end_date_param: dayEnd.toISOString()
          });

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
          return;
        }

        // Then fetch the bookings for these sessions using our secure function
        if (sessionsData && sessionsData.length > 0) {
          const sessionIds = sessionsData.map((s: any) => s.id);
          const { data: bookingsData, error: bookingsError } = await supabase
            .rpc('get_bookings_for_sessions', {
              session_ids: sessionIds
            });

          if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
            return;
          }

          // Combine the data
          const sessionsWithBookings = sessionsData.map((session: any) => ({
            ...session,
            instructor: {
              id: session.instructor_id,
              first_name: session.instructor_first_name,
              last_name: session.instructor_last_name
            },
            class_type: {
              id: session.class_type_id,
              name: session.class_type_name
            },
            bookings: bookingsData?.filter((b: any) => b.session_id === session.id) || []
          }));

          setAvailableSessions(sessionsWithBookings);
        } else {
          setAvailableSessions([]);
        }
      } catch (e: any) {
        console.error('Error fetching sessions:', e);
        setAvailableSessions([]);
      }
    };

    fetchSessions();
  }, [selectedDate, currentSession]);

  const handleReschedule = async () => {
    if (!currentSession || !selectedDate || !selectedTimeSlot) return;

    setLoading(true);
    setError(null);

    const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    const duration = getSessionDuration();
    const endTime = new Date(startTime.getTime() + duration * 60000);

    console.log('DEBUG - Starting reschedule process:');
    console.log('Current session:', currentSession);
    console.log('Selected date:', selectedDate);
    console.log('Selected time slot:', selectedTimeSlot);
    console.log('Start time:', startTime.toISOString());
    console.log('End time:', endTime.toISOString());

    try {
      // Check if there's an existing compatible session at this time slot
      const existingSession = getSessionForTimeSlot(selectedTimeSlot);
      console.log('Existing session found:', existingSession);
      
      let targetSessionId;

      if (existingSession && isSessionCompatible(existingSession) && 
          existingSession.id !== currentSession.id) {
        // Use the existing session
        console.log('Using existing compatible session:', existingSession.id);
        targetSessionId = existingSession.id;
        console.log('Target session ID set to existing session:', targetSessionId);
      } else {
        // Create a new session
        console.log('Creating new session for this time slot');
        console.log('Session data to insert:', {
          class_type_id: currentSession.class_type_id,
          instructor_id: currentSession.instructor_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          capacity: currentSession.capacity,
          spots_available: currentSession.capacity,
          status: 'scheduled'
        });
        
        const { data: newSession, error: newSessionError } = await supabase
          .from('sessions')
          .insert({
            class_type_id: currentSession.class_type_id,
            instructor_id: currentSession.instructor_id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            capacity: currentSession.capacity,
            spots_available: currentSession.capacity,
            status: 'scheduled', 
          })
          .select()
          .single();
          
        if (newSessionError) {
          console.error('Error creating new session:', newSessionError);
          throw newSessionError;
        }
        
        console.log('New session created:', newSession);
        targetSessionId = newSession.id;
        console.log('Target session ID set to new session:', targetSessionId);
      }

      // We already have the booking ID from the URL parameter
      if (!currentBooking) {
        console.error('No booking found to update');
        setError('No booking found to update');
        setLoading(false);
        return;
      }
      
      console.log('Updating booking:', currentBooking.id);
      console.log('From session:', currentSession?.id);
      console.log('To session:', targetSessionId);
      
      // Log the exact SQL query we're about to execute (for debugging)
      console.log('DEBUG - Booking update operation:');
      console.log('Table: bookings');
      console.log('Update: { session_id:', targetSessionId, '}');
      console.log('Where: { id:', currentBooking.id, '}');
      
      // First check if the booking exists
      const { data: checkBooking, error: checkError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', currentBooking.id)
        .single();
        
      if (checkError) {
        console.error('Error checking if booking exists:', checkError);
        setError(`Booking not found: ${checkError.message}`);
        setLoading(false);
        return;
      }
      
      console.log('Booking found before update:', checkBooking);
      
      // Try to update the booking using the standard API first
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({ session_id: targetSessionId })
        .eq('id', currentBooking.id)
        .select();
        
      if (updateError) {
        console.error(`Error updating booking ${currentBooking.id}:`, updateError);
        console.log('Trying RPC function update method...');
        
        // Use the RPC function we created to bypass RLS policies
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('update_booking_session', {
            booking_id: currentBooking.id,
            new_session_id: targetSessionId
          });
          
          if (rpcError) {
            console.error('RPC update failed:', rpcError);
            setError(`Failed to update booking: ${rpcError.message}`);
            setLoading(false);
            return;
          }
          
          console.log('RPC update successful:', rpcData);
          
          if (rpcData === false) {
            console.error('RPC function returned false - booking may not exist');
            setError('Booking update failed - booking may not exist');
            setLoading(false);
            return;
          }
        } catch (rpcException) {
          console.error('RPC exception:', rpcException);
          setError(`Exception during booking update: ${rpcException}`);
          setLoading(false);
          return;
        }
      } else {
        console.log(`Successfully updated booking ${currentBooking.id}:`, data);
      }
      
      // Skip verification if we're using RPC since we already know it worked
      // Only verify if we used the standard API update
      if (!updateError) {
        // Direct query to check if the booking was updated
        try {
          const { data: directData, error: directError } = await supabase.rpc('check_booking_session', {
            booking_id: currentBooking.id,
            expected_session_id: targetSessionId
          });
          
          console.log('Direct verification result:', directData);
          
          if (directError) {
            console.error('Error with direct verification:', directError);
          } else if (directData === false) {
            console.error('Direct verification failed - booking was not updated');
            // Don't return here, we'll try the RPC update function instead
            
            // Use our RPC function as a last resort
            console.log('Trying RPC update as final attempt...');
            const { data: rpcData, error: rpcError } = await supabase.rpc('update_booking_session', {
              booking_id: currentBooking.id,
              new_session_id: targetSessionId
            });
            
            if (rpcError) {
              console.error('Final RPC update failed:', rpcError);
              setError(`Failed to update booking: ${rpcError.message}`);
              setLoading(false);
              return;
            }
            
            console.log('Final RPC update result:', rpcData);
          }
        } catch (verifyException) {
          console.error('Verification exception:', verifyException);
          // Continue anyway, don't block the flow
        }
      }
      
      console.log('Booking successfully updated');

      // Redirect back to instructor profile
      router.push('/instructor_profile');

    } catch (e: any) {
      console.error('Reschedule failed:', e);
      setError(e.message || 'An unexpected error occurred during rescheduling.');
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      const fetchBookingAndSessionDetails = async () => {
        try {
          // Ensure bookingId is a string and extract just the UUID part if it contains additional parts (like client name)
          const bookingIdStr = Array.isArray(bookingId) ? bookingId[0] : bookingId;
          const bookingUuid = bookingIdStr.split('_')[0];
          
          console.log('Original booking ID:', bookingIdStr);
          console.log('Extracted booking UUID:', bookingUuid);
          
          // First, try to get the booking with its session details
          console.log('Attempting to fetch booking with session details...');
          const { data: bookingData, error: bookingError } = await supabase
            .rpc('get_booking_with_session', { booking_id_param: bookingUuid });

          console.log('RPC call result:', { data: bookingData, error: bookingError });

          if (bookingError) {
            console.error('RPC Error:', bookingError);
            throw new Error(`Failed to fetch booking: ${bookingError.message}`);
          }

          if (!bookingData) {
            throw new Error('No data returned from get_booking_with_session');
          }

          console.log('Fetched booking data:', bookingData);

          // If we got here, we have valid booking data
          const sessionData = {
            id: bookingData.session_id,
            instructor_id: bookingData.instructor_id,
            class_type_id: bookingData.class_type_id,
            start_time: bookingData.start_time,
            end_time: bookingData.end_time,
            capacity: bookingData.capacity,
            spots_available: bookingData.spots_available,
            status: bookingData.status,
            class_type: {
              id: bookingData.class_type_id,
              name: bookingData.class_type_name || 'Unknown Class'
            },
            instructor: {
              id: bookingData.instructor_id,
              first_name: bookingData.instructor_first_name || 'Unknown',
              last_name: bookingData.instructor_last_name || 'Instructor'
            }
          };

          // Transform the data to match our interfaces
          const booking = {
            id: bookingData.booking_id,
            client_id: bookingData.client_id,
            session_id: bookingData.session_id,
            booking_time: bookingData.booking_time,
            status: bookingData.status
          };

          // The session data is already properly formatted
          const session = {
            ...sessionData,
            bookings: [] // Initialize empty array for bookings
          };

          console.log('Setting current session with data:', {
            id: session.id,
            instructor_id: session.instructor_id,
            class_type_id: session.class_type_id,
            start_time: session.start_time,
            end_time: session.end_time,
            capacity: session.capacity,
            spots_available: session.spots_available,
            status: session.status
          });

          console.log('Setting current session:', session);
          setCurrentSession(session);
          setCurrentBooking(booking);
          
          // Set the selected date to the session's date
          if (session.start_time) {
            const sessionDate = new Date(session.start_time);
            setSelectedDate(sessionDate);
          }

          setLoading(false);
        } catch (error) {
          console.error('Error in fetchBookingAndSessionDetails:', error);
          setError('An error occurred while fetching booking details');
          setLoading(false);
        }
      };

      fetchBookingAndSessionDetails();
    }, [bookingId]); // Add bookingId to the dependency array

    // Watch for changes to currentSession and fetch available sessions
    // We're already handling session fetching in the useEffect above

    // Add a debug log to check session data
    useEffect(() => {
      if (availableSessions.length > 0) {
        console.log('Available sessions:', availableSessions);
      }
    }, [availableSessions]);

    return (
      <div className="min-h-screen bg-[#EBCECE] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="text-white p-6 relative" style={{ backgroundImage: 'url(/images/AdobeStock_142637447.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-black/30 z-0"></div>
              <div className="relative z-10">
                <CardTitle className="text-3xl font-bold text-center">Reprogramare Ședință</CardTitle>
              </div>
            </CardHeader>
          <CardContent className="p-6 md:p-8">
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-sm">Error: {error}</p>}

            {currentSession && (
              <div>
                <div className="md:flex md:space-x-6">
                  <div className="mb-4 md:mb-0 md:w-1/2 flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      className="rounded-md border shadow-md"
                      disabled={(date: Date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} // Disable past dates
                    />
                  </div>
                  <div className="md:w-1/2">
                    <h4 className="text-md font-medium text-foreground mb-2">Intervale Disponibile pentru {selectedDate?.toLocaleDateString()}:</h4>
                    {loading && <p>Încarcare intervale...</p>}
                    {!loading && selectedDate && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TIME_SLOTS.map((slot, index) => {
                          const session = getSessionForTimeSlot(slot);
                          const feedbackText = renderTimeSlotFeedback(slot);
                          
                          // A slot is selectable if:
                          // 1. It's a new session (no session exists at this time), OR
                          // 2. It's a compatible session with available spots
                          const isSelectable = !session || (
                            isSessionCompatible(session) && 
                            ((session.capacity || 4) - (session.bookings?.length || 0)) > 0
                          );
                          
                          // Debug log to help verify selection logic
                          console.log('Time slot:', slot, {
                            hasSession: !!session,
                            isCompatible: session ? isSessionCompatible(session) : 'N/A',
                            spotsAvailable: session ? (session.capacity || 4) - (session.bookings?.length || 0) : 'N/A',
                            isSelectable
                          });
                          
                          return (
                            <TimeSlot
                              key={index}
                              time={slot}
                              isSelected={selectedTimeSlot === slot}
                              onSelect={handleTimeSlotSelect}
                              feedbackText={feedbackText}
                              isSelectable={isSelectable}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Moved the button outside the flex container to position at bottom */}
                {selectedTimeSlot && (
                  <div className="mt-6">
                    <Button
                      onClick={handleReschedule}
                      className="w-full bg-[#E57F84] text-white hover:bg-[#E57F84]/90"
                    >
                      Confirmează Reprogramare
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}