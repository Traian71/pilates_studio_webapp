// D:\\pilates_app\\src\\app\\instructor_sessions\\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Corrected path
import { Calendar, momentLocalizer, Event, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { User } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area'; // For scrollable client list
import { Loader2 } from 'lucide-react'; // For loading spinner

// Define interfaces for your data
interface StudioSession {
  id: string;
  class_type_id: string | null;
  instructor_id: string;
  start_time: string;
  end_time: string;
  capacity: number; // Directly from API response
  spots_available: number; // Directly from API response
  status: string | null;
  level?: string | null; // Explicitly mark as optional if not always present
  current_attendees?: number; // Will be calculated
  class_types: { name: string; color_code?: string | null } | null;
}

interface ClientInfo {
  id: string; // Booking ID
  client_id: string; // Client ID
  first_name: string;
  last_name: string;
}

interface CalendarEvent extends Event {
  resource?: any; // For react-big-calendar, can store original session data
  title: string; // Explicitly define title
}


const localizer = momentLocalizer(moment);

export default function InstructorSessionsPage() {
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Tracks if a fetch is in progress
  const [initialLoading, setInitialLoading] = useState(true); // Tracks initial page load
  const [error, setError] = useState<string | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>('month'); // Added for calendar view control
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<StudioSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false); // For initial modal draw and basic session info
  const [loadingClients, setLoadingClients] = useState<boolean>(false); // Specifically for the client list loading
  const [bookedClients, setBookedClients] = useState<ClientInfo[]>([]);

  useEffect(() => {
    const fetchUserAndSessions = async () => {
      setLoading(true); // Indicate a fetch is starting
      // Don't reset error here if we want to show stale data while loading new, otherwise fine

      const { data: { user } } = await supabase.auth.getUser();
      if (!user && initialLoading) { // Only set current user if not already set or on initial load
        setCurrentUser(null);
        setError('You must be logged in to view your sessions.');
        setLoading(false);
        setInitialLoading(false);
        return;
      } else if (user && !currentUser) {
        setCurrentUser(user);
      }
      
      // Ensure currentUser is available for instructorId, especially after initial load where it might be set asynchronously
      const effectiveUser = user || currentUser;
      if (!effectiveUser) {
        // This case should ideally not be hit if initial checks are proper
        // but as a fallback if user becomes null unexpectedly mid-session:
        setError('Session expired or user not found. Please log in again.');
        setLoading(false);
        setInitialLoading(false); 
        return;
      }
      const instructorId = effectiveUser.id;

      const startDate = moment(currentCalendarDate).startOf('month').subtract(1, 'week').toISOString();
      const endDate = moment(currentCalendarDate).endOf('month').add(1, 'week').toISOString();

      try {
        // setError(null); // Clear previous errors only before a new fetch attempt if not showing stale data
        // First, get all sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select(`
            *,
            class_types (name, color_code)
          `)
          .eq('instructor_id', instructorId)
          .gte('start_time', startDate)
          .lte('start_time', endDate)
          .order('start_time', { ascending: true });

        if (sessionsError) {
          console.error('Supabase error fetching sessions:', sessionsError);
          throw sessionsError;
        }

        // Filter sessions to only include those that are not empty
        const sessionsWithClients = (sessionsData || []).filter((session: any) => 
          session.spots_available !== session.capacity
        );

        setError(null);

        // Map the filtered sessions to our StudioSession type
        const fetchedSessions: StudioSession[] = sessionsWithClients.map((session: any) => ({
          id: session.id,
          class_type_id: session.class_type_id,
          instructor_id: session.instructor_id,
          start_time: session.start_time,
          end_time: session.end_time,
          capacity: session.capacity,
          spots_available: session.spots_available,
          status: session.status,
          level: session.level ?? null,
          current_attendees: (session.capacity && session.spots_available !== undefined) 
            ? (session.capacity - session.spots_available) 
            : 0,
          class_types: Array.isArray(session.class_types) ? session.class_types[0] : session.class_types
        }));

        setSessions(fetchedSessions);
        const calendarEvents: CalendarEvent[] = fetchedSessions.map(session => ({
          title: session.class_types?.name || 'Pilates Session',
          start: new Date(session.start_time),
          end: new Date(session.end_time),
          allDay: false,
          resource: session,
        }));
        setCalendarEvents(calendarEvents);

      } catch (e: any) {
        console.error('Error fetching sessions:', e);
        // Don't clear existing calendarEvents, show stale data with an error message
        setError('Failed to load some sessions. Displaying previously loaded data if available.');
      } finally {
        setLoading(false);       // Fetch complete
        setInitialLoading(false); // Initial load is complete
      }
    };

    // Fetch user initially, then rely on currentCalendarDate changes
    if (initialLoading && !currentUser) {
        fetchUserAndSessions();
    } else if (currentUser) { // If user is known, fetch on date changes
        fetchUserAndSessions();
    }
  }, [currentUser, currentCalendarDate, initialLoading]); // Removed calendarView from dependencies here, it's controlled by onNavigate/onView

  const handleShowMore = (events: CalendarEvent[], date: Date) => {
    setCalendarView('day');
    setCurrentCalendarDate(date);
  };

  const fetchClientsForSession = async (sessionId: string) => {
    if (!sessionId) {
      setModalLoading(false); // Not a valid session to load, stop modal loading
      setLoadingClients(false); // Ensure client loading is also false
      return;
    }
    setBookedClients([]); 
    setLoadingClients(true); // Specifically start loading the client list

    try {
      // Use the secure database function to get session bookings with client details
      const { data: bookingsData, error: bookingsError } = await supabase
        .rpc('get_session_bookings', { session_id_param: sessionId });
      
      // At this point, basic session info is from the calendar event, so modal itself is no longer "globally" loading.
      setModalLoading(false); 

      console.log('[DIAGNOSTIC] Fetched bookings with client details for session ID', sessionId, ':', JSON.stringify(bookingsData, null, 2));

      if (bookingsError) {
        console.error('Error fetching session bookings:', bookingsError);
        setBookedClients([]); 
        throw bookingsError; 
      }

      if (!bookingsData || bookingsData.length === 0) {
        console.log('[DIAGNOSTIC] No bookings found for session ID:', sessionId);
        setBookedClients([]);
        return; // Client list will be empty, loadingClients stops in finally
      }

      // Transform the data to include the booking ID and client names
      const clientsData = bookingsData.map((booking: { 
        booking_id: string;
        client_id: string;
        first_name: string; 
        last_name: string 
      }) => ({
        id: booking.booking_id, // Use the actual booking ID
        client_id: booking.client_id,
        first_name: booking.first_name,
        last_name: booking.last_name
      }));
      
      setBookedClients(clientsData as any[] || []);

    } catch (error: any) {
      console.error('Error fetching booked clients:', error);
      setBookedClients([]); 
      setModalLoading(false); // Ensure modal doesn't get stuck if there was an error anywhere
    } finally {
      setLoadingClients(false); // Always stop client-specific loading
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setModalLoading(true); // Indicate modal is preparing
    setSelectedSessionForModal(event.resource as StudioSession);
    setIsModalOpen(true);
    fetchClientsForSession((event.resource as StudioSession).id); 
  };

  const eventStyleGetter = (event: CalendarEvent, start: Date, end: Date, isSelected: boolean) => {
    const session = event.resource as StudioSession;
    let backgroundColor = session?.class_types?.color_code || '#2D5D7C'; // Default to Deep Teal
    
    // Example: Make past events slightly faded
    if (moment(start).isBefore(moment(), 'day')) {
        // Simple fade: use a generic semi-transparent dark color for past events
        // or, if you have a utility to convert hex to rgba, you can use it here.
        backgroundColor = 'rgba(70, 70, 70, 0.7)'; // Darker semi-transparent
    }

    const style = {
        backgroundColor,
        borderRadius: '5px',
        opacity: 1,
        color: 'white',
        border: '0px',
        display: 'block',
        padding: '3px 5px',
        fontSize: '0.85em'
    };
    return {
        style: style
    };
  };


  if (initialLoading) { // Show full page loading only on initial load
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-vibrant-coral">Loading your sessions...</p>
        {/* You can add a spinner component here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <p className="text-xl text-vibrant-coral mb-4">{error}</p>
        {/* Optionally, add a retry button or link to login */}
      </div>
    );
  }
  
  if (!currentUser) {
     return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center">
        <img src="/images/logo.png" alt="Balance Studio" className="w-32 h-32 mb-6" />
        <p className="text-xl text-vibrant-coral mb-4">Please log in to view your sessions.</p>
        <a 
          href="/login" 
          className="px-6 py-2 bg-vibrant-coral text-white rounded-lg hover:bg-vibrant-coral/90 transition-colors"
        >
          Go to Login
        </a>
      </div>
    );
  }


  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-vibrant-coral text-center">My Sessions</h1>
        {currentUser && (
          <p className="text-center text-gray-600 mt-2">
            Welcome, {currentUser.user_metadata?.first_name || 'Instructor'}! Here is your schedule.
          </p>
        )}
      </header>
      {/* Calendar section correctly placed within the main div */}
      <div className="bg-white p-2 md:p-6 rounded-xl shadow-2xl">
        <Calendar
          events={calendarEvents}
          localizer={localizer}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 200px)' }} // Adjust height as needed
          eventPropGetter={eventStyleGetter}
          selectable
          onNavigate={(date) => setCurrentCalendarDate(date)}
          onView={(view) => setCalendarView(view)}
          view={calendarView}
          date={currentCalendarDate}
          onShowMore={handleShowMore} // Hook up the handler
          onSelectEvent={handleSelectEvent}
          popup // Enable the default popup for month view day cell overflow
          messages={{
            showMore: total => `+${total} more` // Customize the "+X more" message if needed
          }}
          views={['month', 'week', 'day', 'agenda']} // Ensure all desired views are enabled
          className="rounded-lg" // Optional: for additional styling
        />
      </div>

      {/* Footer correctly placed within the main div */}
      <footer className="text-center mt-8 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Balance Studio. All rights reserved.</p>
      </footer>

      {/* Modal also within the main div */}
      {selectedSessionForModal && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px] md:sm:max-w-[550px] bg-zinc-800 border-zinc-700 text-zinc-100">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">{selectedSessionForModal.class_types?.name || 'Pilates Session'}</DialogTitle>
              <DialogDescription className="text-zinc-300 mt-1">
                {moment(selectedSessionForModal.start_time).format('dddd, MMMM Do YYYY')}
                <br />
                {moment(selectedSessionForModal.start_time).format('LT')} - {moment(selectedSessionForModal.end_time).format('LT')}
                <br />
                Level: <span className="font-medium text-zinc-200">{selectedSessionForModal.level ? selectedSessionForModal.level.charAt(0).toUpperCase() + selectedSessionForModal.level.slice(1) : (selectedSessionForModal.class_types?.name || 'N/A')}</span>
                <br />
                Capacity: <span className="font-medium text-zinc-200">{selectedSessionForModal.current_attendees ?? 0} / {selectedSessionForModal.capacity}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-6">
              <h4 className="font-semibold mb-3 text-zinc-100">Booked Clients:</h4>
              {loadingClients ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                  <p className="ml-3 text-zinc-400">Loading clients...</p>
                </div>
              ) : bookedClients.length > 0 ? (
                <ScrollArea className="max-h-[150px] w-full rounded-md border border-zinc-700 p-3 bg-zinc-700/50">
                  <ul className="space-y-2">
                    {bookedClients.map((client, index) => (
                      <li key={index} className="text-sm text-zinc-200">
                        {client.first_name} {client.last_name}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-sm text-zinc-400 italic">No clients booked for this session yet.</p>
              )}
            </div>

            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button 
                  type="button" 
                  variant="outline"
                  className="bg-zinc-700 border-zinc-600 hover:bg-zinc-600 hover:text-zinc-100 text-zinc-200"
                >
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
