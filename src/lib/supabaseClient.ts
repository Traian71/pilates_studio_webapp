import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Ensure these environment variables are set in your .env.local file
const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate Supabase configuration
function validateSupabaseConfig() {
  if (!supabaseUrl) {
    console.error('❌ Missing Supabase URL');
    console.error('Please check your .env.local file');
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!supabaseAnonKey) {
    console.error('❌ Missing Supabase Anon Key');
    console.error('Please check your .env.local file');
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  // Additional validation can be added here
  if (!supabaseUrl.includes('supabase.co')) {
    console.warn('⚠️ Supabase URL might be incorrect');
  }
}

// Validate configuration before creating client
validateSupabaseConfig();

// Create Supabase client with comprehensive configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-application-name': 'Balance Studio' },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Create a service role client for admin operations
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: { 'x-forwarded-role': 'service_role' },
      },
    }) 
  : null;

// Validate service role key if present
if (supabaseServiceKey && !supabaseAdmin) {
  console.error('❌ Failed to create service role client');
  console.warn('⚠️ Check your SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

// Note: Supabase client doesn't have a native 'on' method for global errors
// This is a placeholder for potential future error handling
// You might want to use try-catch or specific error handling methods
