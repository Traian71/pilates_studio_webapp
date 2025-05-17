"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
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

export default function LoginForm() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Redirect after successful login
      router.push(redirectPath);
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Conectare</CardTitle>
        <CardDescription className="text-center">
          Introduceți datele de conectare
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 border border-red-400 p-3 rounded-md">{error}</div>
        )}
        <form onSubmit={handleSubmit} id="login-form">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nume@exemplu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parolă</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-4">
        <Button 
          type="submit" 
          form="login-form"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Se conectează...' : 'Conectare'}
        </Button>
        <div className="flex flex-col items-center space-y-2 text-sm pt-2">
          <Link href="/reset-password" className="text-gray-500 hover:text-vibrant-coral hover:underline">
            Ai uitat parola?
          </Link>
          <p className="text-sm text-center w-full">
            Nu ai cont? 
            <Link href="/signup" className="text-vibrant-coral hover:text-vibrant-coral/80 hover:underline ml-1">
              Înregistrează-te
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}