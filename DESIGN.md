# Design

<!-- impeccable:design-schema 1 -->

## World

**Concrete tropical modern (Luanda façade)** — limestone daylight, deep slate shade, Atlantic teal. Seed `ff890b3a` · grounded candidate 7.

Replaces the previous acid-lime-on-near-black gadget mall look.

## Color

| Token | Value | Role |
|-------|-------|------|
| canvas | `#ede6da` | Page ground (limestone) |
| ink | `#142126` | Primary text / shade |
| panel | `#f7f2e8` | Surfaces |
| panel2 | `#e8dfd0` | Recessed |
| line | `#d4cbb8` | Rules |
| acid | `#0c7c76` | Accent (Atlantic teal; legacy class name) |
| brass | `#b8956a` | Warm secondary wash |
| steel | `#5a6a6e` | Muted labels |

Strategy: Restrained neutrals + one committed teal accent; shade bands for trust/copy sections.

## Typography

- Display: **Sora**
- Body: **Source Sans 3**
- Mono / labels: **Source Code Pro**

Brand wordmark on home sits at architectural scale (`clamp(3rem, 12vw, 7.5rem)`).

## Layout

- Façade column rhythm (subtle vertical rules) on the home hero.
- Full-bleed hero: brand + headline + CTA + product plane (not inset card).
- Featured products as equal metered grid.
- Department links as façade tile grid.

## Motion

- `brand-in` on the wordmark
- `rise` on hero copy/CTA
- Soft product image scale on card hover

## Components

- Buttons: teal fill + canvas text; secondary = ink ring on canvas
- Cards: square corners preference on home/departments; product cards keep thin border, no neon glow
- Header: translucent canvas blur, wordmark “Vantagem” without acid square glyph

## Do not

- Acid lime `#c9f24a`, Space Grotesk / IBM Plex costume
- Eyebrow kickers above hero brand
- Glassmorphism as decoration
- Stat strips in the first viewport
