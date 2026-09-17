-- I.M.A FILMES V10 - esquema inicial para Supabase/Postgres
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null,
 avatar_url text,
 role text not null default 'seller' check(role in ('seller','admin')),
 created_at timestamptz not null default now()
);

create table if not exists public.contents (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 type text not null check(type in ('Filme','Série','Anime','Dorama','E-book')),
 title text not null,
 description text,
 cover_url text,
 ebook_url text,
 price numeric(12,2) not null default 0 check(price>=0),
 free boolean not null default true,
 status text not null default 'active' check(status in ('active','pending','removed')),
 created_at timestamptz not null default now()
);

create table if not exists public.episodes (
 id uuid primary key default gen_random_uuid(),
 content_id uuid not null references public.contents(id) on delete cascade,
 season_no int not null default 1,
 episode_no int not null default 1,
 title text,
 video_url text not null,
 duration_seconds int,
 created_at timestamptz not null default now()
);

create table if not exists public.favorites (
 user_id uuid references public.profiles(id) on delete cascade,
 content_id uuid references public.contents(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,content_id)
);

create table if not exists public.progress (
 user_id uuid references public.profiles(id) on delete cascade,
 content_id uuid references public.contents(id) on delete cascade,
 seconds numeric not null default 0,
 duration numeric not null default 0,
 updated_at timestamptz not null default now(),
 primary key(user_id,content_id)
);

create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 buyer_id uuid references public.profiles(id),
 seller_id uuid references public.profiles(id),
 content_id uuid references public.contents(id),
 gross_amount numeric(12,2) not null,
 commission_rate numeric(5,2) not null default 10,
 commission_amount numeric(12,2) not null,
 seller_net numeric(12,2) not null,
 payment_method text not null check(payment_method in ('Multicaixa Express','Transferência bancária','Plataforma')),
 payment_status text not null default 'pending' check(payment_status in ('pending','paid','rejected')),
 delivery_status text not null default 'pending' check(delivery_status in ('pending','delivered')),
 payment_proof_url text,
 created_at timestamptz not null default now()
);

create table if not exists public.promotions (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references public.profiles(id) on delete cascade,
 plan text not null check(plan in ('7_dias','30_dias')),
 price numeric(12,2) not null,
 max_videos int not null,
 payment_method text check(payment_method in ('Multicaixa Express','Transferência bancária')),
 payment_status text not null default 'pending' check(payment_status in ('pending','paid','rejected')),
 starts_at timestamptz,
 ends_at timestamptz,
 created_at timestamptz not null default now()
);

create table if not exists public.promotion_videos (
 promotion_id uuid references public.promotions(id) on delete cascade,
 content_id uuid references public.contents(id) on delete cascade,
 primary key(promotion_id,content_id)
);

create table if not exists public.comments (
 id uuid primary key default gen_random_uuid(),
 admin_id uuid references public.profiles(id),
 content_id uuid references public.contents(id) on delete cascade,
 body text not null,
 created_at timestamptz not null default now()
);

create table if not exists public.deliveries (
 id uuid primary key default gen_random_uuid(),
 order_id uuid references public.orders(id) on delete cascade,
 admin_id uuid references public.profiles(id),
 note text,
 delivered_at timestamptz,
 created_at timestamptz not null default now()
);

create table if not exists public.showcase_clips (
 id uuid primary key default gen_random_uuid(),
 content_id uuid references public.contents(id) on delete cascade,
 action_url text,
 romance_url text,
 suspense_url text,
 ai_status text not null default 'pending',
 created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
 insert into public.profiles(id,name) values(new.id,coalesce(new.raw_user_meta_data->>'name',new.email));
 return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Comissão: 10% automática. Em produção, use uma função RPC para criar pedidos;
-- nunca confie no valor enviado pelo navegador.
create or replace function public.calculate_order(gross numeric)
returns table(commission numeric,seller_net numeric) language sql immutable as $$
 select round(gross*0.10,2), round(gross-gross*0.10,2);
$$;

alter table public.profiles enable row level security;
alter table public.contents enable row level security;
alter table public.episodes enable row level security;
alter table public.favorites enable row level security;
alter table public.progress enable row level security;
alter table public.orders enable row level security;
alter table public.promotions enable row level security;
alter table public.comments enable row level security;
alter table public.deliveries enable row level security;
alter table public.showcase_clips enable row level security;

-- Políticas iniciais: catálogo público; cada usuário gerencia os próprios dados.
create policy "public read active contents" on public.contents for select using(status='active');
create policy "owner insert contents" on public.contents for insert with check(auth.uid()=owner_id);
create policy "owner update contents" on public.contents for update using(auth.uid()=owner_id);
create policy "owner favorites" on public.favorites for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "owner progress" on public.progress for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "profile self read" on public.profiles for select using(auth.uid()=id);
create policy "profile self update" on public.profiles for update using(auth.uid()=id);

-- Admin policies devem ser implementadas com função security-definer baseada em role.
-- Não conceda acesso amplo a orders/deliveries ao navegador sem essa função.
