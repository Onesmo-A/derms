# DERMS Frontend — Responsiveness Fix Plan

## Tatizo Lililotambuliwa

Baada ya kukagua files zote za frontend, hivi ndivyo matatizo makuu:

### 1. Shell Layout (`routes.tsx` — `const Shell`) — **KUBWA SANA**
- `aside` ina `w-[320px]` bila breakpoint — kwenye mobile inachukua nafasi yote
- **Hakuna mobile menu / hamburger** — sidebar haionekani kwa phones
- `main` ina `p-6` tu — kwenye mobile padding ni kubwa mno
- `h-screen` kwenye sidebar inafanya scroll isiende vizuri

### 2. `app.css` — Responsive Utilities Hazipo
- Hakuna `scrollbar-hide` utility (inaitumika katika StudentsPage lakini haijafafanuliwa)
- Hakuna responsive table utilities
- Hakuna safe area padding kwa mobile devices

### 3. Pages — Tables na Grids
- Tables za data zinatumia `min-w-full` lakini hakuna `overflow-x-auto` wrapper vizuri
- Grids kama `grid-cols-4` hazibadiliki kwa mobile (zinapaswa kuwa `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`)
- Tab lists haziscroll vizuri kwenye mobile

### 4. Dashboard kwenye `routes.tsx`
- Stats cards: `grid-cols-4` fixed → zinavunjika kwenye mobile

---

## Mabadiliko Yaliyopendekezwa

### Component 1: `app.css` (MODIFY)
#### [MODIFY] [app.css](file:///c:/xampp/htdocs/DERMS/resources/css/app.css)
- Ongeza `scrollbar-hide` utility
- Ongeza responsive base styles
- Ongeza `.derms-table-wrap` — safe overflow container
- Ongeza `.derms-page` — page wrapper yenye responsive padding
- Ongeza `touch-action: pan-x pan-y` kwa smooth mobile scroll

### Component 2: `routes.tsx` — Shell Layout (MODIFY)
#### [MODIFY] [routes.tsx](file:///c:/xampp/htdocs/DERMS/resources/js/routes.tsx)
**Kubadilisha Shell layout kabisa:**
- Ongeza `sidebarOpen` state (default: false kwenye mobile, true kwenye desktop)
- Ongeza hamburger menu button kwenye mobile top bar
- Ongeza overlay (backdrop) kwa mobile sidebar
- Badilisha aside: `translate-x` based overlay kwenye mobile / fixed kwenye desktop
- Badilisha main: responsive padding `p-3 sm:p-4 md:p-6`
- Badilisha DashboardPage stats grid: `grid-cols-2 xl:grid-cols-4`

---

## Muundo Mpya wa Shell (Mobile vs Desktop)

```
Mobile (< 768px):
┌─────────────────────────────┐
│ [≡] DERMS    [User initials]│  ← TopBar (fixed)
├─────────────────────────────┤
│                             │
│    Main Content Area        │
│    (full width, p-3)        │
│                             │
└─────────────────────────────┘
   ↕ Sidebar slides in from left as overlay

Desktop (≥ 768px):
┌──────────┬──────────────────┐
│          │                  │
│ Sidebar  │   Main Content   │
│ (320px / │   (flex-1, p-6)  │
│  92px)   │                  │
└──────────┴──────────────────┘
```

---

## Verification Plan

### Automated
- `npm run build` — confirm no TS errors after changes

### Manual (vifaa vya kujaribu)
- Chrome DevTools → iPhone 375px → angalia sidebar, tabs, tables
- Chrome DevTools → iPad 768px → angalia grid layouts
- Chrome DevTools → 1280px desktop → hakikisha bado inafanya kazi

> [!IMPORTANT]
> Shell layout iko moja — inasaidia pages zote (Students, Schools, Regions, Districts, Exams, n.k.). Mabadiliko yake yatasaidia mfumo wote kwa wakati mmoja.
