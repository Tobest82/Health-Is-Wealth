/**
 * HEALTH IS WEALTH - ADMIN DASHBOARD CLIENT
 * Enterprise-grade single page administration suite.
 * Persists all changes directly to Supabase and broadcasts live updates to the storefront.
 */

(function () {
  'use strict';

  // State
  const state = {
    token: null,
    adminUser: null,
    products: [],
    categories: [],
    orders: [],
    storeConfig: null,
    mediaFiles: [],
    currentView: 'dashboard',
    searchQuery: '',
    selectedCategory: '',
    stockFilter: '',
    featuredFilter: '',
    sortBy: 'id_asc',
    orderSearchQuery: '',
    orderStatusFilter: '',
    pendingDeleteAction: null,
    syncChannel: null,
  };

  // Setup broadcast channel for instant multi-tab live sync
  try {
    state.syncChannel = new BroadcastChannel('healthIsWealth_sync');
  } catch (e) {
    console.warn('BroadcastChannel not supported in this environment');
  }

  function broadcastDataChange(type, payload) {
    if (state.syncChannel) {
      try {
        state.syncChannel.postMessage({ type, payload, timestamp: Date.now() });
      } catch (e) {}
    }
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '';
    if (type === 'success') {
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (type === 'error') {
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'warning') {
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else {
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      <div style="flex-shrink: 0;">${icon}</div>
      <div style="font-size: 0.85rem; font-weight: 500; color: #1e293b; flex: 1;">${escapeHtml(message)}</div>
      <button type="button" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:2px;" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, duration);
  }

  function escapeHtml(text) {
    if (typeof text !== 'string') return String(text || '');
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // AUTHENTICATION SYSTEM
  // =========================================================================
  function getStoredToken() {
    return sessionStorage.getItem('healthIsWealth_admin_token') || localStorage.getItem('healthIsWealth_admin_token');
  }

  function setStoredToken(token) {
    state.token = token;
    sessionStorage.setItem('healthIsWealth_admin_token', token);
    localStorage.setItem('healthIsWealth_admin_token', token);
  }

  function clearStoredToken() {
    state.token = null;
    state.adminUser = null;
    sessionStorage.removeItem('healthIsWealth_admin_token');
    localStorage.removeItem('healthIsWealth_admin_token');
  }

  async function checkAuthSession() {
    const token = getStoredToken();
    if (!token) {
      showLoginScreen();
      return;
    }

    try {
      const res = await fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          state.token = token;
          state.adminUser = data.user;
          showDashboardScreen();
          initDashboardData();
          return;
        }
      }
    } catch (e) {
      console.warn('Session verification error:', e);
    }

    clearStoredToken();
    showLoginScreen();
  }

  function showLoginScreen() {
    const login = document.getElementById('loginScreen');
    const app = document.getElementById('adminApp');
    if (login) login.style.display = 'flex';
    if (app) app.style.display = 'none';
    const alertBox = document.getElementById('loginAlert');
    if (alertBox) alertBox.style.display = 'none';
  }

  function showDashboardScreen() {
    const login = document.getElementById('loginScreen');
    const app = document.getElementById('adminApp');
    if (login) login.style.display = 'none';
    if (app) app.style.display = 'flex';
    if (state.adminUser) {
      const emailEl = document.getElementById('sidebarAdminEmail');
      if (emailEl) emailEl.textContent = state.adminUser.email;
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const alertBox = document.getElementById('loginAlert');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const btnText = document.getElementById('loginBtnText');
    const btnSpinner = document.getElementById('loginBtnSpinner');

    if (!password) {
      alertBox.textContent = 'Please enter your administrator password.';
      alertBox.style.display = 'block';
      return;
    }

    alertBox.style.display = 'none';
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        setStoredToken(data.token);
        state.adminUser = data.user;
        showToast('Welcome back, Administrator!', 'success');
        showDashboardScreen();
        initDashboardData();
      } else {
        alertBox.textContent = data.message || 'Authentication failed. Please verify credentials.';
        alertBox.style.display = 'block';
      }
    } catch (err) {
      alertBox.textContent = 'Network or server error while authenticating. Please try again.';
      alertBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
    }
  }

  async function handleLogout() {
    const token = getStoredToken();
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {}
    }
    clearStoredToken();
    showToast('Signed out of admin dashboard.', 'info');
    showLoginScreen();
  }

  // =========================================================================
  // DATA LOADING & SUPABASE INITIALIZATION
  // =========================================================================
  async function initDashboardData() {
    try {
      if (typeof window.SupabaseStore !== 'undefined') {
        await window.SupabaseStore.ensureConfig();
      }

      await Promise.all([
        loadProductsFromSupabase(),
        loadCategoriesFromSupabase(),
        loadOrdersFromSupabase(),
        loadConfigFromSupabase(),
        loadMediaList()
      ]);

      renderDashboardOverview();
      renderProductsTable();
      renderCategoriesTable();
      renderOrdersTable();
      populateSettingsForm();
      populateContentForm();
      updateDiagnosticsPanel();
      pingSupabaseStatus();
    } catch (err) {
      console.error('Error initializing dashboard data:', err);
      showToast('Error loading data from Supabase. Check connectivity.', 'error');
    }
  }

  async function loadProductsFromSupabase() {
    if (typeof window.SupabaseStore === 'undefined') return;
    try {
      const prods = await window.SupabaseStore.fetchProducts();
      if (Array.isArray(prods) && prods.length > 0) {
        state.products = prods;
      } else {
        // Fallback to local catalog
        const local = localStorage.getItem('healthIsWealth_products');
        if (local) {
          try { state.products = JSON.parse(local); } catch (e) {}
        }
        if (!state.products || state.products.length === 0) {
          if (typeof window.STORE_DEFAULT_PRODUCTS !== 'undefined') {
            state.products = [...window.STORE_DEFAULT_PRODUCTS];
          }
        }
      }
      try {
        localStorage.setItem('healthIsWealth_products', JSON.stringify(state.products));
      } catch (e) {}
      updateCounts();
    } catch (e) {
      console.error('Failed to load products:', e);
    }
  }

  async function loadCategoriesFromSupabase() {
    if (typeof window.SupabaseStore === 'undefined') return;
    try {
      const cats = await window.SupabaseStore.fetchCategories();
      if (Array.isArray(cats) && cats.length > 0) {
        state.categories = cats;
      } else {
        state.categories = ['Health', 'Beauty/Wellness'];
      }
      try {
        localStorage.setItem('healthIsWealth_categories', JSON.stringify(state.categories));
      } catch (e) {}
      populateCategoryDropdowns();
      updateCounts();
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  }

  async function loadOrdersFromSupabase() {
    if (typeof window.SupabaseStore === 'undefined') return;
    try {
      const orders = await window.SupabaseStore.fetchOrders();
      state.orders = Array.isArray(orders) ? orders : [];
      updateCounts();
    } catch (e) {
      console.error('Failed to load orders:', e);
    }
  }

  async function loadConfigFromSupabase() {
    if (typeof window.SupabaseStore === 'undefined') return;
    try {
      const cfg = await window.SupabaseStore.fetchStoreConfig();
      if (cfg) {
        state.storeConfig = cfg;
      } else {
        state.storeConfig = {
          storeName: "Health is Wealth",
          whatsappNumber: "2348084765252",
          phoneDisplay: "08084765252",
          bankName: "Sterling Bank",
          bankAccount: "0097137583",
          accountName: "Ezema Emmanuel Tochukwu",
          currencySymbol: "₦",
          location: "Enugu, Abuja & Lagos, Nigeria (Nationwide Delivery)"
        };
      }
      try {
        localStorage.setItem('healthIsWealth_config', JSON.stringify(state.storeConfig));
      } catch (e) {}
    } catch (e) {
      console.error('Failed to load store config:', e);
    }
  }

  async function loadMediaList() {
    try {
      const headers = {};
      if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
      }
      const res = await fetch('/api/admin/media-list', { headers });
      if (res.ok) {
        const data = await res.json();
        state.mediaFiles = Array.isArray(data.files) ? data.files : [];
        renderMediaGallery();
      }
    } catch (e) {
      console.warn('Could not load media list:', e);
    }
  }

  function updateCounts() {
    const totalProducts = state.products.length;
    const activeProducts = state.products.filter(p => p.inStock !== false).length;
    const totalCats = state.categories.length;
    const totalOrders = state.orders.length;
    const pendingOrders = state.orders.filter(o => (o.status || 'pending').toLowerCase() === 'pending').length;

    // Sidebar badges
    const spCount = document.getElementById('sidebarProductCount');
    if (spCount) spCount.textContent = totalProducts;
    const scCount = document.getElementById('sidebarCategoryCount');
    if (scCount) scCount.textContent = totalCats;
    const soCount = document.getElementById('sidebarOrderCount');
    if (soCount) soCount.textContent = totalOrders;

    // Stats cards
    const statTP = document.getElementById('statTotalProducts');
    if (statTP) statTP.textContent = totalProducts;
    const statAP = document.getElementById('statActiveProducts');
    if (statAP) statAP.textContent = `${activeProducts} in stock, ${totalProducts - activeProducts} out`;

    const statTC = document.getElementById('statTotalCategories');
    if (statTC) statTC.textContent = totalCats;

    const statTO = document.getElementById('statTotalOrders');
    if (statTO) statTO.textContent = totalOrders;
    const statPO = document.getElementById('statPendingOrders');
    if (statPO) statPO.textContent = `${pendingOrders} pending fulfillment`;

    let totalRevenue = 0;
    state.orders.forEach(o => {
      const val = Number(o.total_amount || 0);
      if (!isNaN(val) && val > 0) totalRevenue += val;
    });
    const statRev = document.getElementById('statTotalRevenue');
    if (statRev) statRev.textContent = `₦${totalRevenue.toLocaleString()}`;
  }

  // =========================================================================
  // VIEW SWITCHING
  // =========================================================================
  window.switchView = function (viewId) {
    state.currentView = viewId;

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    document.querySelectorAll('.admin-panel').forEach(panel => {
      if (panel.id === `panel-${viewId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    const titleMap = {
      dashboard: 'Dashboard Overview',
      products: 'Product Inventory & Pricing',
      categories: 'Store Categories & Collections',
      orders: 'Customer Orders & Enquiries',
      content: 'Live Website Content & Announcements',
      media: 'Media Storage & Image Manager',
      settings: 'Store Configuration & Bank Details',
      sync: 'Supabase Cloud Integration & Live Diagnostics'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titleMap[viewId] || 'Admin Dashboard';

    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');

    if (viewId === 'orders') renderOrdersTable();
    if (viewId === 'products') renderProductsTable();
    if (viewId === 'categories') renderCategoriesTable();
    if (viewId === 'media') renderMediaGallery();
    if (viewId === 'sync') updateDiagnosticsPanel();
  };

  // =========================================================================
  // DASHBOARD OVERVIEW RENDERING
  // =========================================================================
  function renderDashboardOverview() {
    const tbodyOrders = document.getElementById('dashboardRecentOrdersTable');
    if (tbodyOrders) {
      if (state.orders.length === 0) {
        tbodyOrders.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 2rem;">No orders registered yet. Customer orders placed on the website appear here.</td></tr>`;
      } else {
        const slice = state.orders.slice(0, 5);
        tbodyOrders.innerHTML = slice.map(o => {
          const ref = escapeHtml(o.order_number || o.id?.slice(0, 8) || 'REF');
          const name = escapeHtml(o.customer_name || 'Anonymous Customer');
          const phone = escapeHtml(o.customer_phone || '');
          const total = Number(o.total_amount || 0).toLocaleString();
          const status = escapeHtml(o.status || 'pending');
          const statusBadge = getStatusBadge(status);

          return `
            <tr>
              <td><span style="font-weight: 600; font-family: monospace; color: #059669;">#${ref}</span></td>
              <td>
                <div style="font-weight: 600; color: #0f172a;">${name}</div>
                <div style="font-size: 0.72rem; color: #64748b;">${phone}</div>
              </td>
              <td style="font-weight: 700; color: #0f172a;">₦${total}</td>
              <td>${statusBadge}</td>
            </tr>
          `;
        }).join('');
      }
    }

    const tbodyFeatured = document.getElementById('dashboardFeaturedProductsTable');
    if (tbodyFeatured) {
      const featuredList = state.products.filter(p => p.featured);
      if (featuredList.length === 0) {
        tbodyFeatured.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 2rem;">No featured products set yet. Mark products as featured in Product Management.</td></tr>`;
      } else {
        tbodyFeatured.innerHTML = featuredList.slice(0, 5).map(p => {
          const img = p.image || 'https://images.unsplash.com/photo-1608248597359-2e11894d0fb8?auto=format&fit=crop&w=120&q=80';
          return `
            <tr>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <img src="${escapeHtml(img)}" alt="" style="width: 34px; height: 34px; border-radius: 6px; object-fit: cover; border: 1px solid #e2e8f0;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'34\\' height=\\'34\\' fill=\\'%23f1f5f9\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>'" />
                  <span style="font-weight: 600; color: #0f172a; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(p.name)}</span>
                </div>
              </td>
              <td><span class="badge badge-slate">${escapeHtml(p.category)}</span></td>
              <td style="font-weight: 700; color: #059669;">${escapeHtml(p.price || `₦${Number(p.priceNum || 0).toLocaleString()}`)}</td>
              <td>
                <span class="badge ${p.inStock !== false ? 'badge-success' : 'badge-danger'}">
                  ${p.inStock !== false ? 'In Stock' : 'Out'}
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  function getStatusBadge(status) {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'confirmed') return `<span class="badge badge-info">Confirmed</span>`;
    if (s === 'dispatched') return `<span class="badge badge-warning">Dispatched</span>`;
    if (s === 'completed') return `<span class="badge badge-success">Completed</span>`;
    if (s === 'cancelled') return `<span class="badge badge-danger">Cancelled</span>`;
    return `<span class="badge badge-warning">Pending</span>`;
  }

  // =========================================================================
  // PRODUCT MANAGEMENT
  // =========================================================================
  function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    let list = [...state.products];

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        String(p.id) === q
      );
    }

    if (state.selectedCategory) {
      list = list.filter(p => p.category === state.selectedCategory);
    }

    if (state.stockFilter === 'in_stock') {
      list = list.filter(p => p.inStock !== false);
    } else if (state.stockFilter === 'out_of_stock') {
      list = list.filter(p => p.inStock === false);
    }

    if (state.featuredFilter === 'featured') {
      list = list.filter(p => p.featured);
    }

    if (state.sortBy === 'price_asc') {
      list.sort((a, b) => (Number(a.priceNum || 0) - Number(b.priceNum || 0)));
    } else if (state.sortBy === 'price_desc') {
      list.sort((a, b) => (Number(b.priceNum || 0) - Number(a.priceNum || 0)));
    } else if (state.sortBy === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      list.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    }

    const paginationText = document.getElementById('productPaginationText');
    if (paginationText) {
      paginationText.textContent = `Showing ${list.length} of ${state.products.length} products`;
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 2.5rem;">No products match your search or filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(p => {
      const img = p.image || 'https://images.unsplash.com/photo-1608248597359-2e11894d0fb8?auto=format&fit=crop&w=120&q=80';
      const formattedPrice = p.price || `₦${Number(p.priceNum || 0).toLocaleString()}`;
      const oldPrice = p.oldPrice ? `<div style="font-size: 0.72rem; color: #94a3b8; text-decoration: line-through;">${escapeHtml(p.oldPrice)}</div>` : '';

      return `
        <tr data-product-id="${p.id}">
          <td>
            <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'44\\' height=\\'44\\' fill=\\'%23f1f5f9\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>'" />
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${escapeHtml(p.name)}</div>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">ID: #${p.id}</div>
          </td>
          <td>
            <span class="badge badge-slate">${escapeHtml(p.category || 'Health')}</span>
          </td>
          <td>
            <div style="font-weight: 700; color: #059669;">${escapeHtml(formattedPrice)}</div>
            ${oldPrice}
          </td>
          <td>
            <label class="toggle-switch" title="Toggle In Stock">
              <input type="checkbox" ${p.inStock !== false ? 'checked' : ''} onchange="toggleProductStock(${p.id}, this.checked)" />
              <span class="toggle-slider"></span>
            </label>
          </td>
          <td>
            <label class="toggle-switch" title="Toggle Featured on Homepage">
              <input type="checkbox" ${p.featured ? 'checked' : ''} onchange="toggleProductFeatured(${p.id}, this.checked)" />
              <span class="toggle-slider"></span>
            </label>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 4px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openEditProductModal(${p.id})" title="Edit Product">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit</span>
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="confirmDeleteProduct(${p.id})" title="Delete Product">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.toggleProductStock = async function (id, inStock) {
    const product = state.products.find(p => p.id === Number(id));
    if (!product) return;

    product.inStock = inStock;
    product.in_stock = inStock;
    showToast(`Updating stock status for "${product.name}"...`, 'info', 1500);

    try {
      const res = await window.SupabaseStore.saveProduct(product);
      if (res && res.success) {
        showToast(`Stock status updated in Supabase!`, 'success');
        try {
          localStorage.setItem('healthIsWealth_products', JSON.stringify(state.products));
        } catch (e) {}
        broadcastDataChange('products_updated', state.products);
        updateCounts();
      } else {
        showToast(res.message || 'Failed to update stock in Supabase', 'error');
      }
    } catch (e) {
      showToast('Error persisting to Supabase', 'error');
    }
  };

  window.toggleProductFeatured = async function (id, featured) {
    const product = state.products.find(p => p.id === Number(id));
    if (!product) return;

    product.featured = featured;
    showToast(`Updating featured status for "${product.name}"...`, 'info', 1500);

    try {
      const res = await window.SupabaseStore.saveProduct(product);
      if (res && res.success) {
        showToast(`Featured status updated in Supabase!`, 'success');
        try {
          localStorage.setItem('healthIsWealth_products', JSON.stringify(state.products));
        } catch (e) {}
        broadcastDataChange('products_updated', state.products);
        renderDashboardOverview();
      } else {
        showToast(res.message || 'Failed to update featured in Supabase', 'error');
      }
    } catch (e) {
      showToast('Error persisting to Supabase', 'error');
    }
  };

  function populateCategoryDropdowns() {
    const filterSelect = document.getElementById('productCategoryFilter');
    const modalSelect = document.getElementById('prodFormCategory');

    if (filterSelect) {
      filterSelect.innerHTML = `<option value="">All Categories</option>` +
        state.categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }

    if (modalSelect) {
      modalSelect.innerHTML = state.categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }
  }

  function updatePriceCalculators() {
    const prodPriceInput = document.getElementById('prodFormPriceNum');
    const prodOldPriceInput = document.getElementById('prodFormOldPriceNum');
    const priceDisplay = document.getElementById('prodFormPriceDisplay');
    const discountDisplay = document.getElementById('prodFormDiscountDisplay');

    const p = prodPriceInput ? Number(prodPriceInput.value || 0) : 0;
    const op = prodOldPriceInput ? Number(prodOldPriceInput.value || 0) : 0;

    if (priceDisplay) {
      priceDisplay.textContent = `Formatted: ₦${p.toLocaleString()}`;
    }

    if (discountDisplay) {
      if (op > p && p > 0) {
        const discountPct = Math.round(((op - p) / op) * 100);
        discountDisplay.textContent = `Calculated discount: ${discountPct}% off (Original: ₦${op.toLocaleString()})`;
        discountDisplay.style.color = '#059669';
      } else {
        discountDisplay.textContent = 'Discount will be calculated automatically if original price is higher';
        discountDisplay.style.color = '#64748b';
      }
    }
  }

  // Add / Edit Product Modal
  window.openAddProductModal = function () {
    document.getElementById('productModalTitle').textContent = 'Add New Product';
    document.getElementById('saveProductBtnText').textContent = 'Save Product to Supabase';
    const idBadge = document.getElementById('prodFormIdBadge');
    if (idBadge) idBadge.style.display = 'none';

    document.getElementById('prodFormId').value = '';
    document.getElementById('prodFormName').value = '';
    document.getElementById('prodFormPriceNum').value = '';
    document.getElementById('prodFormOldPriceNum').value = '';
    const tagInput = document.getElementById('prodFormTag');
    if (tagInput) tagInput.value = '';
    document.getElementById('prodFormImage').value = '';
    document.getElementById('prodFormImagePreview').style.display = 'none';
    document.getElementById('prodFormImageFallback').style.display = 'block';
    document.getElementById('prodFormInStock').checked = true;
    document.getElementById('prodFormFeatured').checked = false;
    const descEl = document.getElementById('prodFormDescription');
    if (descEl) descEl.value = '';
    const fullDescEl = document.getElementById('prodFormFullDescription');
    if (fullDescEl) fullDescEl.value = '';
    const benefitsEl = document.getElementById('prodFormBenefits');
    if (benefitsEl) benefitsEl.value = '';

    updatePriceCalculators();
    populateCategoryDropdowns();

    document.getElementById('productModalBackdrop').classList.add('active');
    const modalBody = document.querySelector('#productModalBackdrop .modal-body');
    if (modalBody) modalBody.scrollTop = 0;
  };

  window.openEditProductModal = function (id) {
    const p = state.products.find(prod => prod.id === Number(id));
    if (!p) {
      showToast('Product not found in current catalog', 'error');
      return;
    }

    document.getElementById('productModalTitle').textContent = 'Edit Product Details';
    const idBadge = document.getElementById('prodFormIdBadge');
    if (idBadge) {
      idBadge.textContent = `Database ID: #${p.id}`;
      idBadge.style.display = 'inline-block';
    }

    document.getElementById('saveProductBtnText').textContent = 'Save Changes to Supabase';
    document.getElementById('prodFormId').value = p.id;
    document.getElementById('prodFormName').value = p.name || '';

    // Handle priceNum accurately whether from REST column price_num or property priceNum
    const rawPriceNum = p.priceNum ?? p.price_num ?? (typeof p.price === 'string' ? p.price.replace(/[^0-9]/g, '') : '') ?? '';
    document.getElementById('prodFormPriceNum').value = rawPriceNum;

    // Handle old price accurately
    const rawOldPrice = p.oldPrice ?? p.old_price ?? '';
    const oldPriceDigits = typeof rawOldPrice === 'string' ? rawOldPrice.replace(/[^0-9]/g, '') : rawOldPrice;
    document.getElementById('prodFormOldPriceNum').value = oldPriceDigits || '';

    // Refresh live price & discount display
    updatePriceCalculators();

    const tagInput = document.getElementById('prodFormTag');
    if (tagInput) tagInput.value = p.tag || '';
    document.getElementById('prodFormImage').value = p.image || '';

    const imgPreview = document.getElementById('prodFormImagePreview');
    const imgFallback = document.getElementById('prodFormImageFallback');
    if (p.image) {
      imgPreview.src = p.image;
      imgPreview.style.display = 'block';
      imgFallback.style.display = 'none';
    } else {
      imgPreview.style.display = 'none';
      imgFallback.style.display = 'block';
    }

    document.getElementById('prodFormInStock').checked = (p.inStock !== false && p.in_stock !== false);
    document.getElementById('prodFormFeatured').checked = Boolean(p.featured);

    const descEl = document.getElementById('prodFormDescription');
    if (descEl) {
      descEl.value = p.description || p.fullDescription || p.full_description || '';
    }
    const fullDescEl = document.getElementById('prodFormFullDescription');
    if (fullDescEl) {
      fullDescEl.value = p.fullDescription || p.full_description || p.description || '';
    }

    // Parse and display benefits list if element exists
    const benefitsEl = document.getElementById('prodFormBenefits');
    if (benefitsEl) {
      let benefitsText = '';
      if (Array.isArray(p.benefits)) {
        benefitsText = p.benefits.map(b => String(b || '').trim()).filter(Boolean).join('\n');
      } else if (typeof p.benefits === 'string' && p.benefits.trim()) {
        try {
          const parsed = JSON.parse(p.benefits);
          if (Array.isArray(parsed)) {
            benefitsText = parsed.map(b => String(b || '').trim()).filter(Boolean).join('\n');
          } else {
            benefitsText = p.benefits.trim();
          }
        } catch (e) {
          benefitsText = p.benefits.trim();
        }
      }
      benefitsEl.value = benefitsText;
    }

    populateCategoryDropdowns();
    if (p.category) {
      const catSelect = document.getElementById('prodFormCategory');
      if (catSelect) {
        const exists = Array.from(catSelect.options).some(opt => opt.value === p.category);
        if (!exists) {
          const opt = document.createElement('option');
          opt.value = p.category;
          opt.textContent = p.category;
          catSelect.appendChild(opt);
        }
        catSelect.value = p.category;
      }
    }

    document.getElementById('productModalBackdrop').classList.add('active');
    const modalBody = document.querySelector('#productModalBackdrop .modal-body');
    if (modalBody) modalBody.scrollTop = 0;
  };

  window.closeProductModal = function () {
    document.getElementById('productModalBackdrop').classList.remove('active');
  };

  async function handleProductFormSubmit(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('btnSaveProductSubmit');
    const saveText = document.getElementById('saveProductBtnText');
    const rawId = document.getElementById('prodFormId').value;
    const isEdit = Boolean(rawId);

    let prodId;
    if (isEdit) {
      prodId = Number(rawId);
    } else {
      const maxId = state.products.reduce((acc, curr) => Math.max(acc, Number(curr.id || 0)), 0);
      prodId = maxId + 1;
    }

    const priceNum = Number(document.getElementById('prodFormPriceNum').value || 0);
    const oldPriceNum = Number(document.getElementById('prodFormOldPriceNum').value || 0);
    const formattedPrice = `₦${priceNum.toLocaleString()}`;
    const oldPriceFormatted = oldPriceNum > 0 ? `₦${oldPriceNum.toLocaleString()}` : null;

    let discount = '';
    if (oldPriceNum > priceNum && priceNum > 0) {
      const pct = Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100);
      discount = `${pct}% off`;
    }

    const existingProduct = isEdit ? state.products.find(p => p.id === prodId) : null;
    const descValue = (document.getElementById('prodFormDescription')?.value || '').trim();
    const fullDescEl = document.getElementById('prodFormFullDescription');
    const fullDescValue = fullDescEl ? fullDescEl.value.trim() : descValue;

    let benefitsList = [];
    const benefitsEl = document.getElementById('prodFormBenefits');
    if (benefitsEl && benefitsEl.value) {
      benefitsList = benefitsEl.value
        .split('\n')
        .map(b => b.trim())
        .filter(Boolean);
    } else if (existingProduct && Array.isArray(existingProduct.benefits)) {
      benefitsList = existingProduct.benefits;
    }

    const productPayload = {
      id: prodId,
      name: document.getElementById('prodFormName').value.trim(),
      category: document.getElementById('prodFormCategory').value || 'Health',
      price: formattedPrice,
      priceNum: priceNum,
      price_num: priceNum,
      oldPrice: oldPriceFormatted,
      old_price: oldPriceFormatted,
      discount: discount,
      tag: (document.getElementById('prodFormTag')?.value || '').trim() || null,
      image: document.getElementById('prodFormImage').value.trim(),
      inStock: document.getElementById('prodFormInStock').checked,
      in_stock: document.getElementById('prodFormInStock').checked,
      featured: document.getElementById('prodFormFeatured').checked,
      description: descValue,
      fullDescription: fullDescValue || descValue,
      full_description: fullDescValue || descValue,
      benefits: benefitsList
    };

    saveBtn.disabled = true;
    saveText.textContent = 'Saving to Supabase...';

    try {
      const result = await window.SupabaseStore.saveProduct(productPayload);

      if (result && result.success) {
        showToast(`Product "${productPayload.name}" saved to Supabase successfully!`, 'success');

        const existingIdx = state.products.findIndex(p => p.id === prodId);
        if (existingIdx >= 0) {
          state.products[existingIdx] = productPayload;
        } else {
          state.products.push(productPayload);
        }

        try {
          localStorage.setItem('healthIsWealth_products', JSON.stringify(state.products));
        } catch (e) {}
        broadcastDataChange('products_updated', state.products);

        closeProductModal();
        renderProductsTable();
        renderDashboardOverview();
        updateCounts();
      } else {
        showToast(result.message || 'Error saving product to Supabase', 'error');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      showToast('Network error while saving to Supabase', 'error');
    } finally {
      saveBtn.disabled = false;
      saveText.textContent = isEdit ? 'Save Changes to Supabase' : 'Save Product to Supabase';
    }
  }

  // Delete Product Confirmation
  window.confirmDeleteProduct = function (id) {
    const prod = state.products.find(p => p.id === Number(id));
    if (!prod) return;

    document.getElementById('deleteConfirmTitle').textContent = `Delete "${prod.name}"?`;
    document.getElementById('deleteConfirmMessage').textContent =
      `Are you sure you want to permanently remove this product from Supabase? It will immediately disappear from your live storefront.`;

    state.pendingDeleteAction = async () => {
      showToast(`Deleting product #${prod.id} from Supabase...`, 'info');
      const success = await window.SupabaseStore.deleteProduct(prod.id);
      if (success) {
        state.products = state.products.filter(p => p.id !== prod.id);
        try {
          localStorage.setItem('healthIsWealth_products', JSON.stringify(state.products));
        } catch (e) {}
        broadcastDataChange('products_updated', state.products);
        showToast(`Product "${prod.name}" deleted from Supabase.`, 'success');
        renderProductsTable();
        renderDashboardOverview();
        updateCounts();
      } else {
        showToast('Could not delete product from Supabase', 'error');
      }
    };

    document.getElementById('deleteConfirmBackdrop').classList.add('active');
  };

  // =========================================================================
  // CATEGORY MANAGEMENT
  // =========================================================================
  function renderCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

    if (state.categories.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 2rem;">No categories found.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.categories.map((catName, index) => {
      const prodCount = state.products.filter(p => p.category === catName).length;

      return `
        <tr>
          <td><span style="font-family: monospace; color: #64748b;">#${index + 1}</span></td>
          <td>
            <div style="font-weight: 700; color: #0f172a; font-size: 0.95rem;">${escapeHtml(catName)}</div>
          </td>
          <td>
            <span class="badge ${prodCount > 0 ? 'badge-info' : 'badge-slate'}">
              ${prodCount} product${prodCount === 1 ? '' : 's'}
            </span>
          </td>
          <td style="font-size: 0.8rem; color: #059669; font-weight: 600;">Active Live</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button type="button" class="btn btn-danger btn-sm" onclick="confirmDeleteCategory('${escapeHtml(catName)}')" title="Delete Category">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.openAddCategoryModal = function () {
    document.getElementById('categoryFormName').value = '';
    document.getElementById('categoryModalBackdrop').classList.add('active');
  };

  window.closeCategoryModal = function () {
    document.getElementById('categoryModalBackdrop').classList.remove('active');
  };

  async function handleCategoryFormSubmit(e) {
    e.preventDefault();
    const newName = document.getElementById('categoryFormName').value.trim();
    if (!newName) return;

    if (state.categories.includes(newName)) {
      showToast(`Category "${newName}" already exists`, 'warning');
      return;
    }

    showToast(`Adding category "${newName}" to Supabase...`, 'info');
    const ok = await window.SupabaseStore.addCategory(newName);

    if (ok) {
      state.categories.push(newName);
      try {
        localStorage.setItem('healthIsWealth_categories', JSON.stringify(state.categories));
      } catch (e) {}
      broadcastDataChange('categories_updated', state.categories);
      showToast(`Category "${newName}" created successfully in Supabase!`, 'success');
      closeCategoryModal();
      populateCategoryDropdowns();
      renderCategoriesTable();
      updateCounts();
    } else {
      showToast('Failed to save category in Supabase', 'error');
    }
  }

  window.confirmDeleteCategory = function (catName) {
    const count = state.products.filter(p => p.category === catName).length;
    if (count > 0) {
      showToast(`Cannot delete "${catName}": ${count} products belong to this category. Reassign them first.`, 'warning', 4500);
      return;
    }

    document.getElementById('deleteConfirmTitle').textContent = `Delete category "${catName}"?`;
    document.getElementById('deleteConfirmMessage').textContent =
      `Are you sure you want to delete this category from Supabase? It will no longer appear in store collections.`;

    state.pendingDeleteAction = async () => {
      showToast(`Deleting category from Supabase...`, 'info');
      const ok = await window.SupabaseStore.deleteCategory(catName);
      if (ok) {
        state.categories = state.categories.filter(c => c !== catName);
        try {
          localStorage.setItem('healthIsWealth_categories', JSON.stringify(state.categories));
        } catch (e) {}
        broadcastDataChange('categories_updated', state.categories);
        showToast(`Category "${catName}" deleted from Supabase.`, 'success');
        populateCategoryDropdowns();
        renderCategoriesTable();
        updateCounts();
      } else {
        showToast('Error deleting category from Supabase', 'error');
      }
    };

    document.getElementById('deleteConfirmBackdrop').classList.add('active');
  };

  // =========================================================================
  // ORDERS MANAGEMENT
  // =========================================================================
  function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    let list = [...state.orders];

    if (state.orderSearchQuery) {
      const q = state.orderSearchQuery.toLowerCase();
      list = list.filter(o =>
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_phone && o.customer_phone.includes(q)) ||
        (o.order_number && o.order_number.toLowerCase().includes(q)) ||
        (o.id && o.id.toLowerCase().includes(q))
      );
    }

    if (state.orderStatusFilter) {
      list = list.filter(o => (o.status || 'pending').toLowerCase() === state.orderStatusFilter.toLowerCase());
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 2.5rem;">No customer orders found.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(o => {
      const ref = escapeHtml(o.order_number || o.id?.slice(0, 8) || 'REF');
      const date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
      const name = escapeHtml(o.customer_name || 'Anonymous Customer');
      const phone = escapeHtml(o.customer_phone || '-');
      const location = escapeHtml(o.delivery_location || o.delivery_address || o.state_city || '-');
      const itemsCount = Array.isArray(o.items) ? o.items.length : 0;
      const total = Number(o.total_amount || 0).toLocaleString();
      const currentStatus = (o.status || 'pending').toLowerCase();

      const waNumber = (o.customer_phone || '').replace(/[^0-9]/g, '');
      const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${o.customer_name || ''}, this is Health is Wealth Store regarding your order #${ref}.`)}` : null;

      return `
        <tr>
          <td><span style="font-weight: 700; font-family: monospace; color: #059669;">#${ref}</span></td>
          <td style="font-size: 0.78rem; color: #64748b; white-space: nowrap;">${date}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${name}</div>
            <div style="font-size: 0.75rem; color: #059669;">${phone}</div>
          </td>
          <td style="font-size: 0.8rem; color: #475569; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${location}</td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" onclick="viewOrderDetails('${o.id}')">
              ${itemsCount} item${itemsCount === 1 ? '' : 's'}
            </button>
          </td>
          <td style="font-weight: 700; color: #0f172a;">₦${total}</td>
          <td>
            <select class="filter-select" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onchange="handleOrderStatusChange('${o.id}', this.value)">
              <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${currentStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="dispatched" ${currentStatus === 'dispatched' ? 'selected' : ''}>Dispatched</option>
              <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 4px;">
              ${waLink ? `
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="color: #059669;" title="Message on WhatsApp">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </a>
              ` : ''}
              <button type="button" class="btn btn-secondary btn-sm" onclick="viewOrderDetails('${o.id}')" title="Inspect Order">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="confirmDeleteOrder('${o.id}')" title="Delete Order">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.handleOrderStatusChange = async function (orderId, newStatus) {
    showToast(`Updating order status to "${newStatus}" in Supabase...`, 'info', 1500);
    const ok = await window.SupabaseStore.updateOrderStatus(orderId, newStatus);
    if (ok) {
      const ord = state.orders.find(o => o.id === orderId);
      if (ord) ord.status = newStatus;
      showToast('Order status updated in Supabase!', 'success');
      updateCounts();
      renderDashboardOverview();
    } else {
      showToast('Could not update order status in Supabase', 'error');
    }
  };

  window.viewOrderDetails = function (orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const ref = escapeHtml(order.order_number || order.id?.slice(0, 8) || 'REF');
    const date = order.created_at ? new Date(order.created_at).toLocaleString('en-GB') : '-';
    const items = Array.isArray(order.items) ? order.items : [];

    const itemsHtml = items.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem;">
        <div>
          <div style="font-weight: 600; color: #0f172a;">${escapeHtml(item.name || 'Product')}</div>
          <div style="font-size: 0.75rem; color: #64748b;">Qty: ${item.quantity || 1} × ${item.price || ''}</div>
        </div>
        <div style="font-weight: 700; color: #059669;">
          ₦${((Number(item.priceNum || 0)) * (Number(item.quantity || 1))).toLocaleString()}
        </div>
      </div>
    `).join('');

    document.getElementById('orderModalTitle').textContent = `Order Details #${ref}`;
    document.getElementById('orderModalBody').innerHTML = `
      <div style="margin-bottom: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; font-size: 0.82rem;">
          <div>
            <span style="color: #64748b; font-size: 0.72rem; text-transform: uppercase;">Customer Name:</span>
            <div style="font-weight: 700; color: #0f172a;">${escapeHtml(order.customer_name || 'Anonymous')}</div>
          </div>
          <div>
            <span style="color: #64748b; font-size: 0.72rem; text-transform: uppercase;">Phone Number:</span>
            <div style="font-weight: 700; color: #059669;">${escapeHtml(order.customer_phone || '-')}</div>
          </div>
          <div>
            <span style="color: #64748b; font-size: 0.72rem; text-transform: uppercase;">Delivery Location:</span>
            <div style="font-weight: 600; color: #0f172a;">${escapeHtml(order.delivery_location || order.delivery_address || order.state_city || '-')}</div>
          </div>
          <div>
            <span style="color: #64748b; font-size: 0.72rem; text-transform: uppercase;">Order Date:</span>
            <div style="font-weight: 600; color: #0f172a;">${date}</div>
          </div>
        </div>
      </div>

      <h4 style="font-size: 0.9rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Purchased Botanical Items</h4>
      <div style="margin-bottom: 1rem; max-height: 220px; overflow-y: auto;">
        ${itemsHtml || '<div style="color: #94a3b8; font-size: 0.82rem;">No item details available.</div>'}
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 0.75rem; display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between; color: #64748b;">
          <span>Subtotal:</span>
          <span>₦${Number(order.subtotal || 0).toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #64748b;">
          <span>Delivery Fee:</span>
          <span>₦${Number(order.delivery_fee || 0).toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.05rem; color: #059669; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 4px;">
          <span>Total Order Amount:</span>
          <span>₦${Number(order.total_amount || 0).toLocaleString()}</span>
        </div>
      </div>
    `;

    document.getElementById('orderModalBackdrop').classList.add('active');
  };

  window.closeOrderModal = function () {
    document.getElementById('orderModalBackdrop').classList.remove('active');
  };

  window.confirmDeleteOrder = function (orderId) {
    document.getElementById('deleteConfirmTitle').textContent = `Delete Order?`;
    document.getElementById('deleteConfirmMessage').textContent =
      `Are you sure you want to delete this order from Supabase? This action cannot be undone.`;

    state.pendingDeleteAction = async () => {
      showToast('Deleting order from Supabase...', 'info');
      const ok = await window.SupabaseStore.deleteOrder(orderId);
      if (ok) {
        state.orders = state.orders.filter(o => o.id !== orderId);
        showToast('Order removed from Supabase.', 'success');
        renderOrdersTable();
        renderDashboardOverview();
        updateCounts();
      } else {
        showToast('Error deleting order from Supabase', 'error');
      }
    };

    document.getElementById('deleteConfirmBackdrop').classList.add('active');
  };

  // =========================================================================
  // WEBSITE CONTENT MANAGEMENT
  // =========================================================================
  function populateContentForm() {
    const marqueeInput = document.getElementById('marqueeTextInput');
    const marqueePreview = document.getElementById('marqueePreview');
    const locationInput = document.getElementById('storeLocationInput');
    const currencyInput = document.getElementById('currencySymbolInput');

    const cfg = state.storeConfig || {};
    const marqueeVal = cfg.marqueeText || "Welcome to Health is Wealth • 100% Pure Natural Botanical Formulations";

    if (marqueeInput) {
      marqueeInput.value = marqueeVal;
      if (marqueePreview) marqueePreview.textContent = marqueeVal;
    }

    if (locationInput) {
      locationInput.value = cfg.location || "Enugu, Abuja & Lagos, Nigeria (Nationwide Delivery)";
    }

    if (currencyInput) {
      currencyInput.value = cfg.currencySymbol || "₦";
    }
  }

  async function handleContentFormSubmit(e) {
    e.preventDefault();
    const marqueeText = document.getElementById('marqueeTextInput').value.trim();
    const location = document.getElementById('storeLocationInput').value.trim();
    const currencySymbol = document.getElementById('currencySymbolInput').value.trim();

    state.storeConfig = {
      ...(state.storeConfig || {}),
      marqueeText,
      location,
      currencySymbol
    };

    showToast('Saving website content to Supabase...', 'info');

    try {
      const ok = await window.SupabaseStore.saveStoreConfig(state.storeConfig);
      if (ok) {
        try {
          localStorage.setItem('healthIsWealth_config', JSON.stringify(state.storeConfig));
        } catch (e) {}
        broadcastDataChange('config_updated', state.storeConfig);
        showToast('Website content published live to Supabase!', 'success');
      } else {
        showToast('Could not save content to Supabase', 'error');
      }
    } catch (err) {
      showToast('Error communicating with Supabase', 'error');
    }
  }

  // =========================================================================
  // MEDIA STORAGE & IMAGE MANAGER
  // =========================================================================
  function renderMediaGallery() {
    const grid = document.getElementById('mediaGalleryGrid');
    const countEl = document.getElementById('mediaCountText');
    if (!grid) return;

    if (countEl) {
      countEl.textContent = `${state.mediaFiles.length} image${state.mediaFiles.length === 1 ? '' : 's'} (Supabase Storage: product-images)`;
    }

    if (state.mediaFiles.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 2.5rem;">No media files uploaded yet. Drag &amp; drop photos above to add images directly to your Supabase Storage bucket.</div>`;
      return;
    }

    grid.innerHTML = state.mediaFiles.map(file => {
      const isSupabase = file.url && file.url.includes('supabase.co');
      return `
        <div class="media-item">
          <img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.name)}" loading="lazy" />
          <div class="media-item-overlay">
            <div style="font-size: 0.65rem; color: #fff; max-width: 90%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; font-weight: 600;">
              ${escapeHtml(file.name)}
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: center;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="copyMediaUrl('${escapeHtml(file.url)}')" style="font-size: 0.72rem; padding: 3px 6px;">
                Copy URL
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="useMediaInProductModal('${escapeHtml(file.url)}')" style="font-size: 0.72rem; padding: 3px 6px;">
                Use
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="confirmDeleteMedia('${escapeHtml(file.name)}')" style="font-size: 0.72rem; padding: 3px 6px;" title="Delete from Supabase Storage">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.copyMediaUrl = function (url) {
    const fullUrl = url.startsWith('http') ? url : (window.location.origin + url);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('Image URL copied to clipboard!', 'success');
      });
    } else {
      showToast(fullUrl, 'info');
    }
  };

  window.useMediaInProductModal = function (url) {
    const productModalOpen = document.getElementById('productModalBackdrop').classList.contains('active');
    if (!productModalOpen) {
      openAddProductModal();
    }
    const imgInput = document.getElementById('prodFormImage');
    const imgPrev = document.getElementById('prodFormImagePreview');
    const imgFall = document.getElementById('prodFormImageFallback');
    if (imgInput) imgInput.value = url;
    if (imgPrev) {
      imgPrev.src = url;
      imgPrev.style.display = 'block';
    }
    if (imgFall) imgFall.style.display = 'none';
    showToast('Image attached to product!', 'success');
  };

  window.confirmDeleteMedia = function (fileName) {
    document.getElementById('deleteConfirmTitle').textContent = `Delete Image "${fileName}"?`;
    document.getElementById('deleteConfirmMessage').textContent =
      `Are you sure you want to permanently delete this image from your Supabase Storage bucket ("product-images")? Any product using this image URL will lose its preview.`;

    state.pendingDeleteAction = async () => {
      showToast(`Deleting "${fileName}" from Supabase Storage...`, 'info');
      try {
        const res = await fetch('/api/admin/delete-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: fileName })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          state.mediaFiles = state.mediaFiles.filter(f => f.name !== fileName);
          renderMediaGallery();
          showToast('Image deleted from Supabase Storage!', 'success');
        } else {
          showToast(data.message || 'Error deleting image from Supabase Storage', 'error');
        }
      } catch (err) {
        showToast('Network error deleting image', 'error');
      }
    };

    document.getElementById('deleteConfirmBackdrop').classList.add('active');
  };

  async function uploadImageFile(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Selected file is not an image', 'error');
      return;
    }

    showToast(`Uploading ${file.name} to Supabase Storage...`, 'info');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (state.token) {
          headers['Authorization'] = `Bearer ${state.token}`;
        }

        const res = await fetch('/api/admin/upload-media', {
          method: 'POST',
          headers,
          body: JSON.stringify({ filename: file.name, dataUrl })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Image saved to Supabase Storage ("product-images")!', 'success');
          state.mediaFiles.unshift({ name: data.name, url: data.url });
          renderMediaGallery();

          // If product modal is open, auto-fill
          const prodImageInput = document.getElementById('prodFormImage');
          const prodImagePreview = document.getElementById('prodFormImagePreview');
          const prodImageFallback = document.getElementById('prodFormImageFallback');
          if (document.getElementById('productModalBackdrop').classList.contains('active')) {
            if (prodImageInput) prodImageInput.value = data.url;
            if (prodImagePreview) {
              prodImagePreview.src = data.url;
              prodImagePreview.style.display = 'block';
            }
            if (prodImageFallback) prodImageFallback.style.display = 'none';
          }
        } else {
          showToast(data.message || 'Upload to Supabase Storage failed', 'error');
        }
      } catch (err) {
        showToast('Network error uploading image to Supabase Storage', 'error');
      }
    };
    reader.readAsDataURL(file);
  }

  // =========================================================================
  // STORE SETTINGS & STERLING BANK DETAILS
  // =========================================================================
  function populateSettingsForm() {
    const cfg = state.storeConfig || {};
    const nameEl = document.getElementById('settingStoreName');
    const waEl = document.getElementById('settingWhatsapp');
    const phoneEl = document.getElementById('settingPhoneDisplay');
    const locEl = document.getElementById('settingLocation');
    const bankNameEl = document.getElementById('settingBankName');
    const bankAcctEl = document.getElementById('settingBankAccount');
    const acctNameEl = document.getElementById('settingAccountName');
    const fbEl = document.getElementById('settingFacebook');
    const igEl = document.getElementById('settingInstagram');

    if (nameEl) nameEl.value = cfg.storeName || "Health is Wealth";
    if (waEl) waEl.value = cfg.whatsappNumber || "2348084765252";
    if (phoneEl) phoneEl.value = cfg.phoneDisplay || "08084765252";
    if (locEl) locEl.value = cfg.location || "Enugu, Abuja & Lagos, Nigeria (Nationwide Delivery)";
    if (bankNameEl) bankNameEl.value = cfg.bankName || "Sterling Bank";
    if (bankAcctEl) bankAcctEl.value = cfg.bankAccount || "0097137583";
    if (acctNameEl) acctNameEl.value = cfg.accountName || "Ezema Emmanuel Tochukwu";
    if (fbEl) fbEl.value = cfg.facebookUrl || "https://www.facebook.com/profile.php?id=61550049644320";
    if (igEl) igEl.value = cfg.instagramUrl || "https://www.instagram.com/healthis440?stkn=MW4xMDM0a3cwdmwwOA==";
  }

  async function handleStoreSettingsSubmit(e) {
    e.preventDefault();
    const updated = {
      ...(state.storeConfig || {}),
      storeName: document.getElementById('settingStoreName').value.trim(),
      whatsappNumber: document.getElementById('settingWhatsapp').value.trim(),
      phoneDisplay: document.getElementById('settingPhoneDisplay').value.trim(),
      location: document.getElementById('settingLocation').value.trim(),
      bankName: document.getElementById('settingBankName').value.trim(),
      bankAccount: document.getElementById('settingBankAccount').value.trim(),
      accountName: document.getElementById('settingAccountName').value.trim(),
      facebookUrl: document.getElementById('settingFacebook').value.trim(),
      instagramUrl: document.getElementById('settingInstagram').value.trim(),
    };

    state.storeConfig = updated;
    showToast('Saving store configuration to Supabase...', 'info');

    try {
      const ok = await window.SupabaseStore.saveStoreConfig(updated);
      if (ok) {
        try {
          localStorage.setItem('healthIsWealth_config', JSON.stringify(updated));
        } catch (e) {}
        broadcastDataChange('config_updated', updated);
        showToast('Store settings & Sterling Bank account saved to Supabase!', 'success');
      } else {
        showToast('Failed to save settings to Supabase', 'error');
      }
    } catch (err) {
      showToast('Network error saving settings', 'error');
    }
  }

  // =========================================================================
  // SUPABASE DIAGNOSTICS & BULK SYNC
  // =========================================================================
  function updateDiagnosticsPanel() {
    const pCount = document.getElementById('diagProductsCount');
    const cCount = document.getElementById('diagCategoriesCount');
    const oCount = document.getElementById('diagOrdersCount');
    const sStatus = document.getElementById('diagConfigStatus');

    if (pCount) pCount.textContent = `${state.products.length} Records`;
    if (cCount) cCount.textContent = `${state.categories.length} Categories`;
    if (oCount) oCount.textContent = `${state.orders.length} Logged Orders`;
    if (sStatus) sStatus.textContent = state.storeConfig ? 'Configured (Active)' : 'Standard Defaults';
  }

  async function pingSupabaseStatus() {
    const textEl = document.getElementById('supabaseStatusText');
    const titleEl = document.getElementById('diagStatusTitle');
    const subEl = document.getElementById('diagStatusSub');

    if (typeof window.SupabaseStore === 'undefined') return;

    try {
      const res = await window.SupabaseStore.testConnection();
      if (res && res.success) {
        if (textEl) textEl.textContent = 'Supabase Connected';
        if (titleEl) titleEl.textContent = 'Supabase PostgreSQL Cloud Active';
        if (subEl) subEl.textContent = 'Live REST query verified • Instant cloud sync active';
      } else {
        if (textEl) textEl.textContent = 'Offline / Local Store';
        if (titleEl) titleEl.textContent = 'Supabase Connection Notice';
        if (subEl) subEl.textContent = res.message || 'Check database connection credentials.';
      }
    } catch (e) {
      if (textEl) textEl.textContent = 'Offline / Local Store';
    }
  }

  async function handleTestSupabaseLatency() {
    const start = performance.now();
    showToast('Testing Supabase response latency...', 'info', 1500);

    try {
      const res = await window.SupabaseStore.testConnection();
      const elapsed = Math.round(performance.now() - start);

      if (res && res.success) {
        showToast(`Supabase PostgreSQL active! Response time: ${elapsed}ms`, 'success');
      } else {
        showToast(`Test result: ${res.message}`, 'warning', 4500);
      }
    } catch (err) {
      showToast('Error testing Supabase connection', 'error');
    }
  }

  async function handleForcePullAll() {
    showToast('Pulling latest database records from Supabase...', 'info');
    await initDashboardData();
    showToast('Fresh data loaded from Supabase!', 'success');
  }

  async function handleForcePushAll() {
    showToast('Pushing all local catalog products and categories to Supabase...', 'info');
    try {
      const ok = await window.SupabaseStore.pushAllToSupabase(
        state.products,
        state.categories,
        state.storeConfig
      );
      if (ok) {
        showToast('All products and configurations uploaded to Supabase!', 'success');
        broadcastDataChange('products_updated', state.products);
        updateDiagnosticsPanel();
      } else {
        showToast('Could not complete bulk push to Supabase', 'error');
      }
    } catch (e) {
      showToast('Error pushing data to Supabase', 'error');
    }
  }

  // =========================================================================
  // DELETE CONFIRMATION MODAL
  // =========================================================================
  window.closeDeleteConfirmModal = function () {
    document.getElementById('deleteConfirmBackdrop').classList.remove('active');
    state.pendingDeleteAction = null;
  };

  async function handleExecuteDelete() {
    if (typeof state.pendingDeleteAction === 'function') {
      const action = state.pendingDeleteAction;
      closeDeleteConfirmModal();
      await action();
    }
  }

  // =========================================================================
  // EVENT LISTENERS & BOOTSTRAP
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth check
    checkAuthSession();

    // 2. Forms
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

    const productForm = document.getElementById('productForm');
    if (productForm) productForm.addEventListener('submit', handleProductFormSubmit);

    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) categoryForm.addEventListener('submit', handleCategoryFormSubmit);

    const contentForm = document.getElementById('contentSettingsForm');
    if (contentForm) contentForm.addEventListener('submit', handleContentFormSubmit);

    const storeSettingsForm = document.getElementById('storeSettingsForm');
    if (storeSettingsForm) storeSettingsForm.addEventListener('submit', handleStoreSettingsSubmit);

    // 3. Logout Buttons
    const btnLogoutSidebar = document.getElementById('btnLogoutSidebar');
    if (btnLogoutSidebar) btnLogoutSidebar.addEventListener('click', handleLogout);

    const btnHeaderLogout = document.getElementById('btnHeaderLogout');
    if (btnHeaderLogout) btnHeaderLogout.addEventListener('click', handleLogout);

    // 4. Delete confirm
    const btnExecuteDelete = document.getElementById('btnExecuteDelete');
    if (btnExecuteDelete) btnExecuteDelete.addEventListener('click', handleExecuteDelete);

    // 5. Password Show/Hide Toggle
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const loginPassword = document.getElementById('loginPassword');
    if (togglePasswordBtn && loginPassword) {
      togglePasswordBtn.addEventListener('click', () => {
        if (loginPassword.type === 'password') {
          loginPassword.type = 'text';
          togglePasswordBtn.textContent = 'Hide';
        } else {
          loginPassword.type = 'password';
          togglePasswordBtn.textContent = 'Show';
        }
      });
    }

    // 6. Mobile Sidebar Toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (mobileBtn && sidebar && backdrop) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        backdrop.classList.toggle('active');
      });
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('active');
      });
    }

    // 7. Search & Filter Inputs
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        renderProductsTable();
      });
    }

    const catFilter = document.getElementById('productCategoryFilter');
    if (catFilter) {
      catFilter.addEventListener('change', (e) => {
        state.selectedCategory = e.target.value;
        renderProductsTable();
      });
    }

    const stockFilter = document.getElementById('productStockFilter');
    if (stockFilter) {
      stockFilter.addEventListener('change', (e) => {
        state.stockFilter = e.target.value;
        renderProductsTable();
      });
    }

    const featuredFilter = document.getElementById('productFeaturedFilter');
    if (featuredFilter) {
      featuredFilter.addEventListener('change', (e) => {
        state.featuredFilter = e.target.value;
        renderProductsTable();
      });
    }

    const sortBy = document.getElementById('productSortBy');
    if (sortBy) {
      sortBy.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderProductsTable();
      });
    }

    // 8. Order search & filter
    const orderSearch = document.getElementById('orderSearchInput');
    if (orderSearch) {
      orderSearch.addEventListener('input', (e) => {
        state.orderSearchQuery = e.target.value.trim();
        renderOrdersTable();
      });
    }

    const orderStatusFilter = document.getElementById('orderStatusFilter');
    if (orderStatusFilter) {
      orderStatusFilter.addEventListener('change', (e) => {
        state.orderStatusFilter = e.target.value;
        renderOrdersTable();
      });
    }

    const btnRefreshOrders = document.getElementById('btnRefreshOrders');
    if (btnRefreshOrders) {
      btnRefreshOrders.addEventListener('click', async () => {
        showToast('Refreshing customer orders...', 'info');
        await loadOrdersFromSupabase();
        renderOrdersTable();
        renderDashboardOverview();
        showToast('Orders refreshed!', 'success');
      });
    }

    // 9. Product Form Live Price Display & Image Preview
    const prodPriceInput = document.getElementById('prodFormPriceNum');
    const prodOldPriceInput = document.getElementById('prodFormOldPriceNum');

    if (prodPriceInput) prodPriceInput.addEventListener('input', updatePriceCalculators);
    if (prodOldPriceInput) prodOldPriceInput.addEventListener('input', updatePriceCalculators);

    const prodImageInput = document.getElementById('prodFormImage');
    const prodImagePreview = document.getElementById('prodFormImagePreview');
    const prodImageFallback = document.getElementById('prodFormImageFallback');

    if (prodImageInput) {
      prodImageInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val && prodImagePreview && prodImageFallback) {
          prodImagePreview.src = val;
          prodImagePreview.style.display = 'block';
          prodImageFallback.style.display = 'none';
        } else if (prodImagePreview && prodImageFallback) {
          prodImagePreview.style.display = 'none';
          prodImageFallback.style.display = 'block';
        }
      });
    }

    // Product Modal Image File Upload
    const btnUploadImageForProduct = document.getElementById('btnUploadImageForProduct');
    const productImageFileInput = document.getElementById('productImageFileInput');
    if (btnUploadImageForProduct && productImageFileInput) {
      btnUploadImageForProduct.addEventListener('click', () => productImageFileInput.click());
      productImageFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          uploadImageFile(e.target.files[0]);
        }
      });
    }

    // Media Gallery Dropzone & File Input
    const mediaDropzone = document.getElementById('mediaDropzone');
    const mediaFileInput = document.getElementById('mediaFileInput');
    if (mediaDropzone && mediaFileInput) {
      mediaDropzone.addEventListener('click', () => mediaFileInput.click());
      mediaFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          uploadImageFile(e.target.files[0]);
        }
      });

      mediaDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        mediaDropzone.classList.add('dragover');
      });

      mediaDropzone.addEventListener('dragleave', () => {
        mediaDropzone.classList.remove('dragover');
      });

      mediaDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        mediaDropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          uploadImageFile(e.dataTransfer.files[0]);
        }
      });
    }

    // Marquee Live Preview
    const marqueeInput = document.getElementById('marqueeTextInput');
    const marqueePreview = document.getElementById('marqueePreview');
    if (marqueeInput && marqueePreview) {
      marqueeInput.addEventListener('input', (e) => {
        marqueePreview.textContent = e.target.value;
      });
    }

    // Diagnostics buttons
    const btnTestPing = document.getElementById('btnTestSupabasePing');
    if (btnTestPing) btnTestPing.addEventListener('click', handleTestSupabaseLatency);

    const btnForcePull = document.getElementById('btnForcePullAll');
    if (btnForcePull) btnForcePull.addEventListener('click', handleForcePullAll);

    const btnForcePush = document.getElementById('btnForcePushAll');
    if (btnForcePush) btnForcePush.addEventListener('click', handleForcePushAll);
  });
})();
