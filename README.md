# I.M.A FILMES V10.1

Marketplace digital para filmes, séries, anime, doramas e e-books.

## Conexão
O projeto está configurado para o Supabase do I.M.A-FILME. A chave usada no `config.js` é uma chave publicável. Nunca coloque `service_role`, `sb_secret_*` ou senha do banco no frontend.

## Banco
A estrutura principal foi criada no Supabase com perfis, conteúdos, episódios, favoritos, progresso, biblioteca, transações, pagamentos, promoções, vitrine, entregas, avaliações, denúncias e destaques.

`supabase/v10_1_migration.sql` cria o bucket privado `payments` e suas políticas. Execute-o uma vez no SQL Editor se o bucket ainda não existir.

## Fluxo de venda
1. Comprador escolhe o conteúdo.
2. Seleciona o método de pagamento.
3. O pedido é registrado como pendente.
4. Comprovativo pode ser enviado.
5. Administrador confirma o pagamento.
6. A comissão de 10% é calculada automaticamente no banco.
7. O valor líquido do vendedor fica registrado.
8. A compra entra na biblioteca e uma entrega é criada.

## Promoções
- 7 dias: 800 Kz, até 2 vídeos.
- 30 dias: 1.600 Kz, até 4 vídeos.

## Limitações importantes
- A confirmação de Multicaixa Express/transferência ainda precisa de integração com um meio de pagamento verificável ou conferência administrativa.
- A classificação de vídeo por IA (ação/romance/suspense) requer processamento no servidor; o frontend apenas prepara a vitrine.
- Os vídeos não são tornados públicos por padrão.
- O site não deve ser usado para distribuir material sem autorização dos titulares dos direitos.

## Publicação
Arquivos principais:
- `index.html`
- `style.css`
- `app.js`
- `config.js`

Pode ser publicado em GitHub Pages ou outro host de arquivos estáticos.
