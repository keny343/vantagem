# Vantagem Hardening

Endurecer o que já existe sob condições reais — sem adicionar features de produto.

## v1 (feito)

| Área | Medida |
|------|--------|
| Checkout | Preços e stock da BD; `FOR UPDATE`; `UPDATE … WHERE quantidade >= n` |
| Idempotência | `idempotencyKey` obrigatória em `POST /api/pedidos` |
| IDOR | Pedido e comprovativo só para dono ou admin |
| Upload | Magic bytes (JPEG/PNG/WEBP/GIF), rejeição de path traversal |
| Rate limit | Global `/api` + login/registo/recuperar + checkout + upload + cupão |
| CSRF | Token HMAC no cabeçalho (proxy Vercel) |
| Observabilidade | `X-Request-Id`, logs estruturados, `/health` e `/ready` (DB) |
| Testes unitários | Cupões/envio/IVA, MIME, CSRF assinado, códigos de erro |
| CI | GitHub Actions: typecheck + test + build |

## v2 (feito / em curso)

| Área | Medida |
|------|--------|
| Integração Postgres | CI com Postgres 16; teste de **checkout concorrente** + idempotência |
| Backup | [docs/backup.md](docs/backup.md) — `pg_dump` / Render / Aiven |
| Error webhook | `ERROR_WEBHOOK_URL` para 5xx (Sentry Relay ou equivalente) |
| Catálogo | [docs/catalogo-explain.md](docs/catalogo-explain.md) — EXPLAIN e índices |

## Fora de âmbito (de propósito)

- Redis / filas / microserviços
- Rastreio de transportadora (removido)
- Redesign visual completo (fase seguinte: identidade própria)
- E2E Playwright completo (próximo quando o fluxo admin/cliente estabilizar)

## Como correr localmente

```bash
cd backend
npm test
npm run typecheck
```

Integração com Postgres local (opcional):

```bash
# Postgres a escutar em 5432 com user/pass/db vantagem/vantagem/vantagem_test
# ou define DATABASE_URL e:
npm test
```

Em CI o serviço Postgres é provisionado automaticamente.
