I.M.A FILMES V11.4

CORREÇÃO PRINCIPAL:
A função v11_get_episode foi incluída no SQL. A V11.3 chamava esta função, mas ela não estava criada no banco, causando:
"Could not find the function public.v11_get_episode(p_content_id) in the schema cache".

INSTALAÇÃO:
1. Substitua no GitHub: app.js, index.html, config.js e style.css.
2. Execute SQL-V11.4.sql UMA vez no Supabase.
3. Aguarde o GitHub Pages.
4. Ctrl+F5 no site.
5. Faça login e teste um filme.

Não execute SQL-V10.4.0 nem SUPABASE-CORRECOES.sql depois deste arquivo.
