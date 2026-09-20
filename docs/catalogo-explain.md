# Queries do catálogo (EXPLAIN)

Notas para manter listagens rápidas. Correr em staging/produção com `EXPLAIN (ANALYZE, BUFFERS)`.

## Listagem pública (`listarProdutos`)

Base:

```sql
SELECT p.*, c.nome, c.slug, s.quantidade
FROM produtos p
INNER JOIN categorias c ON c.id = p.categoria_id
INNER JOIN stock s ON s.produto_id = p.id
WHERE p.activo = true
  -- filtros opcionais: c.slug, p.marca, preco, featured, hero, ILIKE nome
ORDER BY …;
```

Índices esperados (migração `001`):

- `produtos_categoria_idx` — filtro por categoria
- `produtos_marca_idx` — filtro por marca
- `produtos_featured_idx` / `produtos_hero_unico` — home
- `produtos_preco_idx` — ordenação por preço

Sinais de alerta:

- `Seq Scan` em `produtos` com milhares de linhas activas
- `Rows Removed by Filter` alto em `activo` / stock
- Sort em disco (`external merge`)

Acções típicas: garantir `WHERE activo`, evitar `SELECT *` no cliente HTTP (já mapeamos campos), paginar quando o catálogo passar ~200 artigos.

## Checkout (stock)

```sql
SELECT … FROM produtos p
INNER JOIN stock s ON s.produto_id = p.id
WHERE p.slug = $1
FOR UPDATE OF s;

UPDATE stock
SET quantidade = quantidade - $1
WHERE produto_id = $2 AND quantidade >= $1;
```

Deve usar o PK de `stock` (`produto_id`). Em concorrência, um dos `UPDATE` devolve `rowCount = 0` → `INSUFFICIENT_STOCK` (coberto pelo teste de integração).
