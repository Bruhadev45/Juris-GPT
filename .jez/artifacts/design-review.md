# Design Review: JurisGPT Landing Page
**Date**: 2026-04-24
**URL**: /Users/bruuu/Desktop/Juris-GPT/Juris-GPT/frontend/src/app/page.tsx

## Overall Impression

The landing page demonstrates **solid professional design foundations** with a cohesive teal color palette, consistent use of design tokens, and sophisticated animations via Framer Motion. However, it suffers from **animation overload**, **visual hierarchy issues**, and **several accessibility concerns** that diminish its professional appearance. The design feels like it's trying too hard to impress with effects rather than letting the content breathe.

---

## Findings

### High Severity

1. **Animation Overload — Distracting from Content**
   - **Location**: Entire page (FloatingOrb, FloatingLawIcon, HeroScalesAnimation, InteractiveDots)
   - **Issue**: 15+ floating law icons at 3-6% opacity, 3 floating gradient orbs, radiating circles, interactive dot canvas, parallax hero, shimmer buttons — all animating simultaneously. The cognitive load is high, and the primary CTA competes with visual noise.
   - **Fix**: Remove or significantly reduce background animations. Keep max 2-3 subtle ambient effects. Hero should have ONE focal animation (the video is sufficient).

2. **Hero Layout — Video Position is Wrong**
   - **Location**: Hero section (lines 611-748)
   - **Issue**: Video is on the LEFT, but text content (the value proposition) should be the dominant left element since Western users scan left-to-right. The video is also smaller than optimal for a hero visual.
   - **Fix**: Swap positions — text content LEFT (60%), video RIGHT (40%). Or center the text above a full-width demo video.

3. **Nav CTA Confusion — "Dashboard" vs "Login"**
   - **Location**: Navigation (lines 537-549)
   - **Issue**: Primary CTA says "Dashboard" but users who aren't logged in should see "Get Started" or "Sign Up". "Login" is hidden on mobile. The hierarchy is backwards.
   - **Fix**: Primary CTA = "Start Free" / "Get Started". Secondary = "Login". Dashboard link belongs INSIDE the dashboard, not on landing.

4. **Stats Section — "18hrs Avg. Research Time" is Confusing**
   - **Location**: Stats bar (lines 755-784)
   - **Issue**: "18hrs" looks like a negative metric (who wants 18 hours?). Without context like "Saved" or comparison baseline, this stat is meaningless or even harmful.
   - **Fix**: Reframe as "Save 18+ hrs/week" or "90% faster research" with clear benefit framing.

5. **Missing Focus States on Several Interactive Elements**
   - **Location**: Navigation buttons, mobile menu buttons, back-to-top button
   - **Issue**: Using `motion.button` without explicit focus ring styling. Keyboard users cannot see current focus.
   - **Fix**: Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to all buttons.

### Medium Severity

6. **Typography Scale — Inconsistent Header Sizes**
   - **Location**: Section headers throughout
   - **Issue**: h2 headings use `text-3xl md:text-5xl` but FAQ section h2 is styled identically to other sections despite being less important. "Questions" as an h2 title is too generic.
   - **Fix**: FAQ should use `text-2xl md:text-4xl`. Title should be "Frequently Asked Questions" for clarity.

7. **Bento Grid Gap Inconsistency**
   - **Location**: Services section (lines 808-959)
   - **Issue**: Grid uses `gap-4` (16px) for card spacing, but cards have `p-7 md:p-8` internal padding. The internal padding is larger than external gaps, making cards feel disconnected from each other.
   - **Fix**: Increase gap to `gap-6` (24px) to match card padding proportion.

8. **Card Hover State — Learn More Text Appears on Hover Only**
   - **Location**: Service cards (lines 837-839)
   - **Issue**: "Learn more →" is `opacity-0` by default and only appears on hover. Screen readers announce this text even when invisible. Mobile users never see it.
   - **Fix**: Show "Learn more →" by default at reduced opacity (0.6) and brighten on hover. This also provides affordance that cards are clickable.

9. **Testimonial Section — All 5-Star Ratings Look Fake**
   - **Location**: Testimonials (lines 1120-1174)
   - **Issue**: Every testimonial has a perfect 5-star rating. This reduces credibility.
   - **Fix**: Mix of 4.5 and 5 stars, or remove stars entirely and let quotes speak for themselves.

10. **ShiningBorderCard — Excessive DOM Layers**
    - **Location**: ShiningBorderCard component (lines 374-439)
    - **Issue**: Each card renders 5+ absolutely-positioned divs for the border effect. With 5 cards, that's 25+ extra DOM elements for a subtle visual effect.
    - **Fix**: Simplify to a single `:before` pseudo-element with CSS gradient, or use CSS `box-shadow` transition.

11. **Footer Links — "#" href for Legal Pages**
    - **Location**: Footer (lines 1369-1375)
    - **Issue**: Privacy Policy, Terms of Service, Trust Portal all link to "#". This is broken UX and looks unprofessional.
    - **Fix**: Either create the pages or remove the links entirely until they exist.

12. **Line Length on Hero Paragraph**
    - **Location**: Hero text (lines 710-719)
    - **Issue**: `max-w-xl` allows ~80 characters per line on desktop, slightly above optimal 75 characters.
    - **Fix**: Change to `max-w-lg` (448px) for better readability.

### Low Severity

13. **Floating Badge Position Shift on Mobile**
    - **Location**: Hero video badge (lines 645-655)
    - **Issue**: Badge uses `-bottom-4 -right-4` on mobile but `md:bottom-4 md:right-4`. This creates a jarring position jump at the breakpoint.
    - **Fix**: Use consistent positioning with responsive offset, e.g., `-bottom-3 -right-3 md:-bottom-4 md:-right-4`.

14. **Scroll Progress Bar — 2px Too Subtle**
    - **Location**: Scroll progress bar (lines 482-486)
    - **Issue**: `h-[2px]` is barely visible, especially on high-DPI displays.
    - **Fix**: Increase to `h-1` (4px) for better visibility.

15. **Back to Top Button — Appears Too Early**
    - **Location**: Back to top button (line 465)
    - **Issue**: Shows at `scrollY > 400` which is roughly after the hero. Users rarely need back-to-top that early.
    - **Fix**: Trigger at 800-1000px or when past 50% of page.

16. **Icon Animation on Icon Containers**
    - **Location**: Service card icons (lines 825-830)
    - **Issue**: `whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}` creates a "wiggle" that feels playful rather than professional for a legal services platform.
    - **Fix**: Use subtle scale (1.05) only, or a gentle color shift.

17. **Hardcoded Background Color in Nav**
    - **Location**: Navigation (line 508)
    - **Issue**: `rgba(245, 247, 249, ${navBg})` uses hardcoded hex instead of CSS variable.
    - **Fix**: Use `hsl(var(--background) / ${navBg})` for consistency with theme.

---

## What Looks Good

1. **Color Palette** — Deep teal (#004E64) is excellent for legal/trust. Consistent use of CSS custom properties throughout.

2. **Semantic HTML Structure** — Proper use of `<section>`, `<nav>`, `<footer>`, `<main>`, heading hierarchy.

3. **Type Scale** — Good use of responsive typography with `md:` breakpoints. Inter font is a solid choice.

4. **ShiningBorderCard Effect** — When viewed in isolation, the mouse-follow shine effect is impressive and unique.

5. **FAQ Accordion** — Clean implementation with proper ARIA from Radix UI.

6. **Trust Badges in Footer** — Bar Council Verified, DPDPA Compliant, Indian Data Residency — well-placed for credibility.

7. **Dark Mode Variables** — Complete dark mode token set is defined and ready.

8. **Video Integration** — Using video for hero is smart — shows product in action.

---

## Top 3 Fixes

### 1. Simplify Animations (High Impact)
Remove `FloatingOrb`, `LegalGridBackground`, `HeroScalesAnimation`, and reduce `InteractiveDots` opacity to 3-4%. Let the video and content be the focus. A legal platform should feel calm and authoritative, not like a tech startup trying to look futuristic.

**Before**: 20+ animated elements competing for attention
**After**: Hero video + subtle interactive dots only

### 2. Fix Hero Layout and CTA Hierarchy
- Swap video and text positions (text left, video right)
- Change nav CTA from "Dashboard" to "Start Free"
- Reframe "18hrs" stat as "Save 18+ hrs"
- Add clear "Login" link that doesn't disappear on mobile

### 3. Add Focus States and Fix Accessibility
- Add `focus-visible:` ring to all interactive elements
- Show "Learn more" on cards by default (not hover-only)
- Fix `#` hrefs in footer
- Ensure proper color contrast on hover states

---

## Design Token Summary

The page correctly uses design tokens from `globals.css`:
- `--primary: #004E64` (Deep Teal)
- `--foreground: #0A2A36` (Near Black)
- `--muted-foreground: #4A6E7D` (Gray-Teal)
- `--border: #C8D1D9` (Light Gray)
- `--background: #F5F7F9` (Off-White)

**Verdict**: Token usage is consistent. The core design system is solid; execution needs refinement.
