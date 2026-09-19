# Vantagem Marketplace — API Completa

## Autenticação
- `GET /api/auth/csrf` — Obter token CSRF
- `POST /api/auth/login` — Login (rate-limited: 20/15min)
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Obter sessão atual

## Catálogo
- `GET /api/categorias` — Listar categorias
- `GET /api/marcas` — Listar marcas
- `GET /api/produtos` — Listar produtos (filtros: q, categoria, marca, max)
- `GET /api/produtos/:slug` — Detalhes de produto

## Pedidos
- `POST /api/pedidos` — Criar pedido (guest ou autenticado)
- `GET /api/pedidos/meus` 🔒 — Meus pedidos
- `GET /api/pedidos/:referencia` — Detalhes de pedido

## Conta do utilizador 🔒
### Dashboard
- `GET /api/conta/dashboard` — Resumo (pedidos, favoritos, cupons)

### Perfil
- `GET /api/conta/perfil` — Obter dados pessoais
- `PATCH /api/conta/perfil` — Actualizar perfil

### Endereços
- `GET /api/conta/enderecos` — Listar endereços
- `POST /api/conta/enderecos` — Adicionar endereço
- `PATCH /api/conta/enderecos/:id` — Actualizar endereço
- `DELETE /api/conta/enderecos/:id` — Eliminar endereço
- `POST /api/conta/enderecos/:id/principal` — Marcar como principal

### Favoritos
- `GET /api/conta/favoritos` — Listar favoritos
- `POST /api/conta/favoritos` — Adicionar favorito (body: `{ produtoId }`)
- `DELETE /api/conta/favoritos/:produtoId` — Remover favorito

## Pós-venda 🔒
### Devoluções
- `GET /api/conta/devolucoes` — Listar devoluções
- `POST /api/conta/devolucoes` — Solicitar devolução

### Avaliações
- `POST /api/conta/avaliacoes` — Criar avaliação (só após entrega)
- `GET /api/produtos/:produtoId/avaliacoes` — Listar avaliações do produto

## Engagement 🔒
### Cupons
- `GET /api/conta/cupons` — Meus cupons disponíveis
- `POST /api/conta/cupons/validar` — Validar cupão (body: `{ codigo }`)

### Notificações
- `GET /api/conta/notificacoes` — Listar notificações
- `PATCH /api/conta/notificacoes/:id/lida` — Marcar como lida

## Suporte 🔒
### Tickets
- `GET /api/conta/tickets` — Meus tickets
- `POST /api/conta/tickets` — Abrir ticket
- `GET /api/conta/tickets/:id` — Detalhes do ticket + respostas
- `POST /api/conta/tickets/:id/respostas` — Responder ticket

### FAQ
- `GET /api/faq` — Listar perguntas frequentes (público)

## Admin 🔒🛡️ (apenas `perfil: 'admin'`)
- `GET /api/admin/resumo` — Dashboard administrativo
- `GET /api/admin/produtos` — Listar produtos
- `GET /api/admin/pedidos` — Listar pedidos
- `PATCH /api/admin/pedidos/:id/estado` — Actualizar estado
- `PATCH /api/admin/produtos/:slug/stock` — Actualizar stock

---

## Schema da base de dados

```sql
-- Categorias, Produtos, Stock, Utilizadores, Sessões,
-- Pedidos, Itens de Pedido, Tentativas Login
-- + Fases 6-9:
-- Endereços, Favoritos, Avaliações, Devoluções, Cupons,
-- Cupons Utilizador, Notificações, Mensagens, Tickets,
-- Respostas Ticket, FAQ, Rastreamento Pedido
```

**Migrações:**
- `001_schema.sql` — Schema base
- `002_fases_6_9.sql` — Extensões de conta, pós-venda, engagement, suporte

---

## Deploy

### Render (PostgreSQL + API)
- Blueprint: `render.yaml` cria `vantagem-db` e `vantagem-api` em Frankfurt
- Env: `DATABASE_URL` (fromDatabase), `CORS_ORIGINS`, `FRONTEND_URL`, `SUPABASE_*`, `ADMIN_*`

### Supabase Storage
- Bucket público `artigos` (pastas `produtos/` e `comprovativos/`)

### Vercel (Frontend)
- Env var: `VITE_API_BASE=https://vantagem-api-xyz.onrender.com`

**Instruções:** Ver `DEPLOY_STEPS.md`
