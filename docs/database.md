# Esquema PostgreSQL (Vantagem)

Dinheiro em **cêntimos** (inteiros). Stock numa tabela própria para o checkout poder
bloquear e actualizar a linha sem misturar com o catálogo.

## Tabelas

| Tabela | Função |
|---|---|
| `categorias` | Áudio, Fotografia, … |
| `produtos` | Catálogo (preço, specs, imagens, variantes) |
| `stock` | Quantidade disponível por produto |
| `utilizadores` | Clientes e admins (`role`) |
| `sessoes` | Sessões opacas (hash do token) |
| `tentativas_login` | Rate limit persistente |
| `pedidos` | Encomendas |
| `itens_de_pedido` | Linhas do pedido (preço congelado) |

## Contas

Em desenvolvimento o seed pode criar contas locais. Em produção o primeiro
administrador nasce de `ADMIN_EMAIL` + `ADMIN_PASSWORD` no arranque da API.
O seed recusa-se a correr com `NODE_ENV=production`.

## Migrações

```bash
cd backend && npm run migrate && npm run seed
```
