"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from '../../lib/supabaseClient'; // Ensure this path is correct
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

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/new-password`, // Your page to handle the password update
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage("If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");
        setEmail(''); // Clear the email field
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-soft-peach">Resetează Parola</CardTitle>
          <CardDescription className="text-gray-600 pt-2">
            Introdu adresa ta de email mai jos și îți vom trimite un link pentru a-ți reseta parola.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordReset}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-soft-peach">Email</Label>
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
            {error && (
              <p className="text-sm text-red-500 bg-red-100 border border-red-400 p-3 rounded-md">{error}</p>
            )}
            {message && (
              <p className="text-sm text-green-600 bg-green-100 border border-green-400 p-3 rounded-md">{message}</p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-vibrant-coral text-white hover:bg-vibrant-coral/90" 
              disabled={isLoading}
            >
              {isLoading ? 'Se trimite...' : 'Trimite Link de Resetare'}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center text-sm pt-6">
          <Link href="/login" className="text-soft-peach hover:text-vibrant-coral hover:underline">
            Ți-ai amintit parola? Conectare
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}