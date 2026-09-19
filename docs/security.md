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
- Cookie `vantagem_csrf` (legível pelo JS) + header `X-CSRF-Token` (double-submit).
- Emitido em `GET /api/auth/csrf` e em qualquer pedido `/api` sem cookie.
- Mutações (POST/PATCH/DELETE) sem o par cookie+header → 403.

## Cookies cross-origin (Vercel → Render)
- Em produção: `SameSite=None; Secure` na sessão e no CSRF.
- Em desenvolvimento: `SameSite=Lax` (HTTP local).

## Validação e injecção
- Input validado com **Zod** no servidor.
- Queries só com parâmetros (`$1…`) via `pg` — sem SQL concatenado.
- Helmet + CORS restrito a origens em `CORS_ORIGINS`.
- Respostas de erro sem stack em produção.

## Autorização
- Rotas `/api/admin/*` exigem sessão + perfil `admin`.
- Pedidos por referência só para dono, email do pedido, ou admin.

## Segredos
- `DATABASE_URL`, `CORS_ORIGINS`, etc. só em variáveis de ambiente.
- `.env` está no `.gitignore`.
