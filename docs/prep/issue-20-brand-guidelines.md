# Issue #20 — Brand Guidelines: Cronus Metabolus Visual Identity System

**Owner:** Scott Lefler (Lefler Design)
**Prepared by:** Engineering (automated analysis)
**Status:** Ready for design

---

## Executive Summary

Cronus Metabolus needs its own visual identity — separate from Lefler Design's brand. This document provides:
- Color palette (primary, secondary, accent, neutrals with hex values)
- Typography (heading, body, monospace — font families, weights, sizes)
- Logo concepts (wordmark + logomark options)
- Tone of voice (professional/playful/technical spectrum)
- Icon style guide (line weight, corner radius, fill rules)
- Usage guidelines (do's and don'ts, spacing rules, minimum sizes)
- Brand application examples (dashboard, pitch decks, social media)

---

## 1. Brand Positioning

### Brand Essence

**Cronus Metabolus** is the **content yield engine** for premium brands.

It transforms one premium visual asset (hero film, 3D render, product shoot) into 30+ days of platform-optimized social content. Built for brands that invest heavily in original production but struggle to maintain high-frequency social presence.

### Brand Values

1. **Premium** — High-quality, sophisticated, professional
2. **Intelligent** — AI-powered, data-driven, algorithmic
3. **Efficient** — Automated, scalable, time-saving
4. **Measurable** — ROI-focused, attributed, transparent
5. **Distinctive** — Not generic, not templated, brand-specific

### Brand Personality

**If Cronus Metabolus were a person:**
- Sophisticated but approachable
- Intelligent but not arrogant
- Professional but not stuffy
- Innovative but not gimmicky
- Confident but not aggressive

**Voice characteristics:**
- Clear and concise (no jargon)
- Confident and authoritative (expert tone)
- Warm and human (not robotic)
- Aspirational but achievable (premium but accessible)

---

## 2. Color Palette

### Primary Colors

**Cronus Blue**
- Hex: `#4f7df5`
- RGB: `79, 125, 245`
- HSL: `220°, 88%, 64%`
- Usage: Primary actions, links, highlights

**Cronus Teal**
- Hex: `#22d3a8`
- RGB: `34, 211, 168`
- HSL: `164°, 75%, 48%`
- Usage: Secondary actions, success states, accents

**Gradient (Primary → Secondary)**
- CSS: `linear-gradient(135deg, #4f7df5, #22d3a8)`
- Usage: Hero sections, CTAs, special highlights
- Angle: 135° (top-left to bottom-right)

### Secondary Colors

**Cronus Purple**
- Hex: `#7c4dff`
- RGB: `124, 77, 255`
- HSL: `259°, 100%, 65%`
- Usage: Tertiary accents, special highlights

**Cronus Coral**
- Hex: `#ff6b6b`
- RGB: `255, 107, 107`
- HSL: `0°, 100%, 71%`
- Usage: Error states, warnings, alerts

### Neutral Colors

**Gray Scale**
- `#050510` — Background (dark mode)
- `#111827` — Text primary (dark mode)
- `#1F2937` — Text secondary (dark mode)
- `#374151` — Text muted (dark mode)
- `#6B7280` — Text disabled
- `#9CA3AF` — Borders
- `#E5E7EB` — Dividers
- `#F3F4F6` — Background (light mode)
- `#F9FAFB` — Background (lighter)
- `#FFFFFF` — Cards, surfaces

### Semantic Colors

**Success**
- Hex: `#16A34A`
- Usage: Approved states, positive metrics, success messages

**Warning**
- Hex: `#CA8A04`
- Usage: Pending states, caution messages

**Error**
- Hex: `#DC2626`
- Usage: Rejected states, error messages, destructive actions

**Info**
- Hex: `#2563EB`
- Usage: Informational messages, tips, hints

---

## 3. Typography

### Font Families

**Primary Font: Inter**
- Source: Google Fonts
- URL: https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800&display=swap
- Usage: All UI text, headings, body, labels

**Monospace Font: JetBrains Mono**
- Source: Google Fonts
- URL: https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap
- Usage: Code, formulas, technical data, metrics

### Font Weights

**Ultra-Light (200)**
- Usage: Large headlines, hero text
- Example: "Cronus Metabolus" (logo, title)
- Context: Premium, sophisticated feel

**Light (300)**
- Usage: Subheadings, secondary headlines
- Example: "The content yield engine"
- Context: Elegant, refined

**Regular (400)**
- Usage: Body text, paragraphs, labels
- Example: "Transforms one premium visual asset into 30+ days of content"
- Context: Readable, clear

**Medium (500)**
- Usage: Emphasized text, buttons, CTAs
- Example: "Upload Asset" (button)
- Context: Actionable, confident

**Semi-Bold (600)**
- Usage: Section headings, strong emphasis
- Example: "Dashboard Overview"
- Context: Important, structured

**Bold (700)**
- Usage: Stats, metrics, key numbers
- Example: "30-90" (posts per asset)
- Context: Impactful, data-driven

**Extra-Bold (800)**
- Usage: Rare, special emphasis
- Example: "NEW" (badge)
- Context: Urgent, attention-grabbing

### Font Sizes

**Display (48px / 3rem)**
- Usage: Hero headlines, landing pages
- Line height: 1.1
- Letter spacing: -0.03em
- Weight: 200 (ultra-light)

**H1 (36px / 2.25rem)**
- Usage: Page titles, major sections
- Line height: 1.2
- Letter spacing: -0.02em
- Weight: 200-300

**H2 (28px / 1.75rem)**
- Usage: Section headings
- Line height: 1.3
- Letter spacing: -0.01em
- Weight: 300

**H3 (20px / 1.25rem)**
- Usage: Subsection headings
- Line height: 1.4
- Letter spacing: 0
- Weight: 500

**H4 (16px / 1rem)**
- Usage: Card titles, labels
- Line height: 1.5
- Letter spacing: 0
- Weight: 600

**Body (14px / 0.875rem)**
- Usage: Paragraphs, descriptions
- Line height: 1.6
- Letter spacing: 0
- Weight: 400

**Small (12px / 0.75rem)**
- Usage: Captions, metadata, timestamps
- Line height: 1.5
- Letter spacing: 0
- Weight: 400

**Tiny (10px / 0.625rem)**
- Usage: Badges, tags, fine print
- Line height: 1.4
- Letter spacing: 0.05em
- Weight: 500
- Transform: uppercase

### Typography Rules

**Do:**
- ✅ Use Inter for all UI text
- ✅ Use JetBrains Mono for code/formulas
- ✅ Maintain consistent font weights (200-800)
- ✅ Use letter spacing for large text (-0.03em)
- ✅ Use line height 1.5-1.6 for body text

**Don't:**
- ❌ Mix font families (stick to Inter + JetBrains Mono)
- ❌ Use font weights outside 200-800 range
- ❌ Use font sizes smaller than 10px
- ❌ Use all-caps for body text (only for tiny labels)
- ❌ Underline text (use color for links)

---

## 4. Logo Concepts

### Concept #1: Wordmark (Text Only)

**Design:**
- Text: "Cronus Metabolus"
- Font: Inter, weight 200 (ultra-light)
- Color: Gradient (blue → teal)
- Layout: Horizontal (single line)

**Variations:**
- Full: "Cronus Metabolus" (horizontal)
- Stacked: "Cronus" (line 1) + "Metabolus" (line 2)
- Abbreviated: "CM" (monogram)

**Usage:**
- Primary logo for all applications
- Minimum size: 120px wide (full), 40px wide (monogram)
- Clear space: 1x logo height on all sides

### Concept #2: Logomark (Icon Only)

**Design:**
- Symbol: Abstract "C" + "M" monogram
- Style: Geometric, minimal
- Color: Gradient (blue → teal)
- Shape: Circular or hexagonal

**Variations:**
- Full color (gradient)
- Single color (blue or teal)
- White (on dark backgrounds)
- Black (on light backgrounds)

**Usage:**
- Favicon, app icon, social media avatar
- Minimum size: 32x32px
- Clear space: 1x icon size on all sides

### Concept #3: Combination Mark (Icon + Text)

**Design:**
- Icon: Abstract "C" + "M" monogram (left)
- Text: "Cronus Metabolus" (right)
- Layout: Horizontal (icon + text)

**Variations:**
- Horizontal (icon left, text right)
- Stacked (icon top, text bottom)
- Vertical (icon top, text below)

**Usage:**
- Primary logo for marketing materials
- Minimum size: 200px wide
- Clear space: 1x icon size on all sides

### Logo Files (To Be Created)

**Formats:**
- SVG (vector, scalable)
- PNG (raster, transparent background)
- PDF (print-ready)

**Sizes:**
- Small: 120px wide (web)
- Medium: 240px wide (print)
- Large: 480px wide (large format)

**Colors:**
- Full color (gradient)
- Single color (blue)
- Single color (teal)
- White (on dark)
- Black (on light)

---

## 5. Tone of Voice

### Voice Spectrum

**Professional ← → Playful**
- Cronus Metabolus: **70% professional, 30% playful**
- Rationale: Premium brands expect professionalism, but personality builds connection

**Technical ← → Simple**
- Cronus Metabolus: **60% technical, 40% simple**
- Rationale: AI-powered system needs technical credibility, but must be accessible

**Formal ← → Casual**
- Cronus Metabolus: **65% formal, 35% casual**
- Rationale: B2B audience expects formality, but conversational tone is more engaging

**Serious ← → Humorous**
- Cronus Metabolus: **90% serious, 10% humorous**
- Rationale: Premium brands don't use humor in marketing (save for social media)

### Voice Guidelines

**Do:**
- ✅ Be clear and concise (no jargon, no fluff)
- ✅ Be confident and authoritative (expert tone)
- ✅ Be warm and human (not robotic, not corporate)
- ✅ Use active voice (not passive)
- ✅ Use specific numbers (not vague claims)
- ✅ Focus on benefits (not features)

**Don't:**
- ❌ Use jargon or acronyms (unless industry-standard)
- ❌ Use superlatives (best, amazing, incredible)
- ❌ Use exclamation points (unless celebrating)
- ❌ Use slang or colloquialisms
- ❌ Use passive voice
- ❌ Make vague claims (use specific numbers)

### Voice Examples

**Headlines:**

✅ Good:
- "One premium asset → continuous content → measurable yield"
- "Turn your content into a system"
- "30-90 posts per asset. Automatically."

❌ Bad:
- "The best content engine ever!"
- "Amazing AI-powered content creation"
- "Revolutionary platform for content marketing"

**Body Copy:**

✅ Good:
- "Transforms one premium visual asset into 30+ days of platform-optimized social content."
- "Built for brands that invest heavily in original production but struggle to maintain high-frequency social presence."
- "Every post is on-brand, platform-optimized, and attributed to its source asset."

❌ Bad:
- "Our amazing platform uses cutting-edge AI to create incredible content for you!"
- "You'll love how easy it is to use our revolutionary system!"
- "We're the best content engine on the market, guaranteed!"

**CTAs:**

✅ Good:
- "Upload Your First Asset"
- "Get Started"
- "Book a Demo"
- "See How It Works"

❌ Bad:
- "Click Here!"
- "Sign Up Now!"
- "Don't Miss Out!"
- "Act Now!"

---

## 6. Icon Style Guide

### Icon System

**Library:** Lucide Icons (https://lucide.dev)
**Style:** Outline (stroke-based)
**Stroke Width:** 1.5px
**Size:** 24x24px (default), 16x16px (small), 32x32px (large)
**Color:** Current text color (inherits from parent)

### Icon Rules

**Do:**
- ✅ Use Lucide icons (consistent style)
- ✅ Use 1.5px stroke width
- ✅ Use 24x24px default size
- ✅ Use currentColor (inherits text color)
- ✅ Add aria-label for accessibility

**Don't:**
- ❌ Mix icon libraries (stick to Lucide)
- ❌ Use filled icons (only outline)
- ❌ Use custom icons (unless necessary)
- ❌ Resize icons disproportionately
- ❌ Use icons without labels (for accessibility)

### Icon Usage

**Navigation:**
- Size: 24x24px
- Stroke: 1.5px
- Color: Gray-600 (inactive), Gray-900 (active)
- Spacing: 12px between icon and label

**Buttons:**
- Size: 20x20px
- Stroke: 1.5px
- Color: White (on primary), Gray-900 (on secondary)
- Spacing: 8px between icon and label

**Cards:**
- Size: 24x24px
- Stroke: 1.5px
- Color: Gray-500
- Spacing: 8px between icon and text

**Stats:**
- Size: 32x32px
- Stroke: 1.5px
- Color: Blue-500 or Teal-500
- Spacing: 12px between icon and value

---

## 7. Usage Guidelines

### Clear Space

**Logo:**
- Minimum clear space: 1x logo height on all sides
- No other elements (text, graphics, borders) in clear space

**Icon:**
- Minimum clear space: 1x icon size on all sides
- No other elements in clear space

### Minimum Sizes

**Logo:**
- Full wordmark: 120px wide (web), 240px wide (print)
- Stacked wordmark: 80px wide (web), 160px wide (print)
- Monogram: 40px wide (web), 80px wide (print)

**Icon:**
- Minimum: 16x16px (web), 32x32px (print)
- Recommended: 24x24px (web), 48x48px (print)

### Color Usage

**Primary Color (Blue):**
- Primary actions (buttons, links)
- Highlights (selected states, active states)
- Informational messages

**Secondary Color (Teal):**
- Secondary actions
- Success states
- Accents (highlights, badges)

**Gradient (Blue → Teal):**
- Hero sections
- CTAs (call-to-action buttons)
- Special highlights (premium features)

**Neutral Colors (Gray):**
- Backgrounds
- Text
- Borders
- Dividers

### Do's and Don'ts

**Do:**
- ✅ Use brand colors consistently
- ✅ Maintain clear space around logo
- ✅ Use Inter font for all text
- ✅ Follow tone of voice guidelines
- ✅ Use Lucide icons (outline style)

**Don't:**
- ❌ Stretch or distort logo
- ❌ Change logo colors (except for approved variations)
- ❌ Place logo on busy backgrounds
- ❌ Use non-brand fonts
- ❌ Use filled icons (only outline)
- ❌ Deviate from tone of voice

---

## 8. Brand Applications

### Dashboard

**Header:**
- Logo: Wordmark (horizontal) — "Cronus Metabolus"
- Font: Inter, weight 200
- Color: Gray-900
- Size: 20px

**Navigation:**
- Icons: Lucide, 24x24px, 1.5px stroke
- Labels: Inter, weight 500, 14px
- Active state: Gray-100 background, Gray-900 text
- Inactive state: Gray-600 text

**Buttons:**
- Primary: Gradient background (blue → teal), white text
- Secondary: White background, Gray-900 text, Gray-200 border
- Size: 44px height (touch-friendly)

**Cards:**
- Background: White
- Border: 1px solid Gray-200
- Border radius: 12px
- Padding: 16px (mobile), 24px (desktop)

### Pitch Decks

**Title Slide:**
- Logo: Wordmark (horizontal) — "Cronus Metabolus"
- Font: Inter, weight 200
- Color: Gradient (blue → teal)
- Size: 48px

**Headings:**
- Font: Inter, weight 200-300
- Color: White (on dark background)
- Size: 36px (H1), 28px (H2), 20px (H3)

**Body Text:**
- Font: Inter, weight 300
- Color: Gray-400 (on dark background)
- Size: 16px

**Stats:**
- Font: Inter, weight 700
- Color: Gradient (blue → teal)
- Size: 32px

### Social Media

**Profile Picture:**
- Icon: Logomark (C+M monogram)
- Size: 400x400px
- Background: Gradient (blue → teal)

**Cover Photo:**
- Logo: Combination mark (icon + text)
- Size: 1500x500px (Twitter), 1640x924px (LinkedIn)
- Background: Gradient (blue → teal)

**Post Templates:**
- Logo: Monogram (top right corner)
- Colors: Brand palette (blue, teal, gray)
- Font: Inter (headings, body)
- Style: Clean, minimal, professional

---

## 9. Brand Assets (To Be Created)

### Logo Files

**Formats:**
- SVG (vector, scalable)
- PNG (raster, transparent background)
- PDF (print-ready)

**Variations:**
- Full color (gradient)
- Single color (blue)
- Single color (teal)
- White (on dark)
- Black (on light)

### Icon Files

**Formats:**
- SVG (vector, scalable)
- PNG (raster, transparent background)

**Sizes:**
- 16x16px (small)
- 24x24px (default)
- 32x32px (large)
- 48x48px (extra large)

### Template Files

**Figma:**
- Dashboard UI kit
- Pitch deck template
- Social media templates

**Canva:**
- Social media post templates
- Story templates
- Cover photo templates

### Guidelines Document

**Formats:**
- PDF (print-ready)
- Web (interactive)
- Figma (design system)

---

## 10. Recommended Next Steps

### For Scott (Design)

1. **Review brand guidelines** — Approve colors, typography, tone
2. **Design logo concepts** — Create 3 logo variations
3. **Create brand assets** — Logo files, icon files, templates
4. **Build design system** — Figma library with all components
5. **Document guidelines** — PDF + web version

### For Engineering (Anthony)

1. **Implement brand colors** — Update Tailwind config
2. **Add Inter font** — Update index.html
3. **Update components** — Apply brand styles
4. **Test across pages** — Ensure consistency
5. **Deploy to production** — Update live dashboard

### For Partnership (Both)

1. **Review brand guidelines** — Align on vision
2. **Approve logo concepts** — Select final design
3. **Test brand applications** — Dashboard, pitch decks, social
4. **Launch rebrand** — Update all surfaces
5. **Monitor consistency** — Ensure brand integrity

---

## 11. Brand Checklist

### Visual Identity

- [ ] Logo designed (3 concepts)
- [ ] Logo files created (SVG, PNG, PDF)
- [ ] Color palette defined (hex values)
- [ ] Typography defined (font families, weights, sizes)
- [ ] Icon style guide defined (Lucide, 1.5px stroke)
- [ ] Clear space rules defined
- [ ] Minimum sizes defined

### Tone of Voice

- [ ] Voice spectrum defined (professional/playful, technical/simple)
- [ ] Voice guidelines written (do's and don'ts)
- [ ] Voice examples created (headlines, body copy, CTAs)
- [ ] Tone of voice document published

### Applications

- [ ] Dashboard updated (brand colors, typography)
- [ ] Pitch decks updated (brand styles)
- [ ] Social media templates created
- [ ] Email templates created
- [ ] Print materials created (business cards, letterhead)

### Guidelines

- [ ] Brand guidelines document created (PDF)
- [ ] Brand guidelines website created (web)
- [ ] Design system created (Figma)
- [ ] Brand assets library created (logos, icons, templates)

---

**Document prepared:** 2026-07-20
**Design owner:** Scott Lefler
**Engineering support:** Anthony Padavano
**Next review:** After Scott's design work
