# Vantagem Hardening

Endurecer o que já existe sob condições reais — sem adicionar features de produto.

## v1 (feito)

| Área | Medida |
|------|--------|
| Checkout | Preços da BD; stock verificado no checkout mas **debitado só na confirmação de pagamento** (`FOR UPDATE` + `UPDATE … WHERE quantidade >= n`) |
| Estados | Máquina de transições (`transicoesPedido.ts`); histórico em `historico_estado_pedido` |
| Idempotência | `idempotencyKey` obrigatória em `POST /api/pedidos` |
| IDOR | Pedido e comprovativo só para dono ou admin |
| Upload | Magic bytes (JPEG/PNG/WEBP/GIF), rejeição de path traversal |
| Rate limit | Global `/api` + login/registo/recuperar + checkout + upload + cupão |
| CSRF | Token HMAC no cabeçalho (proxy Vercel) |
| Observabilidade | `X-Request-Id`, logs estruturados, `/health` e `/ready` (DB) |
| Testes unitários | Cupões/envio/IVA, MIME, CSRF assinado, códigos de erro |
| CI | GitHub Actions: typecheck + test + build |

## v2 (feito)

| Área | Medida |
|------|--------|
| Integração Postgres | CI com Postgres 16; teste de **checkout concorrente** + idempotência |
| Backup | [docs/backup.md](docs/backup.md) — `pg_dump` / Render / Aiven |
| Error webhook | `ERROR_WEBHOOK_URL` para 5xx (Sentry Relay ou equivalente) |
| Catálogo | [docs/catalogo-explain.md](docs/catalogo-explain.md) — EXPLAIN e índices |

## v3 (feito)

| Área | Medida |
|------|--------|
| E2E Playwright | Registo → checkout + comprovativo → admin confirma pagamento |
| CI E2E | Job com Postgres + API + Vite + Chromium ([docs/e2e.md](docs/e2e.md)) |
| Regressão enum | `alterarEstado(pendente→pago)` coberto no teste de integração Postgres |

## Fora de âmbito (de propósito)

- Redis / filas / microserviços
- Rastreio de transportadora (removido)

## Identidade visual (em curso)

Ver `PRODUCT.md` + `DESIGN.md` — mundo **Concrete tropical modern (Luanda)**: limestone, teal Atlântico, Sora. Home brand-first full-bleed.

## Como correr localmente

```bash
cd backend
npm test
npm run typecheck
```

E2E: ver [docs/e2e.md](docs/e2e.md).
