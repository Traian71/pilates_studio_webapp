"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient"; // Adjusted path
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

export default function NewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  useEffect(() => {
    // Supabase client library automatically handles the session from the URL fragment.
    // We just need to check if a session exists after the component mounts and the client has processed the URL.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // This can happen if the link is invalid, expired, or already used.
        // Or if the user navigates here directly without a valid token in the URL.
        setError("Invalid or expired password reset link. Please request a new one.");
        // Optionally redirect to login or password reset request page after a delay
        // setTimeout(() => router.push('/login'), 5000); 
      }
      setIsSessionChecked(true);
    };

    // The token is in the URL fragment (hash). Supabase client needs a moment to process it.
    // A short delay can help ensure the client has picked up the session from the fragment.
    const timer = setTimeout(() => {
        checkSession();
    }, 500); // Adjust delay if needed, or listen to auth state changes for a more robust solution

    return () => clearTimeout(timer);
  }, [router]);

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
      } else {
        setMessage("Your password has been updated successfully! You can now log in with your new password.");
        // Clear form
        setPassword('');
        setConfirmPassword('');
        // Optionally sign the user out if they were technically in a session from the reset link
        // await supabase.auth.signOut(); 
        setTimeout(() => router.push('/login'), 3000); // Redirect to login after a delay
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSessionChecked && !error) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-transparent p-4">
            <p className="text-soft-peach">Se verifică link-ul de resetare a parolei...</p>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-soft-peach">Setează o Parolă Nouă</CardTitle>
          {!error && !message && (
            <CardDescription className="text-gray-600 pt-2">
              Te rugăm să introduci noua ta parolă mai jos.
            </CardDescription>
          )}
        </CardHeader>
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-6">
            {isSessionChecked && !error && !message && ( // Only show form if session is valid and no final message
              <>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-soft-peach">Parolă Nouă</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Introdu parola nouă (min 6 caractere)"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-gray-300 focus:border-soft-peach focus:ring-soft-peach placeholder-gray-500"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-soft-peach">Confirmă Parola Nouă</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmă parola nouă"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-gray-300 focus:border-soft-peach focus:ring-soft-peach placeholder-gray-500"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-vibrant-coral text-white hover:bg-vibrant-coral/90"
                  disabled={isLoading || !!error } // Disable if loading or initial check failed
                >
                  {isLoading ? 'Se actualizează...' : 'Actualizează Parola'}
                </Button>
              </>
            )}
            {error && (
              <p className="text-sm text-red-500 bg-red-100 border border-red-400 p-3 rounded-md">{error}</p>
            )}
            {message && (
              <p className="text-sm text-green-600 bg-green-100 border border-green-400 p-3 rounded-md">{message}</p>
            )}
          </CardContent>
        </form>
        {(message || error) && ( // Show link to login only if there's a final message or an error that prevents form use
            <CardFooter className="flex justify-center text-sm pt-6">
                <Link href="/login" className="text-soft-peach hover:text-vibrant-coral hover:underline">
                    Înapoi la Conectare
                </Link>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
