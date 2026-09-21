I.M.A FILMES V10.3

Correção definitiva de cache e URLs blob.
1. Substitua TODOS os arquivos no GitHub: index.html, app.js, style.css, config.js.
2. Faça commit.
3. Abra o site e pressione Ctrl+Shift+R.
4. O console deve mostrar: I.M.A FILMES V10.3 iniciado: ONLINE | versão 10.3.0
5. O sistema remove registros locais antigos incompatíveis, desativa service workers antigos e elimina caches do navegador quando possível.
6. Nunca são usados URLs blob como URLs permanentes de capa ou vídeo.

IMPORTANTE: não apague o armazenamento de autenticação do Supabase manualmente.


V10.3 CORREÇÃO PRINCIPAL: a geração das 5 capas automáticas não revoga o object URL enquanto o elemento de vídeo ainda pode estar tentando lê-lo. O elemento é pausado, recebe src vazio, load() e só depois o object URL é revogado.


V10.3.5: versionamento unificado, cache-busting e upload de capas resiliente com timeout/retry e fallback de imagem otimizada.
