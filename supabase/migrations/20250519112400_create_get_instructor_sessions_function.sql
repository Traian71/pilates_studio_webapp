-- Create a secure function to get sessions with related data
create or replace function public.get_instructor_sessions(
  start_date_param timestamptz,
  end_date_param timestamptz
)
returns table (
  id uuid,
  instructor_id uuid,
  class_type_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  capacity integer,
  spots_available integer,
  status text,
  instructor_first_name text,
  instructor_last_name text,
  class_type_name text,
  booking_count bigint
)
language sql
security definer
as $$
  select 
    s.id,
    s.instructor_id,
    s.class_type_id,
    s.start_time,
    s.end_time,
    s.capacity,
    s.spots_available,
    s.status,
    i.first_name as instructor_first_name,
    i.last_name as instructor_last_name,
    ct.name as class_type_name,
    (select count(*) from bookings b where b.session_id = s.id) as booking_count
  from 
    sessions s
    join instructors i on i.id = s.instructor_id
    join class_types ct on ct.id = s.class_type_id
  where 
    s.start_time >= start_date_param
    and s.start_time <= end_date_param
    and (
      -- Only admins or the instructor who owns the session can see it
      exists (
        select 1 from auth.users u 
        where u.id = auth.uid() and u.raw_user_meta_data->>'role' = 'admin'
      )
      or exists (
        select 1 from auth.users u 
        where u.id = auth.uid() and u.id = s.instructor_id
      )
    )
  order by s.start_time;
$$;
