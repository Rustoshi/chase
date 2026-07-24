# Safe Haven Private — Design System

Design brief for an AI coding agent redesigning an online banking website. Follow these tokens and rules exactly — do not substitute colors, fonts, or weights not listed here.

## 1. Brand direction

Private banking, not consumer fintech. The reference point is a private bank statement or a stationery card — warm, dark, restrained — not a startup dashboard. Every choice should ask: does this look expensive because it's ornamented, or because it's disciplined? Always choose disciplined.

Light theme only. Three brand colors, used unevenly on purpose.

## 2. Color tokens

```css
:root {
  /* Brand — use only these three as "color" */
  --ink: #17140F;        /* primary — near-black warm charcoal */
  --bronze: #A67C3D;     /* accent — muted metallic gold */
  --linen: #F2EEE4;      /* base — warm ivory background */

  /* Derived neutrals — tints of --ink, not new colors */
  --ink-90: #17140FE6;
  --ink-80: #17140FCC;
  --ink-50: #17140F80;
  --ink-20: #17140F33;
  --ink-10: #17140F1A;
  --surface: #FBFAF7;    /* card surface, slightly lighter than linen */

  /* Bronze tints — for hover/pressed states only, never a new hue */
  --bronze-dark: #8A6428; /* bronze text-on-light, button label */
  --bronze-10: #A67C3D1A;

  /* Functional — NOT brand colors, reserved for money/state semantics only */
  --debit: #17140F80;    /* debits render in muted ink, not red — see §5 */
  --error: #B3261E;      /* form errors, failed transactions only */
  --error-bg: #F7E8E6;
}
```

### Usage ratio
Roughly **70% ink, 25% linen/white, 5% bronze.** If bronze appears on more than one element per screen, pull it back.

### Hard rules
- `--bronze` is **never used as a fill/background** on shapes larger than a rule line, icon, or small button outline. It is a line weight and a label color, not a paint color.
- No pure black (`#000`) or pure white (`#FFF`) anywhere. Use `--ink` and `--surface`/`--linen`.
- No gradients. Flat fills only.
- Debits/negative amounts do **not** default to red. Red is reserved for genuine errors (failed transfer, invalid input, declined card). A debit is just muted-ink text — see §5.

## 3. Typography tokens

```css
:root {
  --font-display: 'Newsreader', serif;        /* headlines, balance figures, hero */
  --font-ui: 'General Sans', sans-serif;       /* nav, body, labels, buttons */
  --font-mono: 'Spline Sans Mono', monospace;  /* transaction amounts, account/card numbers */
}
```

| Token | Face | Weight | Size | Letter-spacing | Use |
|---|---|---|---|---|---|
| `--text-hero` | display | 300 | 40–56px | 0 | Balance figures, page hero |
| `--text-h1` | display | 400 | 28–32px | 0 | Section headings |
| `--text-h2` | ui | 500 | 18–20px | 0 | Card titles |
| `--text-body` | ui | 400 | 15–16px | 0 | Paragraphs, table cells |
| `--text-label` | ui | 500 | 11px | 0.08–0.1em, uppercase | Eyebrows, field labels, section tags |
| `--text-caption` | ui | 400 | 12–13px | 0 | Timestamps, helper text |
| `--text-amount` | mono | 400 | matches context | 0 | Every currency figure, account number, card number |

### Hard rules
- **Never use font-weight above 500.** No bold anywhere in the interface — hierarchy comes from size, the ink/bronze/linen relationship, and serif-vs-sans, not boldness.
- Every currency amount, account number, card number, or transaction reference uses `--font-mono`, no exceptions — this is what gives tabular alignment when scanning a statement.
- Uppercase text always gets the tracked letter-spacing above. Uppercase without tracking looks like an error, not a label.
- `--font-display` is reserved for: hero balance, page H1, marketing headlines. Never used for buttons, nav, or body copy.

## 4. Spacing, radius, elevation

```css
:root {
  --radius-control: 2px;   /* buttons, inputs — sharp, not rounded */
  --radius-card: 8px;
  --hairline: 0.5px solid var(--ink-10);
  --hairline-strong: 0.5px solid var(--ink-20);
}
```

- Elevation is a hairline border, never a box-shadow. Shadows read as "app," borders read as "print."
- Buttons and inputs use `--radius-control` (near-sharp corners) — cards use `--radius-card`. Do not round buttons into pills.
- Generous whitespace over dense packing: prefer removing a decorative element over shrinking padding to fit it.

## 5. Component rules

**Buttons**
- Primary: transparent fill, `0.5px solid var(--bronze)` border, `var(--bronze-dark)` label text, uppercase `--text-label` style. Hover: `--bronze-10` background.
- Secondary: `0.5px solid var(--ink-20)` border, `--ink` text.
- Exactly **one primary button per screen.** Every other action is secondary or a text link.
- Never a solid bronze-filled button.

**Cards**
- `--surface` background, `--hairline` border, `--radius-card`.
- No shadow.

**Balances / amounts**
- Positive and neutral amounts: `--ink` text.
- Debits/negative amounts: `--ink-50` text (muted, not colored) — a leading minus sign is the signal, not a color.
- Only genuine failures (declined transaction, error state) use `--error` / `--error-bg`.

**Navigation**
- Top nav / footer: `--ink` background, `--linen` text at 50–100% opacity depending on active state, active item in `--bronze`.
- Active nav item is the only place bronze appears as text color at full opacity outside of buttons/rules.

**Dividers**
- Section breaks use a 24–32px wide, 1.5px `--bronze` rule — this is a signature element, use it once per section max, not as a general-purpose `<hr>`.
- All other dividers are `--hairline`.

**Forms**
- Input: `--surface` fill, `--hairline` border, `--bronze` border on focus (no glow/shadow).
- Labels: `--text-label` style, positioned above the field.
- Placeholder text: `--ink-50`.

**Tables / statements**
- Row dividers: `--hairline`.
- Amount column: right-aligned, `--font-mono`.
- No zebra striping — striping reads as spreadsheet, not statement.

## 6. Accessibility

- Body text (`--ink` on `--linen`/`--surface`) meets WCAG AA (contrast ratio > 7:1 — verify after any tint adjustment).
- Bronze text (`--bronze-dark` on `--surface`) is for labels/buttons only, not body copy — confirm ≥ 4.5:1 before using it for anything text-sized below 14px.
- Never convey debit/credit or error/success by color alone — always pair with a symbol (+ / −) or explicit label.
- Focus states: `0.5px solid var(--bronze)` border replaces default outline, must remain visible on both `--linen` and `--surface` backgrounds.

## 7. What to avoid

- Navy blue, emerald green, or any prior "consumer fintech" palette iteration — this system supersedes those.
- Rounded/pill buttons, drop shadows, gradients, glows.
- Bold weights, all-caps without tracking, more than one bronze-filled element per screen.
- Any font not listed in §3 (no fallback to Inter/Roboto/system fonts in production).