-- I.M.A FILMES V9 / Supabase PostgreSQL
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default 'Utilizador',
 role text not null default 'user' check (role in ('user','admin')),
 created_at timestamptz not null default now()
);

create table if not exists public.contents (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 type text not null check (type in ('Filme','Série','E-book')),
 title text not null, description text default '', year int, price numeric(12,2) default 0, free boolean not null default true, cover_url text, ebook_url text, status text not null default 'active', created_at timestamptz not null default now()
);

create table if not exists public.episodes (
 id uuid primary key default gen_random_uuid(),
 content_id uuid not null references public.contents(id) on delete cascade,
 season_no int not null default 1, episode_no int not null default 1, title text not null, video_url text, duration numeric, created_at timestamptz not null default now(), unique(content_id,season_no,episode_no)
);

create table if not exists public.favorites (user_id uuid references public.profiles(id) on delete cascade, content_id uuid references public.contents(id) on delete cascade, created_at timestamptz default now(), primary key(user_id,content_id));
create table if not exists public.progress (user_id uuid references public.profiles(id) on delete cascade, content_id uuid references public.contents(id) on delete cascade, seconds numeric default 0, duration numeric default 0, updated_at timestamptz default now(), primary key(user_id,content_id));
create table if not exists public.transactions (id uuid primary key default gen_random_uuid(), buyer_id uuid references public.profiles(id), seller_id uuid references public.profiles(id), content_id uuid references public.contents(id), amount numeric(12,2) not null default 0, status text not null default 'pending', created_at timestamptz default now());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$ begin insert into public.profiles(id,name) values(new.id,coalesce(new.raw_user_meta_data->>'name','Utilizador')); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security; alter table public.contents enable row level security; alter table public.episodes enable row level security; alter table public.favorites enable row level security; alter table public.progress enable row level security; alter table public.transactions enable row level security;

create policy "profiles own read" on public.profiles for select using (auth.uid()=id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "profiles own update" on public.profiles for update using(auth.uid()=id);
create policy "contents public read" on public.contents for select using(status='active');
create policy "contents owner insert" on public.contents for insert with check(auth.uid()=owner_id);
create policy "contents owner update" on public.contents for update using(auth.uid()=owner_id);
create policy "contents owner delete" on public.contents for delete using(auth.uid()=owner_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "episodes public read" on public.episodes for select using(true);
create policy "episodes owner write" on public.episodes for all using(exists(select 1 from public.contents c where c.id=content_id and c.owner_id=auth.uid()));
create policy "favorites own" on public.favorites for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "progress own" on public.progress for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "transactions buyer seller" on public.transactions for select using(auth.uid()=buyer_id or auth.uid()=seller_id);

insert into storage.buckets(id,name,public) values('videos','videos',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values('capas','capas',true) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values('ebooks','ebooks',false) on conflict(id) do nothing;

-- Storage: o utilizador só deve gravar na própria pasta.
create policy "video upload own folder" on storage.objects for insert to authenticated with check(bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "video read authenticated" on storage.objects for select to authenticated using(bucket_id='videos');
create policy "video delete own" on storage.objects for delete to authenticated using(bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "cover upload own folder" on storage.objects for insert to authenticated with check(bucket_id='capas' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "cover public read" on storage.objects for select using(bucket_id='capas');
create policy "ebook upload own folder" on storage.objects for insert to authenticated with check(bucket_id='ebooks' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "ebook read authenticated" on storage.objects for select to authenticated using(bucket_id='ebooks');
