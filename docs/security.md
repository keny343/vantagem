# Segurança (Vantagem)

## Passwords
- Hash com **bcrypt** (cost 12 em produção). Nunca texto simples.
- Login falhado e conta inexistente devolvem a mesma mensagem.

## Sessões
- Cookie `httpOnly`, `SameSite=Lax`, `Secure` em produção.
- Token opaco de 256 bits; na BD só existe o **SHA-256**.
- Expiração: 7 dias. Sessões revogáveis.

## Rate limiting
- Global em `/api` (300 req/min).
- Login: 20 tentativas / 15 min por IP (express-rate-limit).
- Tentativas falhadas persistidas em `tentativas_login` (5 por email / 20 por IP na janela).

## CSRF
- Cookie `vantagem_csrf` (legível pelo JS) + header `X-CSRF-Token` (HMAC assinado ou double-submit).
- Emitido em `GET /api/auth/csrf` e em qualquer pedido `/api` seguro sem cookie.
- Mutações (POST/PATCH/DELETE) sem token válido → 403.
- Em **produção**, `CSRF_SECRET` (≥16 caracteres) é obrigatório no boot.

## Cookies cross-origin (Vercel → Render)
- Em produção: `SameSite=None; Secure` na sessão e no CSRF.
- Em desenvolvimento: `SameSite=Lax` (HTTP local).

## Validação e injecção
- Input validado com **Zod** (schemas `.strict()` em registo/perfil público).
- Queries só com parâmetros (`$1…`) via `pg` — sem SQL concatenado.
- Helmet + CORS restrito a origens em `CORS_ORIGINS`.
- Respostas de erro sem stack em produção.

## Autorização
- Rotas `/api/admin/*` exigem sessão + perfil `admin`.
- Pedido e comprovativo por referência: só o **dono** (utilizador do pedido) ou **admin** (anti-IDOR).
- Devoluções: `pedido_id` tem de pertencer ao cliente autenticado.
- `idempotencyKey` de outro utilizador → 404 (não vaza o pedido).

## Uploads
- Content-Type do browser não basta: validação por **magic bytes** (imagens e PDF).
- Nomes com `..` / `/` / `\` rejeitados.
- **Fotos de produto:** bucket Supabase público `artigos` (pasta `produtos/`).
- **Comprovativos:** bucket Supabase **privado** `comprovativos`; download só via `GET /api/pedidos/:referencia/comprovativo` (sessão + ownership).
- Em desenvolvimento sem Supabase: disco local (`uploads/produtos`, `uploads/comprovativos`) — comprovativos nunca servidos por static.

## Observabilidade
- `X-Request-Id` em cada pedido; erros 5xx podem ir para `ERROR_WEBHOOK_URL` (opcional).
- `/health` (processo) e `/ready` (ping à BD).

## Segredos
- `DATABASE_URL`, `CORS_ORIGINS`, etc. só em variáveis de ambiente.
- `.env` está no `.gitignore`.
