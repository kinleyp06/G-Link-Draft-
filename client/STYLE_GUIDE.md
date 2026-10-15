# G-Link style guide (F-01)

Owner: Tandin · Live demo: run `npm run dev` in `client/` and open <http://localhost:5173> (the StyleGuide page).

## Colours

Use the CSS variables from `src/styles/tokens.css`, never raw hex codes.

| Name | Variable | Hex | Use for |
|---|---|---|---|
| Brand | `--color-brand` | `#2e4a7a` | Main buttons, links, headings |
| Soft | `--color-brand-soft` | `#e3ebf6` | Table headers, highlights |
| Success | `--color-success` | `#1e7b34` | Approved, saved |
| Danger | `--color-danger` | `#b03a3a` | Errors, reject, delete |
| Warning | `--color-warning` | `#b45309` | Pending, warnings |
| Info | `--color-info` | `#3b5b92` | Information, completed |
| Text | `--color-text` | `#1a1a1a` | Body text |
| Muted | `--color-muted` | `#666666` | Hints, help text |
| Border | `--color-border` | `#c8ceda` | Boxes, tables |
| Background | `--color-bg` | `#f5f7fb` | Page background |

Booking status colours: `--status-pending`, `--status-approved`, `--status-rejected`, `--status-cancelled`, `--status-completed` (each with a `-bg` partner). Use `<StatusBadge status="Approved" />`.

## Fonts

System font stack (`--font-family`), no downloads. Sizes: `--font-size-xs` 12px, `sm` 14px, `md` 16px (body), `lg` 20px, `xl` 24px, `2xl` 32px.

## Spacing and shape

Spacing goes in 4px steps: `--space-1` 4px, `-2` 8px, `-3` 12px, `-4` 16px, `-5` 20px, `-6` 24px, `-8` 32px, `-10` 40px, `-12` 48px.
Corners: `--radius-sm` 4px, `--radius-md` 8px (buttons, inputs), `--radius-lg` 12px (cards, modals).

## Parts (`src/components/ui`)

Import from one place: `import { Button, TextInput, useToast } from '../components/ui';`

| Part | Use |
|---|---|
| `Button` | `variant="primary" \| "secondary" \| "danger"`, `loading`, `disabled`, `size="small"`, `block`. One primary button per form. |
| `TextInput` | `label` (required), `error` (red, under the box, read out by screen readers), `help`, plus any `<input>` prop. |
| `PasswordInput` | Same as TextInput with a Show / Hide button. |
| `Select` | `options={['Male','Female']}` or `[{ value, label }]`, `placeholder`. |
| `Textarea` | Same props as TextInput, for longer text (`rows`). |
| `Checkbox` | `label` on the right, `checked`, `onChange`, `error`, `help`. |
| `DatePicker` | Native date box; value is `YYYY-MM-DD`; use `min` / `max`. |
| `Table` | `columns=[{ key, header, render? }]`, `rows`, `emptyMessage`, `caption`. Scrolls sideways inside itself on phones. |
| `Modal` | `open`, `title`, `onClose`, `footer`. Closes with Escape or a click outside. Use it to confirm Approve / Reject / Cancel. |
| `Toast` | Wrap the app in `<ToastProvider>`, then `const toast = useToast(); toast.success('Saved')`, `toast.error(...)`, `toast.info(...)`. Closes after 4 seconds. |
| `StatusBadge` | Coloured pill for a booking status. |

## Page building blocks (`src/components`)

`PageHeader` (title, back link, actions), `Notice` (coloured message box), `Loading`, `ErrorMessage` (with *Try again*),
`DefinitionList` (label / value pairs). Layout classes in `src/styles/layout.css`: `.grid--2/3/4`, `.form-row`,
`.actions`, `.form-narrow`, `.stat`, `.tabs`, `.steps`.

## Rules

1. Build every page from these parts. If you need something new, add it to `components/ui` and to the StyleGuide page.
2. Never use `alert()`, `confirm()` or `prompt()`. Use `Toast` for messages and `Modal` for questions.
3. Every box has a visible label. No placeholder-only inputs.
4. Show errors in plain words under the box they belong to (the `error` prop).
5. Pages must work at 375px wide with no sideways scrolling of the page. Wide tables scroll inside `Table`.
6. Use the CSS variables for colours, sizes and spacing.
