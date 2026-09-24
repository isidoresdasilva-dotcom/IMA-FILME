-- I.M.A FILMES V10.4.0 — acesso mínimo necessário
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.episodes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.episodes TO authenticated;
GRANT SELECT ON TABLE public.contents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.contents TO authenticated;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ima_episodes_read ON public.episodes;
CREATE POLICY ima_episodes_read ON public.episodes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS ima_episodes_insert ON public.episodes;
CREATE POLICY ima_episodes_insert ON public.episodes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.contents c WHERE c.id=episodes.content_id AND c.owner_id=auth.uid()));
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
