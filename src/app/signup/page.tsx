"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient'; // Ensure this path is correct
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
          },
        },
      });

      // Check for signup errors
      if (signUpError) {
        const errorMap: {[key: string]: string} = {
          'user_already_exists': 'An account with this email already exists.',
          'invalid_email': 'The email address is invalid.',
          'invalid_password': 'The password does not meet requirements.',
        };

        const userFriendlyError = errorMap[signUpError.message] || signUpError.message;
        setError(userFriendlyError);
        setIsLoading(false);
        return;
      }

      // User creation validation
      if (!data.user) {
        setError('User creation failed');
        setIsLoading(false);
        return;
      }

      // Step 2: Insert or update client record
      try {
        const insertClient = supabaseAdmin || supabase;
        const { error: clientInsertError } = await insertClient
          .from('clients')
          .upsert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            email,
            phone: phone || null,
          }, {
            onConflict: 'id'
          });

        if (clientInsertError) {
          console.warn('Client record insertion warning:', clientInsertError);
          
          // Detailed error handling
          const errorMessages: {[key: string]: string} = {
            '42501': 'Unable to create record. Please contact support.',
            'PGRST116': 'Registration failed due to security policy.',
            'UNABLE_TO_GET_SESSION': 'Could not retrieve authentication session.',
          };

          const userFriendlyError = errorMessages[clientInsertError.code] || 
            `Could not complete registration: ${clientInsertError.message}`;
          
          setError(userFriendlyError);
          return;
        }

        await supabase.auth.refreshSession();

        console.log('✅ Client record created successfully');

        // Always redirect on successful signup
        setMessage("Sign up successful! You are now logged in.");
        router.push('/');
      } catch (insertError) {
        console.error('🚨 Unexpected error inserting client:', insertError);
        setError('An unexpected error occurred during registration');
        return;
      }

      // Clear sensitive form fields
      setPassword('');
      setConfirmPassword('');

    } catch (err: unknown) {
      // Type-safe error handling
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('🔥 Unexpected Signup Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#EBCECE] p-4">
      <Card className="w-full max-w-lg bg-white shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-vibrant-coral">Creează-ți Contul</CardTitle>
          <CardDescription className="text-gray-600 pt-2">
            Alătură-te Balance Studio și începe călătoria ta spre bunăstare.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-vibrant-coral">Prenume</Label>
                <Input 
                  id="firstName" 
                  placeholder="Prenumele tău" 
                  required 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  className="border-gray-300 focus:border-soft-peach focus:ring-soft-peach placeholder-gray-500" 
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-vibrant-coral">Nume</Label>
                <Input 
                  id="lastName" 
                  placeholder="Numele tău" 
                  required 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  className="border-gray-300 focus:border-soft-peach focus:ring-soft-peach placeholder-gray-500" 
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-vibrant-coral">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@exemplu.com" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="border-gray-300 focus:border-soft-peach focus:ring-soft-peach placeholder-gray-500" 
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-vibrant-coral">Număr de Telefon (Opțional)</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="Numărul tău de telefon" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="border-gray-300 focus:border-soft-peach focus:ring-soft-peach placeholder-gray-500" 
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-vibrant-coral">Parolă</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Creează o parolă puternică (min 6 caractere)" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="border-gray-300 focus:border-soft-peach focus:ring-soft-peach placeholder-gray-500" 
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-vibrant-coral">Confirmă Parola</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="Confirmă parola ta" 
                required 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="border-gray-300 focus:border-soft-peach focus:ring-soft-peach placeholder-gray-500" 
                disabled={isLoading}
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
            {message && <p className="mt-2 text-sm text-green-600 text-center">{message}</p>}
          </CardContent>
          <CardFooter className="flex flex-col items-center pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Se creează contul...' : 'Înregistrare'}
            </Button>
            <p className="mt-4 text-center text-sm text-gray-600">
              Ai deja un cont?{' '}
              <Link href="/login" className="font-medium text-vibrant-coral hover:text-deep-teal underline">
                 Conectare
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}