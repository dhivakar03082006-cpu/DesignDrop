# DesignDrop

DesignDrop is a custom T-shirt, mug, hoodie, and cap printing store with a live 3D product preview and an easy-to-use 2D Design Studio.

## Features
- **Live 3D Preview**: Rotate and zoom T-shirts, mugs, hoodies, and caps in 3D as you edit your artwork (with automatic 2D preview fallback if WebGL is unavailable and a Lite Mode toggle for slower phones).
- **2D Design Studio**: Upload photos, add custom text, pick stickers, reorder layers, undo/redo with clear labels, auto-save ("Saved ✓"), and get a guided first-time tour.
- **Simple, Everyday Language**: Friendly wording, helpful tooltips (?) for GST and delivery, clear prices with tax included, and English / Tamil / Hindi language support.
- **Guest Checkout & Billing**: 3-step checkout with Razorpay Test Mode or Cash on Delivery, plus instant PDF tax invoice downloads via jsPDF.
- **Live Order Tracking**: Real-time order updates pushed from the Admin Dashboard to customers without refreshing.
- **Admin Dashboard (`/admin`)**: Sales charts, order management, print-ready artwork PNG downloads, product CRUD, coupon management, and CSV exports.
- **Offline-Ready PWA**: Installable web app with offline notice and fallback page.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and optionally add your Supabase keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and Razorpay test key (`VITE_RAZORPAY_TEST_KEY`).
   - If you leave Supabase keys blank, DesignDrop runs seamlessly using its built-in Express backend (`server.ts`) and local persistent store (`data/store.json`).
3. Start the development server on port 3000:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Supabase Setup (Optional)
1. Create a new Supabase project.
2. Open the SQL Editor and run `supabase/schema.sql`. This creates all tables, Row Level Security (RLS) policies, and seeds 12 products, 4 categories, 5 coupons, and sample reviews.
3. Copy your project URL and anon key into `.env`.

## Deploying to Vercel
1. Connect your repository to Vercel.
2. Set the Framework Preset to **Vite** (`npm run build`, output `dist`), or deploy the full Express + Vite app on Node 20+.
3. Add any environment variables from `.env.example` in Project Settings.
4. Deploy!
