/**
 * HEALTH IS WEALTH - ADMIN DASHBOARD ENGINE
 * Authorized Store Management System
 * Admin Password: tontobest82
 */

const DEFAULT_ADMIN_PASSWORD = "tontobest82";
const STORAGE_KEY_ADMIN_PW = "healthIsWealth_admin_password";
const STORAGE_KEY_AUTH = "healthIsWealth_admin_auth";

function getAdminPassword() {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_PW) || DEFAULT_ADMIN_PASSWORD;
  } catch (e) {
    return DEFAULT_ADMIN_PASSWORD;
  }
}
const STORAGE_KEY_PRODUCTS = "healthIsWealth_products";
const STORAGE_KEY_CONFIG = "healthIsWealth_config";
const STORAGE_KEY_MARQUEE = "healthIsWealth_marquee";
const STORAGE_KEY_CATEGORIES = "healthIsWealth_categories";

// Default Standard Curated Categories (Strictly Health and Beauty/Wellness)
const DEFAULT_CATEGORIES = ["Health", "Beauty/Wellness"];

// Default 27 Curated Store Products (loaded globally from /products-data.js)
const DEFAULT_PRODUCTS = (window.DEFAULT_PRODUCTS && window.DEFAULT_PRODUCTS.length > 0)
  ? window.DEFAULT_PRODUCTS
  : [];
const CATALOG_VERSION = window.CATALOG_VERSION || "2026_27_products_v2";

// Default Store Configuration
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
  marqueeText: "HEALTH IS WEALTH • OUR STORES ARE LOCATED IN ENUGU, ABUJA AND LAGOS • WE DELIVER NATIONWIDE • QUALITY HEALTH, BEAUTY & WELLNESS PRODUCTS • DIRECT FAST WHATSAPP ORDERING: 08084765252",
  productsPerPage: 8
};

// State
let currentProducts = [];
let currentCategories = ["Health", "Beauty/Wellness"];
let currentConfig = { ...DEFAULT_STORE_CONFIG };
let activeCategory = "All";
let searchQuery = "";

// ======================================================================
// 1. INITIALIZATION & AUTHENTICATION
// ======================================================================
document.addEventListener("DOMContentLoaded", () => {
  initProductsAndConfig();
  checkAuthSession();
});

function initProductsAndConfig() {
  // Categories are strictly Health and Beauty/Wellness
  currentCategories = ["Health", "Beauty/Wellness"];
  saveCategoriesToStorage();

  // Load products safely preserving all user edits
  try {
    const savedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    let shouldLoadDefaults = false;

    if (savedProducts) {
      const parsed = JSON.parse(savedProducts);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Successfully load the user's stored products
        currentProducts = parsed;
        // Normalize categories so all items strictly map to Health or Beauty/Wellness
        let changed = false;
        currentProducts.forEach(p => {
          const lower = (p.category || "").toLowerCase();
          const cleanCat = (lower === "health" || lower.includes("health")) ? "Health" : "Beauty/Wellness";
          if (p.category !== cleanCat) {
            p.category = cleanCat;
            changed = true;
          }
        });
        if (changed) {
          saveProductsToStorage();
        }
      } else {
        shouldLoadDefaults = true;
      }
    } else {
      shouldLoadDefaults = true;
    }

    if (shouldLoadDefaults) {
      const fresh = typeof window.getFreshDefaultProducts === "function"
        ? window.getFreshDefaultProducts()
        : JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      currentProducts = fresh;
      currentProducts.forEach(p => {
        const lower = (p.category || "").toLowerCase();
        p.category = (lower === "health" || lower.includes("health")) ? "Health" : "Beauty/Wellness";
      });
      saveProductsToStorage();
    }
  } catch (e) {
    console.error("Error loading products from storage, using defaults:", e);
    const fresh = typeof window.getFreshDefaultProducts === "function"
      ? window.getFreshDefaultProducts()
      : JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    currentProducts = fresh;
    currentProducts.forEach(p => {
      const lower = (p.category || "").toLowerCase();
      p.category = (lower === "health" || lower.includes("health")) ? "Health" : "Beauty/Wellness";
    });
    saveProductsToStorage();
  }

  // Load store config
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (savedConfig) {
      currentConfig = { ...DEFAULT_STORE_CONFIG, ...JSON.parse(savedConfig) };
    } else {
      currentConfig = { ...DEFAULT_STORE_CONFIG };
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
    }
  } catch (e) {
    currentConfig = { ...DEFAULT_STORE_CONFIG };
  }

  // Ensure official Sterling Bank details are always set
  if (!currentConfig.bankAccount || currentConfig.bankAccount === "8084765252" || currentConfig.bankName !== "Sterling Bank") {
    currentConfig.bankName = "Sterling Bank";
    currentConfig.bankAccount = "0097137583";
    currentConfig.accountName = "Ezema Emmanuel Tochukwu";
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
    } catch (e) {}
  }

  // Load marquee text
  try {
    const savedMarquee = localStorage.getItem(STORAGE_KEY_MARQUEE);
    if (savedMarquee) {
      currentConfig.marqueeText = savedMarquee;
    }
  } catch (e) {}
}

function checkAuthSession() {
  const isAuthSession = sessionStorage.getItem(STORAGE_KEY_AUTH) === "true";
  const isAuthLocal = localStorage.getItem(STORAGE_KEY_AUTH) === "true";

  if (isAuthSession || isAuthLocal) {
    showAdminDashboard();
  } else {
    showAuthScreen();
  }
}

function showAuthScreen() {
  const authScreen = document.getElementById("authScreen");
  const adminApp = document.getElementById("adminApp");
  if (authScreen) authScreen.style.display = "flex";
  if (adminApp) adminApp.style.display = "none";
  const pwInput = document.getElementById("adminPasswordInput");
  if (pwInput) {
    pwInput.value = "";
    setTimeout(() => pwInput.focus(), 150);
  }
}

function showAdminDashboard() {
  const authScreen = document.getElementById("authScreen");
  const adminApp = document.getElementById("adminApp");
  if (authScreen) authScreen.style.display = "none";
  if (adminApp) adminApp.style.display = "flex";

  renderDashboardMetrics();
  renderAdminCategoryPills();
  renderCategoriesManagement();
  populateCategorySelects();
  renderProductsCatalog();
  populateSettingsForm();
  initWhatsAppStudio();

  // Check Supabase connection and auto-push if cloud database catalog is empty
  if (typeof window.SupabaseStore !== "undefined" && window.SupabaseStore.isConfigured()) {
    updateSupabaseStatusBadge("connected", "Connected to Supabase");
    window.SupabaseStore.fetchProducts().then(prods => {
      if (prods && prods.length === 0 && currentProducts.length > 0) {
        console.log("Supabase connected with empty catalog. Auto-pushing 27 products...");
        handlePushToSupabase(true);
      }
    }).catch(() => {});
  } else {
    updateSupabaseStatusBadge("local", "Local Storage Mode");
  }
}

function handleAdminLogin(event) {
  event.preventDefault();
  const pwInput = document.getElementById("adminPasswordInput");
  const errorMsg = document.getElementById("authErrorMsg");
  const errorText = document.getElementById("authErrorText");
  const rememberMe = document.getElementById("rememberMeCheckbox")?.checked;

  if (!pwInput) return;

  const entered = pwInput.value.trim();
  const correctPassword = getAdminPassword();

  if (entered === correctPassword || entered === DEFAULT_ADMIN_PASSWORD) {
    if (errorMsg) errorMsg.style.display = "none";

    // Set auth tokens
    sessionStorage.setItem(STORAGE_KEY_AUTH, "true");
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY_AUTH, "true");
    }

    showToast("Welcome! Admin dashboard unlocked.", "success");
    showAdminDashboard();
  } else {
    if (errorMsg) {
      errorMsg.style.display = "flex";
      if (errorText) errorText.textContent = "Incorrect admin password. Please try again.";
    }
    const card = document.querySelector(".auth-card");
    if (card) {
      card.classList.remove("shake");
      void card.offsetWidth; // Trigger reflow
      card.classList.add("shake");
    }
    pwInput.select();
  }
}

function togglePasswordVisibility() {
  const pwInput = document.getElementById("adminPasswordInput");
  if (!pwInput) return;
  const isPw = pwInput.type === "password";
  pwInput.type = isPw ? "text" : "password";
}

function handleAdminLogout() {
  sessionStorage.removeItem(STORAGE_KEY_AUTH);
  localStorage.removeItem(STORAGE_KEY_AUTH);
  showToast("Logged out of admin console.", "info");
  showAuthScreen();
}

// ======================================================================
// 2. TABS & NAVIGATION
// ======================================================================
function switchTab(tabId) {
  // If product modal is open, close it
  const modal = document.getElementById("productModal");
  if (modal && modal.style.display !== "none") {
    closeProductModal();
  }

  const tabMap = {
    products: { btn: "tabBtnProducts", panel: "panelProducts" },
    categories: { btn: "tabBtnCategories", panel: "panelCategories" },
    settings: { btn: "tabBtnSettings", panel: "panelSettings" },
    whatsapp: { btn: "tabBtnWhatsApp", panel: "panelWhatsApp" }
  };

  Object.keys(tabMap).forEach(key => {
    const info = tabMap[key];
    const btn = document.getElementById(info.btn);
    const panel = document.getElementById(info.panel);
    const isTarget = (key === tabId);
    if (btn) btn.classList.toggle("active", isTarget);
    if (panel) {
      panel.style.display = isTarget ? "block" : "none";
      panel.classList.toggle("active", isTarget);
    }
  });

  if (tabId === "whatsapp") {
    initWhatsAppStudio();
  } else if (tabId === "categories") {
    renderCategoriesManagement();
  } else if (tabId === "products") {
    renderProductsCatalog();
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ======================================================================
// 3. METRICS & COUNTERS
// ======================================================================
function renderDashboardMetrics() {
  const total = currentProducts.length;
  const inStock = currentProducts.filter(p => p.inStock !== false).length;
  const featured = currentProducts.filter(p => p.featured || p.tag === "Bestseller").length;

  const totalEl = document.getElementById("metricTotalProducts");
  const inStockEl = document.getElementById("metricInStock");
  const featuredEl = document.getElementById("metricFeatured");
  const tabBadge = document.getElementById("tabProductCount");

  if (totalEl) totalEl.textContent = total;
  if (inStockEl) inStockEl.textContent = `${inStock} / ${total}`;
  if (featuredEl) featuredEl.textContent = featured;
  if (tabBadge) tabBadge.textContent = total;
}

// ======================================================================
// 4. PRODUCT CATALOG MANAGEMENT
// ======================================================================
function renderProductsCatalog() {
  const container = document.getElementById("productCatalogContainer");
  if (!container) return;

  // Filter products
  const query = searchQuery.trim().toLowerCase();
  const filtered = currentProducts.filter(p => {
    const matchesCat = (activeCategory === "All" || p.category === activeCategory);
    const matchesSearch = !query || 
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.tag && p.tag.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query));
    return matchesCat && matchesSearch;
  });

  renderDashboardMetrics();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Products Found</h3>
        <p>${query ? `No items matched "${escapeHtml(query)}" in category "${activeCategory}".` : 'Your catalog has no products in this category.'}</p>
        <button type="button" class="btn-primary" onclick="openProductModal()">+ Add Product Now</button>
      </div>
    `;
    return;
  }

  const cardsHtml = filtered.map(p => {
    const inStock = p.inStock !== false;
    const tagBadge = p.tag ? `<span class="badge-pill badge-tag">${escapeHtml(p.tag)}</span>` : "";
    const oldPriceHtml = p.oldPrice ? `<span class="price-old">${escapeHtml(p.oldPrice)}</span>` : "";

    return `
      <div class="product-admin-card" id="prodCard-${p.id}">
        <div class="card-top-row">
          <div class="card-thumb-wrapper">
            <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="card-thumb" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1608248597359-2e11894d0fb8?auto=format&fit=crop&w=800&q=80'" />
          </div>
          <div class="card-main-meta">
            <div class="badge-row">
              <span class="badge-pill badge-category">${escapeHtml(p.category || 'Product')}</span>
              ${tagBadge}
            </div>
            <h4 class="card-prod-title" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h4>
            <div class="price-row">
              <span class="price-current">${escapeHtml(p.price)}</span>
              ${oldPriceHtml}
            </div>
          </div>
        </div>

        <div class="card-body-meta">
          <div class="stock-toggle-row">
            <span class="stock-status-pill ${inStock ? 'in-stock' : 'out-of-stock'}">
              <span class="stock-dot"></span>
              ${inStock ? 'In Stock' : 'Out of Stock'}
            </span>
            <button type="button" class="btn-toggle-stock" onclick="toggleStockStatus(${p.id})">
              ${inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
            </button>
          </div>

          <p class="card-desc-snippet">${escapeHtml(p.description || p.fullDescription || 'Quality botanical product.')}</p>
        </div>

        <div class="card-actions-row">
          <button type="button" class="btn-card-action" onclick="openProductModal('${p.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit</span>
          </button>

          <button type="button" class="btn-card-action btn-wa-test" onclick="testProductWhatsApp('${p.id}')" title="Generate and test WhatsApp order message">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.073.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/>
            </svg>
            <span>WhatsApp</span>
          </button>

          <button type="button" class="btn-card-action btn-delete" onclick="confirmDeleteProduct('${p.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = `<div class="products-admin-grid">${cardsHtml}</div>`;
}

function handleAdminSearch(val) {
  searchQuery = val;
  renderProductsCatalog();
}

function setAdminCategory(cat) {
  activeCategory = cat;
  const pills = document.querySelectorAll("#adminCategoryPills .cat-pill");
  pills.forEach(pill => {
    pill.classList.toggle("active", pill.textContent.trim() === cat);
  });
  renderProductsCatalog();
}

function toggleStockStatus(id) {
  const prod = currentProducts.find(p => String(p.id) === String(id) || Number(p.id) === Number(id));
  if (!prod) return;

  prod.inStock = prod.inStock === false ? true : false;
  saveProductsToStorage();
  renderProductsCatalog();
  showToast(`Updated stock status for "${prod.name}"`, "info");
}

// Single Product Deletion Modal & Engine
function openDeleteProductModal(id) {
  const prod = currentProducts.find(p => String(p.id) === String(id) || Number(p.id) === Number(id));
  if (!prod) return;

  const modal = document.getElementById("deleteProductModal");
  if (!modal) {
    if (confirm(`Are you sure you want to delete "${prod.name}" from your store catalog?`)) {
      currentProducts = currentProducts.filter(p => String(p.id) !== String(id));
      saveProductsToStorage();
      renderProductsCatalog();
      populateWhatsAppGenProducts();
      showToast(`Deleted "${prod.name}"`, "info");
    }
    return;
  }

  const idField = document.getElementById("deleteProductTargetId");
  const imgEl = document.getElementById("deleteProductPreviewImg");
  const nameEl = document.getElementById("deleteProductNameText");
  const catEl = document.getElementById("deleteProductCategoryText");
  const priceEl = document.getElementById("deleteProductPriceText");

  if (idField) idField.value = prod.id;
  if (imgEl) imgEl.src = prod.image || "";
  if (nameEl) nameEl.textContent = prod.name || "Product";
  if (catEl) catEl.textContent = prod.category || "General";
  if (priceEl) priceEl.textContent = prod.price || "₦0";

  modal.style.display = "flex";
}

function closeDeleteProductModal() {
  const modal = document.getElementById("deleteProductModal");
  if (modal) modal.style.display = "none";
}

function handleConfirmDeleteProduct(event) {
  if (event) event.preventDefault();
  const idField = document.getElementById("deleteProductTargetId");
  const targetId = idField?.value;
  if (!targetId) {
    closeDeleteProductModal();
    return;
  }

  const prod = currentProducts.find(p => String(p.id) === String(targetId) || Number(p.id) === Number(targetId));
  const prodName = prod ? prod.name : "Product";

  currentProducts = currentProducts.filter(p => String(p.id) !== String(targetId));
  saveProductsToStorage();
  closeDeleteProductModal();
  renderProductsCatalog();
  populateWhatsAppGenProducts();
  showToast(`Permanently deleted "${prodName}" from catalog`, "info");
}

function confirmDeleteProduct(id) {
  openDeleteProductModal(id);
}

// Delete All Products Modal & Engine
function openDeleteAllProductsModal() {
  const modal = document.getElementById("deleteAllProductsModal");
  if (modal) {
    modal.style.display = "flex";
  } else if (confirm("Are you sure you want to delete ALL products from your store catalog?")) {
    handleConfirmDeleteAllProducts();
  }
}

function closeDeleteAllProductsModal() {
  const modal = document.getElementById("deleteAllProductsModal");
  if (modal) modal.style.display = "none";
}

function handleConfirmDeleteAllProducts(event) {
  if (event) event.preventDefault();
  currentProducts = [];
  saveProductsToStorage();
  closeDeleteAllProductsModal();
  renderProductsCatalog();
  populateWhatsAppGenProducts();
  showToast("All products have been deleted from store catalog", "info");
}

// Restore 27 Botanical Products Engine
function confirmResetDefaults() {
  const count = currentProducts.length;
  const msg = count > 0 
    ? `Restore all 27 curated botanical products? This will replace your current catalog (${count} items) with the complete 27-item Nigerian health & wellness catalog.`
    : `Restore all 27 curated botanical products to your catalog?`;

  if (!confirm(msg)) return;

  const fresh = typeof window.getFreshDefaultProducts === "function"
    ? window.getFreshDefaultProducts()
    : JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));

  currentProducts = fresh;
  localStorage.setItem("healthIsWealth_catalog_version", CATALOG_VERSION);
  saveProductsToStorage();
  renderProductsCatalog();
  populateWhatsAppGenProducts();
  showToast("Successfully restored all 27 curated botanical products!", "success");
}

// ======================================================================
// ======================================================================
// 5. ADD / EDIT PRODUCT WORKSPACE (PAGE VIEW)
// ======================================================================
function openProductModal(id = null) {
  const modal = document.getElementById("productModal");
  const modalTitle = document.getElementById("modalTitle");
  const editId = document.getElementById("editProductId");
  const breadcrumbTitle = document.getElementById("editorBreadcrumbTitle");

  const nameInput = document.getElementById("prodName");
  const catInput = document.getElementById("prodCategory");
  const priceInput = document.getElementById("prodPrice");
  const oldPriceInput = document.getElementById("prodOldPrice");
  const tagInput = document.getElementById("prodTag");
  const imgInput = document.getElementById("prodImage");
  const inStockCheck = document.getElementById("prodInStock");
  const inStockLabel = document.getElementById("prodInStockLabel");
  const featuredCheck = document.getElementById("prodFeatured");
  const descInput = document.getElementById("prodDesc") || document.getElementById("prodShortDesc");
  const benefitsInput = document.getElementById("prodBenefits");
  const deleteBtn = document.getElementById("btnDeleteFromEditModal");
  const deleteBtnFooter = document.getElementById("btnDeleteFromEditModalFooter");
  const saveBtn = document.getElementById("saveProductBtn");
  const saveBtnText = document.getElementById("saveProductBtnText");
  const saveBtnTopText = document.getElementById("saveProductBtnTopText");

  if (!modal) return;

  // Refresh category options dynamically
  populateCategorySelects();

  if (id !== null && id !== undefined && id !== "") {
    // Editing existing product
    const prod = currentProducts.find(p => String(p.id) === String(id) || Number(p.id) === Number(id));
    if (!prod) {
      showToast("Product not found.", "error");
      return;
    }

    const prodDisplayName = prod.name || "Product";
    if (modalTitle) modalTitle.textContent = "Edit: " + prodDisplayName;
    if (breadcrumbTitle) breadcrumbTitle.textContent = "Edit: " + prodDisplayName;
    if (editId) editId.value = prod.id;
    if (deleteBtn) deleteBtn.style.display = "inline-flex";
    if (deleteBtnFooter) deleteBtnFooter.style.display = "inline-flex";
    
    if (saveBtnText) saveBtnText.textContent = "Save Changes";
    if (saveBtnTopText) saveBtnTopText.textContent = "Save Changes";
    if (saveBtn && !saveBtnText) saveBtn.textContent = "Save Changes";

    if (nameInput) nameInput.value = prod.name || "";
    
    // Ensure category option exists and selects accurately
    if (catInput && prod.category) {
      const matchingOpt = Array.from(catInput.options).find(o => o.value.toLowerCase() === prod.category.toLowerCase());
      if (matchingOpt) {
        catInput.value = matchingOpt.value;
      } else {
        const opt = document.createElement("option");
        opt.value = prod.category;
        opt.textContent = prod.category;
        catInput.appendChild(opt);
        catInput.value = prod.category;
      }
    } else if (catInput && currentCategories.length > 0) {
      catInput.value = currentCategories[0];
    }

    // Format price without Naira symbol inside input field so user can edit cleanly
    if (priceInput) {
      const priceRaw = prod.price ? String(prod.price).replace(/[^0-9]/g, "") : (prod.priceNum ? String(prod.priceNum) : "");
      const priceVal = parseInt(priceRaw, 10);
      priceInput.value = (!isNaN(priceVal) && priceVal > 0) ? priceVal.toLocaleString("en-NG") : "";
    }
    
    if (oldPriceInput) {
      const oldPriceRaw = prod.oldPrice ? String(prod.oldPrice).replace(/[^0-9]/g, "") : "";
      const oldPriceVal = parseInt(oldPriceRaw, 10);
      oldPriceInput.value = (!isNaN(oldPriceVal) && oldPriceVal > 0) ? oldPriceVal.toLocaleString("en-NG") : "";
    }

    if (tagInput) tagInput.value = prod.tag || "";
    
    // Set image value and display preview card
    if (imgInput) imgInput.value = prod.image || "";
    displayProductImagePreview(prod.image || "", false, prod.name);

    if (inStockCheck) inStockCheck.checked = prod.inStock !== false;
    if (inStockLabel) inStockLabel.textContent = (inStockCheck && inStockCheck.checked) ? "In Stock (Available)" : "Out of Stock";
    if (featuredCheck) featuredCheck.checked = !!prod.featured;
    if (descInput) descInput.value = prod.description || prod.fullDescription || "";
    if (benefitsInput) benefitsInput.value = Array.isArray(prod.benefits) ? prod.benefits.join("\n") : "";
  } else {
    // Adding new product
    if (modalTitle) modalTitle.textContent = "Add New Botanical Product";
    if (breadcrumbTitle) breadcrumbTitle.textContent = "New Product";
    if (editId) editId.value = "";
    if (deleteBtn) deleteBtn.style.display = "none";
    if (deleteBtnFooter) deleteBtnFooter.style.display = "none";
    
    if (saveBtnText) saveBtnText.textContent = "Add Product to Store";
    if (saveBtnTopText) saveBtnTopText.textContent = "Add to Store";
    if (saveBtn && !saveBtnText) saveBtn.textContent = "Add Product to Store";

    document.getElementById("productForm")?.reset();
    if (inStockCheck) inStockCheck.checked = true;
    if (inStockLabel) inStockLabel.textContent = "In Stock (Available)";
    
    // Reset file upload state
    clearProductPhoto();
  }

  // Bind inStock checkbox label update & preview
  if (inStockCheck) {
    inStockCheck.onchange = () => {
      if (inStockLabel) inStockLabel.textContent = inStockCheck.checked ? "In Stock (Available)" : "Out of Stock";
      updateLiveStorePreview();
    };
  }

  // Update real-time storefront preview
  updateLiveStorePreview();

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  const scrollContainer = document.getElementById("productModalBodyScroll") || modal.querySelector(".editor-body-scroll");
  if (scrollContainer) {
    scrollContainer.scrollTop = 0;
  }
}

function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) modal.style.display = "none";
  document.body.style.overflow = "";
}

function openDeleteModalFromEdit() {
  const editId = document.getElementById("editProductId")?.value;
  if (!editId) return;
  closeProductModal();
  confirmDeleteProduct(editId);
}

// ----------------------------------------------------------------------
// REAL-TIME STOREFRONT PREVIEW & VALUE CALCULATOR
// ----------------------------------------------------------------------
function updateLiveStorePreview() {
  const name = document.getElementById("prodName")?.value?.trim();
  const category = document.getElementById("prodCategory")?.value || "Health";
  const rawPrice = document.getElementById("prodPrice")?.value?.trim() || "";
  const rawOldPrice = document.getElementById("prodOldPrice")?.value?.trim() || "";
  const tag = document.getElementById("prodTag")?.value || "";
  const inStock = document.getElementById("prodInStock")?.checked ?? true;
  const desc = document.getElementById("prodDesc")?.value?.trim() || document.getElementById("prodShortDesc")?.value?.trim() || "";
  const image = document.getElementById("prodImage")?.value?.trim();

  // Mockup elements
  const mockupTitle = document.getElementById("mockupTitle");
  const mockupCat = document.getElementById("mockupCat");
  const mockupDesc = document.getElementById("mockupDesc");
  const mockupImg = document.getElementById("mockupImg");
  const mockupPrice = document.getElementById("mockupPrice");
  const mockupOldPrice = document.getElementById("mockupOldPrice");
  const mockupTagBadge = document.getElementById("mockupTagBadge");
  const mockupStockPill = document.getElementById("mockupStockPill");
  const mockupDiscountBadge = document.getElementById("mockupDiscountBadge");

  // Insight elements
  const insightCard = document.getElementById("pricingInsightCard");
  const insightBadge = document.getElementById("insightSavingsBadge");
  const insightText = document.getElementById("insightSavingsText");

  // Status badge in header
  const headerStatusBadge = document.getElementById("editorHeaderStatusBadge");
  const headerStatusText = document.getElementById("editorHeaderStatusText");
  const stockStatusDesc = document.getElementById("stockStatusDescription");
  const inStockLabel = document.getElementById("prodInStockLabel");

  if (mockupTitle) mockupTitle.textContent = name || "Product Title Preview";
  if (mockupCat) mockupCat.textContent = category;
  if (mockupDesc) mockupDesc.textContent = desc || "Product botanical formulation and description will appear here...";
  if (mockupImg) {
    mockupImg.src = image || "https://i.ibb.co/fzC47YSs/IMG-20251123-WA0004-1.jpg";
  }

  // Parse prices
  const priceNum = parseInt(rawPrice.replace(/[^0-9]/g, ""), 10);
  const oldPriceNum = parseInt(rawOldPrice.replace(/[^0-9]/g, ""), 10);

  if (mockupPrice) {
    mockupPrice.textContent = (!isNaN(priceNum) && priceNum > 0) ? `₦${priceNum.toLocaleString("en-NG")}` : "₦0";
  }

  if (mockupOldPrice) {
    if (!isNaN(oldPriceNum) && oldPriceNum > (priceNum || 0)) {
      mockupOldPrice.textContent = `₦${oldPriceNum.toLocaleString("en-NG")}`;
      mockupOldPrice.style.display = "inline";
    } else {
      mockupOldPrice.style.display = "none";
    }
  }

  // Savings & Discounts
  if (!isNaN(priceNum) && !isNaN(oldPriceNum) && oldPriceNum > priceNum) {
    const diff = oldPriceNum - priceNum;
    const percent = Math.round((diff / oldPriceNum) * 100);
    if (mockupDiscountBadge) {
      mockupDiscountBadge.textContent = `${percent}% OFF`;
      mockupDiscountBadge.style.display = "inline-block";
    }
    if (insightCard) insightCard.style.display = "block";
    if (insightBadge) insightBadge.textContent = `Customer Saves ₦${diff.toLocaleString("en-NG")} (${percent}% OFF)`;
    if (insightText) insightText.textContent = `Discounted offer with verified savings badge visible to shoppers on WhatsApp.`;
  } else {
    if (mockupDiscountBadge) mockupDiscountBadge.style.display = "none";
    if (insightCard) insightCard.style.display = "none";
  }

  // Badges & Tag
  if (mockupTagBadge) {
    if (tag) {
      mockupTagBadge.textContent = tag;
      mockupTagBadge.style.display = "inline-block";
    } else {
      mockupTagBadge.style.display = "none";
    }
  }

  // Stock status styling
  if (inStock) {
    if (mockupStockPill) {
      mockupStockPill.textContent = "In Stock";
      mockupStockPill.className = "mockup-stock-pill in-stock";
    }
    if (headerStatusBadge) {
      headerStatusBadge.className = "editor-status-badge in-stock";
    }
    if (headerStatusText) headerStatusText.textContent = "In Stock";
    if (inStockLabel) inStockLabel.textContent = "In Stock (Available)";
    if (stockStatusDesc) stockStatusDesc.textContent = "Product can be ordered immediately via WhatsApp";
  } else {
    if (mockupStockPill) {
      mockupStockPill.textContent = "Out of Stock";
      mockupStockPill.className = "mockup-stock-pill out-stock";
    }
    if (headerStatusBadge) {
      headerStatusBadge.className = "editor-status-badge out-stock";
    }
    if (headerStatusText) headerStatusText.textContent = "Out of Stock";
    if (inStockLabel) inStockLabel.textContent = "Out of Stock";
    if (stockStatusDesc) stockStatusDesc.textContent = "Product marked unavailable; customers see Out of Stock notice";
  }
}
window.updateLiveStorePreview = updateLiveStorePreview;

function applyPresetPhoto(url, label) {
  const hiddenInput = document.getElementById("prodImage");
  if (hiddenInput) hiddenInput.value = url;
  displayProductImagePreview(url, false, label);
  updateLiveStorePreview();
  showToast(`Applied photo: ${label}`, "success");
}
window.applyPresetPhoto = applyPresetPhoto;

function addBenefitPreset(text) {
  const textarea = document.getElementById("prodBenefits");
  if (!textarea) return;
  const current = textarea.value.trim();
  if (current.includes(text)) {
    showToast("Benefit bullet already added", "info");
    return;
  }
  textarea.value = current ? `${current}\n${text}` : text;
  showToast("Added benefit bullet", "success");
}
window.addBenefitPreset = addBenefitPreset;

function formatPriceInput(input) {
  if (!input) return;
  const rawDigits = input.value.replace(/[^0-9]/g, "");
  if (!rawDigits) {
    input.value = "";
    return;
  }
  const num = parseInt(rawDigits, 10);
  if (!isNaN(num)) {
    input.value = num.toLocaleString("en-NG");
  }
}

// ======================================================================
// DEVICE FILE UPLOAD & IMAGE OPTIMIZATION (PHONE OR COMPUTER)
// ======================================================================

function triggerProductFileInput() {
  const fileInput = document.getElementById("prodImageFileInput");
  if (fileInput) {
    fileInput.value = ""; // reset to allow re-selecting same file
    fileInput.click();
  }
}
window.triggerProductFileInput = triggerProductFileInput;

function compressImageFile(file, maxWidth = 600, maxHeight = 600, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      return reject(new Error("Selected file is not an image"));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // White background for transparent PNG/WebP conversions
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image for optimization"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file from your device"));
    reader.readAsDataURL(file);
  });
}

async function handleProductFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    showToast("Processing photo from your device...", "info");
    const optimizedDataUrl = await compressImageFile(file);
    displayProductImagePreview(optimizedDataUrl, true, file.name);
    const hiddenInput = document.getElementById("prodImage");
    if (hiddenInput) hiddenInput.value = optimizedDataUrl;
    showToast("Product photo loaded successfully!", "success");
  } catch (err) {
    console.error("Error processing photo:", err);
    showToast("Could not process photo file. Please try another image.", "error");
  }
}
window.handleProductFileSelect = handleProductFileSelect;

function handleProductDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  const dropzone = document.getElementById("productFileDropzone");
  if (dropzone) dropzone.classList.add("dragover");
}
window.handleProductDragOver = handleProductDragOver;

function handleProductDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  const dropzone = document.getElementById("productFileDropzone");
  if (dropzone) dropzone.classList.remove("dragover");
}
window.handleProductDragLeave = handleProductDragLeave;

async function handleProductFileDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const dropzone = document.getElementById("productFileDropzone");
  if (dropzone) dropzone.classList.remove("dragover");

  const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  if (!file) return;

  try {
    showToast("Processing dropped photo...", "info");
    const optimizedDataUrl = await compressImageFile(file);
    displayProductImagePreview(optimizedDataUrl, true, file.name);
    const hiddenInput = document.getElementById("prodImage");
    if (hiddenInput) hiddenInput.value = optimizedDataUrl;
    showToast("Product photo loaded successfully!", "success");
  } catch (err) {
    console.error("Error processing dropped photo:", err);
    showToast("Could not process photo. Please try another file.", "error");
  }
}
window.handleProductFileDrop = handleProductFileDrop;

function displayProductImagePreview(src, isNewUpload = false, filename = "") {
  const previewBox = document.getElementById("productImagePreviewContainer");
  const thumb = document.getElementById("productImageThumb");
  const nameLabel = document.getElementById("productImageMetaName");
  const statusLabel = document.getElementById("productImageMetaStatus");
  const dropzone = document.getElementById("productFileDropzone");
  const hiddenInput = document.getElementById("prodImage");

  if (!previewBox || !thumb) return;

  if (src && src.trim()) {
    thumb.src = src.trim();
    if (nameLabel) {
      nameLabel.textContent = filename || (isNewUpload ? "Device photo uploaded" : "Current product photo");
    }
    if (statusLabel) {
      statusLabel.textContent = isNewUpload ? "✓ Optimized & ready to save" : "✓ Active in catalog";
      statusLabel.style.color = "#059669";
    }
    previewBox.style.display = "flex";
    if (dropzone) {
      dropzone.style.display = "none";
    }
    if (hiddenInput) {
      hiddenInput.value = src.trim();
    }
  } else {
    previewBox.style.display = "none";
    if (dropzone) {
      dropzone.style.display = "flex";
    }
    if (hiddenInput) {
      hiddenInput.value = "";
    }
  }

  if (typeof updateLiveStorePreview === "function") {
    updateLiveStorePreview();
  }
}
window.displayProductImagePreview = displayProductImagePreview;

function clearProductPhoto() {
  const fileInput = document.getElementById("prodImageFileInput");
  const hiddenInput = document.getElementById("prodImage");
  const manualInput = document.getElementById("prodImageUrlManual");
  if (fileInput) fileInput.value = "";
  if (hiddenInput) hiddenInput.value = "";
  if (manualInput) manualInput.value = "";
  displayProductImagePreview("", false);
}
window.clearProductPhoto = clearProductPhoto;

function toggleProductUrlInput() {
  const wrap = document.getElementById("productUrlInputWrap");
  const btn = document.getElementById("btnToggleUrlInput");
  if (!wrap) return;
  const isHidden = wrap.style.display === "none" || !wrap.style.display;
  wrap.style.display = isHidden ? "block" : "none";
  if (btn) {
    btn.textContent = isHidden ? "Hide web address field" : "Or paste image web address";
  }
}
window.toggleProductUrlInput = toggleProductUrlInput;

function handleManualUrlInput(url) {
  if (!url || !url.trim()) return;
  const trimmed = url.trim();
  const hiddenInput = document.getElementById("prodImage");
  if (hiddenInput) hiddenInput.value = trimmed;
  displayProductImagePreview(trimmed, false, "Web image URL");
}
window.handleManualUrlInput = handleManualUrlInput;

function handleSaveProduct(event) {
  if (event && event.preventDefault) event.preventDefault();

  const editId = document.getElementById("editProductId")?.value;
  const name = document.getElementById("prodName")?.value.trim();
  const category = document.getElementById("prodCategory")?.value || "Health";
  let price = document.getElementById("prodPrice")?.value.trim() || "";
  let oldPrice = document.getElementById("prodOldPrice")?.value.trim() || "";
  const tag = document.getElementById("prodTag")?.value || "";
  let image = document.getElementById("prodImage")?.value?.trim() || "";
  const inStock = document.getElementById("prodInStock")?.checked ?? true;
  const featured = document.getElementById("prodFeatured")?.checked ?? false;
  const description = document.getElementById("prodDesc")?.value.trim() || document.getElementById("prodShortDesc")?.value.trim() || "";
  const benefitsText = document.getElementById("prodBenefits")?.value.trim() || "";

  if (!name) {
    showToast("Please enter a product title", "error");
    document.getElementById("prodName")?.focus();
    return;
  }

  // Normalize and validate price
  const priceDigits = price.replace(/[^0-9]/g, "");
  const priceNum = parseInt(priceDigits, 10);
  if (!priceNum || isNaN(priceNum) || priceNum <= 0) {
    showToast("Please enter a valid price (e.g. 15,000)", "error");
    document.getElementById("prodPrice")?.focus();
    return;
  }
  const formattedPrice = "₦" + priceNum.toLocaleString("en-NG");

  let formattedOldPrice = undefined;
  if (oldPrice) {
    const oldPriceDigits = oldPrice.replace(/[^0-9]/g, "");
    const oldPriceNum = parseInt(oldPriceDigits, 10);
    if (oldPriceNum > 0) {
      formattedOldPrice = "₦" + oldPriceNum.toLocaleString("en-NG");
    }
  }

  const benefits = benefitsText 
    ? benefitsText.split("\n").map(b => b.trim()).filter(Boolean)
    : [];

  // 1. If image input is empty, check manual URL input
  if (!image) {
    const manualUrl = document.getElementById("prodImageUrlManual")?.value?.trim();
    if (manualUrl) {
      image = manualUrl;
    }
  }

  // 2. If editing and no new photo was selected, retain existing product photo
  if (!image && editId) {
    const existing = currentProducts.find(p => String(p.id) === String(editId) || Number(p.id) === Number(editId));
    if (existing && existing.image) {
      image = existing.image;
    }
  }

  // 3. If STILL no photo provided, assign high-quality botanical placeholder matching category
  if (!image) {
    const defaultBotanyImages = {
      Health: "https://i.ibb.co/fzC47YSs/IMG-20251123-WA0004-1.jpg",
      "Beauty/Wellness": "https://i.ibb.co/7tS64CcB/IMG-20260403-WA0004-1.jpg"
    };
    image = defaultBotanyImages[category] || "https://i.ibb.co/fzC47YSs/IMG-20251123-WA0004-1.jpg";
  }

  if (editId) {
    // Update existing product
    const index = currentProducts.findIndex(p => String(p.id) === String(editId) || Number(p.id) === Number(editId));
    if (index !== -1) {
      const existing = currentProducts[index];
      currentProducts[index] = {
        ...existing,
        name,
        category,
        price: formattedPrice,
        priceNum,
        oldPrice: formattedOldPrice,
        tag: tag || undefined,
        image,
        inStock,
        featured,
        description: description || existing.description || `Premium botanical ${name}.`,
        fullDescription: description || existing.fullDescription || existing.description || `A rich, natural herbal formula specially crafted with organic botanicals.`,
        benefits: benefits.length > 0 ? benefits : (existing.benefits && existing.benefits.length > 0 ? existing.benefits : [])
      };
      showToast(`Saved changes to "${name}" successfully!`, "success");
    } else {
      showToast("Could not find product with ID " + editId, "error");
      return;
    }
  } else {
    // Add new product with guaranteed unique ID
    const numericIds = currentProducts.map(p => Number(p.id)).filter(n => !isNaN(n));
    const newId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

    const newProduct = {
      id: newId,
      name,
      category,
      price: formattedPrice,
      priceNum,
      oldPrice: formattedOldPrice,
      tag: tag || undefined,
      image,
      inStock,
      featured,
      description: description || `Premium botanical ${name}.`,
      fullDescription: description || `A rich, natural herbal formula specially crafted with organic botanicals and holistic vitality.`,
      benefits: benefits.length > 0 ? benefits : []
    };

    currentProducts.unshift(newProduct);
    showToast(`Added "${name}" to product catalog!`, "success");
  }

  saveProductsToStorage();
  closeProductModal();
  renderProductsCatalog();
  populateWhatsAppGenProducts();
}

function saveProductsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(currentProducts));
    localStorage.setItem("healthIsWealth_user_edited", "true");
    renderDashboardMetrics();
    window.dispatchEvent(new Event("productsUpdated"));
    try {
      window.dispatchEvent(new StorageEvent("storage", {
        key: STORAGE_KEY_PRODUCTS,
        newValue: JSON.stringify(currentProducts)
      }));
    } catch (e) {}
  } catch (e) {
    console.error("Failed to save products to localStorage:", e);
    showToast("Error saving products to local storage. If you uploaded a large photo, try a smaller image.", "error");
  }
}

// ======================================================================
// 6. CATEGORY MANAGEMENT ENGINE (CRUD)
// ======================================================================
function saveCategoriesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(currentCategories));
    window.dispatchEvent(new Event("categoriesUpdated"));
  } catch (e) {
    console.error("Error saving categories:", e);
    showToast("Error saving categories to local storage", "error");
  }
}

function renderAdminCategoryPills() {
  const container = document.getElementById("adminCategoryPills");
  if (!container) return;

  const categories = ["All", "Health", "Beauty/Wellness"];
  container.innerHTML = categories.map(cat => `
    <button 
      type="button" 
      class="cat-pill ${cat === activeCategory ? 'active' : ''}" 
      onclick="setAdminCategory('${escapeHtml(cat)}')"
    >
      ${escapeHtml(cat)}
    </button>
  `).join("");
}

function populateCategorySelects() {
  const select = document.getElementById("prodCategory");
  if (select) {
    select.innerHTML = `
      <option value="Health">Health</option>
      <option value="Beauty/Wellness">Beauty/Wellness</option>
    `;
  }
}

function getCategoryIcon(catName) {
  const lower = (catName || "").toLowerCase();
  if (lower.includes("health")) return "🌿";
  return "✨";
}

function renderCategoriesManagement() {
  const container = document.getElementById("adminCategoriesList");
  const tabBadge = document.getElementById("tabCategoryCount");
  if (tabBadge) tabBadge.textContent = "2";

  if (!container) return;

  const categories = [
    {
      name: "Health",
      desc: "Herbal immune boosters, organic vitality capsules, blood & digestive cleansers, and health infusions",
      icon: "🌿"
    },
    {
      name: "Beauty/Wellness",
      desc: "Radiance facial serums, nourishing body milks, organic soaps, hair growth tonics & holistic wellness",
      icon: "✨"
    }
  ];

  container.innerHTML = categories.map(cat => {
    const count = currentProducts.filter(p => {
      const pCat = (p.category || "").toLowerCase();
      if (cat.name === "Health") return pCat === "health" || pCat.includes("health");
      return pCat === "beauty/wellness" || pCat.includes("beauty") || pCat.includes("wellne");
    }).length;

    return `
      <div class="category-row-item" style="display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #e5e7eb; background:#fff;">
        <div class="cat-info-col" style="display:flex; align-items:center; gap:16px;">
          <div class="cat-icon-tag" aria-hidden="true" style="font-size:1.6rem; width:44px; height:44px; display:flex; align-items:center; justify-content:center; background:#f0fdf4; border-radius:10px;">${cat.icon}</div>
          <div>
            <div class="cat-name-heading" style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
              <span style="font-weight:700; font-size:1.05rem; color:#111827;">${cat.name}</span>
              <span class="cat-count-badge" style="background:#f3f4f6; color:#374151; font-size:0.75rem; font-weight:600; padding:2px 8px; border-radius:12px;">${count} ${count === 1 ? 'product' : 'products'}</span>
              <span style="background:#ecfdf5; color:#065f46; font-size:0.75rem; font-weight:600; padding:2px 8px; border-radius:12px; border:1px solid #a7f3d0;">Active Core Category</span>
            </div>
            <p style="margin:0; font-size:0.85rem; color:#6b7280; max-width:540px;">${cat.desc}</p>
          </div>
        </div>

        <div class="cat-actions-col" style="display:flex; align-items:center; gap:8px;">
          <button 
            type="button" 
            class="btn-secondary btn-sm" 
            onclick="setAdminCategory('${cat.name}'); switchTab('products');" 
            title="Filter and view all products under ${cat.name}"
            style="display:inline-flex; align-items:center; gap:6px; font-size:0.85rem; padding:6px 12px;"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>View Products (${count})</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function handleCreateCategory(event) {
  if (event && event.preventDefault) event.preventDefault();
  showToast('Store categories are strictly locked to "Health" and "Beauty/Wellness".', 'info');
}

function openEditCategoryModal(catName) {
  showToast('Store categories are standardized as "Health" and "Beauty/Wellness".', 'info');
}

function closeEditCategoryModal() {
  const modal = document.getElementById("editCategoryModal");
  if (modal) modal.style.display = "none";
}

function handleSaveEditedCategory(event) {
  if (event && event.preventDefault) event.preventDefault();
  closeEditCategoryModal();
}

function handleSaveEditCategory(event) {
  return handleSaveEditedCategory(event);
}

function openDeleteCategoryModal(catName) {
  showToast('Core store categories ("Health" and "Beauty/Wellness") cannot be deleted.', 'info');
}

function closeDeleteCategoryModal() {
  const modal = document.getElementById("deleteCategoryModal");
  if (modal) modal.style.display = "none";
}

function handleConfirmDeleteCategory(event) {
  if (event && event.preventDefault) event.preventDefault();
  closeDeleteCategoryModal();
  showToast('Core store categories cannot be deleted.', 'info');
}

function confirmResetCategories() {
  currentCategories = ["Health", "Beauty/Wellness"];
  saveCategoriesToStorage();
  
  // Re-normalize all products
  currentProducts.forEach(p => {
    const lower = (p.category || "").toLowerCase();
    p.category = (lower === "health" || lower.includes("health")) ? "Health" : "Beauty/Wellness";
  });
  saveProductsToStorage();

  renderCategoriesManagement();
  renderAdminCategoryPills();
  populateCategorySelects();
  renderProductsCatalog();
  showToast("Categories confirmed as Health and Beauty/Wellness.", "success");
}

// ======================================================================
// 7. STORE SETTINGS, BANK DETAILS & MARQUEE
// ======================================================================
function populateSettingsForm() {
  const waNum = document.getElementById("cfgWhatsAppNumber");
  const phoneDisp = document.getElementById("cfgPhoneDisplay");
  const bankName = document.getElementById("cfgBankName");
  const bankAcct = document.getElementById("cfgBankAccount");
  const acctName = document.getElementById("cfgAccountName");
  const marquee = document.getElementById("cfgMarqueeText");
  const loc = document.getElementById("cfgLocationText");
  const fbUrl = document.getElementById("cfgFacebookUrl");
  const igUrl = document.getElementById("cfgInstagramUrl");
  const adminPw = document.getElementById("cfgAdminPassword");

  if (waNum) waNum.value = currentConfig.whatsappNumber || "2348084765252";
  if (phoneDisp) phoneDisp.value = currentConfig.phoneDisplay || "08084765252";
  if (bankName) bankName.value = currentConfig.bankName || "Sterling Bank";
  if (bankAcct) bankAcct.value = currentConfig.bankAccount || "0097137583";
  if (acctName) acctName.value = currentConfig.accountName || "Ezema Emmanuel Tochukwu";
  if (marquee) marquee.value = currentConfig.marqueeText || DEFAULT_STORE_CONFIG.marqueeText;
  if (loc) loc.value = currentConfig.location || DEFAULT_STORE_CONFIG.location;
  if (fbUrl) fbUrl.value = currentConfig.facebookUrl || DEFAULT_STORE_CONFIG.facebookUrl;
  if (igUrl) igUrl.value = currentConfig.instagramUrl || DEFAULT_STORE_CONFIG.instagramUrl;
  if (adminPw) adminPw.value = getAdminPassword();

  // Supabase Configuration
  if (typeof window.SupabaseStore !== "undefined") {
    const sbCfg = window.SupabaseStore.getConfig();
    const sbUrlInput = document.getElementById("cfgSupabaseUrl");
    const sbKeyInput = document.getElementById("cfgSupabaseAnonKey");
    if (sbUrlInput && sbCfg.url && !sbUrlInput.value) {
      sbUrlInput.value = sbCfg.url;
    }
    if (sbKeyInput && sbCfg.key && !sbKeyInput.value) {
      sbKeyInput.value = sbCfg.key;
    }
    updateSupabaseStatusBadge();
  }
}

function handleSaveSettings(event) {
  event.preventDefault();

  const waNum = document.getElementById("cfgWhatsAppNumber")?.value.trim().replace(/[^0-9]/g, "");
  const phoneDisp = document.getElementById("cfgPhoneDisplay")?.value.trim();
  const bankName = document.getElementById("cfgBankName")?.value.trim();
  const bankAcct = document.getElementById("cfgBankAccount")?.value.trim();
  const acctName = document.getElementById("cfgAccountName")?.value.trim();
  const marquee = document.getElementById("cfgMarqueeText")?.value.trim();
  const loc = document.getElementById("cfgLocationText")?.value.trim();
  const fbUrl = document.getElementById("cfgFacebookUrl")?.value.trim();
  const igUrl = document.getElementById("cfgInstagramUrl")?.value.trim();
  const adminPw = document.getElementById("cfgAdminPassword")?.value.trim();

  currentConfig.whatsappNumber = waNum || "2348084765252";
  currentConfig.phoneDisplay = phoneDisp || "08084765252";
  currentConfig.bankName = bankName || "Sterling Bank";
  currentConfig.bankAccount = bankAcct || "0097137583";
  currentConfig.accountName = acctName || "Ezema Emmanuel Tochukwu";
  currentConfig.marqueeText = marquee || DEFAULT_STORE_CONFIG.marqueeText;
  currentConfig.location = loc || DEFAULT_STORE_CONFIG.location;
  currentConfig.facebookUrl = fbUrl || DEFAULT_STORE_CONFIG.facebookUrl;
  currentConfig.instagramUrl = igUrl || DEFAULT_STORE_CONFIG.instagramUrl;

  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
    localStorage.setItem(STORAGE_KEY_MARQUEE, currentConfig.marqueeText);
    if (adminPw) {
      localStorage.setItem(STORAGE_KEY_ADMIN_PW, adminPw);
    }
    showToast("Store settings, bank details, and social links updated successfully!", "success");
    // Update live WhatsApp studio if open
    initWhatsAppStudio();
  } catch (e) {
    showToast("Error saving store settings", "error");
  }
}

// ======================================================================
// 7B. SUPABASE CLOUD DATABASE INTEGRATION & ENVIRONMENT VARIABLES
// ======================================================================
function updateSupabaseStatusBadge(statusOverride = null, textOverride = null) {
  const badge = document.getElementById("supabaseConnectionBadge");
  const text = document.getElementById("supabaseStatusText");
  const bannerBadge = document.getElementById("bannerSupabaseBadge");
  const bannerText = document.getElementById("bannerSupabaseStatusText");

  let cls = "supabase-status-pill local";
  let label = "Local Storage Mode";

  if (statusOverride) {
    cls = `supabase-status-pill ${statusOverride}`;
    if (textOverride) label = textOverride;
  } else {
    const isCfg = typeof window.SupabaseStore !== "undefined" && window.SupabaseStore.isConfigured();
    if (isCfg) {
      cls = "supabase-status-pill connected";
      label = "Connected to Supabase";
    }
  }

  if (badge) badge.className = cls;
  if (text) text.textContent = label;
  if (bannerBadge) bannerBadge.className = cls;
  if (bannerText) bannerText.textContent = label;
}

function toggleSupabaseKeyVisibility() {
  const input = document.getElementById("cfgSupabaseAnonKey");
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
}

async function handleTestSupabaseConnection() {
  const urlInput = document.getElementById("cfgSupabaseUrl");
  const keyInput = document.getElementById("cfgSupabaseAnonKey");
  const testBtn = document.getElementById("btnTestSupabase");

  const url = (urlInput?.value || "").trim();
  const key = (keyInput?.value || "").trim();

  if (!url || !key) {
    showToast("Please enter both your Supabase URL and Anon Public Key to test connection.", "error");
    return;
  }

  // Temporarily store to test
  if (typeof window.SupabaseStore !== "undefined") {
    window.SupabaseStore.saveConfig(url, key);
  }

  updateSupabaseStatusBadge("testing", "Testing Connection...");
  if (testBtn) {
    testBtn.disabled = true;
    testBtn.querySelector("span").textContent = "Pinging Supabase...";
  }

  try {
    const result = await window.SupabaseStore.testConnection();
    if (result.success) {
      updateSupabaseStatusBadge("connected", "Connected to Supabase");
      showToast("Connected to Supabase PostgreSQL database successfully!", "success");
      // Check if remote table needs initial catalog push
      window.SupabaseStore.fetchProducts().then(prods => {
        if (prods && prods.length === 0 && currentProducts.length > 0) {
          handlePushToSupabase(true);
        }
      }).catch(() => {});
    } else {
      updateSupabaseStatusBadge("error", "Connection Failed");
      showToast(result.message, "error");
    }
  } catch (err) {
    updateSupabaseStatusBadge("error", "Connection Error");
    showToast("Error connecting to Supabase: " + err.message, "error");
  } finally {
    if (testBtn) {
      testBtn.disabled = false;
      testBtn.querySelector("span").textContent = "Test Connection";
    }
  }
}

async function handleSaveSupabaseConfig(event) {
  if (event) event.preventDefault();

  const urlInput = document.getElementById("cfgSupabaseUrl");
  const keyInput = document.getElementById("cfgSupabaseAnonKey");
  const saveBtn = document.getElementById("btnSaveSupabase");

  const url = (urlInput?.value || "").trim();
  const key = (keyInput?.value || "").trim();

  if (!url || !key) {
    showToast("Please enter both your Supabase URL and Anon Public Key.", "error");
    return;
  }

  if (typeof window.SupabaseStore !== "undefined") {
    window.SupabaseStore.saveConfig(url, key);
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.querySelector("span").textContent = "Saving & Connecting...";
  }

  const result = await window.SupabaseStore.testConnection();
  if (result.success) {
    updateSupabaseStatusBadge("connected", "Connected to Supabase");
    showToast("Supabase credentials saved and connection verified!", "success");
    // Automatically push catalog if cloud table is empty
    window.SupabaseStore.fetchProducts().then(prods => {
      if (prods && prods.length === 0 && currentProducts.length > 0) {
        handlePushToSupabase(true);
      }
    }).catch(() => {});
  } else {
    updateSupabaseStatusBadge("error", "Saved (Ping Failed)");
    showToast(`Credentials saved, but test ping returned: ${result.message}`, "info");
  }

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.querySelector("span").textContent = "Save & Connect";
  }
}

function handleClearSupabaseConfig() {
  if (!confirm("Disconnect Supabase credentials and revert to local storage catalog?")) return;

  if (typeof window.SupabaseStore !== "undefined") {
    window.SupabaseStore.clearConfig();
  }

  const urlInput = document.getElementById("cfgSupabaseUrl");
  const keyInput = document.getElementById("cfgSupabaseAnonKey");
  if (urlInput) urlInput.value = "";
  if (keyInput) keyInput.value = "";

  updateSupabaseStatusBadge("local", "Local Storage Mode");
  showToast("Supabase configuration cleared. Now using local browser storage.", "info");
}

async function handlePushToSupabase(isAuto = false) {
  if (typeof window.SupabaseStore === "undefined" || !window.SupabaseStore.isConfigured()) {
    if (!isAuto) {
      if (typeof switchTab === "function") switchTab("settings");
      const urlInput = document.getElementById("cfgSupabaseUrl");
      if (urlInput) urlInput.focus();
      showToast("Please enter your Supabase Project URL & Anon Key below, then click 'Save & Connect'.", "info");
    }
    return;
  }

  const triggerButtons = document.querySelectorAll(".btn-push-supabase-trigger, #btnPushSupabase, #btnHeaderPushSupabase, #btnOverviewPushSupabase, #btnCatalogPushSupabase");
  triggerButtons.forEach(b => {
    b.disabled = true;
    const span = b.querySelector("span");
    if (span) span.textContent = "Uploading to Cloud...";
  });

  try {
    if (!isAuto) {
      showToast(`Pushing ${currentProducts.length} products, categories, and Sterling Bank settings to Supabase...`, "info");
    }
    await window.SupabaseStore.pushAllToSupabase(currentProducts, currentCategories, currentConfig);
    showToast(`All ${currentProducts.length} botanical products, categories, and Sterling Bank details successfully synced to Supabase!`, "success");
    updateSupabaseStatusBadge("connected", `Connected (${currentProducts.length} Products Synced)`);
  } catch (err) {
    console.error("Supabase push failed:", err);
    if (!isAuto) {
      showToast("Failed to push to Supabase: " + err.message, "error");
    }
  } finally {
    triggerButtons.forEach(b => {
      b.disabled = false;
      const span = b.querySelector("span");
      if (span) {
        span.textContent = span.getAttribute("data-default-text") || "Push to Supabase";
      }
    });
  }
}

async function handlePullFromSupabase() {
  if (typeof window.SupabaseStore === "undefined" || !window.SupabaseStore.isConfigured()) {
    showToast("Please configure and connect to Supabase first.", "error");
    return;
  }

  const btn = document.getElementById("btnPullSupabase");
  if (btn) {
    btn.disabled = true;
    btn.querySelector("span").textContent = "Pulling from Cloud...";
  }

  try {
    showToast("Fetching live catalog from Supabase...", "info");
    const [cloudProducts, cloudCats, cloudCfg] = await Promise.all([
      window.SupabaseStore.fetchProducts(),
      window.SupabaseStore.fetchCategories(),
      window.SupabaseStore.fetchStoreConfig()
    ]);

    let updatedAny = false;
    if (cloudProducts && cloudProducts.length > 0) {
      currentProducts = cloudProducts;
      saveProductsToStorage();
      renderProductsCatalog();
      populateWhatsAppGenProducts();
      updatedAny = true;
    }

    if (cloudCats && cloudCats.length > 0) {
      currentCategories = cloudCats;
      saveCategoriesToStorage();
      renderCategoriesManagement();
      renderAdminCategoryPills();
      populateCategorySelects();
      updatedAny = true;
    }

    if (cloudCfg) {
      currentConfig = { ...currentConfig, ...cloudCfg };
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
      populateSettingsForm();
      updatedAny = true;
    }

    if (updatedAny) {
      showToast(`Successfully pulled ${currentProducts.length} products from Supabase!`, "success");
    } else {
      showToast("Supabase responded, but no products were found in the database. You can use 'Push Local Catalog to Supabase' to populate it.", "info");
    }
  } catch (err) {
    console.error("Supabase pull failed:", err);
    showToast("Failed to pull from Supabase: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.querySelector("span").textContent = "Pull Catalog from Supabase";
    }
  }
}

// SQL Schema Modal Utilities
let cachedSqlScriptText = "";
async function openSqlSchemaModal() {
  const modal = document.getElementById("supabaseSqlModal");
  const codeBox = document.getElementById("supabaseSqlCodeContainer");
  if (!modal) return;

  modal.style.display = "flex";

  if (codeBox) {
    if (!cachedSqlScriptText) {
      codeBox.textContent = "-- Loading supabase-schema.sql...";
      try {
        const resp = await fetch("/supabase-schema.sql");
        if (resp.ok) {
          cachedSqlScriptText = await resp.text();
        } else {
          cachedSqlScriptText = "-- Please refer to the root file /supabase-schema.sql in your project.";
        }
      } catch (e) {
        cachedSqlScriptText = "-- Please refer to the root file /supabase-schema.sql in your project.";
      }
    }
    codeBox.textContent = cachedSqlScriptText;
  }
}

function closeSqlSchemaModal() {
  const modal = document.getElementById("supabaseSqlModal");
  if (modal) modal.style.display = "none";
}

function copySqlSchemaCode() {
  const codeBox = document.getElementById("supabaseSqlCodeContainer");
  const text = codeBox?.textContent || cachedSqlScriptText;
  if (!text) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied entire SQL schema to clipboard! Now paste it into Supabase SQL Editor.", "success");
      const btnText = document.getElementById("copySqlBtnText");
      if (btnText) {
        btnText.textContent = "Copied to Clipboard!";
        setTimeout(() => { btnText.textContent = "Copy Entire SQL Script"; }, 2500);
      }
    }).catch(() => {
      copyTextFallback(text, "Copied SQL schema to clipboard!");
    });
  } else {
    copyTextFallback(text, "Copied SQL schema to clipboard!");
  }
}

// ======================================================================
// 8. EFFECTIVE WHATSAPP LINK & INVOICE STUDIO
// ======================================================================
let waStudioState = {
  template: 'invoice', // invoice | quick_buy | dispatch | reminder
  routing: 'store',    // store | customer
  items: [],
  deliveryHub: 'Lagos State',
  deliveryFee: 2500,
  customDest: '',
  customerName: '',
  customerPhone: '',
  includeBank: true,
  customNotes: '',
  lastGeneratedMessage: '',
  lastGeneratedUrl: ''
};

function initWhatsAppStudio() {
  if (waStudioState.items.length === 0) {
    const firstProd = currentProducts[0] || { id: 1 };
    waStudioState.items = [{ productId: firstProd.id, qty: 1 }];
  }

  // Update bank preview text
  const bankNameDisp = document.getElementById("waBankNameDisp");
  const bankAcctDisp = document.getElementById("waBankAcctDisp");
  const bankBenDisp = document.getElementById("waBankBeneficiaryDisp");

  if (bankNameDisp) bankNameDisp.textContent = currentConfig.bankName || "Sterling Bank";
  if (bankAcctDisp) bankAcctDisp.textContent = currentConfig.bankAccount || "0097137583";
  if (bankBenDisp) bankBenDisp.textContent = currentConfig.accountName || "Ezema Emmanuel Tochukwu";

  renderWAOrderItems();
  updateGeneratedWALink();
}

function setWATemplate(tmpl) {
  waStudioState.template = tmpl;

  const btnMap = {
    invoice: "tmplBtnInvoice",
    quick_buy: "tmplBtnQuick",
    dispatch: "tmplBtnDispatch",
    reminder: "tmplBtnReminder"
  };

  Object.keys(btnMap).forEach(key => {
    const btn = document.getElementById(btnMap[key]);
    if (btn) btn.classList.toggle("active", key === tmpl);
  });

  updateGeneratedWALink();
}

function handleWARoutingModeChange() {
  const radios = document.getElementsByName("waRoutingMode");
  let selected = "store";
  radios.forEach(r => {
    if (r.checked) selected = r.value;
  });
  waStudioState.routing = selected;

  const cardStore = document.getElementById("radioCardStore");
  const cardCust = document.getElementById("radioCardCustomer");
  const phoneHint = document.getElementById("waPhoneHint");
  const phoneWrapper = document.getElementById("waCustomerPhoneWrapper");

  if (cardStore) cardStore.classList.toggle("active", selected === "store");
  if (cardCust) cardCust.classList.toggle("active", selected === "customer");

  if (selected === "customer") {
    if (phoneHint) {
      phoneHint.style.color = "#059669";
      phoneHint.textContent = "Customer phone number is active for direct messaging!";
    }
    if (phoneWrapper) phoneWrapper.style.opacity = "1";
  } else {
    if (phoneHint) {
      phoneHint.style.color = "#6b7280";
      phoneHint.textContent = "Orders route directly to store's WhatsApp line (+2348084765252).";
    }
    if (phoneWrapper) phoneWrapper.style.opacity = "0.75";
  }

  updateGeneratedWALink();
}

function addWAOrderItem() {
  const defaultProd = currentProducts[0] || { id: 1 };
  waStudioState.items.push({ productId: defaultProd.id, qty: 1 });
  renderWAOrderItems();
  updateGeneratedWALink();
}

function removeWAOrderItem(index) {
  if (waStudioState.items.length <= 1) {
    showToast("Order must contain at least one item", "info");
    return;
  }
  waStudioState.items.splice(index, 1);
  renderWAOrderItems();
  updateGeneratedWALink();
}

function handleWAItemProductChange(index, prodId) {
  if (waStudioState.items[index]) {
    waStudioState.items[index].productId = parseInt(prodId, 10);
    renderWAOrderItems();
    updateGeneratedWALink();
  }
}

function handleWAItemQtyChange(index, qty) {
  const val = Math.max(1, parseInt(qty, 10) || 1);
  if (waStudioState.items[index]) {
    waStudioState.items[index].qty = val;
    renderWAOrderItems();
    updateGeneratedWALink();
  }
}

function renderWAOrderItems() {
  const container = document.getElementById("waOrderItemsList");
  if (!container) return;

  if (currentProducts.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px; background: #fffbeb; border: 1px dashed #f59e0b; border-radius: 8px; text-align: center;">
        <p style="font-size: 0.9rem; color: #92400e; margin-bottom: 8px;">No products currently in store catalog.</p>
        <button type="button" class="btn-secondary btn-sm" onclick="confirmResetDefaults()">Restore 27 Botanical Products</button>
      </div>
    `;
    return;
  }

  // Ensure items have valid product IDs from current catalog
  waStudioState.items.forEach(it => {
    if (!currentProducts.some(p => p.id === it.productId)) {
      it.productId = currentProducts[0].id;
    }
  });

  container.innerHTML = waStudioState.items.map((item, idx) => {
    const prod = currentProducts.find(p => p.id === item.productId) || currentProducts[0];
    const priceNum = prod.priceNum || parseInt(String(prod.price).replace(/[^0-9]/g, ""), 10) || 0;
    const rowSubtotal = priceNum * (item.qty || 1);

    const optionsHtml = currentProducts.map(p => `
      <option value="${p.id}" ${p.id === item.productId ? 'selected' : ''}>
        ${escapeHtml(p.name)} (${p.price})
      </option>
    `).join("");

    return `
      <div class="wa-item-row" id="waItemRow-${idx}">
        <select onchange="handleWAItemProductChange(${idx}, this.value)">
          ${optionsHtml}
        </select>
        <input 
          type="number" 
          min="1" 
          max="99" 
          value="${item.qty}" 
          title="Quantity" 
          oninput="handleWAItemQtyChange(${idx}, this.value)" 
        />
        <div class="wa-item-price-preview">
          ₦${rowSubtotal.toLocaleString()}
        </div>
        <button 
          type="button" 
          class="btn-remove-wa-item" 
          onclick="removeWAOrderItem(${idx})" 
          title="Remove item" 
          ${waStudioState.items.length <= 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}
        >✕</button>
      </div>
    `;
  }).join("");
}

function handleDeliveryHubChange() {
  const select = document.getElementById("waDeliveryHub");
  const feeInput = document.getElementById("waDeliveryFee");
  const customDestGroup = document.getElementById("waCustomDestGroup");

  if (!select) return;

  const selOption = select.options[select.selectedIndex];
  const feeAttr = selOption.getAttribute("data-fee");

  if (select.value === "Custom") {
    if (customDestGroup) customDestGroup.style.display = "block";
  } else {
    if (customDestGroup) customDestGroup.style.display = "none";
    if (feeAttr !== "custom" && feeInput) {
      feeInput.value = feeAttr;
    }
  }

  updateGeneratedWALink();
}

function updateGeneratedWALink() {
  const custNameInput = document.getElementById("waCustomerName");
  const custPhoneInput = document.getElementById("waCustomerPhone");
  const hubSelect = document.getElementById("waDeliveryHub");
  const feeInput = document.getElementById("waDeliveryFee");
  const customDestInput = document.getElementById("waCustomDestText");
  const includeBankCheck = document.getElementById("waIncludeBank");
  const notesInput = document.getElementById("waCustomNotes");

  const customerName = custNameInput?.value.trim() || "";
  const customerPhone = custPhoneInput?.value.trim() || "";
  const deliveryHub = hubSelect?.value || "Lagos State";
  const deliveryFee = parseInt(feeInput?.value || "0", 10) || 0;
  const customDest = customDestInput?.value.trim() || "";
  const includeBank = includeBankCheck?.checked ?? true;
  const notes = notesInput?.value.trim() || "";

  let subtotal = 0;
  const itemSummaryList = [];

  waStudioState.items.forEach(it => {
    const prod = currentProducts.find(p => p.id === it.productId) || currentProducts[0];
    if (!prod) return;
    const priceNum = prod.priceNum || parseInt(String(prod.price).replace(/[^0-9]/g, ""), 10) || 0;
    const rowTot = priceNum * it.qty;
    subtotal += rowTot;
    itemSummaryList.push({
      name: prod.name,
      qty: it.qty,
      unitPrice: prod.price,
      priceNum: priceNum,
      rowTotal: rowTot
    });
  });

  const grandTotal = subtotal + deliveryFee;

  const subtotalEl = document.getElementById("waSummarySubtotal");
  const deliveryEl = document.getElementById("waSummaryDelivery");
  const totalEl = document.getElementById("waSummaryTotal");

  if (subtotalEl) subtotalEl.textContent = `₦${subtotal.toLocaleString()}`;
  if (deliveryEl) deliveryEl.textContent = `₦${deliveryFee.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `₦${grandTotal.toLocaleString()}`;

  const bankName = currentConfig.bankName || "Sterling Bank";
  const bankAcct = currentConfig.bankAccount || "0097137583";
  const bankOwner = currentConfig.accountName || "Ezema Emmanuel Tochukwu";
  const storePhone = currentConfig.phoneDisplay || "08084765252";
  const storeWa = currentConfig.whatsappNumber || "2348084765252";

  const locationLabel = customDest ? customDest : deliveryHub;

  let message = "";

  if (waStudioState.template === "invoice") {
    message += `🧾 *HEALTH IS WEALTH — OFFICIAL ORDER INVOICE*\n`;
    message += `--------------------------------------------------\n`;
    if (customerName) {
      message += `*Customer:* ${customerName}\n`;
    }
    message += `*Fulfillment Hub / Destination:* ${locationLabel}\n\n`;

    message += `*ITEMS ORDERED:*\n`;
    itemSummaryList.forEach(it => {
      message += `• ${it.qty}x ${it.name} (${it.unitPrice}) = ₦${it.rowTotal.toLocaleString()}\n`;
    });

    message += `\n*FINANCIAL BREAKDOWN:*\n`;
    message += `Subtotal: ₦${subtotal.toLocaleString()}\n`;
    message += `Delivery Logistics (${locationLabel}): ₦${deliveryFee.toLocaleString()}\n`;
    message += `*TOTAL PAYABLE:* ₦${grandTotal.toLocaleString()}\n`;

    if (includeBank) {
      message += `\n*PAYMENT INSTRUCTIONS (Direct Transfer):*\n`;
      message += `Bank: ${bankName}\n`;
      message += `Account Number: ${bankAcct}\n`;
      message += `Account Name: ${bankOwner}\n`;
      message += `Kindly share your transfer receipt here for instant dispatch verification.\n`;
    }

    if (notes) {
      message += `\n*Note:* ${notes}\n`;
    }

    message += `\nOrders dispatch promptly from our hubs in Enugu, Abuja & Lagos. Thank you for choosing Health is Wealth!`;

  } else if (waStudioState.template === "quick_buy") {
    const primary = itemSummaryList[0] || { name: "Botanical Product", qty: 1, unitPrice: "₦15,000" };
    message += `Hello Health is Wealth,`;
    if (customerName) {
      message += ` my name is ${customerName}.`;
    }
    message += ` I would like to order:\n\n`;
    message += `*Product:* ${primary.name}\n`;
    message += `*Quantity:* ${primary.qty}\n`;
    message += `*Price:* ${primary.unitPrice}\n`;
    message += `*Delivery Hub:* ${locationLabel}\n`;
    if (deliveryFee > 0) {
      message += `*Est. Delivery:* ₦${deliveryFee.toLocaleString()}\n`;
    }
    message += `\nPlease confirm product availability and payment details. Thank you!`;

  } else if (waStudioState.template === "dispatch") {
    message += `🚚 *HEALTH IS WEALTH — ORDER DISPATCHED*\n`;
    message += `--------------------------------------------------\n`;
    message += `Hello ${customerName || 'Esteemed Customer'},\n`;
    message += `Great news! Your Health is Wealth order has been packaged and dispatched for delivery to *${locationLabel}*.\n\n`;
    message += `*ITEMS IN TRANSIT:*\n`;
    itemSummaryList.forEach(it => {
      message += `• ${it.qty}x ${it.name}\n`;
    });
    if (deliveryFee > 0 && grandTotal > 0) {
      message += `\n*Order Value:* ₦${grandTotal.toLocaleString()} (Verified & In Transit)\n`;
    }
    if (notes) {
      message += `*Dispatch Note:* ${notes}\n`;
    }
    message += `\nFor rider updates or inquiries, call/WhatsApp: ${storePhone}. Thank you for choosing Health is Wealth!`;

  } else if (waStudioState.template === "reminder") {
    message += `💳 *HEALTH IS WEALTH — PAYMENT REMINDER*\n`;
    message += `--------------------------------------------------\n`;
    message += `Hello ${customerName || 'Valued Customer'},\n`;
    message += `Your order reservation is ready for dispatch to *${locationLabel}*:\n\n`;
    itemSummaryList.forEach(it => {
      message += `• ${it.qty}x ${it.name}\n`;
    });
    message += `*Total Due:* ₦${grandTotal.toLocaleString()} (including delivery)\n`;

    if (includeBank) {
      message += `\n*Bank Transfer Details:*\n`;
      message += `Bank: ${bankName}\n`;
      message += `Account: ${bankAcct}\n`;
      message += `Name: ${bankOwner}\n`;
    }
    message += `\nPlease send your payment receipt to confirm delivery with today's dispatch. Thank you!`;
  }

  // Live preview bubble
  const chatBubble = document.getElementById("waChatBubblePreview");
  if (chatBubble) {
    const formattedHtml = escapeHtml(message)
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
    chatBubble.innerHTML = formattedHtml;
  }

  const recipientTitle = document.getElementById("waPreviewRecipientTitle");
  if (recipientTitle) {
    if (waStudioState.routing === "customer") {
      recipientTitle.textContent = customerName ? `${customerName} (${customerPhone || 'Customer'})` : (customerPhone || "Customer WhatsApp");
    } else {
      recipientTitle.textContent = `${currentConfig.storeName || 'Health is Wealth'} (+${storeWa})`;
    }
  }

  let targetNumber = storeWa;
  if (waStudioState.routing === "customer") {
    const cleanCustomerNum = customerPhone.replace(/[^0-9]/g, "");
    if (cleanCustomerNum) {
      targetNumber = cleanCustomerNum.startsWith("0") ? "234" + cleanCustomerNum.slice(1) : cleanCustomerNum;
    }
  }

  const encodedMsg = encodeURIComponent(message);
  const fullUrl = `https://wa.me/${targetNumber}?text=${encodedMsg}`;

  const urlField = document.getElementById("waGeneratedUrl");
  const mainBtnText = document.getElementById("waMainActionText");

  if (urlField) urlField.value = fullUrl;
  if (mainBtnText) {
    if (waStudioState.routing === "customer") {
      mainBtnText.textContent = "Send Directly to Customer on WhatsApp";
    } else {
      mainBtnText.textContent = "Open in WhatsApp";
    }
  }

  const qrCard = document.getElementById("waQRCard");
  const qrImg = document.getElementById("waQRImage");
  if (qrCard && qrCard.style.display !== "none" && qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fullUrl)}`;
  }

  waStudioState.lastGeneratedMessage = message;
  waStudioState.lastGeneratedUrl = fullUrl;
}

function openGeneratedWALink() {
  if (waStudioState.routing === "customer") {
    const custPhoneInput = document.getElementById("waCustomerPhone");
    const val = custPhoneInput ? custPhoneInput.value.trim().replace(/[^0-9]/g, "") : "";
    if (!val || val.length < 9) {
      showToast("Please enter customer's phone number to message them directly!", "error");
      custPhoneInput?.focus();
      return;
    }
  }

  const url = waStudioState.lastGeneratedUrl;
  if (url) {
    window.open(url, "_blank");
  }
}

function copyGeneratedWALink() {
  const url = waStudioState.lastGeneratedUrl;
  if (!url) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast("Full WhatsApp link copied to clipboard!", "success");
    }).catch(() => fallbackCopy(url, "WhatsApp link copied!"));
  } else {
    fallbackCopy(url, "WhatsApp link copied!");
  }
}

function copyGeneratedWAMessageText() {
  const text = waStudioState.lastGeneratedMessage;
  if (!text) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Message text copied! Paste into WhatsApp chat.", "success");
    }).catch(() => fallbackCopy(text, "Message text copied!"));
  } else {
    fallbackCopy(text, "Message text copied!");
  }
}

function toggleWAQRCode() {
  const qrCard = document.getElementById("waQRCard");
  const qrImg = document.getElementById("waQRImage");
  if (!qrCard) return;

  const isVisible = qrCard.style.display !== "none";
  if (isVisible) {
    qrCard.style.display = "none";
  } else {
    qrCard.style.display = "block";
    const url = waStudioState.lastGeneratedUrl || `https://wa.me/${currentConfig.whatsappNumber}`;
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
    }
  }
}

function fallbackCopy(text, successMsg) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    showToast(successMsg, "success");
  } catch (err) {
    showToast("Failed to copy automatically", "error");
  }
  document.body.removeChild(ta);
}

function populateWhatsAppGenProducts() {
  // Keeps backward compatibility with catalog add/delete
  renderWAOrderItems();
  updateGeneratedWALink();
}

function testProductWhatsApp(prodId) {
  const prod = currentProducts.find(p => String(p.id) === String(prodId) || Number(p.id) === Number(prodId));
  if (!prod) return;

  const waNumber = currentConfig.whatsappNumber || "2348084765252";
  const msg = `Hello Health is Wealth, I would like to order: ${prod.name} (${prod.price}). Delivery to Enugu, Abuja, Lagos or Nationwide. Please confirm availability.`;
  const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// ======================================================================
// 8. UTILITIES & TOAST
// ======================================================================
function showToast(message, type = "info") {
  const container = document.getElementById("adminToastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `admin-toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
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

// Keyboard shortcuts for the professional product editor
document.addEventListener("keydown", function(e) {
  const modal = document.getElementById("productModal");
  if (!modal || modal.style.display === "none") return;

  // Escape to close
  if (e.key === "Escape") {
    closeProductModal();
    return;
  }

  // Ctrl+S or Cmd+S to save
  if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
    e.preventDefault();
    const form = document.getElementById("productForm");
    if (form) {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }
  }
});

// Scroll utilities for the product editor
function scrollEditorToBottom() {
  const scrollContainer = document.getElementById("productModalBodyScroll") || document.querySelector(".editor-body-scroll");
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: "smooth" });
  } else {
    window.scrollTo({ top: document.documentElement.scrollHeight || document.body.scrollHeight, behavior: "smooth" });
  }
}

function scrollEditorToTop() {
  const scrollContainer = document.getElementById("productModalBodyScroll") || document.querySelector(".editor-body-scroll");
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Global window exposure for inline HTML attributes across all browsers
window.openProductModal = openProductModal;
window.openProductEditor = openProductModal;
window.closeProductModal = closeProductModal;
window.closeProductEditor = closeProductModal;
window.scrollEditorToBottom = scrollEditorToBottom;
window.scrollEditorToTop = scrollEditorToTop;
window.handleSaveProduct = handleSaveProduct;
window.formatPriceInput = formatPriceInput;
window.openDeleteModalFromEdit = openDeleteModalFromEdit;
window.updateLiveStorePreview = updateLiveStorePreview;
window.applyPresetPhoto = applyPresetPhoto;
window.addBenefitPreset = addBenefitPreset;
window.toggleStockStatus = toggleStockStatus;
window.openDeleteProductModal = openDeleteProductModal;
window.closeDeleteProductModal = closeDeleteProductModal;
window.handleConfirmDeleteProduct = handleConfirmDeleteProduct;
window.confirmDeleteProduct = confirmDeleteProduct;
window.testProductWhatsApp = testProductWhatsApp;
window.triggerProductFileInput = triggerProductFileInput;
window.handleProductFileSelect = handleProductFileSelect;
window.handleProductFileDrop = handleProductFileDrop;
window.handleProductDragOver = handleProductDragOver;
window.handleProductDragLeave = handleProductDragLeave;
window.clearProductPhoto = clearProductPhoto;
window.toggleProductUrlInput = toggleProductUrlInput;
window.handleManualUrlInput = handleManualUrlInput;
window.handleAdminSearch = handleAdminSearch;
window.setAdminCategory = setAdminCategory;
window.saveProductsToStorage = saveProductsToStorage;
window.showToast = showToast;
window.escapeHtml = escapeHtml;

// Supabase Functions
window.updateSupabaseStatusBadge = updateSupabaseStatusBadge;
window.toggleSupabaseKeyVisibility = toggleSupabaseKeyVisibility;
window.handleTestSupabaseConnection = handleTestSupabaseConnection;
window.handleSaveSupabaseConfig = handleSaveSupabaseConfig;
window.handleClearSupabaseConfig = handleClearSupabaseConfig;
window.handlePushToSupabase = handlePushToSupabase;
window.handlePullFromSupabase = handlePullFromSupabase;
window.openSqlSchemaModal = openSqlSchemaModal;
window.closeSqlSchemaModal = closeSqlSchemaModal;
window.copySqlSchemaCode = copySqlSchemaCode;

