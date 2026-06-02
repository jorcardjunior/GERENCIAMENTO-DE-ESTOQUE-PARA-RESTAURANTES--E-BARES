I will modernize the app's UI to be more vibrant, responsive, and specifically tailored for restaurant inventory (Smart Eco Stock), removing any leftover gym-themed elements and adding high-quality visual polish.

### 1. Visual Refresh & Branding
- **Color Palette**: Shift from Cyan (Gym) to **Emerald/Forest Green** (Eco/Fresh) with vibrant highlights.
- **Background**: Add a subtle, high-quality dark gradient with "blob" glows or a vibrant restaurant-themed overlay with glassmorphism.
- **Logo**: Ensure "SMART ECO STOCK" is consistent and use a `Package` or `ChefHat` icon.
- **Glassmorphism**: Apply `backdrop-blur` and semi-transparent backgrounds to sidebars, cards, and mobile navigation for a "premium" feel.

### 2. Layout Unification & Mobile Optimization
- **Unified Layout**: Refactor `src/routes/app.tsx` to use a consistent layout component that handles both desktop sidebar and mobile navigation elegantly.
- **Responsive Navigation**: 
    - Desktop: Sleek sidebar with hover effects and glassmorphism.
    - Mobile: Modern bottom navigation with active state indicators and a clean header.
- **Grid Optimization**: Ensure the dashboard and inventory tables use responsive grid layouts that adapt perfectly from 4K monitors to small smartphone screens.

### 3. Dashboard Enhancements
- **Summary Cards**: Add vibrant gradients and more descriptive icons.
- **Vibrancy**: Use "vibrant" colors for status indicators (Critical = Red Glow, Low Stock = Amber Glow, Healthy = Emerald Glow).
- **Typography**: Use "Plus Jakarta Sans" (already in CSS) more prominently for a modern look.

### Technical Details
- Update `src/styles.css` with new Emerald theme variables.
- Rewrite `src/routes/app.tsx` to improve responsiveness and aesthetics.
- Enhance `src/features/dashboard/components/StockSummary.tsx` with glassmorphism and gradients.
- Ensure all components respect the `dark` theme but with more "vibrancy".

Does this direction align with the "modern and vibrant" look you are seeking?