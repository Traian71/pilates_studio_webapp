"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from 'next/link';

// Define a type for your client data
interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, session } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [pageLoading, setPageLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null); // For initial data load error
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setPageLoading(true);
      return;
    }

    if (!authUser && !authLoading) {
      setFormError('Trebuie să fii conectat pentru a-ți edita profilul. Redirecționare...');
      setTimeout(() => router.push('/login'), 2000);
      setPageLoading(false);
      return;
    }

    if (authUser) {
      setPageLoading(true);
      setFormError(null);
      // Initialize form with auth.users metadata first
      setFirstName(authUser.user_metadata?.first_name || '');
      setLastName(authUser.user_metadata?.last_name || '');
      setPhone(authUser.user_metadata?.phone || '');

      // Then, try to fetch from 'clients' table to get the most up-to-date info
      const fetchClientProfileForEdit = async () => {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('first_name, last_name, phone')
          .eq('id', authUser.id)
          .single();

        if (clientError && clientError.code !== 'PGRST116') { // PGRST116 means no row found, which is fine
          console.error('Error fetching client profile for edit:', clientError);
          setFormError(`Error fetching your profile details: ${clientError.message}. Using existing data.`);
        } else if (clientData) {
          setFirstName(clientData.first_name || authUser.user_metadata?.first_name || '');
          setLastName(clientData.last_name || authUser.user_metadata?.last_name || '');
          setPhone(clientData.phone || authUser.user_metadata?.phone || '');
        }
        setPageLoading(false);
      };
      fetchClientProfileForEdit();
    }
  }, [authUser, authLoading, router]);

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      setUpdateError("No authenticated user found.");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    // 1. Update auth.users metadata
    const { data: updatedAuthUser, error: updateUserError } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName, phone: phone }
    });

    if (updateUserError) {
      setUpdateError(`Failed to update authentication profile: ${updateUserError.message}`);
      setIsUpdating(false);
      return;
    }

    // 2. Upsert (insert or update) public.clients table
    const { error: upsertClientError } = await supabase
      .from('clients')
      .upsert({
        id: authUser.id,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
      }, {
        onConflict: 'id'
      });

    if (upsertClientError) {
      setUpdateError(`Failed to save profile details to clients table: ${upsertClientError.message}`);
      setIsUpdating(false);
      return;
    }
    
    setUpdateSuccess('Profil actualizat cu succes! Redirecționare...');
    setIsUpdating(false);
    setTimeout(() => router.push('/profile'), 2000);
  };

  if (pageLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#EBCECE]">
        <p className="text-xl text-soft-peach">Încărcare pagină de editare profil...</p>
      </div>
    );
  }

  if (formError && !pageLoading && !authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#EBCECE]">
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-vibrant-coral text-center">Eroare</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700">{formError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!authUser && !authLoading && !pageLoading) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-[#EBCECE]">
         <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-vibrant-coral text-center">Acces Interzis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700">Te rugăm să te conectezi pentru a-ți edita profilul.</p>
            <Button onClick={() => router.push('/login')} className="w-full mt-4 bg-vibrant-coral hover:bg-vibrant-coral/90">Conectare</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBCECE] py-8 px-4 flex flex-col items-center">
      <Card className="w-full max-w-lg mx-auto shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl sm:text-4xl font-bold text-vibrant-coral">
            Editează Profilul Tău
          </CardTitle>
          {authUser?.email && (
            <CardDescription className="text-vibrant-coral pt-2">
              Editare profil pentru: {authUser.email}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <Label htmlFor="firstName" className="text-vibrant-coral font-medium">Prenume</Label>
              <Input 
                id="firstName" 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                placeholder="Prenumele tău"
                className="mt-1 focus:ring-vibrant-coral focus:border-vibrant-coral border-gray-300 rounded-md shadow-sm"
                required 
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-vibrant-coral font-medium">Nume</Label>
              <Input 
                id="lastName" 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                placeholder="Numele tău"
                className="mt-1 focus:ring-vibrant-coral focus:border-vibrant-coral border-gray-300 rounded-md shadow-sm"
                required 
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-vibrant-coral font-medium">Număr Telefon (Opțional)</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="Numărul tău de telefon"
                className="mt-1 focus:ring-vibrant-coral focus:border-vibrant-coral border-gray-300 rounded-md shadow-sm"
              />
            </div>

            {updateError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{updateError}</p>}
            {updateSuccess && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{updateSuccess}</p>}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                type="submit" 
                disabled={isUpdating || authLoading || pageLoading}
                className="w-full sm:w-auto flex-grow bg-vibrant-coral hover:bg-vibrant-coral/90 text-white font-semibold py-2.5 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50"
              >
                {isUpdating ? 'Se salvează...' : 'Salvează Modificările'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/profile')}
                disabled={isUpdating}
                className="w-full sm:w-auto flex-grow border-vibrant-coral text-vibrant-coral hover:bg-vibrant-coral/10 font-semibold py-2.5 px-4 rounded-md transition duration-150 ease-in-out"
              >
                Anulare
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-gray-500 justify-center pt-4">
            <p>Modificările vor fi reflectate în profilul și setările contului tău.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
