# Beachwood Cafe Website Plan

## Goal

Create a complete five-page website that feels like entering a warm, design-conscious Beachwood Canyon café. The experience leads with atmosphere, builds appetite, then makes ordering, menu browsing, directions, calling, and reservations effortless.

## Verified content baseline

- Use the official name, address, and phone: Beachwood Cafe, 2695 N Beachwood Dr, Los Angeles, CA 90068, (323) 871-1717.
- Link **Order Online** to the café’s official `/order` destination and **Reserve a Table** to its active OpenTable page.
- Use the official menu as the source of truth. Keep prices out where the official site does not publish them.
- Present hours as editable content. The official location page omits Saturday in one line, while the official dinner menu and OpenTable indicate Friday–Sunday evening service; show the corroborated schedule and avoid implying Saturday is closed.
- Use official-site imagery from the café’s current media library, downloaded into the project rather than hotlinked. Each image will have accurate, descriptive alt text.
- Use the verified 2012 opening, modern American influences, locally sourced/organic ingredient philosophy, house-made approach, and Barbara Bestor design attribution. Avoid the independently unverified award claim.
- Do not publish a Google rating or review count because available sources conflict. Use only clearly attributed, verifiable review content or a tasteful “Read reviews” link if live facts cannot be verified.

## Visual direction

- Warm editorial California hospitality: ivory and natural stone surfaces, charcoal type, muted espresso, and a restrained earthy accent.
- High-contrast editorial serif for expressive headings paired with a neutral sans-serif for navigation and menu readability.
- Full-bleed atmospheric photography, asymmetric editorial compositions, generous whitespace, fine rules, restrained corners, and minimal shadow.
- Motion limited to gentle image reveals, subtle crops on hover, and quiet navigation transitions, with reduced-motion support.
- No tropical beach motifs, Hollywood clichés, glass effects, over-rounded cards, loud gradients, or stock-style imagery.

## Shared experience

- Build a refined sticky desktop header with Home, Menu, About, Gallery, Contact, plus visually prioritized ordering and secondary reservations.
- Build a purpose-designed mobile menu and a compact action bar for Order, Menu, Directions, Call, and Reserve without covering page content.
- Add a compact footer with navigation, actions, address, phone, current hours, and verified Instagram/Facebook links.
- Keep business details, menu sections, featured dishes, hours, and external links in centralized content objects so they are easy to update.

## Pages

### Home

1. Cinematic café-atmosphere opening with restrained headline, short supporting text, Order Online, View Menu, and subtle reservation access.
2. Concise Beachwood experience introduction centered on neighborhood, atmosphere, and modern American cooking.
3. Editorial food story featuring 4–6 verified dishes such as Lemon Ricotta Pancakes, Ricotta Avocado Toast, Huevos Rancheros, Chilaquiles, Breakfast Burrito, and Vegan Burrito, with availability-sensitive wording.
4. Scannable menu preview linking to the full menu.
5. Atmosphere sequence using authentic interior, food, coffee, and social imagery.
6. Authentic social proof without fabricated or stale dynamic metrics.
7. Visit section with address, phone, map, hours, parking guidance, directions, and call controls.
8. Understated closing invitation with Order Online strongest, Directions next, and Reservations secondary.

### Menu

- Create a phone-first menu browser with a sticky category selector and clear sections for Breakfast, Lunch, Dinner, Coffee/Tea/Drinks, Beer/Wine, and other categories present on the official menu.
- Use exact official item names and descriptions where verified; do not invent items, prices, ingredients, or dietary labels.
- Use selective imagery and strong typographic hierarchy rather than carding every item.
- Keep ordering access visible without interrupting scanning.

### About

- Tell a concise story covering the 2012 opening, Beachwood Canyon identity, food philosophy, cross-cultural modern American influences, and Barbara Bestor-designed space.
- Pair restrained copy with authentic interior and neighborhood imagery.

### Gallery

- Create an intentional editorial sequence rather than a generic masonry wall, balancing interiors, food, drinks, exterior, and human moments.
- Use stable aspect ratios and responsive crops for desktop and mobile.

### Contact

- Present address, phone, editable hours, official parking/access guidance, directions, map, ordering, and reservation links.
- Use a lightweight map embed or clear map link; avoid a heavy integration unless needed.

## SEO, accessibility, and performance

- Give every page unique title, description, Open Graph metadata, canonical URL, and one clear H1.
- Add Restaurant/LocalBusiness structured data with consistent name, address, phone, cuisine, hours, menu, ordering, reservation, and social links where verified.
- Write natural local copy around Beachwood Canyon, Hollywood Hills, brunch, breakfast, coffee, and the Hollywood Sign without keyword stuffing.
- Use semantic landmarks, keyboard-accessible navigation, visible focus states, sufficient contrast, descriptive image text, and reduced-motion behavior.
- Download and optimize official imagery, serve responsive sizes, lazy-load below-the-fold media, and keep animation and third-party scripts minimal.

## Validation

- Verify every navigation and external action link.
- Test menu browsing, mobile navigation, sticky actions, map/directions, call, ordering, and reservation flows.
- Review large desktop, tablet, large mobile, and small mobile layouts for text fit, image framing, overlap, and touch usability.
- Confirm each factual claim against its cited official source and remove anything unresolved rather than filling gaps.

## Technical details

- Use TanStack Start routes for `/`, `/menu`, `/about`, `/gallery`, and `/contact` with a shared site shell.
- Build reusable header, footer, action, menu category, food feature, gallery, review, hours, and location components.
- Define the complete semantic color and typography system in the global Tailwind v4 theme and load fonts through document-head links.
- Keep the site frontend-only; ordering and reservations remain honest external links with no fake checkout or booking availability.
