'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from 'sonner';

interface AdminProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminProfile, setAdminProfile] = useState<AdminProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast.error(sessionError?.message || 'You are not authenticated. Redirecting to login...');
        router.push('/login'); // Or admin login page e.g., /admin_auth
        setIsLoading(false);
        return;
      }

      const user = session.user;

      // For admins, we'll use user_metadata for first/last name and user object for email
      // If you have a separate 'admins' table, adjust this logic accordingly.
      const profileData: AdminProfileData = {
        id: user.id,
        first_name: user.user_metadata?.first_name || 'Admin',
        last_name: user.user_metadata?.last_name || 'User',
        email: user.email || 'N/A',
      };
      
      setAdminProfile(profileData);
      setIsLoading(false);
    };

    fetchProfileData();
  }, [router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Logout failed:' + error.message);
    } else {
      toast.success('Logged out successfully');
      router.push('/login'); // Or admin login page
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-500">{error}</p></div>;
  }

  if (!adminProfile) {
    return <div className="flex justify-center items-center h-screen"><p>No profile information available.</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#EBCECE] p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          {/* Profile Image or Avatar Fallback */}
          <div className="flex justify-center pt-4">
            <Avatar className="w-28 h-28 border-2 border-deep-teal shadow-sm">
              <AvatarFallback className="text-3xl bg-gray-200 text-deep-teal">
                {adminProfile.first_name?.[0]?.toUpperCase()}
                {adminProfile.last_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 pt-4"> 
            <div>
              <p className="text-lg font-semibold">
                {adminProfile.first_name} {adminProfile.last_name}
              </p>
              <p className="text-sm text-gray-600">{adminProfile.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => router.push('/all_sessions')}>View Sessions</Button>
              <Button variant="outline" onClick={() => router.push('/admin_profile/edit')}>Edit Profile</Button>
            </div>

            <div className="mt-6 flex flex-col space-y-2">
              <Button onClick={handleLogout} variant="outline" className="w-full">
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
