# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Compradores em Angola (Luanda e províncias) que precisam de electrónica de trabalho e casa — portáteis, telemóveis, periféricos, energia — com factura, garantia e pagamento por transferência bancária com comprovativo.

Administradores da loja que gerem catálogo, stock, comprovativos e suporte.

## Product Purpose

Vantagem é a loja online oficial de electrónica com curadoria: preços em Kwanzas (IVA incluído), envio nacional, e confirmação humana do pagamento. Sucesso = encomenda concluída com confiança (stock real, comprovativo, estado claro).

## Positioning

Não é marketplace genérico nem “tech neon global”. É loja angolana de confiança: transferência + verificação pela loja, estados de encomenda legíveis, catálogo com stock verdadeiro.

## Operating Context

Fluxo cliente: catálogo → conta → checkout → transferência → upload de comprovativo → espera confirmação → estados (pago → preparação → enviado → entregue).

Fluxo admin: fila de comprovativos → confirmar pagamento → actualizar estado.

## Capabilities and Constraints

- Stack existente: React 19 + Vite + Tailwind (Vercel); Express + Postgres (Render); uploads Supabase.
- Pagamento actual: transferência bancária + comprovativo (não gateway cartão).
- Hardening v1–v3 em produção (checkout, CSRF, E2E). Não inventar features novas nesta fase.
- Open: identidade visual própria (substituir o look “acid-on-black” genérico).

## Brand Commitments

- Nome: **Vantagem** / Vantagem Electrónica, Lda.
- País: Angola; idioma da UI: português.
- Tom: directo, claro, sem jargão de programador (heurísticas Nielsen).

## Evidence on Hand

- Código e deploy em `frontend/`, `backend/`, produção `vantagem-one.vercel.app`.
- Sem logo raster oficial no repo; catálogo real depende de dados/admin.
- Não fabricar testemunhos, prémios ou benchmarks.

## Product Principles

1. Confiança operacional acima de hype visual.
2. Preço, stock e estado da encomenda nunca mentem.
3. Brand Vantagem reconhecível no primeiro ecrã sem depender de chips/eyebrows.
4. Admin e loja partilham a mesma linguagem visual, com densidade adequada a cada papel.
5. Acessível: contraste, foco, erros recuperáveis.

## Accessibility & Inclusion

WCAG AA como alvo prático; formulários com labels e mensagens em português; teclado e focus visível.

---

Assumptions (inferred from repo + brief; user said “prossiga” without interview round): audience Angola DTC, payment-by-transfer trust model, redesign replaces generic dark-acid storefront while keeping all product facts above.
