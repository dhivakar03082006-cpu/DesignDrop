-- DesignDrop Complete Supabase PostgreSQL Schema, RLS Policies, and Seed Data

create extension if not exists "uuid-ossp";

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- 2. Categories
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

-- 3. Products
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete set null,
  slug text unique not null,
  name text not null,
  short_description text not null,
  base_price integer not null,
  material text not null,
  is_customizable boolean not null default true,
  product_type text not null default 'tshirt' check (product_type in ('tshirt', 'mug', 'hoodie', 'cap')),
  image_url text not null,
  rating numeric(2,1) not null default 4.8,
  review_count integer not null default 0,
  stock integer not null default 50,
  trending boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. Product Variants (Size and Color)
create table if not exists public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  color_name text not null,
  color_hex text not null,
  size text not null,
  stock integer not null default 25,
  price_delta integer not null default 0
);

-- 5. Designs (Saved 2D + 3D custom artwork)
create table if not exists public.designs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title text not null default 'My Custom Design',
  product_type text not null default 'tshirt',
  color_hex text not null default '#18181B',
  print_area text not null default 'front',
  canvas_json jsonb not null,
  preview_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Addresses
create table if not exists public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text not null,
  phone text not null,
  street text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- 7. Cart Items
create table if not exists public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  design_id uuid references public.designs(id) on delete set null,
  color_name text not null,
  color_hex text not null,
  size text not null,
  print_area text not null default 'front',
  quantity integer not null default 1 check (quantity > 0),
  unit_price integer not null,
  preview_url text,
  created_at timestamptz not null default now()
);

-- 8. Coupons
create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percent', 'flat')),
  discount_value integer not null,
  min_order integer not null default 0,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 9. Orders
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null,
  delivery_method text not null default 'standard',
  payment_method text not null check (payment_method in ('razorpay_test', 'cod')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  status text not null default 'Order Received',
  subtotal integer not null,
  gst_amount integer not null,
  shipping_fee integer not null,
  discount_amount integer not null default 0,
  total_amount integer not null,
  coupon_code text,
  cancel_reason text,
  return_reason text,
  created_at timestamptz not null default now()
);

-- 10. Order Items
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  color_name text not null,
  size text not null,
  print_area text not null,
  quantity integer not null,
  unit_price integer not null,
  design_preview_url text,
  canvas_json jsonb
);

-- 11. Order Tracking Timeline
create table if not exists public.order_tracking (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

-- 12. Payments
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  provider text not null,
  provider_payment_id text,
  amount integer not null,
  status text not null,
  created_at timestamptz not null default now()
);

-- 13. Reviews
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

-- 14. Wishlist
create table if not exists public.wishlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  unique (user_id, product_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.designs enable row level security;
alter table public.addresses enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_tracking enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;

-- Helper function for admin check
create or replace function public.is_admin() returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- Public Read Policies
create policy "Public read categories" on public.categories for select using (true);
create policy "Public read products" on public.products for select using (true);
create policy "Public read variants" on public.product_variants for select using (true);
create policy "Public read active coupons" on public.coupons for select using (active = true);
create policy "Public read reviews" on public.reviews for select using (true);

-- Admin Write Policies
create policy "Admin manage products" on public.products for all using (public.is_admin());
create policy "Admin manage variants" on public.product_variants for all using (public.is_admin());
create policy "Admin manage coupons" on public.coupons for all using (public.is_admin());
create policy "Admin manage orders" on public.orders for all using (public.is_admin());
create policy "Admin manage tracking" on public.order_tracking for all using (public.is_admin());

-- User Policies
create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own designs" on public.designs for all using (auth.uid() = user_id);
create policy "Users manage own addresses" on public.addresses for all using (auth.uid() = user_id);
create policy "Users manage own cart" on public.cart_items for all using (auth.uid() = user_id);
create policy "Users manage own wishlist" on public.wishlist for all using (auth.uid() = user_id);
create policy "Users read own orders" on public.orders for select using (auth.uid() = user_id or public.is_admin());
create policy "Anyone can place guest or user order" on public.orders for insert with check (true);
create policy "Public track order by order_number" on public.order_tracking for select using (true);
create policy "Authenticated users write reviews" on public.reviews for insert with check (auth.uid() is not null);

-- Seed 4 Categories
insert into public.categories (slug, name, description) values
  ('tshirts', 'T-Shirts', 'Soft 100% cotton tees ready for your front or back print.'),
  ('mugs', 'Mugs', 'Dishwasher-safe ceramic mugs with full wrap printing.'),
  ('hoodies', 'Hoodies', 'Warm fleece hoodies made for everyday wear.'),
  ('caps', 'Caps', 'Classic cotton caps with crisp front prints.')
on conflict (slug) do nothing;

-- Seed 5 Coupons
insert into public.coupons (code, discount_type, discount_value, min_order, description) values
  ('WELCOME10', 'percent', 10, 499, '10% off your first custom order'),
  ('SAVE150', 'flat', 150, 999, 'Save Rs 150 on orders over Rs 999'),
  ('MUGLOVE', 'flat', 100, 499, 'Save Rs 100 on custom photo mugs'),
  ('BUNDLE20', 'percent', 20, 1999, '20% off orders above Rs 1,999'),
  ('FREESHIP', 'flat', 79, 599, 'Free standard delivery on Rs 599+')
on conflict (code) do nothing;

-- Seed 28 Products
insert into public.products (slug, name, short_description, base_price, material, product_type, image_url, rating, review_count, stock, trending) values
  ('everyday-cotton-tee', 'Everyday Cotton T-Shirt', 'Soft 180 GSM combed cotton. Great for daily wear.', 599, '100% Cotton', 'tshirt', '/src/assets/images/product_tshirt_charcoal_1794922912702.jpg', 4.9, 142, 120, true),
  ('heavyweight-street-tee', 'Heavyweight Street T-Shirt', 'Thick 240 GSM cotton with a relaxed boxy fit.', 799, 'Heavy Cotton', 'tshirt', '/src/assets/images/product_tshirt_ivory_1794922911236.jpg', 4.8, 96, 85, true),
  ('classic-ceramic-mug', 'Classic Ceramic Mug (11 oz)', 'Glossy white ceramic mug. Safe for microwave and dishwasher.', 349, 'Ceramic', 'mug', '/src/assets/images/product_mug_ceramic_1794922913067.jpg', 4.9, 210, 200, true),
  ('matte-stone-mug', 'Matte Stoneware Mug (12 oz)', 'Smooth matte finish mug that holds heat longer.', 449, 'Stoneware Ceramic', 'mug', '/src/assets/images/product_mug_ceramic_1794922913067.jpg', 4.7, 64, 90, false),
  ('cozy-fleece-hoodie', 'Cozy Fleece Hoodie', 'Warm brushed cotton inside with a roomy front pocket.', 1299, 'Cotton Fleece', 'hoodie', '/src/assets/images/product_hoodie_violet_1794922912510.jpg', 4.9, 88, 60, true),
  ('organic-kids-tee', 'Soft Kids T-Shirt', 'Gentle organic cotton tee built for play and wash cycles.', 499, 'Organic Cotton', 'tshirt', '/src/assets/images/product_tshirt_ivory_1794922911236.jpg', 4.8, 53, 75, false),
  ('oversized-drop-tee', 'Oversized Drop-Shoulder Tee', 'Loose modern fit with extra room for big back prints.', 849, '220 GSM Cotton', 'tshirt', '/src/assets/images/product_tshirt_charcoal_1794922912702.jpg', 4.9, 118, 95, true),
  ('color-rim-mug', 'Two-Tone Handle Mug', 'White print wrap body with a bold colored handle and rim.', 399, 'Ceramic', 'mug', '/src/assets/images/product_mug_ceramic_1794922913067.jpg', 4.6, 41, 110, false),
  ('classic-cotton-cap', 'Classic 6-Panel Cap', 'Brushed cotton twill cap with an easy metal strap.', 449, 'Cotton Twill', 'cap', '/src/assets/images/product_cap_classic_1794922912661.jpg', 4.7, 37, 80, false),
  ('zip-up-studio-hoodie', 'Zip-Up Studio Hoodie', 'Easy full-zip hoodie for chilly mornings and travel.', 1449, 'Cotton Fleece', 'hoodie', '/src/assets/images/product_hoodie_violet_1794922912510.jpg', 4.8, 29, 45, false),
  ('sport-dry-tee', 'Breathable Active T-Shirt', 'Light sweat-wicking fabric for workouts and teams.', 649, 'Cotton Blend', 'tshirt', '/src/assets/images/product_tshirt_charcoal_1794922912702.jpg', 4.7, 48, 100, false),
  ('travel-giant-mug', 'Large Coffee Mug (15 oz)', 'Extra-large mug for big morning teas and coffees.', 499, 'Ceramic', 'mug', '/src/assets/images/product_mug_ceramic_1794922913067.jpg', 4.9, 77, 70, true),
  ('sage-pocket-tee', 'Sage Earth Pocket T-Shirt', 'Soft sage combed cotton with reinforced shoulder stitching.', 699, '100% Organic Cotton', 'tshirt', '/src/assets/images/product_tshirt_sage_1794924010265.jpg', 4.9, 64, 90, true),
  ('magic-heat-mug', 'Magic Heat-Reveal Mug', 'Starts sleek matte black and reveals your photo when hot tea or coffee is poured.', 549, 'Heat-Sensitive Ceramic', 'mug', '/src/assets/images/product_mug_magic_1794924008052.jpg', 4.9, 134, 85, true),
  ('sand-pullover-hoodie', 'Desert Sand Pullover Hoodie', 'Heavyweight 380 GSM fleece hoodie in warm sand tone.', 1399, '380 GSM Fleece', 'hoodie', '/src/assets/images/product_hoodie_sand_1794924009623.jpg', 4.8, 52, 55, true),
  ('navy-dad-cap', 'Navy Curved-Brim Cap', 'Low-profile curved cap with brass buckle strap.', 499, 'Washed Cotton Twill', 'cap', '/src/assets/images/product_cap_navy_1794924011470.jpg', 4.8, 43, 95, false),
  ('couple-matching-tees', 'Matching Duo T-Shirt Pack', 'Two soft cotton tees bundled together for couples or best friends.', 1099, '100% Cotton', 'tshirt', '/src/assets/images/product_tshirt_ivory_1794922911236.jpg', 4.9, 71, 60, false),
  ('studio-trucker-cap', 'Street Snapback Cap', 'Flat-brim structured cap with crisp front panel for bold logos.', 549, 'Structured Cotton', 'cap', '/src/assets/images/product_cap_classic_1794922912661.jpg', 4.7, 31, 65, false),
  ('pastel-gift-mug', 'Pastel Gift Box Ceramic Mug', 'Smooth satin-finish mug shipped inside a ready-to-gift box.', 479, 'Fine Ceramic', 'mug', '/src/assets/images/product_mug_ceramic_1794922913067.jpg', 4.8, 59, 100, false),
  ('cropped-studio-hoodie', 'Relaxed Studio Crew Hoodie', 'Soft double-lined hood with spacious kangaroo pocket.', 1349, 'Brushed Cotton Fleece', 'hoodie', '/src/assets/images/product_hoodie_violet_1794922912510.jpg', 4.8, 44, 50, false),
  ('royal-cobalt-heavyweight-tee', 'Royal Cobalt Heavyweight Tee', 'Vibrant 240 GSM combed cotton tee with twin-needle seams and rich cobalt dye.', 749, '240 GSM Combed Cotton', 'tshirt', '/src/assets/images/product_tshirt_cobalt_1795095304055.jpg', 4.9, 84, 110, true),
  ('obsidian-street-fleece-hoodie', 'Obsidian Street Fleece Hoodie', 'Ultra-plush 400 GSM charcoal fleece with double-lined hood and crisp print panel.', 1499, '400 GSM Heavy Fleece', 'hoodie', '/src/assets/images/product_hoodie_charcoal_1795095304992.jpg', 4.9, 73, 65, true),
  ('terracotta-artisan-matte-mug', 'Terracotta Artisan Matte Mug (12 oz)', 'Warm clay-toned matte stoneware mug with smooth satin finish for custom wraps.', 459, 'Matte Stoneware', 'mug', '/src/assets/images/product_mug_terracotta_1795095303365.jpg', 4.9, 68, 95, true),
  ('desert-sand-heritage-cap', 'Desert Sand Heritage Cap', 'Soft stone-washed desert sand twill cap with clean front print zone.', 479, 'Brushed Cotton Twill', 'cap', '/src/assets/images/product_cap_sand_1795095303847.jpg', 4.8, 54, 88, true),
  ('vintage-boxy-studio-tee', 'Vintage Wash Boxy Tee', 'Garment-dyed 250 GSM boxy silhouette with dropped shoulders.', 829, '250 GSM Heavy Cotton', 'tshirt', '/src/assets/images/product_tshirt_charcoal_1794922912702.jpg', 4.9, 61, 72, false),
  ('midnight-espresso-ceramic-mug', 'Midnight Espresso Ceramic Mug (11 oz)', 'Sleek glossy black ceramic mug that makes bright graphics pop.', 419, 'Glazed Ceramic', 'mug', '/src/assets/images/product_mug_magic_1794924008052.jpg', 4.8, 49, 115, false),
  ('electric-violet-oversized-hoodie', 'Electric Violet Oversized Hoodie', 'Signature studio-violet pullover hoodie with smooth DTG print chest.', 1549, '380 GSM Brushed Fleece', 'hoodie', '/src/assets/images/product_hoodie_violet_1794922912510.jpg', 4.9, 57, 48, false),
  ('minimalist-running-cotton-cap', 'Minimalist Everyday Studio Cap', 'Featherlight breathable 6-panel cap with curved brim and metal clasp.', 459, 'Breathable Cotton', 'cap', '/src/assets/images/product_cap_navy_1794924011470.jpg', 4.7, 38, 92, false)
on conflict (slug) do nothing;
