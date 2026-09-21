-- ==============================================================================
-- HEALTH IS WEALTH - SUPABASE POSTGRESQL DATABASE SCHEMA & SEED DATA
-- ==============================================================================
-- Run this complete script in the Supabase SQL Editor:
-- 1. Log in to your Supabase project dashboard (https://supabase.com/dashboard)
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run"
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT NOT NULL,
    price_num NUMERIC NOT NULL DEFAULT 0,
    old_price TEXT,
    discount TEXT,
    tag TEXT,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    benefits JSONB DEFAULT '[]'::jsonb,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for lightning fast category filtering, searches, and sorting
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_price_num ON public.products(price_num);

-- ------------------------------------------------------------------------------
-- 3. STORE CONFIGURATION & ANNOUNCEMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    store_name TEXT NOT NULL DEFAULT 'Health is Wealth',
    whatsapp_number TEXT NOT NULL DEFAULT '2348084765252',
    phone_display TEXT NOT NULL DEFAULT '08084765252',
    bank_name TEXT DEFAULT 'Sterling Bank',
    bank_account TEXT DEFAULT '0097137583',
    account_name TEXT DEFAULT 'Ezema Emmanuel Tochukwu',
    currency_symbol TEXT DEFAULT '₦',
    location TEXT DEFAULT 'Enugu, Abuja & Lagos, Nigeria (Nationwide Delivery)',
    facebook_url TEXT DEFAULT 'https://www.facebook.com/profile.php?id=61550049644320',
    instagram_url TEXT DEFAULT 'https://www.instagram.com/healthis440?stkn=MW4xMDM0a3cwdmwwOA==',
    marquee_text TEXT DEFAULT 'HEALTH IS WEALTH • OUR STORES ARE LOCATED IN ENUGU, ABUJA AND LAGOS • WE DELIVER NATIONWIDE • QUALITY HEALTH, BEAUTY & WELLNESS PRODUCTS • DIRECT FAST WHATSAPP ORDERING: 08084765252',
    products_per_page INTEGER DEFAULT 8,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. CUSTOMER ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    order_ref TEXT UNIQUE NOT NULL DEFAULT ('HW-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
    customer_name TEXT,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_address TEXT,
    state_city TEXT DEFAULT 'Lagos State',
    notes TEXT,
    payment_method TEXT DEFAULT 'Bank Transfer',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    delivery_fee NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'dispatched', 'completed', 'cancelled'
    whatsapp_link TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);

-- ------------------------------------------------------------------------------
-- 5. AUTOMATIC TIMESTAMP TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_store_config_updated_at ON public.store_config;
CREATE TRIGGER trg_store_config_updated_at
BEFORE UPDATE ON public.store_config
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 6A. Categories: Public can read, anyone can manage
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow management of categories" ON public.categories;
CREATE POLICY "Allow management of categories" ON public.categories
    FOR ALL USING (true) WITH CHECK (true);

-- 6B. Products: Public can view, anyone with anon or auth can manage
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow management of products" ON public.products;
CREATE POLICY "Allow management of products" ON public.products
    FOR ALL USING (true) WITH CHECK (true);

-- 6C. Store Config: Public can view, anyone can manage
DROP POLICY IF EXISTS "Public can view store config" ON public.store_config;
CREATE POLICY "Public can view store config" ON public.store_config
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow management of store config" ON public.store_config;
CREATE POLICY "Allow management of store config" ON public.store_config
    FOR ALL USING (true) WITH CHECK (true);

-- 6D. Orders: Public can insert customer orders, anyone can view
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow viewing of orders" ON public.orders;
CREATE POLICY "Allow viewing of orders" ON public.orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow management of orders" ON public.orders;
CREATE POLICY "Allow management of orders" ON public.orders
    FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. ENABLE REALTIME SYNC ON TABLES
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'store_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_config;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Continue safely if realtime publication is not configured
END $$;

-- ------------------------------------------------------------------------------
-- 8. INITIAL SEED DATA: 6 CURATED CATEGORIES
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, display_order)
VALUES
    ('Health', 'health', 1),
    ('Beauty', 'beauty', 2),
    ('Skincare', 'skincare', 3),
    ('Hair Care', 'hair-care', 4),
    ('Wellness', 'wellness', 5),
    ('Personal Care', 'personal-care', 6)
ON CONFLICT (name) DO UPDATE 
SET display_order = EXCLUDED.display_order;

-- ------------------------------------------------------------------------------
-- 9. INITIAL SEED DATA: STORE CONFIGURATION
-- ------------------------------------------------------------------------------
INSERT INTO public.store_config (
    id,
    store_name,
    whatsapp_number,
    phone_display,
    bank_name,
    bank_account,
    account_name,
    currency_symbol,
    location,
    facebook_url,
    instagram_url,
    marquee_text,
    products_per_page
) VALUES (
    'default',
    'Health is Wealth',
    '2348084765252',
    '08084765252',
    'Sterling Bank',
    '0097137583',
    'Ezema Emmanuel Tochukwu',
    '₦',
    'Enugu, Abuja & Lagos, Nigeria (Nationwide Delivery)',
    'https://www.facebook.com/profile.php?id=61550049644320',
    'https://www.instagram.com/healthis440?stkn=MW4xMDM0a3cwdmwwOA==',
    'HEALTH IS WEALTH • OUR STORES ARE LOCATED IN ENUGU, ABUJA AND LAGOS • WE DELIVER NATIONWIDE • QUALITY HEALTH, BEAUTY & WELLNESS PRODUCTS • DIRECT FAST WHATSAPP ORDERING: 08084765252',
    8
)
ON CONFLICT (id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    whatsapp_number = EXCLUDED.whatsapp_number,
    phone_display = EXCLUDED.phone_display,
    bank_name = EXCLUDED.bank_name,
    bank_account = EXCLUDED.bank_account,
    account_name = EXCLUDED.account_name,
    currency_symbol = EXCLUDED.currency_symbol,
    location = EXCLUDED.location,
    marquee_text = EXCLUDED.marquee_text;

-- ------------------------------------------------------------------------------
-- 10. INITIAL SEED DATA: 27 CURATED BOTANICAL PRODUCTS
-- ------------------------------------------------------------------------------
INSERT INTO public.products (
    id, name, category, price, price_num, old_price, discount, tag, in_stock, image, description, full_description, benefits, featured
) VALUES
(
    1,
    'Herbal Vitality & Immune Boost Tonic',
    'Health',
    '₦14,500',
    14500,
    '₦18,000',
    '19% off',
    'Bestseller',
    true,
    'https://i.ibb.co/fzC47YSs/IMG-20251123-WA0004-1.jpg',
    'Concentrated herbal formulation combining potent natural roots, ginger, and garlic extracts to fortify body immunity and vitality.',
    'A time-honored traditional herbal elixir brewed from wild-harvested roots and antioxidant-rich botanical extracts. Designed to stimulate cellular resilience, enhance daily stamina, and provide natural defense against everyday fatigue and sickness.',
    '["Naturally strengthens white blood cell defense", "Boosts daily physical stamina and mental alertness", "Contains pure wild roots, ginger, and botanical extracts", "No artificial preservatives or added sugars"]'::jsonb,
    true
),
(
    2,
    'Pure Golden Glow Herbal Body Milk',
    'Beauty',
    '₦19,500',
    19500,
    '₦24,000',
    '19% off',
    'Popular',
    true,
    'https://i.ibb.co/7tS64CcB/IMG-20260403-WA0004-1.jpg',
    'Luxurious brightening body lotion enriched with carrot oil, glutathione, and vitamin C for intense hydration and even complexion.',
    'A velvety, ultra-hydrating body milk formulated with organic carrot oil, alpha arbutin, and botanical fruit acids. Delivers deep moisture while progressively fading dark knuckles, sunspots, and hyperpigmentation without peeling.',
    '["Illuminates complexion and evens discoloration", "Intensely hydrates and softens dry skin patches", "Enriched with organic carrot seed and vitamin C", "Non-greasy, fast-absorbing luxury texture"]'::jsonb,
    true
),
(
    3,
    'Radiant Melanin Herbal Facial Serum',
    'Skincare',
    '₦16,000',
    16000,
    '₦20,000',
    '20% off',
    'Trending',
    true,
    'https://i.ibb.co/YK3c6Z7/1757054880205-1.jpg',
    'Targeted botanical corrective serum designed to clear stubborn acne marks, minimize pores, and restore smooth facial glow.',
    'High-potency skin repair serum infused with niacinamide, tea tree oil, and licorice root extract. Penetrates deep into the dermal layers to regulate excess sebum, calm redness, and diminish lingering post-acne blemishes.',
    '["Clears dark spots, sunburn, and hyperpigmentation", "Tightens enlarged pores and refines skin texture", "Soothes inflamed breakouts and redness", "Gentle and effective for all sensitive skin types"]'::jsonb,
    true
),
(
    4,
    'Chebe & Batana Oil Scalp Revival Drops',
    'Hair Care',
    '₦13,500',
    13500,
    '₦17,000',
    '21% off',
    'Staff Pick',
    true,
    'https://i.ibb.co/4w9h35rX/1759235952530-1.jpg',
    'Traditional Chadian chebe powder infused with pure batana oil to stimulate follicles, reverse thinning edges, and stop hair shedding.',
    'Engineered for 4C and textured hair restoration, this nutrient-dense scalp oil fuses authentic Chadian chebe powder, pure Honduran batana oil, and peppermint essence to awaken dormant follicles and retain hair length.',
    '["Stimulates dormant follicles along hairline and edges", "Significantly reduces breakage and strand thinning", "Deeply conditions dry scalp and prevents dandruff", "100% natural, chemical-free formulation"]'::jsonb,
    false
),
(
    5,
    'Digestive Cleanse & Flat Tummy Herbal Tea',
    'Wellness',
    '₦11,000',
    11000,
    '₦14,000',
    '21% off',
    'Hot Deal',
    true,
    'https://i.ibb.co/v61Rm5Cc/1760422949306-1.jpg',
    'All-natural detoxifying tea blend that relieves stubborn water retention, eases abdominal bloating, and cleanses the digestive tract.',
    'A soothing bedtime herbal infusion of senna leaves, peppermint, moringa, and ginger. Promotes healthy intestinal motility, aids waistline trimming, and flushes environmental toxins gently without harsh cramping.',
    '["Flushes out digestive toxins and eliminates bloat", "Promotes a flatter tummy and light feeling", "Calms stomach acidity and supports gut health", "Pleasant refreshing herbal mint aroma"]'::jsonb,
    true
),
(
    6,
    'Organic African Black Soap Clarifying Wash',
    'Personal Care',
    '₦8,500',
    8500,
    '₦11,000',
    '23% off',
    'Organic',
    true,
    'https://i.ibb.co/7JJRJCnj/1760100522140-1.jpg',
    'Authentic raw African black soap enriched with pure honey, aloe vera gel, and camwood to deep-cleanse and clear body blemishes.',
    'Handcrafted according to ancestral traditions with cocoa pod ash, unrefined palm kernel oil, and raw shea butter. Infused with wild blossom honey to provide antiseptic cleansing without stripping skins natural moisture barrier.',
    '["Treats body acne, eczema, and skin rashes", "Balances natural skin oils without dryness", "Gentle enough for daily face and body bathing", "Contains genuine cocoa ash and wild honey"]'::jsonb,
    false
),
(
    7,
    'Natural Blood Cleanser & Detox Extract',
    'Health',
    '₦17,500',
    17500,
    '₦22,000',
    '20% off',
    'Bestseller',
    true,
    'https://i.ibb.co/Jjr4QLwV/1760422983848-1.jpg',
    'Deep cellular blood purifying tonic designed to filter bloodstream impurities, regulate internal heat, and clear chronic skin boils.',
    'A concentrated blend of bitter leaf, neem, turmeric, and sarsaparilla root. Acts as a systemic detoxifier that flushes heavy toxins from the blood, supports kidney function, and eliminates internal toxins responsible for recurring rashes.',
    '["Purifies blood and clears stubborn skin boils", "Supports liver and kidney filtration pathways", "Regulates internal body heat and sluggishness", "Formulated from medicinal grade African herbs"]'::jsonb,
    true
),
(
    8,
    'Kojic & Turmeric Flawless Skin Brightening Cream',
    'Skincare',
    '₦18,000',
    18000,
    '₦22,500',
    '20% off',
    'Top Rated',
    true,
    'https://i.ibb.co/vvVb1jMB/IMG-20251022-WA0004-1.jpg',
    'Powerful anti-blemish cream that combines fermented kojic acid with raw turmeric to target dark patches, hyperpigmentation, and sun damage.',
    'A targeted nighttime treatment cream formulated to fade melasma, stubborn dark neck lines, and discoloration. Turmeric provides anti-inflammatory calming while kojic acid gently regulates melanin production.',
    '["Visibly fades dark marks and age spots within weeks", "Neutralizes free-radical damage with raw turmeric", "Restores even texture and radiant luminous tone", "Safe and non-bleaching plant-derived actives"]'::jsonb,
    true
),
(
    9,
    'Rosewater & Aloe Vera Soothing Face Mist',
    'Beauty',
    '₦9,500',
    9500,
    '₦12,500',
    '24% off',
    'New',
    true,
    'https://i.ibb.co/TBv6Rtf5/IMG-20251021-WA0012-1.jpg',
    'Refreshing botanical facial mist with pure Damask rose floral water, aloe vera, and witch hazel for instant skin hydration.',
    'An invigorating splash of hydration that balances skin pH after cleansing, sets makeup flawlessly, and cools stressed or sun-exposed skin throughout hot days.',
    '["Instantly revives fatigued, dehydrated skin", "Restores optimal 5.5 skin pH balance", "Soothes sun irritation and inflammation", "Leaves skin dewy, refreshed, and calm"]'::jsonb,
    false
),
(
    10,
    'Botanical Hair Growth & Edge Control Pomade',
    'Hair Care',
    '₦12,000',
    12000,
    '₦15,000',
    '20% off',
    'Trending',
    true,
    'https://i.ibb.co/23YwdBqN/1757532039113-1.jpg',
    '2-in-1 styling and nourishing herbal pomade that lays unruly edges while infusing castor oil and biotin to encourage thicker hair growth.',
    'Enriched with Jamaican black castor oil, beeswax, biotin, and rosemary extract. Delivers all-day flexible hold without flaking or hardening, while sealing moisture into fragile hair shafts.',
    '["Firm, flake-free hold for sleek styling and baby hairs", "Feeds edge follicles with pure biotin and castor oil", "Prevents breakage caused by tight braiding or wigs", "Leaves a healthy, glossy non-greasy sheen"]'::jsonb,
    false
),
(
    11,
    'Moringa & Spirulina Superfood Energy Blend',
    'Wellness',
    '₦15,500',
    15500,
    '₦19,000',
    '18% off',
    'Popular',
    true,
    'https://i.ibb.co/Ft9xjTz/IMG-20251006-WA0000-1.jpg',
    'Organic nutrient-packed green superfood powder loaded with essential vitamins, plant iron, and chlorophyll for sustained vitality.',
    'Combines freeze-dried organic moringa oleifera and spirulina microalgae to deliver over 90 bioavailable nutrients. Elevates hemoglobin levels, combats midday exhaustion, and supports radiant skin from the inside out.',
    '["Natural bioavailable iron and protein booster", "Combats fatigue without caffeine crashes", "Detoxifies cells with high chlorophyll content", "Easily mixes into water, smoothies, or warm oats"]'::jsonb,
    true
),
(
    12,
    'Pure Whipped Shea & Cocoa Moisture Butter',
    'Personal Care',
    '₦10,500',
    10500,
    '₦13,500',
    '22% off',
    'Organic',
    true,
    'https://i.ibb.co/mVd6bw5z/IMG-20260811-WA0021-1.jpg',
    'Fluffy whipped unrefined shea and cocoa butter scented with vanilla beans to intensely moisturize dry skin, stretch marks, and eczema.',
    'Whipped to an airy, velvety cloud consistency using wild-harvested Northern Nigerian shea butter and raw cocoa butter. Melts upon contact with warm skin to lock in 48-hour moisture and soften tough heels and elbows.',
    '["Fades stretch marks and dry cracked skin", "Provides rich 48-hour continuous hydration", "Infused with antioxidant vitamin E and cocoa", "No artificial fragrances, gentle for babies and moms"]'::jsonb,
    false
),
(
    13,
    'Anti-Inflammatory Turmeric & Ginger Elixir',
    'Health',
    '₦16,500',
    16500,
    '₦21,000',
    '21% off',
    'Bestseller',
    true,
    'https://i.ibb.co/rPpmhjr/IMG-20260425-WA0012-1.jpg',
    'Potent liquid herbal compound formulated to ease stiff joints, relieve chronic body aches, and support healthy cardiovascular flow.',
    'Cold-extracted organic turmeric root, aged ginger, black pepper extract (piperine), and cloves. Proven to reduce systemic inflammation, ease waist and knee discomfort, and enhance vascular circulation.',
    '["Relieves knee, joint, and waist stiffness", "High curcumin absorption activated by black pepper", "Promotes cardiovascular wellness and normal blood flow", "Natural remedy for post-workout muscle soreness"]'::jsonb,
    true
),
(
    14,
    'Collagen Glow & Skin Firming Complex',
    'Beauty',
    '₦24,000',
    24000,
    '₦29,500',
    '19% off',
    'Top Rated',
    true,
    'https://i.ibb.co/d08xsF50/IMG-20260430-WA0004-1.jpg',
    'Premium marine collagen peptides combined with hyaluronic acid and vitamin C for youthful elasticity, supple skin, and strong nails.',
    'Hydrolyzed low-molecular marine collagen designed for rapid absorption. Stimulates natural collagen synthesis, smooths fine expression lines, plumps dehydrated skin, and strengthens brittle nails and hair shafts.',
    '["Smooths wrinkles and boosts skin elasticity", "Reinforces fragile fingernails and stops hair breakage", "Hyaluronic acid plumps moisture into skin cells", "Noticeable improvement in skin bounce in 30 days"]'::jsonb,
    true
),
(
    15,
    'Exfoliating Herbal Body Scrub & Polish',
    'Skincare',
    '₦13,000',
    13000,
    '₦16,500',
    '21% off',
    'Staff Pick',
    true,
    'https://i.ibb.co/9mwgTDqH/IMG-20260522-WA0037-1-1.jpg',
    'Natural brown sugar and botanical coffee bean scrub to buff away dead skin cells, smooth strawberry legs, and illuminate complexion.',
    'Formulated with fine cane sugar, ground robusta coffee beans, sweet almond oil, and eucalyptus. Gently sloughs off dull surface cells, unblocks ingrown hairs, and leaves skin baby-soft and luminous.',
    '["Buffs away dead skin cells and strawberry skin bumps", "Stimulates microcirculation to reduce cellulite appearance", "Infused with nourishing natural almond oil", "Reveals radiant, ultra-soft new skin immediately"]'::jsonb,
    false
),
(
    16,
    'Organic Rosemary & Mint Root Strengthening Oil',
    'Hair Care',
    '₦11,500',
    11500,
    '₦14,500',
    '21% off',
    'Popular',
    true,
    'https://i.ibb.co/tPpNSHDs/IMG-20260522-WA0049-1.jpg',
    'Cooling scalp therapy oil infused with pure rosemary essential oil and peppermint to promote blood flow and density.',
    'A clinical-strength herbal scalp oil that harnesses rosemary natural ability to block DHT at the follicle level. Cools itchy scalp, strengthens hair anchors, and fosters lush, full-bodied hair growth.',
    '["Natural DHT-blocker that encourages rapid hair density", "Provides tingling, cooling relief to dry or itchy scalp", "Nourishes hair shaft from root to tip", "Suitable for protective styles, locs, and natural hair"]'::jsonb,
    true
),
(
    17,
    'Herbal Sleep & Anxiety Calming Infusion',
    'Wellness',
    '₦12,500',
    12500,
    '₦16,000',
    '22% off',
    'Trending',
    true,
    'https://i.ibb.co/21DrjCXL/IMG-20260718-WA0001-1.jpg',
    'Tranquil herbal blend of chamomile flowers, valerian root, and lavender to relieve daily stress and encourage deep restorative sleep.',
    'Formulated to quiet restless racing thoughts and ease muscular tension before bedtime. Promotes REM sleep cycles without next-morning grogginess or chemical dependency.',
    '["Promotes rapid transition into peaceful deep sleep", "Lowers elevated evening cortisol and stress levels", "Non-habit-forming, 100% organic herbal leaves", "Delicious soothing aroma with natural floral notes"]'::jsonb,
    false
),
(
    18,
    'Herbal Feminine Wash & pH Restoring Foam',
    'Personal Care',
    '₦9,000',
    9000,
    '₦11,500',
    '22% off',
    'New',
    true,
    'https://i.ibb.co/mCYQJpTH/IMG-20260522-WA0051-1-1.jpg',
    'Gentle intimate hygiene foam formulated with lactic acid, apple cider vinegar, and chamomile to maintain natural feminine flora.',
    'A plant-powered foaming cleanser formulated at an optimal pH of 3.8 to 4.2. Guards against odor-causing bacteria, prevents itching, and maintains lasting daily freshness without synthetic fragrance.',
    '["Maintains optimal 4.0 physiological intimate pH", "Prevents recurring itching, dryness, and odor", "Gynecologist-approved gentle herbal formula", "Free from sulfates, parabens, and harsh chemicals"]'::jsonb,
    false
),
(
    19,
    'Bitter Leaf & Neem Total Body Purifier',
    'Health',
    '₦15,000',
    15000,
    '₦19,000',
    '21% off',
    'Bestseller',
    true,
    'https://i.ibb.co/fVbNWqjp/IMG-20260531-WA0009-1.jpg',
    'Traditional African bitter herbs extract renowned for regulating blood sugar, clearing skin impurities, and supporting pancreas function.',
    'Cold-processed bitter leaf (Vernonia amygdalina) and neem extract known for their potent antiviral, antibacterial, and metabolic balancing properties. Helps regulate blood glucose and clear systemic bacterial overgrowth.',
    '["Assists in maintaining balanced blood glucose levels", "Powerful internal antimicrobial and antifungal defense", "Flushes stubborn bile and fatty deposits from the liver", "100% wild-crafted raw medicinal botanical extract"]'::jsonb,
    true
),
(
    20,
    'Vitamin C Brightening Antioxidant Face Cream',
    'Beauty',
    '₦17,000',
    17000,
    '₦21,500',
    '21% off',
    'Hot Deal',
    true,
    'https://i.ibb.co/4gD3jR13/IMG-20260522-WA0057-1-1.jpg',
    'Lightweight daytime facial moisturizer packed with stabilized vitamin C and ferulic acid to shield skin from UV damage and brighten tone.',
    'Formulated to reverse dull, tired skin caused by sun exposure and city pollution. Boosts skins innate radiance, provides all-day moisture without heaviness, and creates a silky smooth base for makeup.',
    '["Shields skin against oxidative stress and photo-aging", "Evens out blotchy tone and lightens sunspots", "Provides lightweight, breathable moisture", "Leaves complexion glowing, energized, and smooth"]'::jsonb,
    true
),
(
    21,
    'Herbal Dark Spot Corrector & Acne Eraser',
    'Skincare',
    '₦14,000',
    14000,
    '₦18,000',
    '22% off',
    'Top Rated',
    true,
    'https://i.ibb.co/fGtZT26v/IMG-20260522-WA0063-1.jpg',
    'Intense spot-treating gel infused with salicylic acid, tea tree oil, and clove to dry up active pimples and prevent dark scars.',
    'An emergency spot clarifier that shrinks painful cystic pimples overnight. Unclogs congested sebum plugs, calms throbbing inflammation, and prevents post-inflammatory dark scarring.',
    '["Visibly flattens angry breakouts within 24 to 48 hours", "Inhibits acne-causing bacteria deep inside pores", "Prevents dark hyperpigmentation marks from forming", "Precision roller/dropper applicator for targeted care"]'::jsonb,
    false
),
(
    22,
    'Deep Conditioning Herbal Hair Mask',
    'Hair Care',
    '₦16,500',
    16500,
    '₦20,500',
    '20% off',
    'Staff Pick',
    true,
    'https://i.ibb.co/qLhkTbDw/IMG-20260522-WA0066-1.jpg',
    'Restorative deep conditioner infused with avocado oil, hydrolyzed wheat protein, and aloe vera to heal brittle, chemically processed hair.',
    'A moisture-penetrating treatment for heat-damaged, color-treated, or bleached hair. Rebuilds damaged keratin bonds, improves hair elasticity, and provides instant slip for easy, pain-free detangling.',
    '["Reconstructs damaged keratin bonds and split ends", "Provides phenomenal slip for easy finger-detangling", "Intensely restores moisture to crunchy, brittle curls", "Shields strands from humidity and frizz"]'::jsonb,
    false
),
(
    23,
    'Daily Stress Relief & Hormonal Balance Elixir',
    'Wellness',
    '₦21,000',
    21000,
    '₦26,000',
    '19% off',
    'Popular',
    true,
    'https://i.ibb.co/PvRzsqCr/IMG-20260522-WA0081-1.jpg',
    'Adaptogenic herbal formula combining ashwagandha, maca root, and holy basil to stabilize mood, energy, and hormonal fluctuations.',
    'Crafted for busy professionals and women managing hormonal imbalances, mood swings, or adrenal fatigue. Regulates cortisol output, stabilizes menstrual comfort, and supports mental focus throughout high-stress days.',
    '["Naturally balances estrogen, progesterone, and cortisol", "Eases menstrual cramps, PMS mood swings, and fatigue", "Sustains sharp cognitive focus and calm disposition", "Full spectrum organic adaptogenic roots"]'::jsonb,
    true
),
(
    24,
    'Antibacterial Botanical Hand & Body Bar',
    'Personal Care',
    '₦6,500',
    6500,
    '₦8,500',
    '24% off',
    'Organic',
    true,
    'https://i.ibb.co/BV1NZdDz/IMG-20260718-WA0002-1.jpg',
    'Natural cold-process herbal soap bar made with neem oil, tea tree, and eucalyptus to kill germs and soothe irritated skin.',
    'Crafted with pure plant oils and saponified lye, free from synthetic detergents and artificial dyes. Lathers into a rich creamy foam that banishes body odor and leaves skin cleanly refreshed.',
    '["Eliminates odor-causing bacteria naturally", "Soothes heat rashes, prickly heat, and eczema", "Non-drying formula with natural glycerin", "Long-lasting bar with crisp herbal fragrance"]'::jsonb,
    false
),
(
    25,
    'Comprehensive Liver Cleanse & Vitality Capsule',
    'Health',
    '₦22,500',
    22500,
    '₦28,000',
    '20% off',
    'Bestseller',
    true,
    'https://i.ibb.co/Ng9tbLGj/IMG-20260626-WA0001-1.jpg',
    'Clinical herbal liver therapy capsules containing milk thistle (80% silymarin), dandelion root, and artichoke to rejuvenate liver cells.',
    'Formulated to protect and regenerate hepatocytes damaged by pharmaceuticals, alcohol, or environmental contaminants. Stimulates bile synthesis, aids digestive breakdown of dietary fats, and increases energy levels.',
    '["Standardized 80% silymarin for maximum liver repair", "Flushes accumulated toxins and supports bile flow", "Reduces bloating after greasy or heavy meals", "Pure vegetarian capsules without synthetic binders"]'::jsonb,
    true
),
(
    26,
    'Luxury 24K Gold Botanical Face Oil',
    'Beauty',
    '₦28,500',
    28500,
    '₦35,000',
    '19% off',
    'Top Rated',
    true,
    'https://i.ibb.co/pvWCfnr6/IMG-20260824-WA0008-1.jpg',
    'Opulent anti-aging beauty oil infused with real 24-karat gold flakes, rosehip seed, and jojoba to firm skin and illuminate facial contours.',
    'An indulgent elixir that transforms tired, dull complexion into incandescent radiance. Pure 24K gold flakes slow collagen breakdown while cold-pressed botanical oils lock in moisture for glass-like, youthful skin.',
    '["Real 24K gold flakes for instant light-reflecting glow", "Firms slackened skin and reduces micro-wrinkles", "Nourishes deeply without clogging facial pores", "The ultimate luxury beauty gift for radiant skin"]'::jsonb,
    true
),
(
    27,
    'Ultra Hydrating Hyaluronic & Snail Mucin Gel',
    'Skincare',
    '₦18,500',
    18500,
    '₦23,000',
    '20% off',
    'Trending',
    true,
    'https://i.ibb.co/8nWTvs3y/IMG-20260527-WA0021-1.jpg',
    'Multi-depth moisture gel combining pure snail secretion filtrate with triple-weight hyaluronic acid to repair damaged skin barrier.',
    'An ultra-cooling, oil-free hydration shield that restores parched skin after sun exposure or harsh treatments. Snail mucin repairs damaged dermal tissue while hyaluronic acid locks in deep hydration for 72 hours.',
    '["Rapidly repairs compromised moisture barrier", "Oil-free, non-comedogenic formulation", "Soothes sunburn, peeling, and chemical irritation", "Delivers intense, bounce-back hydration"]'::jsonb,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    price_num = EXCLUDED.price_num,
    old_price = EXCLUDED.old_price,
    discount = EXCLUDED.discount,
    tag = EXCLUDED.tag,
    in_stock = EXCLUDED.in_stock,
    image = EXCLUDED.image,
    description = EXCLUDED.description,
    full_description = EXCLUDED.full_description,
    benefits = EXCLUDED.benefits,
    featured = EXCLUDED.featured,
    updated_at = TIMEZONE('utc'::text, NOW());

-- Confirmation message
SELECT 'Database schema, RLS policies, store configuration, and 27 botanical products successfully initialized!' AS status;
