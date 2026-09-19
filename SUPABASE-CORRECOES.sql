-- I.M.A FILMES V10.1
-- Execute no Supabase SQL Editor.

-- 1) Garanta que os buckets existem. Capas públicas; mídia privada.
insert into storage.buckets (id, name, public) values
  ('capas','capas',true),
  ('videos','videos',false),
  ('ebooks','ebooks',false),
  ('perfis','perfis',true),
  ('promocoes','promocoes',false),
  ('payments','payments',false)
on conflict (id) do update set public=excluded.public;

-- 2) Confira os valores permitidos para status antes de alterar a constraint.
select pg_get_constraintdef(oid) as constraint_def
from pg_constraint
where conrelid='public.contents'::regclass and conname='contents_status_check';

-- O V10.1 usa status = 'published' para conteúdos publicados e 'removed' para removidos.
-- Se a consulta acima mostrar que 'published' não é permitido, execute este bloco:
-- alter table public.contents drop constraint if exists contents_status_check;
-- alter table public.contents add constraint contents_status_check check (status in ('draft','published','removed'));

-- 3) Confirme os buckets:
select id,name,public from storage.buckets order by name;
