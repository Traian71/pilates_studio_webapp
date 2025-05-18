'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react"; // For dropdown arrow icon

interface Session {
  id: string;
  start_time?: string;
}

interface Booking {
  id: string;
  session_id: string;
  client_id: string;
  session?: Session;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  sessions: Session[];
  bookings: Booking[];
}

// Memoized client list component to prevent unnecessary re-renders
const ClientList = React.memo(({ clients, router }: { clients: Client[], router: any }) => {
  return (
    <Card className="mt-12 max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Clienti</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {clients.length > 0 ? (
          clients.map((client) => (
            <div key={client.id} className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{client.first_name} {client.last_name}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-fit">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-2">
                    {client.sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between w-full p-2 border-t border-gray-200">
                        <span className="flex-1">
                          {session.start_time ? new Date(session.start_time).toLocaleDateString('ro-RO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data necunoscută'}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Find the booking ID for this session and client
                            const booking = client.bookings?.find(b => b.session_id === session.id);
                            
                            if (booking) {
                              router.push(`/instructor_reschedule/${booking.id}`);
                            } else {
                              console.error('No booking found for this session');
                              alert('No booking found for this session');
                            }
                          }}
                          className="w-fit"
                        >
                          Reprogramare
                        </Button>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <p>Nu aveți clienți în acest moment.</p>
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if the clients array has actually changed
  return prevProps.clients === nextProps.clients;
});

ClientList.displayName = 'ClientList';

// Memoized instructor profile component
const InstructorProfile = React.memo(({ 
  instructorData, 
  router, 
  handleLogout 
}: { 
  instructorData: any, 
  router: any, 
  handleLogout: () => Promise<void> 
}) => {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Profil Instructor</CardTitle>
        {/* Profile Image or Avatar Fallback */}
        <div className="flex justify-center pt-4">
          {instructorData.profile_image_url ? (
            <Image 
              src={instructorData.profile_image_url} 
              alt={`${instructorData.first_name} ${instructorData.last_name}`}
              width={120}
              height={120} 
              className="rounded-full object-cover border-2 border-deep-teal shadow-sm"
            />
          ) : (
            <Avatar className="w-28 h-28 border-2 border-deep-teal shadow-sm">
              <AvatarFallback className="text-3xl bg-gray-200 text-deep-teal">
                {instructorData.first_name?.[0]?.toUpperCase()}
                {instructorData.last_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 pt-4 pb-8"> 
          <div>
            <p className="text-lg font-semibold">
              {instructorData.first_name} {instructorData.last_name}
            </p>
            <p className="text-sm text-gray-600">E-mail: {instructorData.email}</p>
            {instructorData.phone && (
              <p className="text-sm text-gray-600">Telefon: {instructorData.phone}</p>
            )}
          </div>

          {instructorData.bio && (
            <div>
              <h3 className="font-sans text-lg">Biografie</h3>
              <p className="text-sm text-gray-700">{instructorData.bio}</p>
            </div>
          )}

          {instructorData.specializations && (
            <div>
              <h3 className="font-sans text-lg">Specializări</h3>
              <p className="text-sm text-gray-700">{instructorData.specializations}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => router.push('/instructor_sessions')}>Sesiunile mele</Button>
            <Button variant="outline" onClick={() => router.push('/instructor_profile/edit')}>Editează profilul</Button>
          </div>

          <div className="mt-6 flex flex-col space-y-2">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Deconectare
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

InstructorProfile.displayName = 'InstructorProfile';

export default function InstructorDashboard() {
  const router = useRouter();
  const [instructorData, setInstructorData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    bio?: string;
    specializations?: string;
    profile_image_url?: string;
  } | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the logout handler to prevent unnecessary re-renders
  const handleLogout = React.useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      router.push('/instructor_auth');
    } catch (error) {
      toast.error('Error logging out');
    }
  }, [router]);

  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        // Get the current user's session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          toast.error('No active session');
          router.push('/instructor_auth');
          return;
        }

        // Fetch instructor details
        const { data, error } = await supabase
          .from('instructors')
          .select('first_name, last_name, email, phone, bio, specializations, profile_image_url')
          .eq('id', session.user.id)
          .single();

        if (error) {
          toast.error('Could not fetch instructor details');
          router.push('/instructor_auth');
          return;
        }

        setInstructorData(data);

        // First, get all sessions for this instructor
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, start_time')
          .eq('instructor_id', session.user.id);

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
          toast.error('Could not fetch sessions');
          return;
        }

        if (!sessions || sessions.length === 0) {
          console.log('No sessions found for this instructor');
          setClients([]);
          return;
        }


        // Use the get_session_clients function for each session
        const clientsMap = new Map();
        
        // Process each session to get clients
        for (const session of sessions) {
          const { data: sessionClients, error: clientsError } = await supabase
            .rpc('get_session_clients', { session_id_param: session.id });
            
          if (clientsError) {
            console.error(`Error fetching clients for session ${session.id}:`, clientsError);
            continue; // Skip this session but continue with others
          }
          
          // Add clients to our map, merging with existing client data
          if (sessionClients && sessionClients.length > 0) {
            for (const client of sessionClients) {
              const clientId = `${client.first_name}_${client.last_name}`; // Create a unique ID
              
              if (!clientsMap.has(clientId)) {
                clientsMap.set(clientId, {
                  id: clientId,
                  first_name: client.first_name,
                  last_name: client.last_name,
                  sessions: [],
                  bookings: []
                });
              }
              
              // Add this session to the client's sessions
              const clientData = clientsMap.get(clientId);
              clientData.sessions.push({
                id: session.id,
                start_time: session.start_time
              });
              
              // Add a simplified booking entry
              clientData.bookings.push({
                id: `${session.id}_${clientId}`, // Create a unique booking ID
                session_id: session.id,
                client_id: clientId,
                session: {
                  id: session.id,
                  start_time: session.start_time
                }
              });
            }
          }
        }

        
        // Convert the map values to an array
        const groupedClients = Array.from(clientsMap.values());

        // Filter out any null entries before setting state
        setClients(groupedClients.filter(Boolean) as Client[]);

      } catch (err) {
        console.error('Instructor dashboard error:', err);
        toast.error('An unexpected error occurred');
        router.push('/instructor_auth');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructorData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Removed supabase as it's not needed in the dependency array

  // Removed handleLogout function as it's now defined as a memoized callback above

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!instructorData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#EBCECE] p-6">
      {/* Use the memoized InstructorProfile component */}
      <InstructorProfile 
        instructorData={instructorData} 
        router={router} 
        handleLogout={handleLogout} 
      />

      {/* Use the memoized ClientList component */}
      <ClientList clients={clients} router={router} />
    </div>
  );
}
