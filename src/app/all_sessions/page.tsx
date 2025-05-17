'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

// Define interfaces for your data
interface StudioSession {
  id: string;
  class_type_id: string | null;
  instructor_id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  spots_available: number;
  status: string | null;
  level?: string | null;
  current_attendees?: number;
  class_types: { name: string; color_code?: string | null } | null;
}

interface ClientInfo {
  first_name: string;
  last_name: string;
}

interface CalendarEvent extends Event {
  resource?: any;
  title: string;
}

const localizer = momentLocalizer(moment);

export default function AllSessionsPage() {
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>('month');
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<StudioSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [loadingClients, setLoadingClients] = useState<boolean>(false);
  const [bookedClients, setBookedClients] = useState<ClientInfo[]>([]);

  useEffect(() => {
    const fetchUserAndSessions = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user && initialLoading) {
        setCurrentUser(null);
        setError('You must be logged in to view sessions.');
        setLoading(false);
        setInitialLoading(false);
        return;
      } else if (user && !currentUser) {
        setCurrentUser(user);
      }
      
      const effectiveUser = user || currentUser;
      if (!effectiveUser) {
        setError('Session expired or user not found. Please log in again.');
        setLoading(false);
        setInitialLoading(false); 
        return;
      }

      const startDate = moment(currentCalendarDate).startOf('month').subtract(1, 'week').toISOString();
      const endDate = moment(currentCalendarDate).endOf('month').add(1, 'week').toISOString();

      try {
        // Fetch all sessions without instructor filter
        const { data, error: sessionsError } = await supabase
          .from('sessions')
          .select(`
            *,
            class_types (name, color_code)
          `)
          .gte('start_time', startDate)
          .lte('start_time', endDate)
          .order('start_time', { ascending: true });

        if (sessionsError) {
          console.error('Supabase error fetching sessions:', sessionsError);
          throw sessionsError;
        }
        
        setError(null);

        const fetchedSessions = (data || []).map(s => ({
          ...s,
          level: s.level ?? null,
          current_attendees: (s.capacity && s.spots_available !== undefined) ? (s.capacity - s.spots_available) : 0,
          class_types: Array.isArray(s.class_types) ? s.class_types[0] : s.class_types
        })) as StudioSession[];

        setSessions(fetchedSessions);
        const events: CalendarEvent[] = fetchedSessions.map(session => ({
          title: session.class_types?.name || 'Pilates Session',
          start: new Date(session.start_time),
          end: new Date(session.end_time),
          allDay: false,
          resource: session,
        }));
        setCalendarEvents(events);

      } catch (e: any) {
        console.error('Error fetching sessions:', e);
        setError('Failed to load some sessions. Displaying previously loaded data if available.');
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    if (initialLoading && !currentUser) {
        fetchUserAndSessions();
    } else if (currentUser) {
        fetchUserAndSessions();
    }
  }, [currentUser, currentCalendarDate, initialLoading]);

  const handleShowMore = (events: CalendarEvent[], date: Date) => {
    setCalendarView('day');
    setCurrentCalendarDate(date);
  };

  const fetchClientsForSession = async (sessionId: string) => {
    if (!sessionId) {
      setModalLoading(false);
      setLoadingClients(false);
      return;
    }
    setBookedClients([]);
    setLoadingClients(true);

    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, client_id')
        .eq('session_id', sessionId);
      
      setModalLoading(false);

      if (bookingsError) {
        console.error('Error fetching booking client_ids for session:', bookingsError);
        setBookedClients([]);
        throw bookingsError;
      }

      if (!bookingsData || bookingsData.length === 0) {
        setBookedClients([]);
        return;
      }

      const clientIds = bookingsData.map(b => b.client_id).filter(id => id !== null) as string[];
      if (clientIds.length === 0) {
        setBookedClients([]);
        return;
      }

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .in('id', clientIds);

      if (clientsError) {
        console.error('Error fetching client details:', clientsError);
        setBookedClients([]);
        throw clientsError;
      }

      setBookedClients(clientsData as ClientInfo[] || []);

    } catch (error: any) {
      console.error('Error fetching booked clients:', error);
      setBookedClients([]);
      setModalLoading(false);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setModalLoading(true);
    setSelectedSessionForModal(event.resource as StudioSession);
    setIsModalOpen(true);
    fetchClientsForSession((event.resource as StudioSession).id);
  };

  const eventStyleGetter = (event: CalendarEvent, start: Date, end: Date, isSelected: boolean) => {
    const session = event.resource as StudioSession;
    let backgroundColor = session?.class_types?.color_code || '#2D5D7C';
    
    if (moment(start).isBefore(moment(), 'day')) {
        backgroundColor = 'rgba(70, 70, 70, 0.7)';
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

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-vibrant-coral">Loading sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <p className="text-xl text-vibrant-coral mb-4">{error}</p>
      </div>
    );
  }
  
  if (!currentUser) {
     return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center">
        <img src="/images/logo.png" alt="Balance Studio" className="w-32 h-32 mb-6" />
        <p className="text-xl text-vibrant-coral mb-4">Please log in to view sessions.</p>
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
        <h1 className="text-3xl md:text-4xl font-bold text-vibrant-coral text-center">All Sessions</h1>
        {currentUser && (
          <p className="text-center text-gray-600 mt-2">
            Welcome, {currentUser.user_metadata?.first_name || 'Admin'}! Here are all scheduled sessions.
          </p>
        )}
      </header>
      <div className="bg-white p-2 md:p-6 rounded-xl shadow-2xl">
        <Calendar
          events={calendarEvents}
          localizer={localizer}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 200px)' }}
          eventPropGetter={eventStyleGetter}
          selectable
          onNavigate={(date) => setCurrentCalendarDate(date)}
          onView={(view) => setCalendarView(view)}
          view={calendarView}
          date={currentCalendarDate}
          onShowMore={handleShowMore}
          onSelectEvent={handleSelectEvent}
          popup
          messages={{
            showMore: total => `+${total} more`
          }}
          views={['month', 'week', 'day', 'agenda']}
          className="rounded-lg"
        />
      </div>

      <footer className="text-center mt-8 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Balance Studio. All rights reserved.</p>
      </footer>

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
