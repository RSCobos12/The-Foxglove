-- ==========================================================
-- The Foxglove
-- Phase IV — Invitation Activation
-- ==========================================================

create or replace function public.activate_invited_profile()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  activated_profile record;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  update public.profiles
  set
    account_status = 'active',
    is_active = true,
    updated_at = now()
  where id = auth.uid()
    and account_status = 'invited'
  returning
    id,
    role,
    account_status,
    is_active
  into activated_profile;

  if not found then
    select
      id,
      role,
      account_status,
      is_active
    into activated_profile
    from public.profiles
    where id = auth.uid();
  end if;

  if activated_profile.id is null then
    raise exception 'A matching member profile was not found.';
  end if;

  return jsonb_build_object(
    'id',
    activated_profile.id,

    'role',
    activated_profile.role,

    'account_status',
    activated_profile.account_status,

    'is_active',
    activated_profile.is_active
  );
end;
$$;

revoke all
on function public.activate_invited_profile()
from public;

grant execute
on function public.activate_invited_profile()
to authenticated;

-- ==========================================================
-- END OF FILE
-- ==========================================================