I.M.A FILMES V11

1. Substitua no GitHub os arquivos index.html, style.css, app.js e config.js pelos desta pasta.
2. No Supabase do projeto ibamnkaeiadvutpreouf, execute SQL-V11.sql uma vez.
3. Confirme que os buckets capas e videos existem. videos pode permanecer privado; o app usa signed URLs.
4. No GitHub Pages faça Ctrl+F5.
5. Entre/crie conta, abra Publicar conteúdo e publique um vídeo.

Correção principal da V11:
- nenhuma atribuição .onclick é feita sem verificar se o elemento existe;
- botão de publicação fica desativado durante o envio;
- uploads usam caminhos privados e reprodução usa signed URL;
- se o banco falhar depois do upload, a V11 tenta remover os arquivos e o registro criado;
- usa os tipos e status compatíveis com a estrutura atual.
