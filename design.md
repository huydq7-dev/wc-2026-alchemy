# Alchemy WC2026 UI Design System

## Goal

Refactor the entire frontend UI so every screen feels visually consistent with the current `BracketView` direction:

- dark FIFA-inspired broadcast aesthetic
- compact, sharp, modern presentation
- strong contrast and clear hierarchy
- consistent spacing, borders, typography, and component behavior

This refactor must **not change product logic**.

Allowed:

- layout cleanup
- component restyling
- spacing and typography changes
- shared UI primitive refactors
- responsive improvements
- visual state improvements

Not allowed:

- changing API contracts
- changing business rules
- changing prediction flow logic
- changing route structure unless purely presentational wrappers require it
- changing data shape

---

## Design North Star

Use `BracketView` as the visual source of truth.

The app should feel like:

- an internal World Cup prediction tool
- premium but restrained
- sporty and data-first
- more FIFA broadcast package than generic dashboard SaaS

Visual keywords:

- dark navy
- electric cyan
- muted white
- sharp panels
- compact labels
- uppercase metadata
- minimal radius
- dense but readable

---

## Core Principles

### 1. One visual language

All pages must use the same:

- background treatment
- panel treatment
- border opacity
- text hierarchy
- interaction feedback

No screen should feel like it came from a different template.

### 2. Minimal but expressive

Avoid decorative clutter.

Use:

- contrast
- spacing
- line weight
- typography
- subtle gradients

instead of excessive shadows, oversized cards, or random accents.

### 3. Compact UI

This product is information-dense. Cards, tabs, tables, filters, and match blocks should be smaller and tighter than before while staying readable.

### 4. Broadcast hierarchy

Metadata should look like metadata.

Examples:

- section kickers
- round names
- match status
- date/time
- venue

These should be uppercase, small, tracked out, and lower emphasis than primary content.

### 5. Presentational refactor only

Every change should preserve:

- props
- state behavior
- network calls
- mutation timing
- query keys
- selection logic
- score logic
- auth flow

---

## Color System

The palette should be standardized around the current bracket colors, not around older red-heavy screens.

### Base surfaces

- `bg-page`: `#08101F` to `#0A0E1A`
- `bg-panel-top`: `rgba(20, 25, 41, 0.96)`
- `bg-panel-bottom`: `rgba(14, 19, 33, 0.96)`
- `bg-tile-top`: `rgba(18, 24, 39, 0.94)`
- `bg-tile-bottom`: `rgba(15, 20, 35, 0.94)`
- `bg-muted`: `rgba(255, 255, 255, 0.025)`

### Bracket-inspired feature colors

- `accent-cyan`: `#1BB7DF`
- `accent-cyan-line`: `#60E6F6`
- `accent-blue-deep`: `#07103A`
- `accent-blue-panel`: `#111A48`
- `accent-gold`: `#F5A623`

### Text colors

- `text-primary`: `#F0F4FF`
- `text-secondary`: `rgba(240, 244, 255, 0.60)`
- `text-muted`: `rgba(240, 244, 255, 0.42)`
- `text-faint`: `rgba(240, 244, 255, 0.32)`

### Borders

- `border-soft`: `rgba(255, 255, 255, 0.07)`
- `border-muted`: `rgba(255, 255, 255, 0.06)`
- `border-strong`: `rgba(255, 255, 255, 0.12)`
- `border-cyan`: `#17307C`
- `border-cyan-bright`: `#1A2A66`

### Status colors

Keep status colors minimal and controlled:

- live: red only as status signal
- selected/active: white surface with dark text, or cyan line accent
- admin/edit actions: gold accent
- destructive: muted red, never neon

### Rule

Do not introduce new arbitrary hex values in feature screens unless they are added to the shared system first.

---

## Background System

All pages should share the same family of backgrounds:

- dark linear base
- subtle radial color blooms
- no flat black screens

Use the current global body background as baseline.

Feature sections may add one extra local gradient layer, but it must remain subtle and consistent with:

- navy
- blue
- cyan
- restrained red glow

Avoid:

- bright purple
- green backgrounds
- isolated solid blocks with no depth

---

## Typography

### Fonts

- Display: `Bebas Neue`
- UI / body: `Inter`

### Hierarchy

#### Page title

- `font-display`
- uppercase or strong tracked title style
- large but not oversized
- default color: white

#### Section kicker

- 10px to 11px
- uppercase
- letter spacing around `0.24em` to `0.32em`
- color `text-muted`

#### Card title / team name

- 12px to 14px
- medium to semibold
- concise

#### Metadata

- 9px to 11px
- uppercase if label-like
- faint or muted color

### Rules

- Prefer tracking and casing over heavy font weight for hierarchy
- Avoid mixing too many text scales inside the same card
- Avoid oversized paragraphs on dashboard-like surfaces

---

## Shape Language

Use smaller, more disciplined radii than before.

### Radius scale

- primary panels: `24px` to `30px`
- secondary panels: `16px` to `24px`
- compact controls: `12px` to `16px`
- bracket cards: `0px`
- status pills: fully rounded

### Rule

If a component is inspired by the bracket or FIFA broadcast look, prefer squarer corners.

If a component is part of app shell or form UI, allow soft rounding.

Do not mix hard square bracket cards with oversized bubbly elements nearby.

---

## Shadows and Depth

Depth should be subtle and dark.

Use:

- soft outer shadow for panels
- occasional inset highlight
- stronger shadow only on active floating controls

Avoid:

- glowy neon shadows
- blurry large-card shadows
- shadow colors unrelated to palette

Recommended pattern:

- panel: `0 18px 40px rgba(0, 0, 0, 0.24)`
- active control: slightly stronger dark shadow

---

## Border Language

Borders are a major part of the system.

### Default

- thin borders
- low-opacity white for most components

### Feature emphasis

Use cyan borders only for:

- bracket containers
- connector systems
- special tournament framing

### Rule

Avoid heavy border stacking:

- panel border + bright inner border + ring + shadow

Usually one subtle border is enough.

---

## Interaction Rules

### Hover

Hover states should be visible but restrained:

- slightly brighter background
- slightly stronger border
- slightly brighter text

No dramatic lift unless the component is explicitly clickable and primary.

### Active / selected

Use one of these two patterns only:

#### Pattern A: inverted active

- white background
- dark text
- stronger shadow

Use for:

- tabs
- segmented toggles
- compact prediction choices

#### Pattern B: line active

- transparent background
- white text
- cyan or brand underline/bar

Use for:

- line tabs
- lightweight nav

### Focus

Focus rings should be:

- visible
- soft
- low-opacity white or system ring

Avoid harsh blue browser-default appearance.

### Disabled

- reduce opacity
- disable pointer events
- keep shape and spacing unchanged

---

## Shared Component Rules

## App Shell

### Header

- dark integrated header
- compact height
- nav inside subtle panel
- no bright hero-banner treatment

### Main content

- consistent horizontal rhythm
- default pages stay in centered container
- exceptional views like bracket may break out full width locally, not globally

---

## Panels and Cards

### Primary card

Use `.app-panel`.

Characteristics:

- dark gradient fill
- soft white border
- subtle shadow
- rounded `24px` to `26px`

### Secondary card

Use `.app-panel-muted` or `.app-tile`.

Characteristics:

- quieter background
- lighter emphasis
- same border family

### Bracket card

Use the `BracketView` look as-is:

- square edges
- high-contrast fill
- visible bracket color identity
- compact row heights

Do not reuse rounded dashboard cards inside the bracket.

---

## Tabs

Tabs should match the current bracket-adjacent style:

- compact height
- equal-width items when grouped
- strong selected state
- clear hover
- obvious pointer cursor

Default tab group:

- dark group container
- light active item
- dark active text

Line variant:

- transparent base
- underline active state

Rule:

- All tabs across app must use shared `Tabs`, `TabsList`, `TabsTrigger`
- No one-off custom tab buttons unless there is a functional reason

---

## Buttons

### Primary

- white background
- dark text
- compact
- semibold

### Secondary / outline

- dark translucent background
- subtle white border
- white or muted white text

### Ghost

- almost invisible at rest
- visible on hover

### Rules

- button height should generally be `36px` to `40px`
- avoid giant CTA buttons unless on login or hero
- keep icon spacing tight

---

## Inputs and Selects

Inputs and selects should feel like part of the same control family:

- dark translucent fill
- subtle white border
- white text
- muted placeholder
- `rounded-2xl`

Do not keep any legacy light input style on dark screens.

---

## Dialogs and Modals

Dialogs should:

- use dark blurred overlay
- use `app-panel` surface
- keep white text hierarchy
- use compact, premium spacing

Close button:

- small
- circular
- subtle border

Avoid legacy light modal panels.

---

## Tables

Tables should not look like plain admin tables.

Use:

- dark panel container
- subtle row separators
- compact row height
- muted headers
- clearer emphasis on key numeric columns

On mobile:

- convert to card/list form
- keep same visual language

---

## Match Cards

Match cards are one of the most repeated UI units and must be consistent everywhere.

Required structure:

- top-right status chip
- stage / venue metadata row
- centered team comparison
- score or time in strongest visual emphasis
- action row below

Rules:

- card radius around `24px` to `26px`
- flags should be crisp and rectangular
- metadata faint
- scores stronger than team names
- live state can use restrained red border glow

---

## Bracket-Specific Rules

The bracket is the reference aesthetic.

Preserve:

- square cards
- cyan connector lines
- left/right color differentiation
- centered final column
- horizontal drag behavior
- compact labels

Do not “roundify” the bracket to match generic cards.

Instead, other screens should borrow its:

- palette
- density
- hierarchy
- border discipline

---

## Icons and Imagery

### Icons

- use `lucide-react`
- default muted white
- brighten only on interaction or emphasis

### Flags

- rectangular
- no decorative containers unless needed for legibility
- no oversized shadows

### Tournament imagery

- world cup emblem can be used sparingly
- avoid mixing too many unrelated illustrations

---

## Spacing System

Use a tighter spacing rhythm.

### Component spacing

- card padding: `12px`, `16px`, `20px`, `24px`
- gaps inside dense controls: `6px`, `8px`, `12px`
- section spacing: `16px`, `24px`, `32px`

### Rule

Avoid:

- oversized vertical whitespace
- random one-off margins
- giant hero gaps on data-heavy screens

Bracket density should influence the rest of the app.

---

## Responsive Rules

### Desktop

- centered layouts by default
- full-width breakout only for bracket-like experiences

### Mobile

- reduce title size slightly
- keep cards compact
- preserve hierarchy, do not stack excessive chrome
- maintain generous touch targets even when visuals are compact

### Rule

Responsiveness should preserve the same design language, not create a separate visual system.

---

## Refactor Boundaries

During implementation, keep presentation separate from behavior.

Safe refactor targets:

- `src/index.css`
- `src/components/ui/*`
- page wrappers and presentational markup
- class names
- shared layout primitives
- spacing and typography

Use extra caution around:

- `usePredictions`
- auth flow
- server-facing calls
- query invalidation
- bracket data mapping
- admin edit behaviors

If a component needs visual cleanup, prefer:

1. extracting a shared presentational wrapper
2. changing classes
3. changing composition

Avoid rewriting state logic unless absolutely necessary.

---

## Implementation Order

### Phase 1: Foundation

- finalize tokens in `src/index.css`
- finalize panel, tile, kicker, text utility patterns
- normalize `Button`, `Input`, `Select`, `Dialog`, `Tabs`, `Badge`, `Card`

### Phase 2: Shell

- normalize `Layout`
- normalize page headers
- align container widths and breakout rules

### Phase 3: High-frequency surfaces

- `MatchCard`
- `LeaderboardTable`
- `GroupTable`
- filters
- chips
- countdown
- login

### Phase 4: Pages

- Dashboard
- Schedule
- Standings
- Leaderboard
- Activity
- Rules
- Fund
- Match Detail

### Phase 5: Polish

- mobile QA
- hover/focus consistency
- status colors consistency
- spacing cleanup

---

## QA Checklist

Before considering the refactor complete, verify:

- no logic behavior changed
- all screens use the same background family
- all cards belong to one of the approved surface types
- text hierarchy is consistent
- tabs have clear hover and selected states
- inputs/selects/dialogs all match the same family
- bracket remains visually special but not disconnected
- no page contains obvious legacy colors or radius styles
- mobile layout remains usable
- no new arbitrary color values were introduced casually

---

## Definition of Done

The UI refactor is complete when:

- the app feels like one coherent product
- the bracket no longer looks like a separate design system
- every major screen visually aligns with bracket palette and hierarchy
- shared components enforce consistency
- no business logic was changed

---

## Short Refactor Directive

If using this document as implementation guidance, follow this rule:

> Refactor presentation only. Borrow the palette, density, border treatment, typography, and interaction language from `BracketView`, then propagate that system across the app without changing behavior.
