-- I.M.A FILMES V10.1 - migração complementar
-- Execute somente se o bucket payments ainda não existir.
-- Não contém senhas nem chaves secretas.

insert into storage.buckets (id, name, public)
values ('payments', 'payments', false)
on conflict (id) do nothing;

-- Comprovativos: somente o próprio usuário pode enviar na sua pasta.
drop policy if exists "payments_owner_upload" on storage.objects;
create policy "payments_owner_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- O usuário pode consultar seus próprios comprovativos; o administrador também.
drop policy if exists "payments_owner_or_admin_read" on storage.objects;
create policy "payments_owner_or_admin_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payments'
  and (
    owner_id = auth.uid()::text
    or public.is_admin()
  )
);

-- O usuário pode apagar seu próprio comprovativo; administrador também.
drop policy if exists "payments_owner_or_admin_delete" on storage.objects;
create policy "payments_owner_or_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'payments'
  and (
    owner_id = auth.uid()::text
    or public.is_admin()
  )
);
