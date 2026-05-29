---
name: visual-identity
description: Editorial SEVEN identity — neutrals, warm accent, low-noise UI, Instrument Serif for editorial moments
type: design
---
# Identidade visual SEVEN — refinada

## Princípios
- Editorial, sóbrio, premium. Lógica 60/30/10: predominância neutra, superfícies quentes secundárias, acento `#A18261` com disciplina.
- Sem roxo SaaS, sem gradientes chamativos, sem glassmorphism, sem neon.
- Sombras sutis (xs/sm/md/lg/editorial), nunca teatrais.
- Hover com `-translate-y-0.5` + `shadow-md`, nunca opacidade.

## Paleta neutra (HSL tokens em index.css)
- `seven-ink` #0A0A0A → `seven-paper` #FAFAFA, escala completa de 11 passos.
- Superfícies quentes: `seven-cream` #F5E9DC, `seven-soft` #F3F0EC, `seven-soft-alt` #EDE6DE.
- Acento: `primary` #A18261 + `seven-accent-hover` #C9A88E.
- Background base: `30 14% 98%` (warm off-white). Card: branco puro.

## Status semânticos (refinados, não-framework)
- success `152 35% 35%` (verde mais sóbrio), warning `32 70% 45%` (âmbar quente), danger `0 62% 44%` (vermelho profundo), info = primary.
- StatusTag agora usa dot + label com fundo sutil (8% opacity), não chip cheio.

## Tipografia
- Body: Motiva Sans 300. Headings: Motiva Sans 700 com `letter-spacing: -0.01em`.
- Display thin (font-weight 100) para números grandes em StatCard e titulares.
- Editorial: `Instrument Serif` via Google Fonts. Classe `.font-editorial` e `.font-editorial-italic`. Usar apenas em momentos editoriais (Login hero, Selecionar Ambiente).
- Overlines: classe `.ui-overline` (10px, bold, tracking 0.18em, muted).

## Sombras / radius
- Tokens `--shadow-xs|sm|md|lg|editorial` em CSS, expostos no Tailwind como `shadow-{xs..editorial}`.
- Radius reduzido para `0.5rem` (mais editorial que o padrão shadcn).

## Botões
- `default` agora é preto sólido (`bg-foreground`), hover `seven-graphite`. Variant nova `accent` para o nude `#A18261`.
- `active:scale-[0.98]` para feedback tátil discreto.

## Sidebars
- Pretas (`#0A0A0A`), labels em overline (10px caps tracking 0.18em).
- Item ativo: barra esquerda 2px em `primary`, sem chip colorido.
- Ícones com `strokeWidth={1.5}` (Lucide light).

## Headers de página
- `PageHeader` com border-bottom sutil, título em Motiva Sans thin 30px tracking -0.01em.
- Topbar Admin/Consultor com label em overline + divisor vertical.

## Layout main
- Padding generoso `px-8 py-8`, `max-w-[1400px]` centralizado.
