# I.M.A FILMES V9

V9 é a primeira versão preparada para uso online com Supabase e GitHub Pages, mantendo fallback local.

## Funcionalidades
- cadastro/login por e-mail e senha via Supabase Auth
- filmes, séries e e-books
- upload de vídeos/capas/e-books para Supabase Storage
- séries com episódios
- 5 capas automáticas
- favoritos e progresso
- player e continuar assistindo
- biblioteca, vendas e painel administrativo
- pesquisa e layout responsivo
- filtro básico de termos explícitos

## Configuração online
1. Crie projeto Supabase.
2. Execute `supabase/schema.sql`.
3. Edite `config.js`.
4. Abra o projeto no GitHub Pages.

### Segurança
Nunca coloque `service_role` key no front-end. O bloqueio de conteúdo explícito por palavras é apenas uma primeira camada; moderação real de vídeo deve ser feita no servidor.

### Administrador
No banco, altere manualmente `profiles.role` de um utilizador para `admin`. Não existe senha administrativa fixa no código da V9.
