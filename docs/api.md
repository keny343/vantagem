# API (Vantagem)

Base URL local: `http://localhost:4200`

Todas as respostas de erro:

```json
{ "error": { "code": "…", "message": "…", "requestId": "…" } }
```

Mutações (POST/PATCH/DELETE) exigem cookie `vantagem_csrf` + header `X-CSRF-Token`.

| Método | Caminho | Auth | Descrição |
|---|---|---|---|
| GET | `/health` | — | Liveness |
| GET | `/ready` | — | DB ok |
| GET | `/api/auth/csrf` | — | Emite CSRF |
| POST | `/api/auth/login` | — | Login (rate limited) |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/auth/me` | cookie | Sessão actual |
| GET | `/api/categorias` | — | Categorias |
| GET | `/api/marcas` | — | Marcas |
| GET | `/api/produtos` | — | Catálogo (`q`, `categoria`, `marca`, `max`, `featured`) |
| GET | `/api/produtos/:slug` | — | Detalhe + relacionados |
| POST | `/api/pedidos` | opcional | Checkout (actualiza stock) |
| GET | `/api/pedidos/meus` | cliente | Pedidos da conta |
| GET | `/api/pedidos/:referencia` | dono/admin | Detalhe |
| GET | `/api/admin/resumo` | admin | KPIs |
| GET | `/api/admin/produtos` | admin | Stock |
| GET | `/api/admin/pedidos` | admin | Lista |
| PATCH | `/api/admin/pedidos/:id/estado` | admin | Estado |
| PATCH | `/api/admin/produtos/:slug/stock` | admin | Quantidade |
