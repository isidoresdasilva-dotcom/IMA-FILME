-- I.M.A FILMES V11.4 - CORREÇÃO DEFINITIVA DO EPISÓDIO
-- Execute UMA vez no projeto Supabase ibamnkaeiadvutpreouf.

create or replace function public.v11_publish_content(
  p_type text,
  p_title text,
  p_description text,
  p_year int,
  p_price numeric,
  p_cover_url text,
  p_video_path text
)
returns table(id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then raise exception 'Usuário não autenticado'; end if;
  if p_type not in ('Filme','Série','Anime','Dorama','E-book') then raise exception 'Tipo de conteúdo inválido'; end if;
  if coalesce(trim(p_title),'') = '' then raise exception 'Título obrigatório'; end if;
  if p_video_path is null or trim(p_video_path) = '' then raise exception 'Caminho do vídeo obrigatório'; end if;

  insert into public.contents(owner_id,type,title,description,year,price,free,cover_url,status)
  values (v_user,p_type,trim(p_title),coalesce(p_description,''),p_year,
          greatest(coalesce(p_price,0),0), greatest(coalesce(p_price,0),0)=0,
          p_cover_url,'active')
  returning contents.id into v_id;

  insert into public.episodes(content_id,season_no,episode_no,title,video_url)
  values (v_id,1,1,trim(p_title),p_video_path);

  return query select v_id;
end;
$$;

-- Esta era a função que estava faltando e causava o erro 404/"function not found".
create or replace function public.v11_get_episode(p_content_id uuid)
returns table(
  id uuid,
  content_id uuid,
  season_no int,
  episode_no int,
  title text,
  video_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  return query
  select e.id,e.content_id,e.season_no,e.episode_no,e.title,e.video_url
  from public.episodes e
  join public.contents c on c.id=e.content_id
  where e.content_id=p_content_id
    and c.status='active'
  order by e.season_no,e.episode_no
  limit 1;
end;
$$;

revoke all on function public.v11_publish_content(text,text,text,int,numeric,text,text) from public;
grant execute on function public.v11_publish_content(text,text,text,int,numeric,text,text) to authenticated;

revoke all on function public.v11_get_episode(uuid) from public;
grant execute on function public.v11_get_episode(uuid) to authenticated;

notify pgrst,'reload schema';
