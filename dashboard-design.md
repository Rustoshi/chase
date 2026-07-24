# Safe Haven — Dashboard Design System

Design system for the **logged-in app** (`/app/*`) and, going forward, the admin area. Extracted from the Grey multi-currency dashboard as visual reference. This is a **separate** system from `design.md` — that file (Safe Haven Private, ink/bronze/linen, serif) governs the **public marketing + auth pages only** and must not be changed. Use THIS file for every dashboard/app screen.

## 1. Brand direction

Modern, friendly multi-currency fintech dashboard — bright, clean, and legible. The reference is a consumer money app: white cards floating on a soft grey canvas, a calm indigo-blue accent, colourful currency badges, and confident bold numbers. Where the public site is a restrained private-bank statement, the app is an approachable everyday product. Clarity and scannability over ornament.

Light theme only.

## 2. Colour tokens

```css
:root {
  /* Canvas & surfaces */
  --dash-bg:         #F5F6F8;   /* app/page background — soft cool grey */
  --dash-surface:    #FFFFFF;   /* cards, sidebar, header */
  --dash-surface-2:  #F9FAFB;   /* table headers, subtle fills, hover rows */

  /* Text */
  --dash-text:       #101828;   /* primary — near-black, used for headings & amounts */
  --dash-text-2:     #667085;   /* secondary — labels, descriptions, inactive nav */
  --dash-text-3:     #98A2B3;   /* tertiary — placeholders, timestamps */

  /* Brand accent — indigo-blue */
  --dash-primary:    #1A2CCE;   /* links, active nav, focus, primary actions */
  --dash-primary-2:  #3D50E0;   /* hover */
  --dash-primary-bg: #EEF0FE;   /* active-nav tint, soft accent fills */

  /* Borders */
  --dash-border:     #EAECF0;   /* hairline card/table borders */
  --dash-border-2:   #D0D5DD;   /* stronger — outlined circle buttons, inputs */

  /* Functional / money semantics */
  --dash-success:    #12B76A;   /* credits (+), "Completed" */
  --dash-success-bg: #ECFDF3;
  --dash-danger:     #F04438;   /* debits/failed, destructive */
  --dash-danger-bg:  #FEF3F2;
  --dash-warning:    #F79009;   /* pending/processing */
  --dash-warning-bg: #FFFAEB;
}
```

### Usage
- Page is always `--dash-bg`; content lives in white cards. Never put content directly on the grey canvas without a card.
- Blue is the single accent — links, the active nav item, focus rings, and the credit-status dots for "info". Don't introduce a second accent hue for chrome; colour otherwise comes only from currency/quick-action icons.
- Money is coloured: **credit amounts and "Completed" are `--dash-success` green; debits/failed are `--dash-danger` red; pending is `--dash-warning` amber.** Always pair with a `+`/`−` sign or a status dot, never colour alone.

## 3. Typography

```css
:root {
  --dash-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

One family — **Inter** — across the whole app. Bold is welcome here (unlike the public system).

| Token | Weight | Size | Use |
|---|---|---|---|
| Page greeting / H1 | 700 | 24–28px | "Hello {name}" |
| Balance figure | 700 | 32–48px | Total balance, big amounts |
| Section title | 600 | 15–16px | "My Balances", "Quick Actions" |
| Card title | 600 | 15px | Quick-action titles, currency names on emphasis |
| Body | 400–500 | 14–15px | Descriptions, table cells |
| Label / eyebrow | 500 | 12px, 0.04em, uppercase | Table headers ("DATE", "AMOUNT") |
| Caption | 400 | 12–13px | Timestamps, helper text |
| Amount / mono-ish | 600 | matches context | Currency figures — use Inter tabular numerals (`font-variant-numeric: tabular-nums`) for column alignment |

Rules: numbers are **bold** (600–700) and use `tabular-nums` so columns align. Secondary text is `--dash-text-2`. Uppercase only for the small tracked table-header labels.

## 4. Spacing, radius, elevation

```css
:root {
  --dash-radius-card:  16px;  /* outer cards */
  --dash-radius-inner: 12px;  /* nested cards, currency tiles */
  --dash-radius-ctrl:  10px;  /* buttons, inputs, icon tiles */
  --dash-shadow:    0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.08);
  --dash-shadow-sm: 0 1px 2px rgba(16,24,40,0.05);
}
```

- **Soft shadows are allowed and expected** — white cards sit on grey with a subtle `--dash-shadow`. A card may use shadow, a `--dash-border` hairline, or both; keep it light.
- Cards use `--dash-radius-card` (16px, generously rounded); nested tiles 12px; controls 10px. Circular action buttons are full circles.
- Generous white space inside cards (20–28px padding).

## 5. Components

**Cards** — `--dash-surface` bg, `--dash-radius-card`, `--dash-shadow` (optionally + `--dash-border` hairline). The whole dashboard is a stack of these on the grey canvas.

**Buttons**
- Primary: solid `--dash-primary` fill, white text, `--dash-radius-ctrl`, weight 600. Hover `--dash-primary-2`.
- Secondary: white fill, `--dash-border-2` border, `--dash-text` label.
- Circular action (Add money / Send / Convert): a `--dash-border-2` outlined circle (44–52px) with a dark outline icon inside, label below in `--dash-text`. Hover: `--dash-primary-bg` fill + `--dash-primary` icon.
- Text link: `--dash-primary`, weight 500–600 ("See all", "See our rates").

**Currency badge (icon asset system)** — every balance/currency is shown as a **colourful circular badge**:
- Fiat → the country **flag emoji** for the currency (USD 🇺🇸, EUR 🇪🇺, GBP 🇬🇧, NGN 🇳🇬, CAD 🇨🇦, JPY 🇯🇵 …) in a 40px circle.
- Bitcoin → an orange (`#F7931A`) circle with a white `₿`.
- Stablecoin/other → a solid brand-colour circle with the currency glyph (USDC blue `#2775CA` `$`, USDT green `#26A17B` `T`).
Currency names render in `--dash-text-2`, the amount below in bold `--dash-text` with `tabular-nums`.

**Quick-action cards** — white card, `--dash-shadow`, with a **colourful rounded icon tile** (44px, `--dash-radius-ctrl`) using a soft tinted background + matching icon colour (e.g. Pay Bills amber, Cards slate, Invoices blue, Send teal). Bold title + `--dash-text-2` description. Grid: 1 col mobile → 2 → 4.

**Navigation (sidebar)** — white `--dash-surface`, `--dash-border` right edge. Inactive items: `--dash-text-2` icon+label. **Active item: `--dash-primary-bg` rounded background with `--dash-primary` icon + label.** Logo top-left. Optional promo card pinned bottom.

**Header** — greeting (bold) + grey subtitle left; right cluster of ghost icon-buttons (rates link, notifications, settings) and a circular avatar with initials on a `--dash-primary-bg`/`--dash-primary` scheme.

**Tables (recent transactions)** — header row on `--dash-surface-2` with uppercase `--dash-text-3` labels; body rows separated by `--dash-border` hairlines, hover `--dash-surface-2`. Amount column right-aligned, bold, coloured by credit/debit. Status = coloured dot + word.

**Status pill / dot**
- Completed → `--dash-success` dot + text (optionally on `--dash-success-bg` pill).
- Pending/Processing → `--dash-warning`.
- Failed/Reversed → `--dash-danger`.

## 6. Accessibility
- `--dash-text` on white/grey and `--dash-text-2` on white both meet WCAG AA.
- Never signal credit/debit or status by colour alone — always pair with `+`/`−` or the status word.
- Focus: 2px `--dash-primary` ring/outline on interactive elements.

## 7. What to avoid
- The public system's tokens (ink/bronze/linen, Newsreader serif, hairline-only elevation, no-bold rule) — those are for `/` marketing + auth only.
- Content floating directly on the grey canvas (always card it).
- More than one accent hue in the chrome (blue only; colour lives in icons/money).
