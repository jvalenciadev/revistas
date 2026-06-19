-- =====================================================
-- PARCHE: Corregir RLS y columna email en profiles
-- Ejecutar en: Supabase > SQL Editor
-- =====================================================

-- 1. Agregar columna email si no existe (el código la necesita)
alter table public.profiles 
  add column if not exists email text;

-- 2. Política de INSERT faltante: cualquier usuario autenticado puede
--    insertar su PROPIO perfil (auth.uid() debe coincidir con id)
drop policy if exists "Los usuarios pueden crear su propio perfil" on public.profiles;
create policy "Los usuarios pueden crear su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. También permitir UPSERT (UPDATE a usuarios que ya existen)
--    La política de UPDATE ya existe pero la reforzamos:
drop policy if exists "Los usuarios pueden actualizar su propio perfil" on public.profiles;
create policy "Los usuarios pueden actualizar su propio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. Verificar que el trigger sigue activo (re-crearlo limpio)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Estudiante Nuevo'),
    coalesce(new.raw_user_meta_data->>'role', 'estudiante'),
    new.email
  )
  on conflict (id) do update
  set
    full_name = coalesce(new.raw_user_meta_data->>'full_name', public.profiles.full_name),
    role      = coalesce(new.raw_user_meta_data->>'role', public.profiles.role),
    email     = new.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Backfill: crear perfil para usuarios que ya existen en Auth pero no en profiles
--    (esto resuelve las cuentas antiguas sin perfil)
insert into public.profiles (id, full_name, role, email)
select 
  au.id,
  coalesce(au.raw_user_meta_data->>'full_name', au.email, 'Usuario'),
  coalesce(au.raw_user_meta_data->>'role', 'estudiante'),
  au.email
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null
on conflict (id) do nothing;
