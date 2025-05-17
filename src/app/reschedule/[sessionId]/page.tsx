'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notification } from '@/components/ui/notification';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { SelectSingleEventHandler } from 'react-day-picker';
import josefinSans from '@/app/layout';
import { useAuth } from '@/contexts/AuthContext';

// Add type definitions for the components
interface CalendarProps {
  mode: 'single';
  selected: Date | undefined;
  onSelect: (day: Date | undefined) => void;
  disabled: (day: Date) => boolean;
  className?: string;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
}

interface CardHeaderProps {
  children: React.ReactNode;
}

interface Session {
  id: string;
  class_type_id: string;
  instructor_id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  spots_available: number;
  status: string | null;
  instructor: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  class_type: {
    name: string;
  };
};

export default function ReschedulePage() {
  const router = useRouter();
  const { sessionId } = useParams();
  const { session } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchBookingAndSession = async () => {
      try {
        // Get the booking by booking_id (which comes from URL params)
        const { data: booking } = await supabase
          .from('bookings')
          .select(`
            *,
            session:session_id(*,
              instructor:instructor_id(
                first_name,
                last_name,
                phone
              ),
              class_type:class_type_id(name)
            )
          `)
          .eq('id', sessionId)
          .single();

        if (!booking?.session) {
          setError('Booking not found');
          setLoading(false);
          return;
        }

        setCurrentSession(booking.session);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load session details');
        setLoading(false);
      }
    };

    fetchBookingAndSession();
  }, [sessionId]);

  const fetchSessionsForDate = async (date: Date) => {
    try {
      // First, get all sessions for the selected date
      const { data: allSessions } = await supabase
        .from('sessions')
        .select(`
          *,
          instructor:instructor_id(
            first_name,
            last_name
          ),
          class_type:class_type_id(name)
        `)
        .gte('start_time', format(date, 'yyyy-MM-dd'))
        .lt('start_time', format(new Date(date.getTime() + 86400000), 'yyyy-MM-dd'))
        .order('start_time');

      // Then get all sessions the user is booked in
      const { data: bookedSessions } = await supabase
        .from('bookings')
        .select('session_id')
        .eq('client_id', session?.user?.id)
        .eq('status', 'confirmed');

      // Filter out sessions the user is already booked in
      const availableSessions = allSessions?.filter(session => 
        !bookedSessions?.some(booking => booking.session_id === session.id)
      ) || [];

      setAvailableSessions(availableSessions);
    } catch (err) {
      setError('Failed to load available sessions');
      console.error('Error fetching sessions:', err);
    }
  };

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    await fetchSessionsForDate(date);
  };

  const handleReschedule = async (newSessionId: string) => {
    try {
      // First, make sure we have a current session
      if (!currentSession) {
        throw new Error('Current session not found');
      }

      // Update the booking to the new session
      const { data: updateResult } = await supabase
        .from('bookings')
        .update({ session_id: newSessionId })
        .eq('id', sessionId)
        .select();

      console.log('Booking update result:', updateResult);

      // Check if the old session has any remaining bookings
      const { data: remainingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('session_id', currentSession.id);

      console.log('Remaining bookings:', remainingBookings);

      // If no bookings remain, delete the session
      if (remainingBookings?.length === 0) {
        console.log('Deleting session:', currentSession.id);
        const { data: deleteResult, error: deleteError } = await supabase
          .from('sessions')
          .delete()
          .eq('id', currentSession.id);

        if (deleteError) {
          console.error('Error deleting session:', deleteError);
          throw deleteError;
        }

        console.log('Session deleted successfully');
      }

      router.push('/profile');
    } catch (err) {
      setError('Failed to reschedule session');
      console.error('Error rescheduling:', err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 sm:w-3/4 w-full max-w-3xl">
      <Notification message="Vă puteți reprograma doar în alte sesiuni existente. Pentru mai multe opțiuni, contactați instructorul." />
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold font-sans">Reprogramează sesiunea</h2>
          <p className="text-gray-600">
            Sesiunea actuală: {currentSession?.class_type?.name || 'Loading...'} cu {currentSession?.instructor?.first_name || 'Loading...'} {currentSession?.instructor?.last_name || 'Loading...'}
            <br />
            {currentSession?.start_time ? new Date(currentSession.start_time).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Loading...'}
            <br />
            {currentSession?.start_time ? new Date(currentSession.start_time).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : 'Loading...'}
            <br />
            Telefon instructor: {currentSession?.instructor?.phone || 'Loading...'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-[300px]">
                <h3 className="text-lg font-bold text-[#E57F84] font-inter text-center">Selectați o nouă dată</h3>
              </div>
              <div className="w-[300px]">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    if (day) {
                      handleDateSelect(day);
                    }
                  }}
                  disabled={(date) => 
                    date < new Date() || 
                    date.getTime() - Date.now() < 24 * 60 * 60 * 1000 // Disable dates within 24 hours
                  }
                  className="w-full"
                />
              </div>
            </div>

            {selectedDate && availableSessions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 font-inter">Sesiuni disponibile</h3>
                {availableSessions.map((session) => (
                  <Card key={session.id} className="mb-4">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex flex-col flex-grow">
                          <h4 className="font-semibold font-inter">
                            {new Date(session.start_time).toLocaleTimeString('ro-RO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {session.instructor.first_name} {session.instructor.last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {session.class_type.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {session.capacity - session.spots_available}/{session.capacity} locuri disponibile
                          </p>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button 
                            onClick={() => handleReschedule(session.id)}
                            className="inline-block sm:px-6 sm:py-2 px-2 py-0.125 text-xs sm:text-sm h-8 sm:h-auto bg-[#E57F84] hover:bg-[#E57F84]/90 text-white"
                          >
                            Reprogramează-te aici
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedDate && availableSessions.length === 0 && (
              <p className="text-gray-600">Nu sunt sesiuni disponibile în această dată</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
