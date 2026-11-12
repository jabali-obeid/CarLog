-- ============================================================================
-- CarLog - Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Ejecuta este script completo en el SQL Editor de tu proyecto Supabase
-- ============================================================================

-- 1. Tabla de Perfiles de Usuarios (vinculada a auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text not null,
  avatar_url text,
  rank text default 'Spotter Novato',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Los perfiles públicos son visibles para todos"
  on public.profiles for select
  using ( true );

create policy "Los usuarios pueden actualizar su propio perfil"
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Los usuarios pueden insertar su propio perfil"
  on public.profiles for insert
  with check ( auth.uid() = id );

-- Trigger automático para crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    'https://api.dicebear.com/7.x/bottts/svg?seed=' || coalesce(new.raw_user_meta_data->>'username', new.id::text)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Tabla de Autos Capturados por Usuario (Garage Personal)
create table if not exists public.garage_cars (
  id text not null,
  user_id uuid references auth.users on delete cascade not null,
  brand text not null,
  model text not null,
  year text,
  rarity text default 'Común',
  hp integer default 0,
  zero_to_hundred numeric default 0,
  top_speed integer default 0,
  engine text,
  color text,
  country text,
  fun_fact text,
  rarity_reason text,
  image_url text,
  model_3d_url text,
  captured_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, id)
);

alter table public.garage_cars enable row level security;

create policy "Cada usuario ve sus propios autos"
  on public.garage_cars for select
  using ( auth.uid() = user_id );

create policy "Cada usuario guarda autos en su propio garage"
  on public.garage_cars for insert
  with check ( auth.uid() = user_id );

create policy "Cada usuario actualiza sus propios autos"
  on public.garage_cars for update
  using ( auth.uid() = user_id );

create policy "Cada usuario elimina autos de su propio garage"
  on public.garage_cars for delete
  using ( auth.uid() = user_id );

-- 3. Tabla de Radar Comunitario (Avistamientos en tiempo real)
create table if not exists public.radar_spots (
  id text primary key,
  user_id uuid references auth.users on delete set null,
  brand text not null,
  model text not null,
  year text,
  rarity text default 'Raro',
  hp integer default 0,
  zero_to_hundred numeric default 0,
  top_speed integer default 0,
  engine text,
  color text,
  image_silhouette text,
  spotted_by text default 'Spotter_CarLog',
  address text default 'Zona Urbana',
  lat double precision default -34.5850,
  lng double precision default -58.4200,
  distance_meters integer default 500,
  spotted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '30 minutes') not null
);

alter table public.radar_spots enable row level security;

create policy "Cualquiera puede ver alertas activas del radar"
  on public.radar_spots for select
  using ( true );

create policy "Usuarios autenticados pueden emitir alertas al radar"
  on public.radar_spots for insert
  with check ( auth.uid() = user_id );

-- 4. Bucket de Storage para fotos reales (Opcional, mejora aún más el rendimiento)
insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', true)
on conflict (id) do nothing;

create policy "Fotos de autos visibles públicamente"
  on storage.objects for select
  using ( bucket_id = 'car-photos' );

create policy "Usuarios autenticados suben fotos a su carpeta"
  on storage.objects for insert
  with check (
    bucket_id = 'car-photos'
    and auth.role() = 'authenticated'
  );

-- 5. Control de cuota diaria de escaneos IA (15 escaneos por usuario/día)
create table if not exists public.daily_scan_usage (
  user_id uuid references auth.users on delete cascade not null,
  scan_date date not null default (timezone('utc'::text, now()))::date,
  scan_count integer not null default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, scan_date)
);

alter table public.daily_scan_usage enable row level security;

create policy "Cada usuario consulta su propio consumo diario"
  on public.daily_scan_usage for select
  using ( auth.uid() = user_id );

create or replace function public.consume_daily_scan(max_scans integer default 15)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (timezone('utc'::text, now()))::date;
  v_count integer;
begin
  if v_uid is null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'AUTH_REQUIRED',
      'used', 0,
      'remaining', 0,
      'limit', max_scans
    );
  end if;

  insert into public.daily_scan_usage (user_id, scan_date, scan_count)
  values (v_uid, v_today, 0)
  on conflict (user_id, scan_date) do nothing;

  update public.daily_scan_usage
  set scan_count = scan_count + 1,
      updated_at = timezone('utc'::text, now())
  where user_id = v_uid
    and scan_date = v_today
    and scan_count < max_scans
  returning scan_count into v_count;

  if v_count is null then
    select scan_count into v_count
    from public.daily_scan_usage
    where user_id = v_uid and scan_date = v_today;

    return jsonb_build_object(
      'allowed', false,
      'reason', 'LIMIT_REACHED',
      'used', coalesce(v_count, max_scans),
      'remaining', 0,
      'limit', max_scans
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', v_count,
    'remaining', greatest(0, max_scans - v_count),
    'limit', max_scans
  );
end;
$$;

grant execute on function public.consume_daily_scan(integer) to authenticated;


