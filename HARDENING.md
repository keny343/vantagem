# Vantagem Hardening v1

Estado após o endurecimento inicial — provar o que já existe sob condições reais, sem adicionar features.

## Já endurecido

| Área | Medida |
|------|--------|
| Checkout | Preços e stock lidos da BD; `FOR UPDATE`; `UPDATE … WHERE quantidade >= n` |
| Idempotência | `idempotencyKey` **obrigatória** em `POST /api/pedidos` |
| IDOR | Pedido e comprovativo só para dono ou admin |
| Upload | Magic bytes (JPEG/PNG/WEBP/GIF), rejeição de path traversal |
| Rate limit | Global `/api` + login/registo/recuperar + checkout + upload + cupão |
| CSRF | Token HMAC no cabeçalho (proxy Vercel) |
| Observabilidade | `X-Request-Id`, logs estruturados por pedido, `/health` e `/ready` (DB) |
| Testes | Vitest: cupões/envio/IVA, MIME, CSRF assinado, códigos de erro |
| CI | GitHub Actions: typecheck + test + build (backend e frontend) |

## Fora de âmbito (de propósito)

- Redis / filas / microserviços
- Rastreio de transportadora (removido)
- Redesign visual completo (fase seguinte: identidade própria)

## Próximos passos (Hardening v2)

1. Testes de integração com Postgres de CI (checkout concorrente)
2. E2E Playwright (registo → checkout → comprovativo → admin confirma)
3. Backup/restore documentado da Aiven
4. Error tracking (Sentry ou equivalente)
5. Lighthouse + EXPLAIN nas queries do catálogo
6. Design system / consistência visual

## Como correr localmente

```bash
cd backend
npm test
npm run typecheck
```
