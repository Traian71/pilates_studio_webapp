-- Create a function that gets bookings for a session
create or replace function public.get_session_bookings(session_id_param uuid)
returns table (
  booking_id uuid,
  client_id uuid,
  first_name text,
  last_name text
) 
language sql
security definer
as $$
  select 
    b.id as booking_id,
    b.client_id,
    c.first_name,
    c.last_name
  from bookings b
  join clients c on b.client_id = c.id
  where b.session_id = session_id_param
  -- Ensure the user has permission to view this data
  and (
    -- Allow if the user is an admin
    exists (
      select 1 from auth.users u
      where u.id = auth.uid() 
      and u.raw_user_meta_data->>'role' = 'admin'
    )
    or
    -- Or if the user is an instructor who owns the session
    exists (
      select 1 from sessions s
      join auth.users u on u.id = auth.uid()
      join instructors i on i.id = u.id  -- instructors.id is the same as auth.users.id
      where s.id = session_id_param
      and s.instructor_id = i.id
    )
  );
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_session_bookings to authenticated;
