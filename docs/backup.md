# Backup e restauro (Postgres)

A API usa Postgres gerido (Render `vantagem-db` ou, se configurado, Aiven).
O disco do contentor da API é **efémero** — a fonte de verdade é a base de dados e o Supabase Storage.

## O que fazer semanalmente

1. Confirmar que o plano do Postgres tem backups automáticos activos (Render: Dashboard → Database → Backups).
2. Guardar fora da plataforma um dump lógico (comando abaixo).
3. Confirmar que o bucket Supabase `artigos` tem versionamento ou política de retenção.

## Dump lógico (qualquer host Postgres)

Na máquina local, com a connection string de **leitura** (external/proxy), nunca commits da string:

```bash
# Linux/macOS
pg_dump "$DATABASE_URL" --format=custom --no-owner --file="vantagem-$(date +%Y%m%d).dump"

# Windows PowerShell
pg_dump $env:DATABASE_URL --format=custom --no-owner --file="vantagem-$(Get-Date -Format yyyyMMdd).dump"
```

Restauro num ambiente vazio (staging):

```bash
# Cria a base vazia primeiro, depois:
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" vantagem-YYYYMMDD.dump
cd backend && npm run migrate
```

As migrações são idempotentes via `schema_migrations`; depois de um restore recente normalmente não há nada a aplicar.

## Render Postgres

- Backups automáticos no plano pago; no free, assume **zero retenção** e corre `pg_dump` tu.
- Connection string interna só funciona a partir de serviços Render na mesma região.
- Para dump a partir do teu PC usa a URL **External**.

## Aiven (se `DATABASE_URL` apontar para Aiven)

- Console Aiven → service → Backups: retenção conforme o plano.
- Fork/restauro pontual a partir do backup no console.
- Continua a fazer `pg_dump` mensal para cópia offline.

## Depois de um incidente

1. Pôr a API em manutenção (escalar a 0 ou health check a falhar) se o restauro for destrutivo.
2. Restaurar o dump / backup do fornecedor.
3. `npm run migrate` se o dump for antigo.
4. Verificar `/ready` (DB) e um pedido de leitura do catálogo.
5. Confirmar uploads no Supabase (não vêm no `pg_dump`).

## O que NÃO entra no dump

- Ficheiros em Supabase Storage (`produtos/`, `comprovativos/`)
- Variáveis de ambiente (CSRF, SMTP, service role)
- Conteúdo em cache no CDN da Vercel
