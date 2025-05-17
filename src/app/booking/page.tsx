'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress"; // Assuming you have a Progress component
import { Calendar } from "@/components/ui/calendar"; // Assuming you have a Calendar component
import Link from 'next/link';

// Define interfaces based on your schema
interface ClassType {
  id: string;
  name: string;
  description: string | null;
  default_duration_minutes: number;
  level: string | null;
  color_code: string | null;
  is_active: boolean;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  specializations: string | null;
  profile_image_url: string | null;
  is_active: boolean;
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
}

interface Booking {
  id: string;
  client_id: string;
  session_id: string;
  client_subscription_id: string;
  booking_time: string;
  status: string; // e.g., 'confirmed', 'cancelled'
  sessions?: Session; // Added for join queries
}

interface ClientSubscription {
  id: string;
  client_id: string;
  classes_remaining: number | null;
  is_active: boolean;
  plan_mat_id: string | null;
  plan_reformer_id: string | null;
}

const STEPS = [
  { id: 1, name: 'Alege Tipul de Clasă' },
  { id: 2, name: 'Alege Instructorul' },
  { id: 3, name: 'Alege Data și Ora' },
  { id: 4, name: 'Confirmă Rezervarea' },
];

const TIME_SLOTS = [
  '08:00', '09:15', '10:30', '11:45', 
  '13:00', '14:15', '15:30', '16:45', '18:00'
];

export default function BookingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);

  const [instructors, setInstructors] = useState<Staff[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<Staff | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [clientSubscription, setClientSubscription] = useState<ClientSubscription | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);


  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
    };
    getUser();
  }, []);

  // Fetch active client subscription
  useEffect(() => {
    if (!authUser?.id) return;

    const fetchSubscription = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('client_subscriptions')
        .select('*')
        .eq('client_id', authUser.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching client subscription:', error);
        // setError('Could not load your subscription details. Please ensure you have an active plan.');
      } else if (data) {
        setClientSubscription(data);
        if (data.classes_remaining !== null && typeof data.classes_remaining === 'number' && data.classes_remaining <= 0) {
            setError("You have no classes remaining on your current plan. Please renew or purchase a new plan.")
        }
      } else {
        // setError('No active subscription found. Please purchase a plan to book classes.');
      }
      setIsLoading(false);
    };
    fetchSubscription();
  }, [authUser]);


  // Fetch class types
  useEffect(() => {
    const fetchClassTypes = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('class_types') // Corrected table name
        .select('*')
        .eq('is_active', true);
      if (error) {
        setError('Failed to load class types.');
        console.error(error);
      } else {
        setClassTypes(data || []);
      }
      setIsLoading(false);
    };
    if (currentStep === 1) {
      fetchClassTypes();
    }
  }, [currentStep]);

  // Fetch instructors
  useEffect(() => {
    const fetchInstructors = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('is_active', true);
      // TODO: Potentially filter instructors by selectedClassType specialization if applicable
      if (error) {
        setError('Failed to load instructors.');
        console.error(error);
      } else {
        setInstructors(data || []);
      }
      setIsLoading(false);
    };
    if (currentStep === 2 && selectedClassType) {
      fetchInstructors();
    }
  }, [currentStep, selectedClassType]);
  
  // Fetch user's existing bookings for the selected date
  useEffect(() => {
    if (!authUser?.id || !selectedDate) return;

    const fetchUserBookings = async () => {
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('bookings')
        .select('*, sessions!inner(*)')
        .eq('client_id', authUser.id)
        .eq('status', 'confirmed')
        .gte('sessions.start_time', dayStart.toISOString())
        .lte('sessions.start_time', dayEnd.toISOString());

      if (error) {
        console.error('Error fetching user bookings:', error);
      } else {
        setUserBookings(data || []);
      }
    };

    fetchUserBookings();
  }, [authUser?.id, selectedDate]);

  // Fetch available sessions for selected date, class type, and instructor
  useEffect(() => {
    if (currentStep !== 3 || !selectedDate || !selectedClassType || !selectedInstructor) {
      setAvailableSessions([]);
      return;
    }

    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const { data, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .gte('start_time', dayStart.toISOString())
        .lte('start_time', dayEnd.toISOString())
        .order('start_time');

      if (sessionError) {
        console.error('Error fetching sessions:', sessionError);
        setError('Could not load available sessions for this day.');
        setAvailableSessions([]);
      } else {
        setAvailableSessions(data || []);
      }
      setIsLoading(false);
    };

    fetchSessions();
  }, [currentStep, selectedDate, selectedClassType, selectedInstructor]);


  const handleNextStep = () => {
    setError(null); // Clear errors when moving
    setSuccessMessage(null); // Clear success message when moving
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setSuccessMessage(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const getSessionDuration = (): number => {
      return selectedClassType?.default_duration_minutes || 60;
  }

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
  };

  const handleBooking = async () => {
    if (!authUser || !clientSubscription || !selectedClassType || !selectedInstructor || !selectedDate || !selectedTimeSlot) {
      setError('Please ensure all selections are made and you have an active subscription.');
      return;
    }

    if (clientSubscription.classes_remaining !== null && typeof clientSubscription.classes_remaining === 'number' && clientSubscription.classes_remaining <= 0) {
        setError("You have no classes remaining on your current plan. Please renew or purchase a new plan.");
        return;
    }

    setIsLoading(true);
    setError(null);

    const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    const durationMinutes = getSessionDuration();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    try {
      // Check if a session already exists
      let sessionToBook: Session | null = null;

      const { data: existingSessions, error: existingSessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('class_type_id', selectedClassType.id)
        .eq('instructor_id', selectedInstructor.id)
        .eq('start_time', startTime.toISOString())
        .limit(1);

      if (existingSessionError) throw existingSessionError;

      if (existingSessions && existingSessions.length > 0) {
        sessionToBook = existingSessions[0];
        if (sessionToBook!.spots_available <= 0) {
          throw new Error('This session is already full.');
        }
      } else {
        // Create new session
        const { data: newSession, error: newSessionError } = await supabase
          .from('sessions')
          .insert({
            class_type_id: selectedClassType.id,
            instructor_id: selectedInstructor.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            capacity: 4, // As per requirement
            spots_available: 4, // As per requirement
            status: 'scheduled', 
          })
          .select()
          .single();
        
        if (newSessionError) throw newSessionError;
        sessionToBook = newSession;
      }

      if (!sessionToBook) {
        throw new Error('Failed to find or create a session.');
      }

      // Create booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: authUser.id,
          session_id: sessionToBook.id,
          client_subscription_id: clientSubscription.id,
          booking_time: new Date().toISOString(),
          status: 'confirmed',
        });

      if (bookingError) throw bookingError;

      // Decrement spots_available in session
      const { error: updateSessionError } = await supabase
        .from('sessions')
        .update({ spots_available: sessionToBook.spots_available - 1 })
        .eq('id', sessionToBook.id);
      
      if (updateSessionError) throw updateSessionError;

      // Decrement classes_remaining in client_subscription if not unlimited
      if (clientSubscription.classes_remaining !== null) {
        const { error: updateSubscriptionError } = await supabase
          .from('client_subscriptions')
          .update({ classes_remaining: clientSubscription.classes_remaining - 1 })
          .eq('id', clientSubscription.id);
        if (updateSubscriptionError) throw updateSubscriptionError;
        // Update local state for immediate feedback
        setClientSubscription(prev => prev ? {...prev, classes_remaining: prev.classes_remaining! - 1} : null);
      }
      
      // Show success message and return to step 3
      setSuccessMessage('Rezervare realizată cu succes! Poți rezerva o altă ședință sau să vizualizezi rezervările tale.');
      setSelectedTimeSlot(null); // Reset time slot selection
      setCurrentStep(3); // Return to date & time selection
      
      // Make the success message disappear after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (e: any) {
      console.error('Booking failed:', e);
      setError(e.message || 'An unexpected error occurred during booking.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const progressValue = (currentStep / STEPS.length) * 100;

  if (!authUser && !isLoading) { // check added for isLoading
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center text-vibrant-coral">Acces Interzis</CardTitle>
                    <CardDescription className="text-center">
                        Te rugăm să te conectezi pentru a accesa pagina de rezervări.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <img src="/images/logo.png" alt="Pilates Studio" className="w-32 h-32 mb-6" />
                    <Button asChild className="w-full">
                        <Link href="/login">Mergi la Conectare</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  if (!clientSubscription && currentStep > 0 && authUser && !isLoading) {
     // Added authUser check and !isLoading check
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-vibrant-coral">Fără Abonament Activ</CardTitle>
            <CardDescription className="text-center">
              Ai nevoie de un abonament activ de Pilates pentru a rezerva clase.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
             <img src="/images/logo.png" alt="Pilates Studio" className="w-32 h-32 mb-6" />
            <p className="mb-4 text-center">Te rugăm să selectezi un abonament pentru a continua.</p>
            <div className="flex gap-4">
                <Button asChild className="w-full bg-[#E57F84] text-white hover:bg-[#E57F84]/90">
                    <Link href="/select-mat">Vezi Abonamente Saltea</Link>
                </Button>
                <Button asChild className="w-full bg-[#E57F84] text-white hover:bg-[#E57F84]/90">
                    <Link href="/select-reformer">Vezi Abonamente Reformer</Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
   if (clientSubscription && clientSubscription.classes_remaining !== null && clientSubscription.classes_remaining !== undefined && clientSubscription.classes_remaining <= 0 && currentStep > 0 && authUser && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-vibrant-coral">Fără Ședințe Rămase</CardTitle>
            <CardDescription className="text-center">
              Ai folosit toate ședințele din abonamentul tău curent.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <img src="/images/logo.png" alt="Pilates Studio" className="w-32 h-32 mb-6" />
            <p className="mb-4 text-center">Te rugăm să-ți reînnoiești abonamentul sau să cumperi unul nou pentru a continua rezervarea ședințelor.</p>
            <div className="flex gap-4">
                 <Button asChild className="w-full bg-vibrant-coral text-white hover:bg-vibrant-coral/90">
                    <Link href="/select-mat">Vezi Abonamente Saltea</Link>
                </Button>
                <Button asChild className="w-full bg-vibrant-coral text-white hover:bg-vibrant-coral/90">
                    <Link href="/select-reformer">Vezi Abonamente Reformer</Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#EBCECE] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="text-white p-6 relative" style={{ backgroundImage: 'url(/images/AdobeStock_142637447.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {/* Add an overlay for better text readability */}
            <div className="absolute inset-0 bg-black/30 z-0"></div>
            {/* Content needs to be relative and have a higher z-index */}
            <div className="relative z-10">
              <CardTitle className="text-3xl font-bold text-center">Rezervă-ți locul</CardTitle>
              <CardDescription className="text-center text-white pt-1">
                {STEPS[currentStep - 1].name}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <Progress value={progressValue} className="mb-6 h-2.5" />
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-sm">Error: {error}</p>}
            {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded-md mb-4 text-sm animate-fade-in">{successMessage}</p>}

            {currentStep === 1 && (
              <div>
                {isLoading && <p>Încarcare tipuri de clase...</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classTypes.map((ct) => (
                    <Button
                      key={ct.id}
                      variant="outline"
                      className={`p-4 h-auto text-left flex flex-col items-start space-y-1 ${selectedClassType?.id === ct.id ? 'border-vibrant-coral ring-2 ring-vibrant-coral' : 'border-gray-300'}`}
                      onClick={() => { setSelectedClassType(ct); handleNextStep(); }}
                    >
                      <span className="font-semibold text-vibrant-coral">{ct.name}</span>
                      {ct.description && <span className="text-sm text-gray-600">{ct.description}</span>}
                      <span className="text-xs text-gray-500">Durată: {ct.default_duration_minutes} min | Nivel: {ct.level || 'Toate'}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && selectedClassType && (
              <div>
                {isLoading && <p>Încarcare instrușiuni...</p>}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {instructors.map((inst) => (
                    <Button
                      key={inst.id}
                      variant="outline"
                      className={`p-4 h-auto text-left flex items-center space-x-3 ${selectedInstructor?.id === inst.id ? 'border-vibrant-coral ring-2 ring-vibrant-coral' : 'border-gray-300'}`}
                      onClick={() => { setSelectedInstructor(inst); handleNextStep();}}
                    >
                       {inst.profile_image_url && <img src={inst.profile_image_url} alt={`${inst.first_name} ${inst.last_name}`} className="w-12 h-12 rounded-full object-cover" />}
                      <div className="flex flex-col">
                        <span className="font-semibold text-vibrant-coral">{inst.first_name} {inst.last_name}</span>
                        {inst.specializations && <span className="text-sm text-gray-600">{inst.specializations}</span>}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && selectedClassType && selectedInstructor && (
              <div>
                <div className="md:flex md:space-x-6">
                    <div className="mb-4 md:mb-0 md:w-1/2 flex justify-center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border shadow-md"
                            disabled={(date: Date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} // Disable past dates
                        />
                    </div>
                    <div className="md:w-1/2">
                        <h4 className="text-md font-medium text-foreground mb-2">Intervale Disponibile pentru {selectedDate?.toLocaleDateString()}:</h4>
                        {isLoading && <p>Încarcare intervale...</p>}
                        {!isLoading && selectedDate && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {TIME_SLOTS.map((slot, index) => {
                                    const [hours, minutes] = slot.split(':').map(Number);
                                    const slotStartTime = new Date(selectedDate);
                                    slotStartTime.setHours(hours, minutes, 0, 0);
                                    
                                    const duration = getSessionDuration();
                                    const slotEndTime = new Date(slotStartTime.getTime() + duration * 60000);

                                    const sessionAtSlot = availableSessions.find(s => new Date(s.start_time).getTime() === slotStartTime.getTime());
                                    const userBookingForSlot = userBookings.find(b => 
                                        b.sessions && new Date(b.sessions.start_time).getTime() === slotStartTime.getTime()
                                    );

                                    let slotStyle = '';
                                    let slotText = '';
                                    let isDisabled = false;

                                    if (userBookingForSlot) {
                                        // User is already booked for this time slot
                                        slotStyle = 'bg-red-200 text-red-700 opacity-70 cursor-not-allowed';
                                        slotText = 'Ocupat';
                                        isDisabled = true;
                                    } else if (sessionAtSlot) {
                                        // Session exists at this time slot
                                        if (sessionAtSlot.class_type_id === selectedClassType.id && sessionAtSlot.instructor_id === selectedInstructor.id) {
                                            // Matches selected class type and instructor
                                            if (sessionAtSlot.spots_available > 0) {
                                                slotStyle = selectedTimeSlot === slot ? 'bg-[#E57F84]/75 text-foreground' : 'bg-background text-foreground border-border hover:bg-[#E57F84]/75';
                                                slotText = `${sessionAtSlot.spots_available} locuri rămase`;
                                            } else {
                                                slotStyle = 'bg-gray-200 text-gray-500 opacity-70 cursor-not-allowed';
                                                slotText = 'Complet';
                                                isDisabled = true;
                                            }
                                        } else {
                                            // Mismatched class type or instructor
                                            slotStyle = 'bg-red-200 text-red-700 opacity-70 cursor-not-allowed';
                                            slotText = 'Ocupat';
                                            isDisabled = true;
                                        }
                                    } else {
                                        // No session exists, this is a potential new session slot
                                        slotStyle = selectedTimeSlot === slot ? 'bg-[#E57F84]/75 text-foreground' : 'bg-background text-foreground border-border hover:bg-[#E57F84]/75';
                                        slotText = 'Ședință Nouă';
                                    }

                                    return (
                                        <Button
                                            key={index}
                                            variant={"outline"} // Base variant, specific styles applied by className
                                            className={`w-full text-xs sm:text-sm py-2 px-1 ${slotStyle}`}
                                            onClick={() => !isDisabled && handleTimeSlotSelect(slot)}
                                            disabled={isDisabled}
                                        >
                                            {slot} &ndash; {String(slotEndTime.getHours()).padStart(2, '0')}:{String(slotEndTime.getMinutes()).padStart(2, '0')}
                                            <br/>
                                            ({slotText})
                                        </Button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
              </div>
            )}
            
            {currentStep === 4 && selectedClassType && selectedInstructor && selectedDate && selectedTimeSlot && (
              <div className="text-center">
                <Card className="mb-6 text-left bg-gray-50 p-4 rounded-lg shadow">
                    <p><strong>Clasă:</strong> {selectedClassType.name}</p>
                    <p><strong>Instructor:</strong> {selectedInstructor.first_name} {selectedInstructor.last_name}</p>
                    <p><strong>Data:</strong> {selectedDate.toLocaleDateString()}</p>
                    <p><strong>Ora:</strong> {selectedTimeSlot} - {(() => {
                        const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
                        const startTime = new Date(selectedDate);
                        startTime.setHours(hours, minutes, 0, 0);
                        const duration = getSessionDuration();
                        const endTime = new Date(startTime.getTime() + duration * 60000);
                        return `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
                    })()}</p>
                                        {clientSubscription && typeof clientSubscription.classes_remaining === 'number' && (
                        <p className="mt-2 text-sm text-gray-600">
                            Aceasta va folosi 1 ședință din abonamentul tău. Ședințe rămase după rezervare: {clientSubscription.classes_remaining - 1}.
                        </p>
                    )}
                </Card>
                <Button onClick={handleBooking} className="w-full bg-foreground text-background hover:bg-foreground/90" disabled={isLoading}>Confirmă Rezervarea</Button>
              </div>
            )}

            <div className={`mt-8 flex ${currentStep === 1 ? 'justify-end' : 'justify-between'} items-center`}>
              {currentStep === 3 && (
                <Button asChild variant="outline" className="mr-auto text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-3">
                 <Link href="/profile">Rezervările Mele</Link>
               </Button>
              )}
              {currentStep > 1 && (
                <Button onClick={handlePrevStep} variant="outline" disabled={isLoading} className="mr-4 text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-3">
                 Înapoi
               </Button>
              )}
              {currentStep < STEPS.length -1 && currentStep !== 3 &&  ( // Adjusted: Next from step 3 is implicit by selecting time
                 <Button onClick={handleNextStep} disabled={isLoading || (currentStep ===1 && !selectedClassType) || (currentStep === 2 && !selectedInstructor)} className="bg-foreground text-background hover:bg-foreground/90">
                  Înainte
                </Button>
              )}
               {currentStep === 3 && selectedTimeSlot && (
                  <Button onClick={handleNextStep} disabled={isLoading || !selectedTimeSlot} className="bg-foreground text-background hover:bg-foreground/90 text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-3">
                    Continuă
                  </Button>
              )}
            </div>
          </CardContent>
        </Card>
         <p className="text-center mt-8 text-sm text-gray-600">
            Trebuie să-ți gestionezi rezervările existente? <Link href="/profile" className="text-vibrant-coral hover:underline">Mergi la Profilul tău</Link>.
        </p>
      </div>
    </div>
  );
}
