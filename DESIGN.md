---
name: 收货扫码
description: 仓口色块——iPhone 收货扫码的一眼状态反馈
colors:
  ink: "#f5f5f5"
  bg: "#111111"
  surface: "#1a1a1a"
  surface-raised: "#222222"
  border: "#444444"
  border-subtle: "#333333"
  action: "#22aa66"
  flash-ok: "#1b5e20"
  flash-dup: "#e65100"
  flash-miss: "#455a64"
  flash-err: "#b71c1c"
  flash-wait: "#1565c0"
  control-secondary: "#333333"
  control-muted: "#444444"
typography:
  title:
    fontFamily: "system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.3
  flash:
    fontFamily: "system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
  flash-primary:
    fontFamily: "system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.35
  flash-watermark:
    fontFamily: "system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 12vw, 4rem)"
    fontWeight: 800
    lineHeight: 1
  flash-secondary:
    fontFamily: "system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  control: "8px"
  flash: "12px"
spacing:
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "16px"
  flash-pad: "28px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "12px"
  button-secondary:
    backgroundColor: "{colors.control-secondary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px"
  input-field:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px"
  flash-panel:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.flash}"
    padding: "{spacing.flash-pad} {spacing.lg}"
    typography: "{typography.flash}"
  flash-ok:
    backgroundColor: "{colors.flash-ok}"
    textColor: "{colors.ink}"
    rounded: "{rounded.flash}"
  flash-dup:
    backgroundColor: "{colors.flash-dup}"
    textColor: "{colors.ink}"
    rounded: "{rounded.flash}"
  flash-miss:
    backgroundColor: "{colors.flash-miss}"
    textColor: "{colors.ink}"
    rounded: "{rounded.flash}"
  flash-err:
    backgroundColor: "{colors.flash-err}"
    textColor: "{colors.ink}"
    rounded: "{rounded.flash}"
---

# Design System: 收货扫码

## 1. Overview

**Creative North Star: "仓口色块"**

This UI is a one-handed warehouse glance tool: aim the phone, read a full-bleed status slab, keep moving. Personality is 干脆 · 醒目 · 不花哨 — large status color and short Chinese labels over chrome. Density stays high on iPhone; after mount, setup retreats so the scan screen owns the job.

Depth is tonal only (darker/lighter slabs), never card stacks or purple SaaS shells. PRODUCT.md forbids looking like an admin dashboard: no card walls, sidebars, purple gradients, metric strips, or multi-panel ops consoles.

**Key Characteristics:**
- Signature element is the `#flash` status slab (color + text, never color alone)
- Dark near-black field; green action; semantic flash hues for 新已收 / 已收过 / 不在清单 / 错误
- Single system-ui family; fixed rem scale, no display/marketing type
- Flat surfaces; no drop shadows
- Controls are full-width, chunky, and undelicate

## 2. Colors

Semantic warehouse palette: neutrals carry the shell; saturated slabs carry scan outcomes.

### Primary
- **Dock Action Green** (`#22aa66`, coded as `#2a6`): Primary mount / confirm actions only — rare accent, not decoration.

### Secondary
- **Fresh Receive Green** (`#1b5e20`): Flash slab for 新已收.
- **Re-scan Amber** (`#e65100`): Flash slab for 已收过 — must stay distinct from fresh green.
- **Off-list Slate** (`#455a64`): Flash slab for 不在清单 — lighter than idle bay so miss ≠ empty.
- **Failure Red** (`#b71c1c`): Flash slab / hard errors (write failure, mount reject).
- **Wait Blue** (`#1565c0`): Transient “挂载中 / 识别等待” only — not a scan outcome.

### Neutral
- **Pit Black** (`#111111`): Page background.
- **Bay Surface** (`#1a1a1a`): Header, pending fold, quieter panels.
- **Raised Bay** (`#222222`): Session bar, fields, idle flash.
- **Ink** (`#f5f5f5`): Body and flash text.
- **Edge** (`#444444` / `#333333`): Control borders and session divider.

### Named Rules
**The Slab-Plus-Label Rule.** Every scan outcome uses a full-color flash background **and** explicit outcome text (新已收 / 已收过 / 不在清单). Color alone is forbidden as the only channel.

**The One Action Green Rule.** Dock Action Green appears on primary CTAs only (≤10% of chrome). Outcome greens live on the flash, not on every button.

## 3. Typography

**Display Font:** none — product tool, no marketing display face  
**Body Font:** system-ui (with sans-serif fallback)  
**Label/Mono Font:** same stack (no mono requirement)

**Character:** One utilitarian sans. Hierarchy is weight and size only — title ≈1rem/600, flash layers as below, labels ≈0.85rem.

### Hierarchy
- **Title** (600, 1rem): App header “收货扫码”; session sheet name.
- **Body** (400, ~1rem): Stats, lists, hints (hints must stay readable — avoid washed gray on dark).
- **Label** (400, 0.85rem): Field labels, compact controls (换批).
- **Flash primary** (700, 1.75rem): 货品描述 (or miss = scanned code) on the status slab.
- **Flash watermark** (800, clamp 2.5–4rem, ~45% opacity): 结果词 behind primary.
- **Flash secondary** (500, 0.85rem, low contrast): 单号 under primary when present.

### Named Rules
**The No Display Face Rule.** Never introduce a decorative or marketing typeface. system-ui only unless PRODUCT.md changes.

## 4. Elevation

Flat by default. Depth = tonal layering (Pit Black → Bay → Raised Bay → flash hue), not shadows. Borders at 1px Edge are structural, not decorative lift.

### Shadow Vocabulary
None. No `box-shadow` in the system.

### Named Rules
**The Flat Bay Rule.** Surfaces stay flat at rest and in motion. If it looks “card-lifted,” remove the shadow.

## 5. Components

Chunky, full-bleed, undelicate — big tap targets for gloved-or-rushed thumbs.

### Buttons
- **Shape:** Gently rounded (`8px`)
- **Primary:** Dock Action Green fill, white text, `12px` padding, full width when alone
- **Secondary:** Raised Bay / control-secondary fill, Edge border — Start/Stop/换批
- **Disabled:** 50% opacity; no separate gray inventiveness
- **Hover / Focus:** Prefer `:focus-visible` outline for keyboard; motion only for state (150–200ms), honor `prefers-reduced-motion`

### Cards / Containers
- **Not a card system.** Panels are flat tonal regions. Pending list uses a simple fold (`details`), not a metric card.
- **Corner Style:** `8px` on folds/controls; `12px` on flash only
- **Shadow Strategy:** none (see Elevation)

### Inputs / Fields
- **Style:** Raised Bay fill, Edge border, `8px` radius, `12px` padding
- **Focus:** Native / visible focus; no glass glow
- **Select:** Same vocabulary as text fields

### Navigation
- **Mount screen:** Batch select + 「挂载并开扫」; advanced API under `<details>`
- **Scan screen:** Compact session bar (title · 已收 x/y); mount hidden; bottom thumb dock (停止 / 继续扫码 / 换批); short scan hint under the reader while scanning
- Always show outcome via watermark + primary (货品描述 or scanned code) when scanning hits

## 6. Do's and Don'ts

### Do:
- **Do** keep the flash slab as the first answer to “这票什么结果?”
- **Do** pair every outcome color with Chinese outcome text.
- **Do** use tonal bays (not shadows) to separate header / session / flash / camera.
- **Do** keep primary green rare; full-width chunky buttons.
- **Do** hide mount UI after successful 挂载; pending list stays a secondary fold.

### Don't:
- **Don't** look like a SaaS admin or analytics dashboard: card walls, sidebars, purple gradients, metric strips, or multi-panel "ops console" layouts (PRODUCT.md anti-references).
- **Don't** use side-stripe borders, gradient text, glassmorphism, or hero-metric templates.
- **Don't** rely on color alone for 新已收 vs 已收过.
- **Don't** add ornamental motion or page-load choreography.
- **Don't** put visual tokens (hex, radius) into CONTEXT.md — glossary stays domain-only; visuals live here.
