-- I.M.A FILMES V11 | executar no SQL Editor do projeto ibamnkaeiadvutpreouf
create extension if not exists pgcrypto;
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,name text,username text,avatar_url text,role text default 'user',created_at timestamptz default now());
create table if not exists public.contents(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,type text not null,title text not null,description text,year int,price numeric(12,2) default 0,free boolean default true,cover_url text,status text default 'active',created_at timestamptz default now(),constraint contents_type_check check(type in ('Filme','Série','Anime','Dorama','E-book')),constraint contents_status_check check(status in ('active','pending','removed','blocked')));
create table if not exists public.episodes(id uuid primary key default gen_random_uuid(),content_id uuid not null references public.contents(id) on delete cascade,season_no int default 1,episode_no int default 1,title text,video_url text not null,created_at timestamptz default now());
create index if not exists contents_owner_idx on public.contents(owner_id);create index if not exists contents_status_idx on public.contents(status);create index if not exists episodes_content_idx on public.episodes(content_id);
grant usage on schema public to anon,authenticated;grant select on public.contents,public.episodes to anon;grant select,insert,update on public.profiles to authenticated;grant select,insert,update,delete on public.contents,public.episodes to authenticated;
alter table public.profiles enable row level security;alter table public.contents enable row level security;alter table public.episodes enable row level security;
drop policy if exists profiles_select_own on public.profiles;create policy profiles_select_own on public.profiles for select to authenticated using(id=auth.uid());
drop policy if exists profiles_insert_own on public.profiles;create policy profiles_insert_own on public.profiles for insert to authenticated with check(id=auth.uid());
drop policy if exists profiles_update_own on public.profiles;create policy profiles_update_own on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
drop policy if exists contents_public_read on public.contents;create policy contents_public_read on public.contents for select to anon,authenticated using(status='active' or owner_id=auth.uid());
drop policy if exists contents_owner_insert on public.contents;create policy contents_owner_insert on public.contents for insert to authenticated with check(owner_id=auth.uid());
drop policy if exists contents_owner_update on public.contents;create policy contents_owner_update on public.contents for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists contents_owner_delete on public.contents;create policy contents_owner_delete on public.contents for delete to authenticated using(owner_id=auth.uid());
drop policy if exists episodes_public_read on public.episodes;create policy episodes_public_read on public.episodes for select to anon,authenticated using(exists(select 1 from public.contents c where c.id=episodes.content_id and (c.status='active' or c.owner_id=auth.uid())));
drop policy if exists episodes_owner_insert on public.episodes;create policy episodes_owner_insert on public.episodes for insert to authenticated with check(exists(select 1 from public.contents c where c.id=episodes.content_id and c.owner_id=auth.uid()));
drop policy if exists episodes_owner_update on public.episodes;create policy episodes_owner_update on public.episodes for update to authenticated using(exists(select 1 from public.contents c where c.id=episodes.content_id and c.owner_id=auth.uid()));
drop policy if exists episodes_owner_delete on public.episodes;create policy episodes_owner_delete on public.episodes for delete to authenticated using(exists(select 1 from public.contents c where c.id=episodes.content_id and c.owner_id=auth.uid()));
notify pgrst,'reload schema';

-- Storage: capas públicas e vídeos privados
insert into storage.buckets (id,name,public) values ('capas','capas',true) on conflict (id) do update set public=true;
insert into storage.buckets (id,name,public) values ('videos','videos',false) on conflict (id) do update set public=false;

drop policy if exists v11_capas_insert on storage.objects;
create policy v11_capas_insert on storage.objects for insert to authenticated with check(bucket_id='capas' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists v11_capas_update on storage.objects;
create policy v11_capas_update on storage.objects for update to authenticated using(bucket_id='capas' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists v11_capas_delete on storage.objects;
create policy v11_capas_delete on storage.objects for delete to authenticated using(bucket_id='capas' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists v11_capas_select_public on storage.objects;
create policy v11_capas_select_public on storage.objects for select to anon,authenticated using(bucket_id='capas');

drop policy if exists v11_videos_insert on storage.objects;
create policy v11_videos_insert on storage.objects for insert to authenticated with check(bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists v11_videos_update on storage.objects;
create policy v11_videos_update on storage.objects for update to authenticated using(bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists v11_videos_delete on storage.objects;
create policy v11_videos_delete on storage.objects for delete to authenticated using(bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists v11_videos_select_authenticated on storage.objects;
create policy v11_videos_select_authenticated on storage.objects for select to authenticated using(bucket_id='videos');
notify pgrst,'reload schema';
