# From Five Colors to a Usable Interface: Building an Accessible UI Palette

Five colors can look excellent beside one another and still fail completely when they are placed inside an interface.

A pale blue may work beautifully as a background but disappear when used for body text. An orange accent may stand out in a palette preview yet provide too little contrast behind white button text. Two colors may be clearly different to one viewer while becoming difficult to distinguish when they are the only signals for success and failure.

The useful question is therefore not:

**Do these colors look good together?**

It is:

**What job should each color perform?**

In this guide, we will begin with a small example palette and turn it into a usable interface system by assigning roles, testing actual foreground/background pairs, separating decoration from information, and planning interaction states.

The goal is not to produce one universally perfect palette.

It is to show the reasoning that turns raw swatches into a design system.

## Start with five swatches, not five assumptions

Imagine that a palette generator gives us these colors:

```text
#0B1F33   deep navy
#2563EB   blue
#0F766E   teal
#D97706   amber
#F7F9FC   pale grey-white
```

At first glance, we have five hexadecimal values.

We do **not** yet have:

```text
background
text
primary button
warning
border
success state
link
focus indicator
```

Those are semantic roles.

A color palette is a collection of values.

A UI color system is a set of decisions about what those values are allowed to mean.

That distinction is the starting point.

## Give each color a job

Instead of naming variables after how the colors look:

```css
--dark-blue: #0B1F33;
--bright-blue: #2563EB;
--green-blue: #0F766E;
--orange: #D97706;
--light-gray: #F7F9FC;
```

consider naming them after their intended role:

```css
--surface: #F7F9FC;
--text-primary: #0B1F33;
--action-primary: #2563EB;
--accent-secondary: #0F766E;
--attention: #D97706;
```

The difference may seem cosmetic, but it affects how the design grows.

If a designer later changes the brand's primary action from blue to violet, code such as:

```css
color: var(--bright-blue);
```

no longer describes why that color is being used.

This is clearer:

```css
color: var(--action-primary);
```

The role remains meaningful even when the actual color changes.

Semantic naming also discourages using one attractive swatch everywhere simply because it happens to be available.

## A palette is not automatically accessible

Color harmony and color contrast solve different problems.

Two colors can sit nicely together aesthetically while being too similar in luminance for readable text.

For normal text, WCAG 2.2 Level AA requires a contrast ratio of at least **4.5:1** between the text and its background.

Large-scale text can use **3:1**. WCAG defines large text as at least 18 point when not bold, or at least 14 point when bold.

Important non-text interface elements and graphical objects generally need at least **3:1** against adjacent colors when their visual appearance is necessary to identify or understand them.

That means accessibility cannot be determined from five isolated swatches.

It has to be checked as pairs:

```text
foreground + background
```

and sometimes as neighboring UI elements.

## Test the pair that will actually appear

Take the blue in our example:

```text
#2563EB
```

with white text:

```text
#FFFFFF
```

That pair has a contrast ratio of approximately:

```text
5.17:1
```

so it clears the WCAG AA 4.5:1 threshold for normal text.

Now consider the amber:

```text
#D97706
```

with white:

```text
#FFFFFF
```

The contrast is only about:

```text
3.19:1
```

That may be sufficient for some large text, but it does **not** meet the 4.5:1 threshold for ordinary-sized text.

The amber itself is not "inaccessible."

This particular combination is unsuitable for that particular use.

Put the same amber behind the dark navy:

```text
#D97706 background
#0B1F33 text
```

and the contrast rises to approximately:

```text
5.24:1
```

Now the relationship is much more suitable for normal text.

This is why statements such as:

> This is an accessible orange.

are incomplete.

Accessibility depends on how the color is used.

## Build the surface before the accents

Interfaces usually need more neutral area than accent color.

A useful starting structure might be:

```css
:root {
  --surface-page: #F7F9FC;
  --surface-card: #FFFFFF;

  --text-primary: #0B1F33;
  --text-on-primary: #FFFFFF;

  --action-primary: #2563EB;
  --accent-secondary: #0F766E;
  --attention: #D97706;
}
```

This establishes a visual hierarchy before adding decorative combinations.

The pale color becomes the broad page surface.

White can become a card or elevated surface.

The deep navy handles primary text.

Blue becomes an action color.

Teal and amber remain available for secondary roles.

This is often more useful than giving every generated swatch equal visual weight.

A five-color generator does not mean the final page should contain 20 percent of each color.

## Separate text colors from decorative colors

A brand color does not have to become body text.

Suppose the company's identity depends heavily on amber.

You can still use it for:

- icons
- highlights
- selected decorative elements
- illustration details
- larger visual markers

while using a darker color for paragraph text.

This preserves the visual identity without forcing every brand color into a role it cannot perform well.

Similarly, a very pale brand color may be excellent for backgrounds while being unsuitable for links.

The role should follow the properties of the color rather than the desire to use every swatch everywhere.

## Primary actions need more than a recognizable hue

Imagine a primary button:

```css
.button-primary {
  background: #2563EB;
  color: #FFFFFF;
}
```

The text/background pair is only one part of the component.

A complete button also has states.

For example:

```text
default
hover
focus
active
disabled
```

If every state uses exactly the same appearance, the user receives little feedback.

If all states are differentiated only by subtle hue shifts, some users may not perceive those differences reliably.

A color system should therefore be planned around interaction, not only static screenshots.

## Derive states deliberately

Suppose blue is the primary action color.

You might define:

```css
--action-primary: #2563EB;
--action-primary-hover: ...;
--action-primary-active: ...;
--action-primary-focus: ...;
```

Do not generate these variations only by making the color "a little prettier" or randomly lighter.

For each state, check what the visual change is supposed to communicate.

A hover state may use a modest background change.

A focus state should provide a clearly visible focus indicator.

A disabled control may use a different visual treatment, but disabled controls are a special case under WCAG contrast requirements.

The important point is that interaction states deserve their own design decisions.

A screenshot of the default palette cannot validate them.

## Do not make color carry the whole message

Consider a form with two messages:

```text
green = accepted
red = rejected
```

If the only difference is color, the interface asks users to identify the state entirely through hue.

WCAG's **Use of Color** criterion says color should not be the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.

A stronger result might combine:

```text
✓ Payment confirmed
```

and:

```text
! Payment could not be processed
```

with different colors.

Now the information is communicated through:

- text
- symbol
- color

rather than color alone.

The colors reinforce the message instead of being the message.

## Semantic meaning should remain consistent

Once teal means success in one part of an interface, avoid using the same teal to mean warning somewhere else.

Consistency reduces interpretation work.

A basic semantic layer might look like:

```css
--status-success: #0F766E;
--status-warning: #D97706;
--status-error: #B91C1C;
--status-info: #2563EB;
```

Notice that we introduced an additional red:

```text
#B91C1C
```

The original five-color palette did not contain a suitable error color.

That is completely acceptable.

A generated palette is a starting set, not a contract that prohibits additional colors.

If the interface needs a semantic role that the initial palette does not provide clearly, add an appropriate value.

Do not force an existing swatch into the wrong meaning merely to preserve an arbitrary count of five colors.

## One palette can contain multiple layers

As an interface becomes more complete, it helps to separate three kinds of values.

### 1. Raw palette values

These describe the actual colors:

```css
--navy-900: #0B1F33;
--blue-600: #2563EB;
--teal-700: #0F766E;
--amber-600: #D97706;
--slate-50: #F7F9FC;
```

### 2. Semantic tokens

These describe purpose:

```css
--text-primary: var(--navy-900);
--surface-page: var(--slate-50);
--action-primary: var(--blue-600);
--status-success: var(--teal-700);
--status-warning: var(--amber-600);
```

### 3. Component tokens

These describe a particular element:

```css
--button-primary-bg: var(--action-primary);
--button-primary-text: #FFFFFF;
--notice-warning-bg: var(--status-warning);
--notice-warning-text: var(--navy-900);
```

This may look more complicated than writing hexadecimal values directly into every component.

In a larger design, it creates a useful separation between:

```text
what the color is
what the color means
where the color is used
```

That makes future changes safer.

## Borders are part of the visual system too

A common palette discussion focuses on:

```text
backgrounds
text
buttons
```

and forgets boundaries.

Consider a text field on a white card.

If its only boundary is an extremely pale grey line, some users may struggle to identify where the input begins.

WCAG 2.2's non-text contrast requirement applies to visual information needed to identify user-interface components and states. Required visual indicators generally need a contrast ratio of at least 3:1 against adjacent colors.

That can affect:

- form-field boundaries
- checkbox marks
- dropdown indicators
- selected-state indicators
- meaningful icons
- focus treatments

You should therefore test more than text.

A color system has to support the structure of the interface as well.

## Links need to look like links in context

Suppose ordinary body text uses:

```text
#0B1F33
```

and links use blue:

```text
#2563EB
```

Both may contrast strongly against the pale background.

But another question remains:

**Can users identify which text is interactive?**

An underline is a strong conventional cue.

If links are distinguished from surrounding text only by color, additional requirements and perception concerns come into play.

The safest general design is not to rely on a subtle color difference alone.

For inline links, visible underlining or another clear non-color distinction can make the interaction much easier to recognize.

## Charts need more than five attractive hues

A five-color palette may appear ideal for a five-series chart.

That does not automatically make the chart understandable.

If the only way to tell two data series apart is:

```text
blue line
teal line
orange line
purple line
green line
```

users who cannot reliably distinguish those hues may lose information.

Consider adding:

- direct data labels
- line styles
- different marker shapes
- patterns
- textual legends tied clearly to the data

For example:

```text
Series A ━━━━━
Series B - - - -
Series C · · · ·
```

Color can still make the chart visually appealing.

It should not be the only channel carrying essential meaning.

## Dark mode is not a color inversion

A common shortcut is to take:

```text
light background
dark text
```

and reverse them.

That rarely creates a complete dark theme.

Colors behave differently against dark surfaces.

A bright accent that felt balanced on white may appear intense on near-black.

A shadow may become invisible.

A subtle border may need a new value.

Status colors may need different lightness levels.

Dark mode is better treated as another semantic mapping:

```css
[data-theme="light"] {
  --surface-page: #F7F9FC;
  --text-primary: #0B1F33;
}

[data-theme="dark"] {
  --surface-page: #0B1F33;
  --text-primary: #F7F9FC;
}
```

The semantic names stay stable.

The actual values change.

That is another benefit of role-based tokens: components do not need to know whether the current theme is light or dark.

They ask for:

```text
surface-page
text-primary
action-primary
```

and the theme provides suitable values.

## Decorative graphics have more freedom

Not every color pair on a page has the same accessibility requirement.

A purely decorative abstract shape does not carry the same information as:

- button text
- an input boundary
- a chart line
- an error icon
- instructional text

This allows a design to remain expressive.

A soft low-contrast gradient in a decorative hero background may be fine if no essential information depends on distinguishing its colors.

The mistake is not using subtle color.

The mistake is using subtle color where perception of that color is required to understand or operate the interface.

## Test the real component, not the palette strip

A row of swatches is an efficient way to explore colors.

It is a poor simulation of an interface.

Before adopting a palette, place it into realistic components:

```text
heading
paragraph
link
primary button
secondary button
form input
alert
card
navigation
focus state
chart
```

Then ask whether the roles still make sense.

The same blue that looked balanced as a 100-pixel swatch may dominate when used across every button.

The same teal may appear too similar to the blue when the two are adjacent.

The amber may need dark rather than white text.

Context reveals problems that the palette preview cannot.

## A simple component sample is more useful than a mood board

Before exporting a palette into a full project, build one small test screen.

For example:

```text
┌───────────────────────────────────────┐
│ Account settings                     │
│                                       │
│ Update how we contact you.            │
│                                       │
│ Email address                         │
│ ┌─────────────────────────────────┐   │
│ │ user@example.com                │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ✓ Email verified                      │
│                                       │
│ [ Save changes ]    Cancel             │
└───────────────────────────────────────┘
```

This tiny screen contains:

- a page surface
- heading text
- body text
- a form boundary
- a success state
- a primary action
- a secondary action

That already exercises more of the palette than a strip of five squares.

If the system works here, expand the sample.

If it does not, changing five variables is much easier than correcting an entire finished website.

## Use the generator for exploration, not certification

The Anvil Tools Color Palette Generator is useful at the exploration stage.

A practical approach is:

1. Generate a five-color starting palette.
2. Lock a swatch that fits the identity you want to preserve.
3. Regenerate the remaining colors to explore alternatives.
4. Copy the values or CSS variables once you find a promising set.
5. Assign semantic roles outside the generator.
6. Test the exact foreground/background combinations used in your design.
7. Validate interaction states and meaningful graphical elements separately.

The generator's contrast preview checks the pair displayed in that preview.

It does not certify every possible combination of the five colors, every text size, or every interface state.

That limitation is important because the same palette can be accessible in one implementation and inaccessible in another.

## A role matrix keeps the system understandable

Before development, document the intended jobs.

For our example palette, that might look like this:

| Role | Value | Intended use |
| --- | --- | --- |
| Page surface | `#F7F9FC` | Main light background |
| Card surface | `#FFFFFF` | Elevated content regions |
| Primary text | `#0B1F33` | Headings and body text |
| Primary action | `#2563EB` | Main buttons and links |
| Success | `#0F766E` | Positive status with additional cue |
| Warning | `#D97706` | Attention surfaces with dark text |
| Error | `#B91C1C` | Error state with text/icon cue |

Notice that the table says **intended use**, not simply "name."

This creates something designers and developers can review together.

It also makes misuse easier to spot.

If someone later uses the warning color for ordinary paragraph text, the discrepancy is obvious.

## Contrast is a threshold, not a design target

Passing at exactly 4.5:1 does not mean every possible rendering environment will feel equally comfortable.

Thin typefaces, font rendering, display quality, glare, viewing conditions, and individual vision can all affect perception.

WCAG thresholds provide a measurable baseline.

They should not stop you from choosing stronger contrast when it works with the design.

If two combinations both fit the visual identity and one provides substantially clearer readability, the clearer pair is often the better design choice.

Accessibility and visual quality do not have to work against one another.

## What the five colors became

We began with:

```text
#0B1F33
#2563EB
#0F766E
#D97706
#F7F9FC
```

At the beginning, they were simply five swatches.

By the end, they had become part of a system:

```text
#F7F9FC → page surface
#0B1F33 → primary text
#2563EB → primary actions
#0F766E → success / secondary accent
#D97706 → warning / attention
```

We added white for a secondary surface and red for an error state because the interface needed roles that the original palette did not adequately supply.

We also established rules around:

- contrast
- component boundaries
- interaction states
- status meaning
- non-color cues
- links
- charts
- themes
- semantic variables

That transformation is the difference between choosing colors and designing with them.

## Build from roles, then refine the colors

A palette generator is most useful when it opens possibilities rather than making final decisions for you.

Generate colors.

Keep the ones that fit the visual direction.

Then stop thinking about five equal swatches and start thinking about the interface:

```text
What is the page surface?
What is readable body text?
What represents an action?
What represents status?
What identifies focus?
What communicates meaning without color?
```

Once those questions have answers, test the exact combinations in the actual components where they will appear.

An attractive palette is a good starting point.

A usable color system is the result of assigning roles, checking contrast, preserving meaning, and seeing the colors perform inside the real design.

## Explore a palette

Want a five-color starting palette that you can turn into semantic UI roles?

Try the [Anvil Tools Color Palette Generator](/tools/color-palette-generator.html).

## Further reading

For the accessibility requirements discussed in this guide, consult:

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Understanding WCAG 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [Understanding WCAG 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [WCAG 1.4.1: Use of Color](https://www.w3.org/TR/WCAG22/#use-of-color)
