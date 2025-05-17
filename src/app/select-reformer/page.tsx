'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js'; // Added User type import
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import Stepper from '@/components/ui/stepper';
import { Input } from '@/components/ui/input'; // Added Input import

interface Plan {
  id: string;
  name: string;
  session_count: number;
  price: number;
  validity_days?: number;
  description?: string;
  type?: 'mat' | 'reformer';
}

interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const STEPS = [
  'Selectează Planul',
  'Detaliile Tale',
  'Confirmare',
  'Plată',
  'Gata!', // Added Confirmation step
];

const SelectReformerPlanPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0-indexed, starts at 'Select Plan'
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
        const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('plans_reformer')
        .select('id, name, session_count, price, validity_days, description');
      
      if (fetchError) {
        console.error('Error fetching reformer plans:', fetchError);
        setError('Failed to load reformer plans. Please try again later.');
        setPlans([]);
      } else {
        setPlans(data as Plan[]);
      }
      setLoading(false);
    };

    fetchPlans(); // Renamed from fetchReformerPlans

    
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentStep === 1) { // Only fetch when on 'Your Details' step
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserDetails({
            firstName: user.user_metadata.first_name || '',
            lastName: user.user_metadata.last_name || '',
            email: user.email || '',
            phone: user.user_metadata.phone || '', // Assuming phone is in user_metadata
          });
        }
      }
    };
    fetchUserData();
  }, [currentStep]);

  // TODO: Add functions to handle nextStep, prevStep
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handlePlanActivation = async (paymentMethod: 'stripe' | 'cash') => {
        if (!selectedPlan || !selectedPlan.id) {
      setError('No plan selected or plan ID is missing. Cannot activate.');
      console.error('Activation failed: No plan selected or plan ID missing.');
      return false;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message || 'User not authenticated. Cannot activate plan.');
      console.error('Activation failed:', userError?.message || 'User not authenticated.');
      return false;
    }

        const currentDate = new Date();
    const startDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    let endDate = null;
    if (selectedPlan.validity_days) {
      const expiryDate = new Date(new Date().setDate(currentDate.getDate() + selectedPlan.validity_days));
      endDate = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    const subscriptionData = {
      client_id: user.id,
      plan_mat_id: null,
      plan_reformer_id: selectedPlan.id,
      start_date: startDate,
      end_date: endDate,
      sessions_total: selectedPlan.session_count,
      classes_remaining: selectedPlan.session_count, // Initially same as total
      price_paid: selectedPlan.price,
      is_active: true,
      payment_status: paymentMethod === 'stripe' ? 'pending' : 'paid',
      // transaction_id will be set after successful Stripe payment for that method
    };

    try {
      // Ensure client exists in 'clients' table (FK constraint on client_subscriptions)
      // This might be redundant depending on your signup flow, but good for safety.
      const { error: clientUpsertError } = await supabase
        .from('clients')
        .upsert({
          id: user.id,
          first_name: user.user_metadata.first_name || userDetails.firstName || 'N/A',
          last_name: user.user_metadata.last_name || userDetails.lastName || 'N/A',
          // phone: user.user_metadata.phone || userDetails.phone, // if you add phone to clients table
        }, { onConflict: 'id' });

      if (clientUpsertError) {
        console.error('Error ensuring client entry:', clientUpsertError);
        // setError(`Failed to prepare client record: ${clientUpsertError.message}`);
        // return false; // Decide if this should be a fatal error for plan activation
      }

      // Insert into client_subscriptions
      const { error: subscriptionError } = await supabase
        .from('client_subscriptions')
        .insert([subscriptionData]);

      if (subscriptionError) {
        throw subscriptionError;
      }
      console.log('Client subscription created successfully for user:', user.id, 'Reformer Plan ID:', selectedPlan.id);
      setError(null);
      return true;
    } catch (e: any) {
      setError(`Failed to activate reformer plan: ${e.message}`);
      console.error('Error creating client subscription for reformer plan:', e);
      return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Select Plan
        if (loading) {
          return <div className="text-center">Loading plans...</div>;
        }
        if (error) {
          return <div className="text-center text-red-500">Error loading plans: {error}</div>;
        }
        return (
          <div className="w-full">
            <button 
              onClick={() => window.history.back()} 
              className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-[#E57F84] bg-white border border-[#E57F84] rounded-md hover:bg-[#E57F84] hover:text-white transition-colors duration-200"
            >
              ← Înapoi
            </button>
            <h2 className="text-3xl md:text-4xl font-bold text-[#E57F84] mb-8 text-center font-inter tracking-tight">Alege un abonament</h2>
            {plans.length === 0 ? (
              <p className="text-center text-gray-600">Nu sunt disponibile momentan abonamente reformer. Vă rog să reveniți mai târziu.</p>
            ) : (
              <div className="flex justify-center gap-6 mb-8 flex-wrap">
                {plans.map((plan) => (
                   <div key={plan.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer w-[280px]">
                     <div>
                       <h2 className="text-xl font-semibold mb-2 text-[#E57F84] font-inter">{plan.name}</h2>
                       {plan.description && <p className="text-gray-700 mb-2">{plan.description}</p>}
                       <p className="text-lg font-medium text-foreground mb-1">Preț: {plan.price} RON</p>
                       <p className="text-sm text-gray-600 mb-1">Sesiuni: {plan.session_count}</p>
                       {plan.validity_days && <p className="text-sm text-gray-600 mb-3">Validitate: {plan.validity_days} zile</p>}
                     </div>
                     <Button 
                       className={`w-full mt-4 ${selectedPlan && selectedPlan.id === plan.id ? 'bg-[#E57F84] text-white hover:bg-[#E57F84]/90' : 'bg-foreground text-background hover:bg-foreground/90'} focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring`}
                       onClick={() => { 
                         setSelectedPlan(plan);
                         if (selectedPlan && selectedPlan.id === plan.id) {
                           nextStep();
                         }
                       }}
                     >
                       {selectedPlan && selectedPlan.id === plan.id ? 'Continua' : 'Alege'}
                     </Button>
                   </div>
                ))}
              </div>
            )}

          </div>
        );
      case 1: // Your Details
        return (
          <div className="w-full max-w-lg mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-[#E57F84] mb-8 text-center font-inter tracking-tight">Detaliile Tale</h2>
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); nextStep(); }} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-xs font-medium text-gray-500 mb-1">Prenume</label>
                <Input 
                  type="text" 
                  name="firstName" 
                  id="firstName" 
                  value={userDetails.firstName} 
                  onChange={(e) => setUserDetails({...userDetails, firstName: e.target.value})} 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/50 focus:ring-opacity-50 text-sm" 
                  required 
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-medium text-gray-500 mb-1">Nume</label>
                <Input 
                  type="text" 
                  name="lastName" 
                  id="lastName" 
                  value={userDetails.lastName} 
                  onChange={(e) => setUserDetails({...userDetails, lastName: e.target.value})} 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/50 focus:ring-opacity-50 text-sm" 
                  required 
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <Input 
                  type="email" 
                  name="email" 
                  id="email" 
                  value={userDetails.email} 
                  onChange={(e) => setUserDetails({...userDetails, email: e.target.value})} 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/50 focus:ring-opacity-50 text-sm" 
                  required 
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-gray-500 mb-1">Telefon</label>
                <Input 
                  type="tel" 
                  name="phone" 
                  id="phone" 
                  value={userDetails.phone} 
                  onChange={(e) => setUserDetails({...userDetails, phone: e.target.value})} 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/50 focus:ring-opacity-50 text-sm" 
                  placeholder="+1234567890" 
                />
              </div>
              <div className="flex justify-between mt-8">
                <Button type="button" variant="outline" onClick={prevStep} className="border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400">Înapoi</Button>
                <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring">Next</Button>
              </div>
            </form>
          </div>
        );
      case 2: // Summary & Location
        if (!selectedPlan) {
          return (
            <div className="text-center">
              <p>Please select a plan first.</p>
              <Button onClick={() => setCurrentStep(0)}>Go to Plan Selection</Button>
            </div>
          );
        }
        return (
          <div className="w-full max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-[#E57F84] mb-8 text-center font-inter tracking-tight">Rezumat</h2>
            <div className="bg-slate-50 p-4 rounded-md mb-6 border border-slate-200">
              <h3 className="text-lg font-medium text-[#E57F84] mb-3 font-inter">Abonament Selectat:</h3>
              <p className="text-xl"><span className="font-semibold">{selectedPlan.name}</span></p>
              <p className="text-lg">Sesiuni: {selectedPlan.session_count}</p>
              <p className="text-lg">Preț: {selectedPlan.price} RON</p>
              {selectedPlan.description && <p className="text-gray-600 mt-2">{selectedPlan.description}</p>}
            </div>
            
            <div className="bg-slate-50 p-4 rounded-md mb-6 border border-slate-200">
              <h3 className="text-lg font-medium text-[#E57F84] mb-3 font-inter">Detaliile Tale:</h3>
              <p><strong>Nume:</strong> {userDetails.firstName} {userDetails.lastName}</p>
              <p><strong>Email:</strong> {userDetails.email}</p>
              <p><strong>Telefon:</strong> {userDetails.phone || 'Not provided'}</p>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={prevStep}>Back</Button>
              <Button onClick={nextStep} className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring">Continuă la Plata</Button>
            </div>
          </div>
        );
      case 3: // Payment
        return (
          <div className="w-full max-w-lg mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-[#E57F84] mb-8 text-center font-inter tracking-tight">Metoda de Plată</h2>
            <div className="space-y-6">
              <Button 
                disabled
                className="w-full bg-gray-400 text-white cursor-not-allowed py-3 text-lg"
              >
                Platește cu Card (Stripe) - În curând
              </Button>
              <Button 
                onClick={async () => {
                  // TODO: Implement logic for cash payment (e.g., update database, send notification)
                  console.log("Payment selected: Cash in Studio");
                  const activated = await handlePlanActivation('cash');
                  if (activated) {
                    nextStep();
                  }
                }} 
                variant="outline" className="w-full border-foreground text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring py-3 text-lg"
              >
                Platește Cash în Studio
              </Button>
            </div>
            <div className="flex justify-start mt-10">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                className="border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              >
                Back
              </Button>
            </div>
          </div>
        );
      case 4: // Confirmation
        if (error) { // Display error if activation failed
          return (
            <div className="w-full max-w-lg mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-destructive mb-6">Activation Failed</h2>
              <p className="text-gray-700 mb-4">{error}</p>
              <p className="text-gray-700 mb-8">Please try again or contact support.</p>
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(3)} // Go back to Payment step
                className="border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              >
                Încercați din nou
              </Button>
            </div>
          );
        }
        return (
          <div className="w-full max-w-lg mx-auto text-center">
            <h2 className="text-2xl font-semibold text-center mb-6 font-inter">Abonament Activat!</h2>
            {selectedPlan && (
              <div className="bg-slate-50 p-6 rounded-md mb-8 border border-slate-200 text-left">
                <h3 className="text-lg font-medium mb-4 font-inter text-[#E57F84]">Detalii:</h3>
                <p className="text-gray-700"><strong>Abonament:</strong> {selectedPlan.name}</p>
                <p className="text-gray-700"><strong>Sesiuni:</strong> {selectedPlan.session_count}</p>
                <p className="text-gray-700"><strong>Preț:</strong> {selectedPlan.price} RON</p>
                {/* You might want to display the expiry date here after fetching it or recalculating */}
              </div>
            )}
            <p className="text-gray-700 mb-8">Mulțumim că ai ales Balance Studio! Acum poți să îți rezervi ședințele.</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/booking">
                <Button className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90">Rezervă Ședințe</Button>
              </Link>
              <Link href="/profile">
                <Button className="w-full sm:w-auto bg-[#E57F84] text-white hover:bg-[#E57F84]/90">Vezi Profilul</Button>
              </Link>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Side: Stepper */}
      <div className="hidden md:block w-full md:w-1/4 lg:w-1/5 p-6 md:min-h-screen bg-slate-50 border-r border-slate-200">
        <Stepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Right Side: Content based on current step */}
      <div className="w-full md:w-3/4 lg:w-4/5 p-6 md:p-8 flex flex-col items-center justify-start">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default SelectReformerPlanPage;
