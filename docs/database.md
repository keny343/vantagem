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

## Contas de demo (seed)

| Email | Password | Perfil |
|---|---|---|
| `admin@vantagem.pt` | `AdminDemo!2026` | admin |
| `cliente@vantagem.pt` | `ClienteDemo!2026` | cliente |

## Migrações

```bash
cd backend && npm run migrate && npm run seed
```
