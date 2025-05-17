'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext'; // Assuming you have AuthProvider

interface InstructorEditData {
  first_name: string;
  last_name: string;
  phone?: string;
  bio?: string;
  specializations?: string;
  profile_image_url?: string;
}

export default function EditInstructorProfilePage() {
  const router = useRouter();
  const { user } = useAuth(); // Get user from AuthProvider
  const [formData, setFormData] = useState<InstructorEditData>({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    specializations: '',
    profile_image_url: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // TODO: Add state for file upload if implementing profile image change

  const fetchInstructorData = useCallback(async () => {
    if (!user) {
      // This might run on initial render before user is populated by useAuth
      // If user is still null after a brief delay, then redirect.
      setTimeout(() => {
        if(!user) {
          toast.error('You must be logged in to edit the profile.');
          router.push('/instructor_auth');
        }
      }, 1000); // Wait 1 sec for user to populate
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('first_name, last_name, phone, bio, specializations, profile_image_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          bio: data.bio || '',
          specializations: data.specializations || '',
          profile_image_url: data.profile_image_url || '',
        });
      }
    } catch (error: any) {
      toast.error(`Failed to fetch profile data: ${error.message}`);
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    // Ensure user is loaded before fetching, or if user changes
    if (user) {
      fetchInstructorData();
    }
  }, [user, fetchInstructorData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // TODO: Add handleFileChange for profile image upload

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called'); // Debug log
    e.preventDefault();
    console.log('User object:', user); // Debug log
    if (!user) {
      toast.error('User not found. Cannot save profile.');
      return;
    }
    console.log('Form data to submit:', formData); // Debug log
    setIsSaving(true);
    try {
      console.log('Attempting Supabase update...'); // Debug log
      const { error } = await supabase
        .from('instructors')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          bio: formData.bio,
          specializations: formData.specializations,
          // profile_image_url: formData.profile_image_url, // Handle separately if uploading
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
      router.push('/instructor_profile'); // Navigate back to profile view
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message}`);
      console.error("Update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !formData.first_name) { // Show loading only if data hasn't been populated yet
    return <div className="flex justify-center items-center h-screen"><p>Loading profile for editing...</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#EBCECE] py-8 px-4 flex flex-col items-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-vibrant-coral">Edit Instructor Profile</CardTitle>
          <CardDescription>Update your personal information and professional details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea id="bio" name="bio" value={formData.bio || ''} onChange={handleChange} rows={4} />
            </div>
            <div>
              <Label htmlFor="specializations">Specializations (Optional, comma-separated)</Label>
              <Input id="specializations" name="specializations" value={formData.specializations || ''} onChange={handleChange} />
            </div>
            
            {/* TODO: Add UI for profile_image_url and file upload */}
            {formData.profile_image_url && (
              <div className="my-4">
                <Label>Current Profile Picture</Label>
                <img src={formData.profile_image_url} alt="Current profile" className="w-24 h-24 rounded-full object-cover mt-2" />
              </div>
            )}
            {/* 
            <div>
              <Label htmlFor="profile_image_file">Upload New Profile Picture</Label>
              <Input id="profile_image_file" name="profile_image_file" type="file" onChange={handleFileChange} />
            </div>
            */}

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" variant="outline" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
