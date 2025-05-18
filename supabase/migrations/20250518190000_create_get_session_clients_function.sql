-- Create a function that gets clients for a session
create or replace function public.get_session_clients(session_id_param uuid)
returns table (first_name text, last_name text) 
language sql
security definer
as $$
  select c.first_name, c.last_name
  from bookings b
  join clients c on b.client_id = c.id
  where b.session_id = session_id_param;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_session_clients to authenticated;
