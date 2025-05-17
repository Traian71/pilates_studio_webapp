'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
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

export default function AdminSignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passkey, setPasskey] = useState(''); // <-- Add passkey state
  const [isPasskeyVerified, setIsPasskeyVerified] = useState(false); // <-- Add verification state
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Handler for Passkey Verification ---
  const handleVerifyPasskey = () => {
    setError(null);
    if (passkey === 'pielari57') {
      setIsPasskeyVerified(true);
    } else {
      setError('Incorrect passkey.');
      setIsPasskeyVerified(false);
    }
  };

  // --- Handler for Enter key press in passkey input ---
  const handlePasskeyKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent potential form submission
      handleVerifyPasskey();
    }
  };

  // --- Original Signup Handler ---
  const handleAdminSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Ensure passkey is verified before proceeding
    if (!isPasskeyVerified) {
        setError('Please verify the studio passkey first.');
        return; // Stop signup if passkey isn't verified
    }

    setIsLoading(true);
    setError(null); // Clear any previous errors

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Create user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'admin'
          },
        },
      });

      // Check for signup errors
      if (signUpError) {
        const errorMap: {[key: string]: string} = {
          'user_already_exists': 'An admin account with this email already exists.',
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
        setError('Admin account creation failed');
        setIsLoading(false);
        return;
      }

      // Step 2: Insert admin record
      try {
        const insertAdmin = supabaseAdmin || supabase;
        const { error: adminInsertError } = await insertAdmin
          .from('admins')
          .upsert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            email,
          }, {
            onConflict: 'id'
          });

        if (adminInsertError) {
          console.warn('Admin record insertion warning:', adminInsertError);
          
          const errorMessages: {[key: string]: string} = {
            '42501': 'Unable to create admin record. Please contact support.',
            'PGRST116': 'Registration failed due to security policy.',
          };

          const userFriendlyError = errorMessages[adminInsertError.code] || 
            `Could not complete registration: ${adminInsertError.message}`;
          
          setError(userFriendlyError);
          return;
        }

        await supabase.auth.refreshSession();

        console.log('✅ Admin record created successfully');

        // Redirect to admin profile
        setMessage("Admin signup successful!");
        router.push('/admin_profile'); 

      } catch (insertError) {
        console.error('🚨 Unexpected error inserting admin record:', insertError);
        setError('An unexpected error occurred during registration');
        return;
      }

      // Clear sensitive form fields
      setPassword('');
      setConfirmPassword('');

    } catch (err: unknown) {
      // Type-safe error handling
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('🔥 Unexpected Admin Signup Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#EBCECE]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Signup</CardTitle>
          <CardDescription>Create an admin account for Balance Studio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminSignUp} className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}

            {/* Passkey Section */}
            {!isPasskeyVerified && (
              <div className="space-y-2 pb-4 border-b border-gray-200 mb-4">
                <Label htmlFor="passkey">Studio Passkey</Label>
                <Input 
                  id="passkey"
                  type="password" // Use password type to obscure input
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  required 
                  placeholder="Enter the studio passkey"
                  onKeyDown={handlePasskeyKeyDown} // <-- Add keydown listener
                  disabled={isLoading}
                />
                 <Button 
                    type="button" // Important: Not a submit button
                    onClick={handleVerifyPasskey} // Use the verification handler
                    disabled={isLoading || !passkey} 
                    className="w-full mt-2"
                 >
                    Verify Passkey
                 </Button>
              </div>
            )}

            {/* Rest of the form - only shown after passkey verification */}       
            {isPasskeyVerified && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required 
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required 
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Admin Account'}
                </Button>
              </>
            )}

          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm">Already an admin? <Link href="/login" className="text-vibrant-coral hover:underline">Login here</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
