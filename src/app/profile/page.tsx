"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient'; // Verify path
import { User } from '@supabase/supabase-js';
import { useAuth } from '../../contexts/AuthContext'; // Corrected path
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from 'next/link';

interface ClientProfile {
  id: string; // UUID from auth.users
  first_name: string;
  last_name: string;
  phone?: string;
  // current_plan_id and plan_expires_at removed
}

interface ActiveSubscription {
  id: string; // subscription id
  plan_mat_id?: string | null;
  plan_reformer_id?: string | null;
  start_date: string;
  end_date?: string | null;
  classes_remaining?: number | null;
  sessions_total?: number | null;
  is_active?: boolean | null;
  payment_status?: string | null;
  // any other relevant fields from client_subscriptions
}

// Define a type for plan details (Mat or Reformer)
interface PlanDetails {
  id: string; // plan id
  name: string;
  session_count: number;
  price: number;
  description?: string;
  validity_days?: number;
  type: 'mat' | 'reformer'; // To know which table it came from or for display logic
}

interface UpcomingSessionDetails {
  booking_id: string;
  session_id: string;
  class_name: string; // From class_types.name
  instructor_name: string; // From instructors.first_name + instructors.last_name
  start_time: string; // From sessions.start_time
  end_time: string; // From sessions.end_time
  level: string; // From class_types.level
  color_code?: string; // From class_types.color_code
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, session } = useAuth();

  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSessionDetails[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setPageLoading(true);
      return;
    }

    if (!authUser && !authLoading) {
      setError('You are not logged in. Redirecting...');
      setTimeout(() => router.push('/login'), 2000);
      setPageLoading(false);
      return;
    }

        if (authUser) {
      const fetchProfileAndSubscriptionData = async () => {
        setPageLoading(true);
        setError(null);
        setClientProfile(null);
        setActiveSubscription(null);
        setPlanDetails(null);
        setUpcomingSessions([]); // Reset upcoming sessions

        // 1. Fetch basic client details (excluding plan info from clients table)
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, first_name, last_name, phone')
          .eq('id', authUser.id)
          .single();

        if (clientError && clientError.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error for us here
          console.error('Error fetching client base details:', clientError);
          setError(`Error fetching your profile: ${clientError.message}`);
          setPageLoading(false);
          return;
        } 
        
        if (clientData) {
          setClientProfile(clientData as ClientProfile);
        } else {
          // If no record in clients table, use metadata from auth.users
          setClientProfile({
            id: authUser.id,
            first_name: authUser.user_metadata?.first_name || 'N/A',
            last_name: authUser.user_metadata?.last_name || 'N/A',
            phone: authUser.user_metadata?.phone || 'N/A',
          });
        }

        // 2. Fetch active subscription from client_subscriptions
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('client_subscriptions')
          .select('*') // Select all fields for now
          .eq('client_id', authUser.id)
          .eq('is_active', true) // Only active subscriptions
          .order('created_at', { ascending: false })
          .limit(1)
          .single(); // Expecting one active subscription or none

        if (subscriptionError && subscriptionError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching active subscription:', subscriptionError);
          // setError('Could not load your subscription details.'); // Optional: inform user
        } else if (subscriptionData) {
          setActiveSubscription(subscriptionData as ActiveSubscription);

          // 3. Fetch plan details (Mat or Reformer) based on the active subscription
          let planId = null;
          let planTable: 'plans_mat' | 'plans_reformer' | null = null;
          let planType: 'mat' | 'reformer' | null = null;

          if (subscriptionData.plan_mat_id) {
            planId = subscriptionData.plan_mat_id;
            planTable = 'plans_mat';
            planType = 'mat';
          } else if (subscriptionData.plan_reformer_id) {
            planId = subscriptionData.plan_reformer_id;
            planTable = 'plans_reformer';
            planType = 'reformer';
          }

          if (planId && planTable && planType) {
            const { data: fetchedPlanDetails, error: planDetailsError } = await supabase
              .from(planTable)
              .select('id, name, session_count, price, description, validity_days')
              .eq('id', planId)
              .single();

            if (planDetailsError) {
              console.error(`Error fetching ${planType} plan details:`, planDetailsError);
              // setError(`Could not load details for your ${planType} plan.`);
            } else if (fetchedPlanDetails) {
              setPlanDetails({ ...fetchedPlanDetails, type: planType } as PlanDetails);
            }
          }
        }

        // 4. Fetch Upcoming Sessions
        const { data: upcomingSessionsData, error: upcomingSessionsError } = await supabase
          .from('bookings')
          .select(`
            booking_id:id,
            session_id,
            sessions (
              start_time,
              end_time,
              instructor_id,
              instructors (first_name, last_name),
              class_type_id,
              class_types (name, level, color_code)
            )
          `)
          .eq('client_id', authUser.id)
          .eq('status', 'confirmed')
          .filter('sessions.start_time', 'gte', new Date().toISOString())
          .order('sessions(start_time)', { ascending: true });

        if (upcomingSessionsError) {
          console.error('Error fetching upcoming sessions:', upcomingSessionsError);
          // Not setting a page-level error for this, as profile can still be useful
        } else if (upcomingSessionsData) {
          const formattedSessions = upcomingSessionsData
            .filter((booking: any) => booking.sessions) // Ensure session data exists
            .map((booking: any) => {
              const session = booking.sessions;
              const instructor = session.instructors;
              const classType = session.class_types;

              return {
                booking_id: booking.booking_id,
                session_id: booking.session_id,
                class_name: classType?.name || session.level || 'Class details unavailable', // Fallback to session.level if class_type.name is missing
                instructor_name: instructor ? `${instructor.first_name} ${instructor.last_name}` : 'Instructor N/A',
                start_time: session.start_time,
                end_time: session.end_time,
                level: classType?.level || session.level || 'N/A', // Fallback to session.level
                color_code: classType?.color_code || '#CCCCCC', // Default color
              };
            });
          setUpcomingSessions(formattedSessions);
        }

        setPageLoading(false);
      };
      fetchProfileAndSubscriptionData();
    }
  }, [authUser, authLoading, router]);

  if (pageLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-[#E57F84]">Loading your profile...</p>
      </div>
    );
  }

  if (error && !clientProfile && !authUser && !authLoading && !pageLoading) { // Show critical errors prominently if profile can't be loaded
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#EBCECE]">
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-vibrant-coral text-center">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!authUser && !authLoading && !pageLoading) {
    // This case should ideally be handled by the redirect in useEffect,
    // but as a fallback:
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#EBCECE]">
         <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-vibrant-coral text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700">Please log in to view your profile.</p>
            <Button onClick={() => router.push('/login')} className="w-full mt-4 bg-vibrant-coral hover:bg-vibrant-coral/90">Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display user information and edit form
  return (
    <div className="min-h-screen bg-[#EBCECE] py-8 px-4 flex flex-col items-center">
      <Card className="w-full max-w-2xl mx-auto shadow-2xl backdrop-blur-sm" style={{ backgroundColor: '#f5f5f5' }}>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl sm:text-4xl font-bold text-vibrant-coral">
            Profilul Tău
          </CardTitle>
          {authUser?.email && (
            <CardDescription className="text-vibrant-coral pt-2">
              {authUser.email}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
             <p className="text-sm text-center text-red-500 mb-4 p-3 bg-red-50 rounded-md">{error}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-sm font-medium text-vibrant-coral">Prenume</p>
              <p className="mt-1 text-lg text-gray-900 p-2 border border-gray-200 rounded-md bg-gray-50 min-h-[40px]">
                {clientProfile?.first_name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-vibrant-coral">Nume</p>
              <p className="mt-1 text-lg text-gray-900 p-2 border border-gray-200 rounded-md bg-gray-50 min-h-[40px]">
                {clientProfile?.last_name || 'N/A'}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-vibrant-coral">Număr Telefon</p>
              <p className="mt-1 text-lg text-gray-900 p-2 border border-gray-200 rounded-md bg-gray-50 min-h-[40px]">
                {clientProfile?.phone || 'N/A'}
              </p>
            </div>
          </div>

          {/* Plan Information Section */}
          <div className="pt-6 mt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-vibrant-coral mb-4 font-inter">Planul tău curent</h3>
            {planDetails && activeSubscription ? (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-1">
                <p className="text-lg font-medium text-vibrant-coral">{planDetails.name} ({planDetails.type.charAt(0).toUpperCase() + planDetails.type.slice(1)})</p>
                {planDetails.description && <p className="text-sm text-gray-600 mt-1 mb-2">{planDetails.description}</p>}
                {typeof activeSubscription.sessions_total === 'number' && <p className="text-gray-700">Sesiuni Totale: {activeSubscription.sessions_total}</p>}
                {typeof activeSubscription.classes_remaining === 'number' && <p className="text-gray-700">Sesiuni Rămase: {activeSubscription.classes_remaining}</p>}
                {activeSubscription.start_date && (
                  <p className="text-gray-700">Început la: {new Date(activeSubscription.start_date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}
                {activeSubscription.end_date && (
                  <p className="text-gray-700">Expiră la: {new Date(activeSubscription.end_date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}
                {activeSubscription.payment_status && (
                  <p className="text-gray-700">Status Plată: <span className={`font-semibold ${
                    activeSubscription.payment_status === 'paid' ? 'text-green-600' : 
                    activeSubscription.payment_status === 'pending' ? 'text-orange-500' : 'text-red-500'
                  }`}>{activeSubscription.payment_status === 'paid' ? 'Plătit' : 
                    activeSubscription.payment_status === 'pending' ? 'În așteptare' : 
                    activeSubscription.payment_status === 'failed' ? 'Eșuat' : 
                    activeSubscription.payment_status === 'refunded' ? 'Rambursat' : 
                    activeSubscription.payment_status.charAt(0).toUpperCase() + activeSubscription.payment_status.slice(1)}</span></p>
                )}
              </div>
            ) : activeSubscription && !planDetails && !pageLoading ? (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-gray-600">Loading plan details...</p>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-gray-600">Nu ai un plan activ. <Link href="/select-mat" className="text-vibrant-coral hover:underline">Alege un Plan Saltea</Link> sau <Link href="/select-reformer" className="text-vibrant-coral hover:underline">Alege un Plan Reformer</Link>.</p>
              </div>
            )}
          </div>

          <div className="pt-4 text-center">
            <Link href="/profile/edit" passHref>
                <Button className="w-full sm:w-auto bg-vibrant-coral text-white border border-transparent hover:bg-white hover:text-vibrant-coral hover:border-vibrant-coral font-semibold py-2.5 px-6 rounded-md transition duration-150 ease-in-out">
                    Editează Profilul
                </Button>
            </Link>
          </div>
        </CardContent> {/* End of main profile/plan CardContent, Edit Profile button is inside this */}
        {/* Upcoming Sessions Section */}
        {upcomingSessions.length > 0 && (
          <>
            <hr className="my-6 border-gray-300 mx-6" /> {/* Added mx-6 for consistent padding with CardContent children */}
            <CardContent> {/* This CardContent is specifically for upcoming sessions */}
              <h3 className="text-xl font-semibold text-vibrant-coral mb-4 font-inter">Sesiuni Viitoare</h3>
              <div className="space-y-4">
                {upcomingSessions.map(session => (
                  <Card key={session.booking_id} className="bg-white shadow-md rounded-lg border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col h-full">
                        <div className="flex flex-col flex-grow">
                          <p className="font-semibold text-lg text-vibrant-coral">{session.class_name}</p>
                          <p className="text-sm text-gray-600">Cu: {session.instructor_name}</p>
                          <p className="text-sm text-gray-600">
                            Data: {new Date(session.start_time).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-600">
                            Ora: {new Date(session.start_time).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Link 
                            href={`/reschedule/${session.booking_id}`}
                            className="text-[#E57F84] hover:text-[#E57F84]/90 text-sm sm:text-base"
                          >
                            Reprogramează
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </>
        )}

        {/* No Upcoming Sessions Message */} 
        {!pageLoading && !error && upcomingSessions.length === 0 && (
           <>
            <hr className="my-6 border-gray-300 mx-6" />
            <CardContent>
              <h3 className="text-xl font-semibold text-vibrant-coral mb-2">Sesiuni Viitoare</h3>
              <p className="text-gray-600">Nu ai nicio sesiune programată.</p>
              <Button onClick={() => router.push('/booking')} className="mt-4 bg-vibrant-coral hover:bg-vibrant-coral/90 text-white">
                Rezervă o Clasă
              </Button>
            </CardContent>
          </>
        )}

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-200 mt-6">
          <p className="text-xs text-gray-500 mb-4 sm:mb-0">
              Înscris: {authUser && authUser.created_at ? new Date(authUser.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
          </p>
          <Button onClick={() => router.push('/')} className="bg-vibrant-coral text-white border border-transparent hover:bg-white hover:text-vibrant-coral hover:border-vibrant-coral font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out">Înapoi la Pagina Principală</Button>
        </CardFooter>

      </Card> {/* End of the main w-full max-w-2xl Card */}
    </div> // End of the main div
  ); // End of return
} // End of ProfilePage function
