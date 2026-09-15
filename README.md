# I.M.A FILMES V9 — corrigido

## Correções principais
- Corrigido o erro de sintaxe no `app.js` causado por uma quebra de linha dentro de uma string.
- Adicionadas as funções que estavam sendo chamadas mas não existiam: `openModal`, `closeModal` e `upload`.
- Melhorado o modo local com IndexedDB.
- Mantidas as 5 capas automáticas.
- Adicionado fundo visual próprio em `fundo.svg`, sem depender de imagem externa.
- Melhorada a página inicial e o visual responsivo.
- Mantido o modo Supabase e o modo local.

## Arquivos
- `index.html`
- `style.css`
- `app.js`
- `config.js`
- `fundo.svg`
- `README.md`

## Supabase
Em `config.js`, coloque somente a URL do projeto e a chave publicável/anon.
Nunca coloque `service_role` ou a senha do banco no navegador.

Para publicação online, crie os buckets `videos`, `capas` e `ebooks` e configure as políticas RLS/Storage adequadas.
