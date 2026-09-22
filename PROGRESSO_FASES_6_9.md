# Vantagem Marketplace — Progresso das Fases 6-9

> Actualizado na finalização: o frontend das fases 6–9 está em grande parte implementado.
> Ver `README.md` para o estado do produto.

## Backend

Fases 6–9: schema + APIs concluídas (conta, pós-venda, engagement, suporte).

## Frontend

Páginas existentes incluem: conta/dashboard, perfil, endereços, favoritos, pedidos, cupões, devoluções, suporte/tickets, FAQ/ajuda, admin (produtos, categorias, pedidos, cupões, tickets, utilizadores).

## Operação

- Stock debitado só na confirmação de pagamento
- Máquina de estados de pedido + `historico_estado_pedido`
- Deploy: Vercel `vantagem` (`vantagem-one.vercel.app`) + Render API/Postgres

## Pendências futuras (não bloqueiam demo)

- Logo raster oficial
- Testes de carga instrumentados (k6/artillery) com métricas publicadas
- Domínio próprio / SMTP de produção
- Notificações no header (API já existe)
