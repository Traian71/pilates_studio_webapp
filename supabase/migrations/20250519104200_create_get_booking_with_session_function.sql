-- Create a function that gets a booking with its session details
create or replace function public.get_booking_with_session(booking_id_param uuid)
returns table (
  booking_id uuid,
  client_id uuid,
  session_id uuid,
  booking_time timestamptz,
  status text,
  instructor_id uuid,
  instructor_first_name text,
  instructor_last_name text,
  class_type_id uuid,
  class_type_name text,
  start_time timestamptz,
  end_time timestamptz,
  capacity integer,
  spots_available integer
) 
language plpgsql
security definer
as $$
begin
  -- Debug: Log the input parameters
  raise notice 'get_booking_with_session called with booking_id_param: %', booking_id_param;
  raise notice 'auth.uid(): %', auth.uid();
  
  return query
  select 
    b.id as booking_id,
    b.client_id,
    b.session_id,
    b.booking_time,
    b.status,
    s.instructor_id,
    i.first_name as instructor_first_name,
    i.last_name as instructor_last_name,
    s.class_type_id,
    ct.name as class_type_name,
    s.start_time,
    s.end_time,
    s.capacity,
    s.spots_available
  from bookings b
  join sessions s on b.session_id = s.id
  left join instructors i on s.instructor_id = i.id
  left join class_types ct on s.class_type_id = ct.id
  where b.id = booking_id_param
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
      select 1 from auth.users u
      where u.id = auth.uid()
      and exists (
        select 1 from instructors inst 
        where inst.id = u.id 
        and inst.id = s.instructor_id
      )
    )
    or
    -- Or if the user is the client who made the booking
    exists (
      select 1 from auth.users u
      join clients c on c.user_id = u.id
      where u.id = auth.uid()
      and c.id = b.client_id
    )
  )
  limit 1;
  
  -- Debug: Log if no rows were returned
  if not found then
    raise notice 'No booking found with id: %', booking_id_param;
  end if;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_booking_with_session to authenticated;
