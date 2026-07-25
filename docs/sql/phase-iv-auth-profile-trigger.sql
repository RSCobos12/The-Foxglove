-- ==========================================================
-- The Foxglove Invitational
-- Phase IV — Auth Profile Trigger
-- ==========================================================
--
-- Purpose
--
-- Create profile records from Supabase Auth users while
-- respecting invitation status and access metadata.
--
-- ==========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_status text;
  requested_active boolean;
begin
  requested_status :=
    case
      when new.raw_user_meta_data ->> 'account_status'
        in ('invited', 'active', 'inactive')
      then new.raw_user_meta_data ->> 'account_status'
      else 'active'
    end;

  requested_active :=
    case
      when lower(
        coalesce(
          new.raw_user_meta_data ->> 'is_active',
          'true'
        )
      ) = 'false'
      then false
      else true
    end;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    account_status,
    is_active
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'first_name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'last_name',
      ''
    ),
    new.email,
    case
      when new.raw_user_meta_data ->> 'role'
        = 'admin'
      then 'admin'
      else 'member'
    end,
    requested_status,
    requested_active
  );

  return new;
end;
$$;

-- ==========================================================
-- END OF FILE
-- ==========================================================