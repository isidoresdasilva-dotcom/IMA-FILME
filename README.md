# I.M.A FILMES V10 — plataforma profissional

Frontend responsivo em HTML/CSS/JS + Supabase como backend.

## Recursos
- Marketplace de filmes, séries, anime, doramas e e-books.
- Cadastro/login, perfil com foto, favoritos e biblioteca.
- Publicação com capa original ou 5 capas automáticas geradas a partir do vídeo.
- Fluxo vender/grátis.
- Métodos de pagamento: Multicaixa Express, transferência bancária e pagamento pela plataforma, com registro e confirmação administrativa.
- Comissão configurável de 10% por venda.
- Área do vendedor: produtos, vendas/lucros e promoção.
- Promoções: 7 dias / 800 Kz / até 2 vídeos; 30 dias / 1.600 Kz / até 4 vídeos.
- Área administrativa: vendedores, conteúdos por categoria, moderação, entregas, vitrine, promoções e comentários.
- Vitrine com apresentações de 30 segundos divididas em ação, romance e suspense.

## Importante sobre pagamentos e IA
O V10 prepara o fluxo de pagamentos e os registros no banco, mas não finge que um pagamento foi confirmado. A confirmação deve vir de uma integração oficial/gateway ou da validação do comprovativo pelo administrador.

A apresentação de 30s no navegador permite selecionar trechos de vídeo; classificação automática real por IA (ação/romance/suspense) deve ser executada no servidor com um serviço de análise de vídeo. O banco inclui campos para essa integração.

## Configuração
1. Crie um projeto Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Crie os buckets indicados em `config.js` ou ajuste os nomes.
4. Coloque a URL e a chave pública em `config.js`.
5. Publique os arquivos no GitHub Pages.
6. Crie sua conta e atribua `admin` ao perfil administrador usando o SQL de configuração.

## Segurança
- A chave `service_role` não deve ir para o navegador.
- Comissão, permissões, compras e moderação devem ser reforçadas com RLS/policies e funções SQL.
- Não coloque senha de administrador dentro do JavaScript.
