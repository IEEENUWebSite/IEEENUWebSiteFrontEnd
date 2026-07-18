---
name: IEEE Nile University Student Branch Portal
description: Bridging academic theory and real-world innovation through student-led technical development.
colors:
  primary: "#00b4d8"
  primary-hover: "#0077b6"
  secondary: "#6c757d"
  neutral-bg: "#f8f9fa"
  neutral-dark: "#012b5b"
  neutral-white: "#ffffff"
typography:
  display:
    fontFamily: "Merriweather Sans, -apple-system, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.15
  headline:
    fontFamily: "Merriweather Sans, -apple-system, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Merriweather Sans, -apple-system, sans-serif"
    fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Merriweather, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Merriweather Sans, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.08em"
rounded:
  sm: "12px"
  md: "20px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.sm}"
    padding: "0.9rem 2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.neutral-white}"
  button-xl:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.sm}"
    padding: "1.25rem 2.75rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.sm}"
    padding: "0.85rem 2rem"
---

# Design System: IEEE Nile University Student Branch Portal

## 1. Overview

**Creative North Star: "The Collaborative Beacon"**

The visual system of the IEEE Nile University Student Branch is anchored in the concept of a lighthouse or "beacon" that guides student innovation, collaboration, and learning. It bridges structured engineering excellence with dynamic, human-centric design.

The layout architecture balances clean, high-contrast typography, content-focused rhythm, and modern glassmorphic overlays. This ensures that technical documentation, member application portals, and administrative views feel modern, highly professional, and responsive across all device sizes.

This system rejects dense, uninspiring enterprise dashboard conventions in favor of a breathable, well-proportioned interface that sparks enthusiasm.

**Key Characteristics:**
- High-contrast, deeply legible dark mode and light mode surfaces.
- Sleek glassmorphic containers displaying content hierarchy and depth.
- Tactile interactive feedback with smooth transitions and micro-animations.
- Generous white space and clear paths of action.

## 2. Colors

The color palette utilizes deep professional tones of dark blue alongside electric cyan accents to convey a sense of modern engineering, academic intelligence, and dynamic energy.

### Primary
- **Electric Tech Cyan** (#00b4d8): The main interactive color, used for primary CTAs, links, active navigation sliders, and high-visibility status indicators. It stands out sharply against neutral surfaces.

### Secondary
- **Academic Slate** (#6c757d): Used for secondary labels, fallback button borders, muted descriptive text, and non-active list counts.

### Neutral
- **Deep IEEE Midnight Blue** (#012b5b): The dominant container and background color for the recruitment forms, footer elements, and dark mode containers. It represents stability and structural trust.
- **Cool Light Surface** (#f8f9fa): Used as a secondary light background color for main section splits and public page dividers.
- **Pure White** (#ffffff): Used for content cards, high-contrast typography, and light-theme inputs.

### Named Rules
**The Accented Rarity Rule.** The main accent color (Electric Tech Cyan) must occupy no more than 10% of any single view. Its sparsity is what drives interest and guides user attention to actionable targets.
**The No-Mud Rule.** Dark backgrounds must always use clean midnight tints (e.g. Deep IEEE Midnight Blue) or dark slate variants. Pure gray or flat black values are prohibited for core dark layout panels.

## 3. Typography

The design features a clear typographic pairing: Merriweather Sans for bold, structured headings, and Merriweather Serif for highly readable body prose.

**Display Font:** Merriweather Sans (with -apple-system, sans-serif fallback)
**Body Font:** Merriweather (with -apple-system, sans-serif fallback)

### Hierarchy
- **Display** (800, clamp(2.5rem, 6vw, 4rem), 1.15): Hero section headings and main sub-page banners. Used to grab immediate attention.
- **Headline** (700, clamp(1.75rem, 3.5vw, 2.5rem), 1.2): Section titles. Always accompanied by the primary color divider.
- **Title** (700, clamp(1.2rem, 2.5vw, 1.5rem), 1.3): Card headings, committee labels, and form section group titles.
- **Body** (400, 1rem, 1.7): General descriptions, blog articles, and form labels. Maximum line length for prose should be kept between 65–75ch for optimal reading comfort.
- **Label** (600, 0.875rem, 1.5): Uppercase uppercase tracking (0.08em letter-spacing) used on buttons, navigation items, category tags, and dates.

### Named Rules
**The Case-Contrast Rule.** Small navigational links, CTA buttons, and secondary tag badges must always be styled in uppercase letter-case with generous letter-spacing to distinguish them from standard body text.

## 4. Elevation

The system relies on a combination of flat rest states, subtle border strokes, and hover-triggered elevation changes. Glassmorphic layers are used in dark sections to achieve high visual depth without relying on generic shadows.

### Shadow Vocabulary
- **Interactive Focus** (`box-shadow: 0 8px 25px rgba(0, 180, 216, 0.35)`): Used on primary buttons during hover states to represent energy and push.
- **Soft Floating Card** (`box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18)`): Used on committee cards and action sheets during hover to create physical separation.

### Named Rules
**The Hover-State Response Rule.** Containers and buttons must rest flat or with minimal border styling. Deep shadows and glowing gradients are active states, indicating tactile responsiveness.

## 5. Components

### Buttons
- **Shape:** Softly curved corners with a medium border radius (12px / 0.75rem).
- **Primary:** Electric Tech Cyan background, white bold text. Styled with uppercase labels.
- **Hover / Focus:** Transitions smoothly over 0.3s with a translate-Y lift (-2px) and an interactive glow shadow.
- **Secondary / Outline:** Transparent background, white border (2px), white text. Transitions to white background and Midnight Blue text on hover.

### Cards / Containers
- **Corner Style:** Medium border radius (12px / 0.75rem) for standard cards; large border radius (20px / 1.25rem) for main hero glass panels.
- **Background:** White for light cards, semi-transparent white (rgba(255, 255, 255, 0.07)) with backdrop-filter (blur(16px)) for dark glass containers.
- **Shadow Strategy:** Floating shadows apply only on hover.

### Inputs / Fields
- **Style:** Semi-transparent background (rgba(255, 255, 255, 0.06)), thin border (1px solid rgba(255, 255, 255, 0.12)), white text.
- **Focus:** Highlighted with a primary cyan border and a subtle cyan glow.

### Navigation
- **Style:** Fixed-top header, transparent at rest on the hero page, shrinking to Midnight Blue background (rgba(1, 43, 91, 0.95)) with backdrop-filter blur (12px) on scroll.
- **Links:** Uppercase, active state indicated by a primary cyan underline slide-in.

## 6. Do's and Don'ts

### Do:
- **Do** use the Electric Tech Cyan accent sparingly on interactive elements only (buttons, nav sliders, active highlights).
- **Do** align form inputs to a clear, single-column vertical layout on smaller screen sizes.
- **Do** ensure all text components meet standard contrast ratios (at least 4.5:1 for body copy).
- **Do** apply glassmorphic cards with blur (16px) inside dark layout blocks to maintain hierarchy.

### Don't:
- **Don't** use overly complex enterprise tables or dense data grids without clear visual spacing hierarchy.
- **Don't** style dark mode views using flat gray backgrounds or high-contrast neon purple/green gradients.
- **Don't** style interactive cards with heavy drop shadows when they are in a resting state.
- **Don't** mix serif headings with sans-serif body text; headings are strictly Merriweather Sans, and body copy is Merriweather.
