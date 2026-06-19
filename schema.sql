-- ESQUEMA DE BASE DE DATOS PARA LETRAS ABIERTAS
-- Ejecutar esto en el SQL Editor de tu Dashboard de Supabase (https://supabase.com)

-- 1. Crear tabla de perfiles (roles y nombres)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text check (role in ('profesor', 'estudiante')) default 'estudiante' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en profiles
alter table public.profiles enable row level security;

-- Políticas de RLS para profiles
create policy "Los perfiles son legibles por todos" 
  on public.profiles for select 
  using (true);

create policy "Los usuarios pueden actualizar su propio perfil" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Los profesores pueden actualizar cualquier perfil (CRUD)"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'profesor'
    )
  );

-- 2. Crear tabla de artículos / trabajos
create table if not exists public.articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  category text not null, -- 'Poesía', 'Cuento', 'Ensayo', 'Crónica'
  file_url text, -- Archivo adjunto opcional
  student_id uuid references public.profiles(id) on delete cascade not null,
  student_name text not null,
  status text check (status in ('borrador', 'pendiente', 'aprobado', 'rechazado')) default 'pendiente' not null,
  cover_url text, -- Imagen de portada opcional
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en articles
alter table public.articles enable row level security;

-- Políticas de RLS para articles
create policy "Artículos aprobados son públicos" 
  on public.articles for select 
  using (status = 'aprobado');

create policy "Estudiantes pueden ver sus propios artículos" 
  on public.articles for select 
  using (auth.uid() = student_id);

create policy "Profesores pueden ver todos los artículos" 
  on public.articles for select 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'profesor'
    )
  );

create policy "Estudiantes pueden crear sus propios artículos" 
  on public.articles for insert 
  with check (auth.uid() = student_id);

create policy "Estudiantes pueden actualizar sus propios artículos si no están aprobados" 
  on public.articles for update 
  using (auth.uid() = student_id and status != 'aprobado');

create policy "Profesores tienen control total sobre artículos" 
  on public.articles for all 
  using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'profesor'
    )
  );

-- 3. Trigger para crear automáticamente el perfil tras el registro en Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Estudiante Nuevo'),
    coalesce(new.raw_user_meta_data->>'role', 'estudiante')
  )
  on conflict (id) do update
  set
    full_name = coalesce(new.raw_user_meta_data->>'full_name', public.profiles.full_name),
    role = coalesce(new.raw_user_meta_data->>'role', public.profiles.role);
  return new;
end;
$$ language plpgsql security definer;

-- Crear el disparador (trigger)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Buckets de Almacenamiento (Storage)
-- Nota: Debes crear un bucket público llamado 'documents' en la sección de Storage de Supabase.
-- Opcionalmente, puedes ejecutar estas políticas en Supabase para el bucket 'documents':
--   - Permitir descargas públicas de archivos
--   - Permitir subidas a usuarios autenticados
