"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient'; // Adjusted path
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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/');
  
  useEffect(() => {
    // Get redirect parameter from URL
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectPath(redirect);
    }
  }, [searchParams]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Redirect to the specified path or homepage on successful login
        router.push(redirectPath);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#EBCECE] p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-vibrant-coral">Bine ai revenit!</CardTitle>
          <CardDescription className="text-gray-600 pt-2">
            Conectează-te pentru a-ți accesa contul și a-ți continua călătoria în lumea Pilates.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin} id="login-form">
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-vibrant-coral">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your.email@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-300 focus:border-soft-peach focus:ring-soft-peach placeholder-gray-500"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-vibrant-coral">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gray-300 focus:border-soft-peach focus:ring-soft-peach placeholder-gray-500"
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-100 border border-red-400 p-3 rounded-md">{error}</p>
            )}
          </CardContent>
        </form>
        <CardFooter className="flex flex-col items-center space-y-4 text-sm pt-4"> {/* Adjusted padding and added space-y */} 
          <Button 
            type="submit" 
            className="w-full" // Use standard button styling
            disabled={isLoading}
            form="login-form" // Associate button with the form
          >
            {isLoading ? 'Se conectează...' : 'Conectare'}
          </Button>
          <Link href="/signup" className="text-vibrant-coral hover:text-vibrant-coral/80 hover:underline">
            Nu ai cont? Înregistrează-te
          </Link>
          <Link href="/reset-password" className="text-gray-500 hover:text-vibrant-coral hover:underline">
            Ai uitat parola?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

