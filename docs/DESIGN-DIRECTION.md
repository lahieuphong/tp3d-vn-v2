# Tân Phong — Interior experiences

## 1. Information architecture audit

The selected tp3d-vn-v2 workspace was empty. A read-only inspection of the neighboring tp3d-vn project found a services-led architecture: Home/About, Services, 3D Solutions, Projects, Blog, Careers, Contact. Interior Collection was an external project link; product/material detail relationships were absent. Existing global WebGL transitions do not suit the requested quiet editorial direction. The original project is preserved.

## 2. Proposed sitemap

- / — Inspiration and discovery
- /spaces — Living, Dining, Kitchen, Bedroom and Workspace
- /spaces/[slug] — Room introduction, related project, materials and furniture, entry to 3D
- /projects — Selected interior concepts
- /projects/[slug] — Project information, gallery, design concept, materials, furniture, related projects
- /collections — Contemporary, Japandi, Minimal, Modern and Classic
- /collections/[slug] — Interiors selected by style
- /experience/[slug] — On-demand Three.js room and selectable furniture/materials
- /products/[slug], /materials/[slug] — Detail information
- /journal, /journal/[slug] — Original design stories
- /about, /contact — Studio approach and contact information

Search indexes actual internal content. Site navigation is shallow and supports mobile.

## 3. Homepage hierarchy

Hero → Introduction → Explore Spaces → Selected Interiors → 3D Experience → Collections → Materials & Details → Furniture → Journal → Footer.
Keep homepage copy brief; all specifications and editorial articles live on detail pages. Collection previews use large images rather than small boxed cards.

## 4. Design system

Visual thesis: a quietly expressive architecture journal, with a cinematic interior photograph, generous ivory margins, fine rules, warm wood tones, and restrained serif typography.
Colors: ivory #f7f5f0, paper #eeece5, ink #292823, muted #69665d, wood #79644e. No glow, heavy shadows, glass effects or decorative gradients. Corners are square; rules are 1px. Motion uses brief opacity/scale changes and respects reduced-motion preferences.

## 5. Typography

Headings: a refined serif (Cormorant Garamond, Georgia fallback), regular/medium weight. Body/navigation: a neutral sans-serif (Manrope, Arial fallback). Main text 16–18px. Eyebrows 12–13px with uppercase tracking. Fluid hero approximately 52–100px, section headings 38–66px.

## 6. Spacing

Base increments 4, 8, 12, 16, 24, 32, 48, 64, 80, 120, 160px. Desktop section spacing 120px; tablet 96px; mobile 76px. Body line height 1.6. Touch targets at least 44px.

## 7. Grid

Maximum width 1480px with desktop 64px gutters. 12-column desktop grid, typically 7/5 or 8/4. Tablet uses 2 balanced columns where appropriate. Mobile uses one column and 22px gutters. Hero and feature images can be full bleed. No carousel dependency.

## 8. 3D architecture and content integrity

The user clarified that this is a new project and no old code should be reused. No source or assets were copied from neighboring projects. No actual 3D models are required in this phase.

The implemented architecture provides ExperienceShell, ExperienceUI, ThreeSceneLoader, LoadingScreen, SceneFallback, and a local chunk error boundary. The registry resolves a dynamically imported scene module only on the experience route. Three.js is not installed and no scene is loaded on the homepage. The future adapter includes cancellation, visibility pause, page lifecycle handling, selection events and disposal. Geometry/texture/renderer ownership belongs to the future scene factory.

Initial interiors and object specifications are explicitly concept studies. Reference photography is not claimed to reproduce actual scenes or commissioned projects. Real GLB assets and verified specifications can replace catalog entries without changing page layouts. Contact and social details remain forthcoming because none were provided.

Lifecycle references: https://threejs.org/manual/en/how-to-dispose-of-objects.html and https://threejs.org/manual/en/cleanup.html
