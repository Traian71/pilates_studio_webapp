-- Enable Row Level Security on clients table if not already enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin users to select all clients
CREATE POLICY "Enable read access for admin users" 
ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create policy to allow admin users to insert clients
CREATE POLICY "Enable insert for admin users"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create policy to allow admin users to update clients
CREATE POLICY "Enable update for admin users"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create policy to allow admin users to delete clients
CREATE POLICY "Enable delete for admin users"
ON public.clients
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
  )
);
