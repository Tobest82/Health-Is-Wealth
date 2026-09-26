/**
 * HEALTH IS WEALTH - BUMPA STOREFRONT ENGINE
 * Provides interactive features for the Bumpa shop architecture
 * while retaining all "Health is Wealth" content, products & WhatsApp flows.
 */

// Store Configuration
const DEFAULT_STORE_CONFIG = {
  storeName: "Health is Wealth",
  whatsappNumber: "2348084765252",
  phoneDisplay: "08084765252",
  bankName: "Sterling Bank",
  bankAccount: "0097137583",
  accountName: "Ezema Emmanuel Tochukwu",
  currencySymbol: "₦",
  location: "Enugu, Abuja & Lagos, Nigeria (Nationwide Delivery)",
  facebookUrl: "https://www.facebook.com/profile.php?id=61550049644320",
  instagramUrl: "https://www.instagram.com/healthis440?stkn=MW4xMDM0a3cwdmwwOA==",
  productsPerPage: 8
};

// All 12 Curated Health is Wealth Products (Default Fallback)
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Organic Glow & Brightening Body Oil",
    category: "Beauty/Wellness",
    price: "₦18,500",
    priceNum: 18500,
    oldPrice: "₦22,000",
    discount: "16% off",
    tag: "Bestseller",
    image: "https://images.unsplash.com/photo-1608248597359-2e11894d0fb8?auto=format&fit=crop&w=800&q=80",
    description: "Deeply nourishing botanical body oil formulated with cold-pressed rosehip, jojoba, and sweet almond oils to illuminate skin and restore elasticity.",
    fullDescription: "An indulgent, non-greasy botanical oil engineered to lock in deep hydration, fade stubborn hyperpigmentation, and impart a radiant golden glow. Formulated with pure cold-pressed Moroccan rosehip seed oil, vitamin E, golden jojoba, and sweet almond oil.",
    benefits: [
      "Fades dullness and evens out skin tone",
      "Locks in moisture for 24-hour supple hydration",
      "Fast-absorbing formula with zero sticky residue",
      "Infused with organic rosehip and vitamin E"
    ],
    featured: true
  },
  {
    id: 2,
    name: "Herbal Detox & Flat Tummy Wellness Tea",
    category: "Health",
    price: "₦12,500",
    priceNum: 12500,
    oldPrice: "₦15,000",
    discount: "17% off",
    tag: "Popular",
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
    description: "100% natural herbal infusion featuring moringa, ginger, lemongrass, and dandelion root to relieve bloating and promote digestive balance.",
    fullDescription: "A gentle yet effective herbal detox formulated with time-tested organic botanicals. It supports your body's natural cleansing pathways, eases post-meal abdominal bloating, stimulates healthy gut motility, and revitalizes sluggish digestion.",
    benefits: [
      "Relieves bloating and supports digestion",
      "Boosts metabolism naturally without laxatives",
      "Rich in natural antioxidants from organic herbs",
      "Caffeine-free and gentle on the stomach"
    ],
    featured: true
  },
  {
    id: 3,
    name: "Raw Shea & Rosemary Hair Growth Butter",
    category: "Beauty/Wellness",
    price: "₦9,500",
    priceNum: 9500,
    oldPrice: "₦11,500",
    discount: "17% off",
    tag: "Top Rated",
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
    description: "Whipped unrefined organic shea butter infused with pure rosemary essential oil, castor oil, and chebe powder for thick, resilient hair.",
    fullDescription: "Ultra-rich whipped butter formulated specifically for coarse, dry, or damaged hair strands. Combines raw unrefined Nigerian shea butter with cold-pressed Jamaican black castor oil, pure rosemary oil, and authentic Chadian chebe powder.",
    benefits: [
      "Seals in moisture to prevent breakage and split ends",
      "Stimulates blood flow to dormant hair roots",
      "Promotes noticeable length retention and fullness",
      "100% natural, free of mineral oil and silicones"
    ],
    featured: true
  },
  {
    id: 4,
    name: "Vitamin C + Hyaluronic Acid Radiance Serum",
    category: "Beauty/Wellness",
    price: "₦16,000",
    priceNum: 16000,
    oldPrice: "₦19,500",
    discount: "18% off",
    tag: "Trending",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    description: "Potent 20% stabilized Vitamin C combined with botanical hyaluronic acid and ferulic acid to fade dark spots and boost collagen production.",
    fullDescription: "An intensive radiance serum specifically calibrated to target hyperpigmentation, sun damage, and acne scarring. Features 20% stabilized sodium ascorbyl phosphate buffered with multi-molecular hyaluronic acid and ferulic acid.",
    benefits: [
      "Visibly fades stubborn dark spots and acne marks",
      "Plumps fine lines with intensive cellular hydration",
      "Shields skin against tropical environmental stressors",
      "Suitable for all skin types, including sensitive skin"
    ],
    featured: true
  },
  {
    id: 5,
    name: "Hydrating Mineral Sunscreen SPF 50+ Invisible Finish",
    category: "Beauty/Wellness",
    price: "₦14,500",
    priceNum: 14500,
    oldPrice: "₦17,000",
    discount: "15% off",
    tag: "Must-Have",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    description: "Zero white-cast broad spectrum SPF 50+ sunscreen enriched with niacinamide and aloe vera for African skin tones.",
    fullDescription: "Specifically tested and formulated to provide high-level UVA/UVB protection without leaving an ashy, chalky white cast on deeper melanin-rich skin tones. Infused with soothing aloe vera juice and niacinamide to calm inflammation.",
    benefits: [
      "Broad Spectrum SPF 50+ UVA & UVB defense",
      "Zero white cast on melanin-rich skin",
      "Water and sweat resistant for up to 80 minutes",
      "Non-comedogenic (will not clog pores)"
    ],
    featured: false
  },
  {
    id: 6,
    name: "Hydrolyzed Collagen Peptides & Biotin Beauty Powder",
    category: "Beauty/Wellness",
    price: "₦26,000",
    priceNum: 26000,
    oldPrice: "₦30,000",
    discount: "13% off",
    tag: "Premium",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    description: "Premium unflavored collagen peptides enriched with 10,000mcg Biotin and Vitamin C for glowing skin, strong nails, and joint vitality.",
    fullDescription: "Nourish your beauty from within. Our grass-fed hydrolyzed type I & III collagen peptides dissolve instantly into tea, coffee, smoothies, or water. Fortified with pure Biotin and Vitamin C to stimulate natural collagen regeneration.",
    benefits: [
      "Improves skin firmness, suppleness & hydration",
      "Fortifies brittle nails and supports thicker hair",
      "Supports healthy joints and connective tissues",
      "100% unflavored, zero sugar, easy to mix"
    ],
    featured: true
  },
  {
    id: 7,
    name: "Traditional African Black Soap Face & Body Cleanser",
    category: "Beauty/Wellness",
    price: "₦7,500",
    priceNum: 7500,
    oldPrice: "₦9,000",
    discount: "16% off",
    tag: "Authentic",
    image: "https://images.unsplash.com/photo-1607006314644-2f22e866579a?auto=format&fit=crop&w=800&q=80",
    description: "Authentic liquid black soap handcrafted with cocoa pods, plantain skins, honey, and camwood to cleanse and clear acne.",
    fullDescription: "Handcrafted following ancestral Nigerian traditions, our liquid African Black Soap combines roasted cocoa pod ash, plantain skin ash, pure wild honey, and camwood powder. It deeply purifies pores, clears persistent body acne, and calms eczema irritation.",
    benefits: [
      "Deeply cleanses congested pores and clears blemishes",
      "Antibacterial and soothing for eczema-prone skin",
      "Gentle liquid formulation for easy daily use",
      "Free of sulfates, parabens, and synthetic fragrance"
    ],
    featured: false
  },
  {
    id: 8,
    name: "Deep Scalp Stimulating & Anti-Dandruff Herbal Oil",
    category: "Beauty/Wellness",
    price: "₦11,000",
    priceNum: 11000,
    oldPrice: "₦13,000",
    discount: "15% off",
    tag: "Flake-Free",
    image: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80",
    description: "Refreshing scalp therapy oil infused with tea tree, peppermint, jojoba, and fenugreek to soothe itching and eliminate flakes.",
    fullDescription: "An invigorating scalp treatment engineered to relieve dry, itchy scalps, eliminate stubborn dandruff flakes, and re-awaken dormant hair follicles. Leaves the scalp refreshingly tingly and balanced.",
    benefits: [
      "Eliminates dandruff flakes and soothes scalp itch",
      "Boosts blood micro-circulation to hair roots",
      "Lightweight oil that washes out cleanly",
      "Comes with an easy precision applicator nozzle"
    ],
    featured: false
  },
  {
    id: 9,
    name: "Revitalizing Arabica Coffee & Brown Sugar Body Polish",
    category: "Beauty/Wellness",
    price: "₦13,500",
    priceNum: 13500,
    oldPrice: "₦16,000",
    discount: "15% off",
    tag: "Glow",
    image: "https://images.unsplash.com/photo-1547793548-710ec861bb6e?auto=format&fit=crop&w=800&q=80",
    description: "Exfoliating scrub crafted with freshly roasted Arabica coffee grounds, natural cane sugar, and sweet almond oil to polish cellulite and smooth bumps.",
    fullDescription: "Say goodbye to strawberry legs and rough skin patches. This energizing scrub buffs away dead epidermal cells with finely ground Arabica coffee and brown sugar crystals. The caffeine content helps temporarily tighten skin appearance.",
    benefits: [
      "Sloughs off dead skin cells and eliminates rough bumps",
      "Stimulates lymphatic circulation and skin tone",
      "Leaves skin silky smooth with zero greasy residue",
      "Delightful natural coffee aroma"
    ],
    featured: false
  },
  {
    id: 10,
    name: "Organic Moringa & Spirulina Superfood Capsules",
    category: "Health",
    price: "₦15,000",
    priceNum: 15000,
    oldPrice: "₦18,000",
    discount: "16% off",
    tag: "Energy",
    image: "https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=800&q=80",
    description: "Nutrient-dense botanical superfood duo packed with complete plant proteins, iron, chlorophyll, and vital immune-boosting micronutrients.",
    fullDescription: "Harvested from organically cultivated moringa oleifera and blue-green spirulina algae. Each capsule delivers a dense spectrum of natural vitamins A, C, and E, plant iron, potassium, and amino acids to combat daily fatigue.",
    benefits: [
      "Natural energy booster without caffeine jitters",
      "Strengthens the immune system and detoxifies blood",
      "Rich source of bioavailable plant iron and minerals",
      "Vegetable-based easy-to-swallow capsules"
    ],
    featured: false
  },
  {
    id: 11,
    name: "Rosewater & Witch Hazel Calming Facial Mist",
    category: "Beauty/Wellness",
    price: "₦8,500",
    priceNum: 8500,
    oldPrice: "₦10,000",
    discount: "15% off",
    tag: "Hydrate",
    image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80",
    description: "Pure distilled Damask rose hydrosol and alcohol-free witch hazel to balance pH, tighten open pores, and revive tired skin throughout the day.",
    fullDescription: "Keep your complexion fresh in hot and humid weather. Steam-distilled from organic Bulgarian rose petals and blended with non-drying witch hazel extract. A single spritz instantly cools the skin and controls excess mid-day shine.",
    benefits: [
      "Instantly cools, balances, and rehydrates skin",
      "Alcohol-free toner that refines the appearance of pores",
      "Can be used as a makeup setting or refreshing mist",
      "100% natural, refreshing floral aroma"
    ],
    featured: false
  },
  {
    id: 12,
    name: "Gentle Foaming Intimate Wellness Cleanser",
    category: "Beauty/Wellness",
    price: "₦9,000",
    priceNum: 9000,
    oldPrice: "₦11,000",
    discount: "18% off",
    tag: "Gentle",
    image: "https://images.unsplash.com/photo-1556228722-d0b630452945?auto=format&fit=crop&w=800&q=80",
    description: "Gynecologist-approved, pH-balanced (4.0) gentle feminine wash enriched with soothing chamomile, lactic acid, and calendula extract.",
    fullDescription: "Formulated with the utmost care for women's sensitive personal wellness. Balances natural feminine microflora with plant-derived lactic acid, organic chamomile, and calming calendula.",
    benefits: [
      "Clinically balanced pH 4.0 matching intimate flora",
      "Prevents irritation, odor, and dryness",
      "Dermatologically & gynecologically tested",
      "Luxurious, velvety self-foaming pump"
    ],
    featured: false
  }
];

// Dynamic Products and Store Config with LocalStorage Persistence
const CATALOG_VERSION = window.CATALOG_VERSION || "2026_27_products_v2";
const STORE_DEFAULT_PRODUCTS = (window.DEFAULT_PRODUCTS && window.DEFAULT_PRODUCTS.length > 0)
  ? window.DEFAULT_PRODUCTS
  : DEFAULT_PRODUCTS;

let PRODUCTS = (typeof window.getFreshDefaultProducts === "function")
  ? window.getFreshDefaultProducts()
  : [...STORE_DEFAULT_PRODUCTS];

try {
  const savedProducts = localStorage.getItem("healthIsWealth_products");
  let shouldLoadDefaults = false;

  if (savedProducts) {
    const parsed = JSON.parse(savedProducts);
    if (Array.isArray(parsed) && parsed.length > 0) {
      PRODUCTS = parsed;
      // Normalize product categories so old 6 categories map to Health or Beauty/Wellness
      let changed = false;
      PRODUCTS.forEach(p => {
        if (!p.category || (p.category !== "Health" && p.category !== "Beauty/Wellness")) {
          const lower = (p.category || "").toLowerCase();
          p.category = (lower === "health" || lower.includes("health")) ? "Health" : "Beauty/Wellness";
          changed = true;
        }
      });
      if (changed) {
        try {
          localStorage.setItem("healthIsWealth_products", JSON.stringify(PRODUCTS));
        } catch (e) {}
      }
    } else {
      shouldLoadDefaults = true;
    }
  } else {
    shouldLoadDefaults = true;
  }

  if (shouldLoadDefaults) {
    PRODUCTS = (typeof window.getFreshDefaultProducts === "function")
      ? window.getFreshDefaultProducts()
      : [...STORE_DEFAULT_PRODUCTS];
    localStorage.setItem("healthIsWealth_products", JSON.stringify(PRODUCTS));
  }
} catch (e) {
  console.warn("Could not load products from localStorage:", e);
}

let STORE_CONFIG = { ...DEFAULT_STORE_CONFIG };
try {
  const savedConfig = localStorage.getItem("healthIsWealth_config");
  if (savedConfig) {
    STORE_CONFIG = { ...DEFAULT_STORE_CONFIG, ...JSON.parse(savedConfig) };
  }
} catch (e) {
  console.warn("Could not load store config from localStorage:", e);
}

// Ensure official Sterling Bank details are always active
if (!STORE_CONFIG.bankAccount || STORE_CONFIG.bankAccount === "8084765252" || STORE_CONFIG.bankName !== "Sterling Bank") {
  STORE_CONFIG.bankName = "Sterling Bank";
  STORE_CONFIG.bankAccount = "0097137583";
  STORE_CONFIG.accountName = "Ezema Emmanuel Tochukwu";
  try {
    localStorage.setItem("healthIsWealth_config", JSON.stringify(STORE_CONFIG));
  } catch (e) {}
}

// Function to update customer footer social links dynamically
function syncFooterSocialLinks() {
  const igLink = document.getElementById("footerInstagramLink");
  const fbLink = document.getElementById("footerFacebookLink");
  if (igLink && STORE_CONFIG.instagramUrl) {
    igLink.href = STORE_CONFIG.instagramUrl;
  }
  if (fbLink && STORE_CONFIG.facebookUrl) {
    fbLink.href = STORE_CONFIG.facebookUrl;
  }
}
document.addEventListener("DOMContentLoaded", syncFooterSocialLinks);

// Background Supabase Synchronizer for Storefront
async function initSupabaseStorefrontSync() {
  if (typeof window.SupabaseStore === "undefined") return;
  try {
    await window.SupabaseStore.ensureConfig();
  } catch (e) {}
  if (!window.SupabaseStore.isConfigured()) return;

  try {
    const [cloudProducts, cloudConfig, cloudCategories] = await Promise.all([
      window.SupabaseStore.fetchProducts(),
      window.SupabaseStore.fetchStoreConfig(),
      window.SupabaseStore.fetchCategories()
    ]);

    let needsReRender = false;

    // If cloud catalog is configured but empty, auto-push default 27 products & bank details
    if (cloudProducts && Array.isArray(cloudProducts) && cloudProducts.length === 0 && PRODUCTS.length > 0) {
      try {
        await window.SupabaseStore.pushAllToSupabase(PRODUCTS, STORE_CATEGORIES, STORE_CONFIG);
        console.log("Automatically seeded Supabase database with local catalog and bank details.");
      } catch (pushErr) {
        console.warn("Auto-push to Supabase notice:", pushErr);
      }
    } else if (cloudProducts && Array.isArray(cloudProducts) && cloudProducts.length > 0) {
      PRODUCTS = cloudProducts;
      try {
        localStorage.setItem("healthIsWealth_products", JSON.stringify(PRODUCTS));
      } catch (e) {}
      needsReRender = true;
    }

    if (cloudCategories && Array.isArray(cloudCategories) && cloudCategories.length > 0) {
      STORE_CATEGORIES = cloudCategories;
      try {
        localStorage.setItem("healthIsWealth_categories", JSON.stringify(STORE_CATEGORIES));
      } catch (e) {}
      renderCategoryFilters();
    }

    if (cloudConfig) {
      STORE_CONFIG = { ...STORE_CONFIG, ...cloudConfig };
      try {
        localStorage.setItem("healthIsWealth_config", JSON.stringify(STORE_CONFIG));
      } catch (e) {}
      syncFooterSocialLinks();
      setupRegulationNav();
    }

    if (needsReRender) {
      if (typeof renderProducts === "function") renderProducts();
      if (typeof renderPagination === "function") renderPagination();
      if (typeof renderFeaturedProducts === "function") renderFeaturedProducts();
    }
  } catch (err) {
    console.warn("Supabase background sync skipped:", err);
  }
}
document.addEventListener("DOMContentLoaded", initSupabaseStorefrontSync);

// Categories with LocalStorage Persistence
const DEFAULT_CATEGORIES = [
  "Health",
  "Beauty/Wellness"
];
let STORE_CATEGORIES = [...DEFAULT_CATEGORIES];
try {
  const savedCategories = localStorage.getItem("healthIsWealth_categories");
  if (savedCategories) {
    const parsed = JSON.parse(savedCategories);
    const hasOldCategories = Array.isArray(parsed) && parsed.some(c =>
      ["skincare", "hair care", "personal care", "beauty", "wellness"].includes((c || "").toLowerCase())
    );
    if (!hasOldCategories && Array.isArray(parsed) && parsed.length > 0) {
      STORE_CATEGORIES = parsed;
    } else {
      STORE_CATEGORIES = [...DEFAULT_CATEGORIES];
      localStorage.setItem("healthIsWealth_categories", JSON.stringify(DEFAULT_CATEGORIES));
    }
  } else {
    localStorage.setItem("healthIsWealth_categories", JSON.stringify(DEFAULT_CATEGORIES));
  }
} catch (e) {
  console.warn("Could not load categories from localStorage:", e);
}

// Re-sync if categories changed in another tab or storage
function handleSyncCategories() {
  try {
    const saved = localStorage.getItem("healthIsWealth_categories");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        STORE_CATEGORIES = parsed;
        setupCollections();
        renderProducts();
      }
    }
  } catch (err) {}
}

// Re-sync if products changed in another tab or storage
function handleSyncProducts() {
  try {
    const saved = localStorage.getItem("healthIsWealth_products");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        PRODUCTS = parsed;
        if (typeof renderProducts === "function") renderProducts();
        if (typeof updateStatsCounter === "function") updateStatsCounter();
      }
    }
  } catch (err) {}
}

window.addEventListener("storage", (e) => {
  if (e.key === "healthIsWealth_products") {
    handleSyncProducts();
  }
  if (e.key === "healthIsWealth_config") {
    try {
      const parsed = JSON.parse(e.newValue);
      if (parsed) {
        STORE_CONFIG = { ...DEFAULT_STORE_CONFIG, ...parsed };
        syncFooterSocialLinks();
      }
    } catch (err) {}
  }
  if (e.key === "healthIsWealth_categories") {
    handleSyncCategories();
  }
});
window.addEventListener("categoriesUpdated", handleSyncCategories);
window.addEventListener("productsUpdated", handleSyncProducts);

// Realtime BroadcastChannel Listener for Instant Admin Sync
try {
  const syncChannel = new BroadcastChannel("healthIsWealth_sync");
  syncChannel.onmessage = (event) => {
    const data = event.data;
    if (!data) return;
    if (data.type === "products_updated") {
      if (Array.isArray(data.payload)) {
        PRODUCTS = data.payload;
        if (typeof renderProducts === "function") renderProducts();
        if (typeof updateStatsCounter === "function") updateStatsCounter();
        if (typeof renderFeaturedProducts === "function") renderFeaturedProducts();
      }
    } else if (data.type === "categories_updated") {
      if (Array.isArray(data.payload)) {
        STORE_CATEGORIES = data.payload;
        if (typeof setupCollections === "function") setupCollections();
        if (typeof renderCategoryFilters === "function") renderCategoryFilters();
      }
    } else if (data.type === "config_updated") {
      if (data.payload) {
        STORE_CONFIG = { ...DEFAULT_STORE_CONFIG, ...data.payload };
        if (typeof syncFooterSocialLinks === "function") syncFooterSocialLinks();
        if (typeof setupRegulationNav === "function") setupRegulationNav();
      }
    }
  };
} catch (e) {
  // BroadcastChannel not available in environment
}

// App State
let activeCollection = "All";
let searchQuery = "";
let currentPage = 1;
let cart = [];
let quickViewQty = 1;

// Load Cart from localStorage
try {
  const savedCart = localStorage.getItem("healthIsWealth_cart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
} catch (e) {
  console.warn("Could not read cart from localStorage:", e);
}

// Save Cart to localStorage
function saveCart() {
  try {
    localStorage.setItem("healthIsWealth_cart", JSON.stringify(cart));
  } catch (e) {
    console.warn("Could not save cart:", e);
  }
  updateCartBadge();
  renderCartDrawer();
}

// Helpers
function createWhatsAppUrl(text) {
  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function getOrderWhatsAppUrl(productId, quantity = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return `https://wa.me/${STORE_CONFIG.whatsappNumber}`;
  const qtyStr = quantity > 1 ? ` (Qty: ${quantity})` : '';
  const message = `Hello Health is Wealth, I would like to order:\n\n*Product:* ${product.name}${qtyStr}\n*Price:* ${product.price}\n\nPlease provide payment details and confirm delivery to my address. Thank you!`;
  return createWhatsAppUrl(message);
}

function orderNow(productId, quantity = 1) {
  const url = getOrderWhatsAppUrl(productId, quantity);
  window.open(url, "_blank");
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25d366" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

function updateCartBadge() {
  const badge = document.getElementById("cartCountBadge");
  const drawerCount = document.getElementById("cartDrawerCount");
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) badge.textContent = totalCount;
  if (drawerCount) drawerCount.textContent = totalCount;
}

// Filtered Products
function getFilteredProducts() {
  return PRODUCTS.filter(p => {
    const activeLower = (activeCollection || "").toLowerCase();
    const prodCatLower = (p.category || "").toLowerCase();
    const isBeautyWellness = (catStr) => catStr.startsWith("beauty") || catStr.includes("wellne");

    let matchesCategory = false;
    if (activeCollection === "All" || activeLower === "all") {
      matchesCategory = true;
    } else if (activeLower === prodCatLower) {
      matchesCategory = true;
    } else if (isBeautyWellness(activeLower) && isBeautyWellness(prodCatLower)) {
      matchesCategory = true;
    } else if (activeLower.includes("health") && prodCatLower.includes("health")) {
      matchesCategory = true;
    }

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });
}

// Render Products Grid
function renderProducts() {
  const grid = document.getElementById("bumpaProductsGrid");
  const countTag = document.getElementById("productResultsCount");
  if (!grid) return;

  const filtered = getFilteredProducts();
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / STORE_CONFIG.productsPerPage) || 1;

  if (currentPage > totalPages) {
    currentPage = 1;
  }

  const startIndex = (currentPage - 1) * STORE_CONFIG.productsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + STORE_CONFIG.productsPerPage);

  if (countTag) {
    countTag.textContent = `${totalItems} Product${totalItems === 1 ? '' : 's'}`;
  }

  if (paginated.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #ffffff; border-radius: 8px; border: 1px dashed #d1d5db;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" style="margin: 0 auto 16px;">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px;">No products found</h3>
        <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 16px;">We couldn't find any products matching "${escapeHtml(searchQuery || activeCollection)}".</p>
        <button type="button" class="base-btn-primary" onclick="resetFilters()" style="margin: 0 auto;">Show All Products</button>
      </div>
    `;
    renderPagination(0, 1);
    return;
  }

  grid.innerHTML = paginated.map(p => `
    <article class="product" data-product-id="${p.id}">
      <div class="product-details">
        <div class="product-image" onclick="openQuickView(${p.id})">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" />
        </div>

        <div class="product-data">
          <span class="product-category-tag">${p.category}</span>
          <h3 class="product-name" onclick="openQuickView(${p.id})" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
          <p class="product-card-desc" onclick="openQuickView(${p.id})" title="Click to view details">${escapeHtml(p.description || p.fullDescription || '')}</p>
          
          <div class="product-pricing-row">
            <span class="product-price">${p.price}</span>
            ${p.oldPrice ? `<span class="old-price">${p.oldPrice}</span>` : ''}
            ${p.discount ? `<span class="percent-off">${p.discount}</span>` : ''}
          </div>

          <div class="product-card-actions">
            <a 
              href="${getOrderWhatsAppUrl(p.id, 1)}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="base-btn-primary" 
              onclick="event.stopPropagation();"
              aria-label="Order ${escapeHtml(p.name)} now on WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" style="flex-shrink: 0;">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.073.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.176L2 22l4.981-1.397A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.688 0-3.255-.494-4.577-1.344l-.328-.21-2.96.83.844-2.883-.229-.344C3.843 14.86 3.333 13.483 3.333 12c0-4.779 3.888-8.667 8.667-8.667 4.778 0 8.667 3.888 8.667 8.667 0 4.779-3.889 8.667-8.667 8.667z"/>
              </svg>
              <span>Order Now</span>
            </a>
            <button type="button" class="base-btn-secondary" onclick="openQuickView(${p.id})" aria-label="Quick View ${escapeHtml(p.name)}" title="Quick View">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  `).join('');

  renderPagination(totalPages, currentPage);
}

// Render Pagination Bar (Bumpa architecture)
function renderPagination(totalPages, current) {
  const container = document.getElementById("bumpaPagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
    <button type="button" class="page-box caret reverse" ${current === 1 ? 'disabled' : ''} onclick="goToPage(${current - 1})" aria-label="Previous Page">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div class="page-numbers">
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button type="button" class="page-box ${i === current ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>
    `;
  }

  html += `
    </div>
    <button type="button" class="page-box caret" ${current === totalPages ? 'disabled' : ''} onclick="goToPage(${current + 1})" aria-label="Next Page">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </button>
  `;

  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderProducts();
  const section = document.getElementById("productsSection");
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

function resetFilters() {
  activeCollection = "All";
  searchQuery = "";
  currentPage = 1;
  const searchInput = document.getElementById("bumpaSearchInput");
  if (searchInput) searchInput.value = "";
  updateCollectionTabUI("All");
  renderProducts();
}

// Collection Tabs Interaction
function setupCollections() {
  const collectionList = document.getElementById("collectionList");

  if (collectionList) {
    let tabsHtml = `
      <button type="button" class="collection-tab ${activeCollection.toLowerCase() === 'all' ? 'collection-active' : ''}" data-tag="All" id="tabAll">
        All
      </button>
    `;

    STORE_CATEGORIES.forEach((cat) => {
      const isActive = cat.toLowerCase() === activeCollection.toLowerCase();
      tabsHtml += `
        <button type="button" class="collection-tab ${isActive ? 'collection-active' : ''}" data-tag="${escapeHtml(cat)}">
          ${escapeHtml(cat)}
        </button>
      `;
    });

    collectionList.innerHTML = tabsHtml;

    // Attach click listeners to freshly rendered tabs
    const tabs = collectionList.querySelectorAll(".collection-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const tag = tab.getAttribute("data-tag") || "All";
        activeCollection = tag;
        currentPage = 1;
        updateCollectionTabUI(tag);
        renderProducts();
      });
    });
  }
}

function selectCollectionFromDropdown(cat) {
  activeCollection = cat;
  currentPage = 1;
  updateCollectionTabUI(cat);
  renderProducts();
  const modalDropdown = document.getElementById("modalCollectionDropdown");
  if (modalDropdown) modalDropdown.style.display = "none";
}

function updateCollectionTabUI(activeTag) {
  const tabs = document.querySelectorAll(".collection-tab");
  tabs.forEach(tab => {
    const tag = tab.getAttribute("data-tag");
    if (tag && tag.toLowerCase() === activeTag.toLowerCase()) {
      tab.classList.add("collection-active");
    } else {
      tab.classList.remove("collection-active");
    }
  });

  const mobileLabel = document.getElementById("mobileCollectionLabel");
  if (mobileLabel) {
    mobileLabel.textContent = activeTag === "All" ? "Browse Collections" : activeTag;
  }
}

// Live Search with Autocomplete Popover
function setupSearch() {
  const input = document.getElementById("bumpaSearchInput");
  const suggestionsBox = document.getElementById("searchSuggestions");
  const searchBtn = document.getElementById("bumpaSearchBtn");

  if (!input || !suggestionsBox) return;

  input.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    searchQuery = val;
    currentPage = 1;

    if (val.length >= 2) {
      const lowerVal = val.toLowerCase();

      const matches = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(lowerVal) || 
        p.category.toLowerCase().includes(lowerVal)
      ).slice(0, 5);

      let itemsHtml = '';

      if (matches.length > 0) {
        itemsHtml += matches.map(p => `
          <div class="suggestion-item" onclick="selectSuggestion(${p.id})">
            <img class="suggestion-thumb" src="${p.image}" alt="${escapeHtml(p.name)}" />
            <div class="suggestion-info">
              <span class="suggestion-name">${escapeHtml(p.name)}</span>
              <span class="suggestion-price">${p.price}</span>
            </div>
          </div>
        `).join('');
      }

      if (itemsHtml) {
        suggestionsBox.innerHTML = itemsHtml;
        suggestionsBox.style.display = "block";
      } else {
        suggestionsBox.style.display = "none";
      }
    } else {
      suggestionsBox.style.display = "none";
    }

    renderProducts();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      suggestionsBox.style.display = "none";
      renderProducts();
      const section = document.getElementById("productsSection");
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
  });

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      suggestionsBox.style.display = "none";
      renderProducts();
      const section = document.getElementById("productsSection");
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
  }

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = "none";
    }
  });
}

function selectSuggestion(productId) {
  const suggestionsBox = document.getElementById("searchSuggestions");
  if (suggestionsBox) suggestionsBox.style.display = "none";
  openQuickView(productId);
}

// Quick View Modal
function openQuickView(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById("quickViewModal");
  const body = document.getElementById("quickViewBody");
  if (!modal || !body) return;

  quickViewQty = 1;
  const orderUrl = getOrderWhatsAppUrl(product.id, 1);

  body.innerHTML = `
    <div class="quick-view-grid">
      <div class="quick-view-image">
        <img src="${product.image}" alt="${escapeHtml(product.name)}" />
      </div>
      <div class="quick-view-info">
        <span class="quick-view-category">${product.category}</span>
        <h2 class="quick-view-name">${escapeHtml(product.name)}</h2>
        <div class="quick-view-price">${product.price}</div>
        <p class="quick-view-desc">${escapeHtml(product.description || product.fullDescription || '')}</p>

        <div class="qty-row">
          <span style="font-size: 0.85rem; font-weight: 600; color: #374151;">Quantity:</span>
          <div class="qty-stepper">
            <button type="button" class="qty-btn" onclick="changeQuickViewQty(-1)">-</button>
            <span class="qty-value" id="quickViewQtyVal">1</span>
            <button type="button" class="qty-btn" onclick="changeQuickViewQty(1)">+</button>
          </div>
        </div>

        <div class="quick-view-actions">
          <a href="${orderUrl}" target="_blank" rel="noopener noreferrer" class="btn-modal-wa" id="quickViewWhatsAppBtn" style="width: 100%;">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.073.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.176L2 22l4.981-1.397A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.688 0-3.255-.494-4.577-1.344l-.328-.21-2.96.83.844-2.883-.229-.344C3.843 14.86 3.333 13.483 3.333 12c0-4.779 3.888-8.667 8.667-8.667 4.778 0 8.667 3.888 8.667 8.667 0 4.779-3.889 8.667-8.667 8.667z"/>
            </svg>
            <span id="quickViewOrderText">Order Now on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  `;

  modal.style.display = "flex";
  document.body.classList.add("modal-open");
}

function changeQuickViewQty(delta) {
  quickViewQty = Math.max(1, quickViewQty + delta);
  const val = document.getElementById("quickViewQtyVal");
  if (val) val.textContent = quickViewQty;

  const btn = document.getElementById("quickViewWhatsAppBtn");
  const modal = document.getElementById("quickViewModal");
  if (btn && modal) {
    const titleEl = modal.querySelector(".quick-view-name");
    if (titleEl) {
      const name = titleEl.textContent;
      const product = PRODUCTS.find(p => p.name === name);
      if (product) {
        btn.href = getOrderWhatsAppUrl(product.id, quickViewQty);
      } else {
        const orderMessage = `Hello Health is Wealth, I would like to order ${name} (Qty: ${quickViewQty}). Please provide payment details and confirm delivery.`;
        btn.href = createWhatsAppUrl(orderMessage);
      }
      const textEl = document.getElementById("quickViewOrderText");
      if (textEl) {
        textEl.textContent = quickViewQty > 1 ? `Order Now on WhatsApp (Qty: ${quickViewQty})` : `Order Now on WhatsApp`;
      }
    }
  }
}

function closeQuickView() {
  const modal = document.getElementById("quickViewModal");
  if (modal) modal.style.display = "none";
  document.body.classList.remove("modal-open");
}

// Shopping Bag / Cart Slideover
function addToCart(productId, qty = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      priceNum: product.priceNum,
      image: product.image,
      quantity: qty
    });
  }

  saveCart();
  showToast(`Added "${product.name}" to shopping bag!`);
}

function updateCartItemQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  saveCart();
}

function removeCartItem(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
}

function openCartDrawer() {
  const slideover = document.getElementById("cartSlideover");
  if (!slideover) return;
  renderCartDrawer();
  slideover.style.display = "block";
  document.body.classList.add("cart-open");
}

function closeCartDrawer() {
  const slideover = document.getElementById("cartSlideover");
  if (!slideover) return;
  slideover.style.display = "none";
  document.body.classList.remove("cart-open");
}

function renderCartDrawer() {
  const container = document.getElementById("cartItemsContainer");
  const subtotalEl = document.getElementById("cartSubtotalAmount");
  const footer = document.getElementById("cartFooter");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
          <path d="M3 6h18"></path>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <h4 class="cart-empty-title">Your shopping bag is empty</h4>
        <p class="cart-empty-desc">Discover our best-selling wellness, beauty, and health essentials today.</p>
        <button type="button" class="btn-continue-shopping" onclick="closeCartDrawer();">Continue Shopping</button>
      </div>
    `;
    if (footer) footer.style.display = "none";
    return;
  }

  if (footer) footer.style.display = "block";

  let subtotal = 0;
  container.innerHTML = cart.map(item => {
    const itemTotal = item.priceNum * item.quantity;
    subtotal += itemTotal;
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-img" />
        <div class="cart-item-details">
          <h4 class="cart-item-name">${escapeHtml(item.name)}</h4>
          <span class="cart-item-price">${formatNaira(item.priceNum)}</span>
          <div class="cart-item-controls">
            <div class="cart-qty-stepper">
              <button type="button" class="cart-qty-btn" onclick="updateCartItemQty(${item.id}, -1)">-</button>
              <span class="cart-qty-val">${item.quantity}</span>
              <button type="button" class="cart-qty-btn" onclick="updateCartItemQty(${item.id}, 1)">+</button>
            </div>
            <button type="button" class="cart-remove-btn" onclick="removeCartItem(${item.id})">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (subtotalEl) {
    subtotalEl.textContent = formatNaira(subtotal);
  }
}

function formatNaira(num) {
  return "₦" + num.toLocaleString();
}

// Checkout via WhatsApp (builds organized order summary)
function checkoutViaWhatsApp() {
  if (cart.length === 0) return;

  let message = `Hello Health is Wealth, I would like to place an order from your store:\n\n`;
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.priceNum * item.quantity;
    total += itemTotal;
    message += `${index + 1}. ${item.name}\n   Qty: ${item.quantity} × ${formatNaira(item.priceNum)} = ${formatNaira(itemTotal)}\n`;
  });

  message += `\n*Total Amount:* ${formatNaira(total)}\n`;
  message += `\nPlease confirm availability and delivery details to my address. Thank you!`;

  const url = createWhatsAppUrl(message);

  // Background Cloud Order Storage in Supabase
  if (typeof window.SupabaseStore !== "undefined" && window.SupabaseStore.isConfigured()) {
    window.SupabaseStore.createOrder({
      customer_name: "Customer Order (Storefront)",
      customer_phone: STORE_CONFIG.whatsappNumber,
      items: cart.map(i => ({ id: i.id, name: i.name, priceNum: i.priceNum, quantity: i.quantity })),
      subtotal: total,
      total_amount: total,
      status: "pending",
      whatsapp_link: url
    }).catch(err => console.warn("Supabase background order record skipped:", err));
  }

  window.open(url, "_blank");
}

// Newsletter Handler
function handleNewsletterSubmit() {
  const input = document.getElementById("newsletterInput");
  const msg = document.getElementById("newsletterMessage");
  if (!input) return;

  const val = input.value.trim();
  if (val) {
    if (msg) {
      msg.textContent = "Thank you for subscribing! You are now on our VIP discount & updates list.";
      msg.style.color = "#25d366";
      msg.style.fontWeight = "600";
    }
    showToast("Subscribed successfully to Health is Wealth updates!");
    input.value = "";
  }
}

// Top Regulation Marquee
function setupRegulationNav() {
  try {
    const savedMarquee = localStorage.getItem("healthIsWealth_marquee");
    if (savedMarquee) {
      const texts = document.querySelectorAll(".regulation-nav .announcement-text");
      texts.forEach(el => {
        el.innerHTML = `🌿 ${escapeHtml(savedMarquee)}`;
      });
    }
  } catch (e) {}
}

// Currency Dropdown Toggle
function toggleCurrencyDropdown() {
  const dropdown = document.getElementById("currencyDropdown");
  if (!dropdown) return;
  const isVisible = dropdown.style.display === "block";
  dropdown.style.display = isVisible ? "none" : "block";
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Global Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  updateCartBadge();
  setupCollections();
  setupSearch();
  setupRegulationNav();

  // Cart Slideover Triggers
  const openCartBtn = document.getElementById("openCartBtn");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const checkoutBtn = document.getElementById("checkoutWhatsAppBtn");

  if (openCartBtn) openCartBtn.addEventListener("click", openCartDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener("click", closeCartDrawer);
  if (checkoutBtn) checkoutBtn.addEventListener("click", checkoutViaWhatsApp);

  // Quick View Modal Close
  const closeQuickViewBtn = document.getElementById("closeQuickViewBtn");
  const quickViewOverlay = document.getElementById("quickViewOverlay");
  if (closeQuickViewBtn) closeQuickViewBtn.addEventListener("click", closeQuickView);
  if (quickViewOverlay) quickViewOverlay.addEventListener("click", closeQuickView);

  // Currency Toggle Button
  const currencyBtn = document.getElementById("currencyToggleBtn");
  if (currencyBtn) {
    currencyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCurrencyDropdown();
    });
  }
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("currencyDropdown");
    if (dropdown && !dropdown.contains(e.target) && e.target !== currencyBtn) {
      dropdown.style.display = "none";
    }
  });

  // ESC key to close open modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeQuickView();
      closeCartDrawer();
    }
  });
});
