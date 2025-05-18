-- Create a secure function to get bookings for multiple sessions
create or replace function public.get_bookings_for_sessions(
  session_ids uuid[]
)
returns table (
  id uuid,
  client_id uuid,
  session_id uuid,
  client_subscription_id uuid,
  booking_time timestamptz,
  status text,
  client_first_name text,
  client_last_name text
)
language sql
security definer
as $$
  select 
    b.id,
    b.client_id,
    b.session_id,
    b.client_subscription_id,
    b.booking_time,
    b.status,
    c.first_name as client_first_name,
    c.last_name as client_last_name
  from 
    bookings b
    join clients c on c.id = b.client_id
  where 
    b.session_id = any(session_ids)
    and (
      -- Only admins or the instructor who owns the session can see the bookings
      exists (
        select 1 from auth.users u 
        where u.id = auth.uid() and u.raw_user_meta_data->>'role' = 'admin'
      )
      or exists (
        select 1 from auth.users u 
        join sessions s on s.instructor_id = u.id
        where u.id = auth.uid() and s.id = b.session_id
      )
    );
$$;
