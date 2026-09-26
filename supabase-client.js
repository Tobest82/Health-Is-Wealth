/**
 * HEALTH IS WEALTH - SUPABASE CLIENT & REST ADAPTER
 * High-performance, resilient connector to Supabase PostgreSQL Database.
 * Works seamlessly with environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY),
 * local credentials, and /supabase-config.json for automatic multi-device live synchronization.
 */

(function(window) {
  const STORAGE_KEY_URL = "healthIsWealth_supabase_url";
  const STORAGE_KEY_KEY = "healthIsWealth_supabase_key";

  /**
   * Cleans and normalizes Supabase URL
   * Prevents double /rest/v1/rest/v1/ 404 path errors if user entered REST endpoint
   */
  function normalizeSupabaseUrl(rawUrl) {
    if (!rawUrl) return "";
    let url = String(rawUrl).trim();
    url = url.replace(/\/+$/, "");
    url = url.replace(/\/rest\/v1\/?$/i, "");
    return url.replace(/\/+$/, "");
  }

  // Detect environment variables safely
  let envUrl = "";
  let envKey = "";
  try {
    const w = typeof window !== "undefined" ? window : {};
    const envObj = w.__ENV__ || w.ENV || (typeof process !== "undefined" && process.env ? process.env : null);
    if (envObj) {
      envUrl = envObj.VITE_SUPABASE_URL || envObj.SUPABASE_URL || "";
      envKey = envObj.VITE_SUPABASE_ANON_KEY || envObj.SUPABASE_ANON_KEY || "";
    }
    if (!envUrl && w.VITE_SUPABASE_URL) envUrl = w.VITE_SUPABASE_URL;
    if (!envKey && w.VITE_SUPABASE_ANON_KEY) envKey = w.VITE_SUPABASE_ANON_KEY;
  } catch (e) {}

  let configLoadingPromise = null;

  const SupabaseStore = {
    /**
     * Get current credentials, prioritizing stored configuration, then environment variables.
     */
    getConfig() {
      let customUrl = "";
      let customKey = "";
      try {
        customUrl = (localStorage.getItem(STORAGE_KEY_URL) || "").trim();
        customKey = (localStorage.getItem(STORAGE_KEY_KEY) || "").trim();
      } catch (e) {}

      const rawUrl = customUrl || envUrl || "";
      const url = normalizeSupabaseUrl(rawUrl);
      const key = (customKey || envKey || "").trim();
      const source = customUrl ? "custom" : (envUrl ? "environment" : "none");

      return {
        url: url,
        key: key,
        source: source,
        isConfigured: !!(url && key)
      };
    },

    isConfigured() {
      return this.getConfig().isConfigured;
    },

    /**
     * Ensures configuration is loaded, fetching /supabase-config.json if empty
     */
    async ensureConfig() {
      if (this.isConfigured()) {
        return this.getConfig();
      }

      if (!configLoadingPromise) {
        configLoadingPromise = (async () => {
          try {
            const resp = await fetch("/supabase-config.json?v=" + Date.now());
            if (resp.ok) {
              const data = await resp.json();
              if (data && data.url && data.key) {
                const normUrl = normalizeSupabaseUrl(data.url);
                this.saveConfig(normUrl, data.key);
                return this.getConfig();
              }
            }
          } catch (e) {
            // Silently continue with local defaults
          }
          return this.getConfig();
        })();
      }

      return configLoadingPromise;
    },

    saveConfig(url, key) {
      const cleanUrl = normalizeSupabaseUrl(url);
      const cleanKey = (key || "").trim();
      try {
        if (cleanUrl) {
          localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
        } else {
          localStorage.removeItem(STORAGE_KEY_URL);
        }
        if (cleanKey) {
          localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
        } else {
          localStorage.removeItem(STORAGE_KEY_KEY);
        }
      } catch (e) {}

      // Inform server to persist to /supabase-config.json if API is active
      if (cleanUrl && cleanKey && typeof fetch !== "undefined") {
        fetch("/api/supabase-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: cleanUrl, key: cleanKey })
        }).catch(() => {});
      }
    },

    clearConfig() {
      try {
        localStorage.removeItem(STORAGE_KEY_URL);
        localStorage.removeItem(STORAGE_KEY_KEY);
      } catch (e) {}
    },

    getHeaders() {
      const cfg = this.getConfig();
      return {
        "apikey": cfg.key,
        "Authorization": "Bearer " + cfg.key,
        "Content-Type": "application/json"
      };
    },

    /**
     * Test live connectivity to Supabase
     */
    async testConnection() {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) {
        return {
          success: false,
          message: "Supabase credentials are missing. Please enter your Supabase URL and Anon Key."
        };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${cfg.url}/rest/v1/products?select=id&limit=1`, {
          method: "GET",
          headers: this.getHeaders(),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const errText = await response.text();
          let parsed;
          try { parsed = JSON.parse(errText); } catch (e) {}
          const detail = (parsed && (parsed.message || parsed.hint || parsed.details)) || errText;
          return {
            success: false,
            message: `Supabase connection failed (${response.status} ${response.statusText}): ${detail}`
          };
        }

        return {
          success: true,
          message: "Successfully connected to Supabase database!"
        };
      } catch (err) {
        clearTimeout(timeout);
        return {
          success: false,
          message: `Network error connecting to Supabase: ${err.message}`
        };
      }
    },

    /**
     * Fetch all products from Supabase
     */
    async fetchProducts() {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return null;

      try {
        const response = await fetch(`${cfg.url}/rest/v1/products?select=*&order=id.asc`, {
          method: "GET",
          headers: this.getHeaders()
        });

        if (!response.ok) {
          console.warn("Supabase fetchProducts returned error:", response.status, response.statusText);
          return null;
        }

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(p => ({
            id: Number(p.id),
            name: p.name || "",
            category: p.category || "Health",
            price: p.price || `₦${(p.price_num || 0).toLocaleString()}`,
            priceNum: Number(p.price_num || 0),
            oldPrice: p.old_price || "",
            discount: p.discount || "",
            tag: p.tag || "",
            inStock: p.in_stock !== false,
            image: p.image || "",
            description: p.description || "",
            fullDescription: p.full_description || p.description || "",
            benefits: Array.isArray(p.benefits) ? p.benefits : (typeof p.benefits === "string" ? JSON.parse(p.benefits || "[]") : []),
            featured: !!p.featured
          }));
        }
        return [];
      } catch (e) {
        console.warn("Error fetching products from Supabase:", e);
        return null;
      }
    },

    /**
     * Upsert a single product to Supabase with explicit on_conflict=id and PATCH fallback
     */
    async saveProduct(product) {
      if (!product || !product.id) {
        return { success: false, message: "Invalid product data: missing product ID" };
      }

      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) {
        return { success: false, message: "Supabase credentials not configured" };
      }

      const prodId = Number(product.id);
      const rawPriceNum = product.priceNum || product.price_num || (typeof product.price === 'string' ? product.price.replace(/[^0-9]/g, '') : 0) || 0;
      const formattedPrice = product.price || `₦${Number(rawPriceNum).toLocaleString('en-NG')}`;

      // Clean, validate and prepare benefits
      let cleanBenefits = [];
      if (Array.isArray(product.benefits)) {
        cleanBenefits = product.benefits.map(b => String(b || '').trim()).filter(Boolean);
      } else if (typeof product.benefits === 'string' && product.benefits.trim()) {
        try {
          const parsed = JSON.parse(product.benefits);
          if (Array.isArray(parsed)) {
            cleanBenefits = parsed.map(b => String(b || '').trim()).filter(Boolean);
          }
        } catch (e) {
          cleanBenefits = product.benefits.split('\n').map(b => b.trim()).filter(Boolean);
        }
      }

      const rawOldPrice = product.oldPrice || product.old_price;
      let formattedOldPrice = null;
      let calculatedDiscount = product.discount ? String(product.discount).trim() : null;

      if (rawOldPrice) {
        const oldPriceDigits = String(rawOldPrice).replace(/[^0-9]/g, '');
        const oldPriceNum = parseInt(oldPriceDigits, 10);
        if (!isNaN(oldPriceNum) && oldPriceNum > 0) {
          formattedOldPrice = `₦${oldPriceNum.toLocaleString('en-NG')}`;
          if (!calculatedDiscount && oldPriceNum > Number(rawPriceNum) && Number(rawPriceNum) > 0) {
            const pct = Math.round(((oldPriceNum - Number(rawPriceNum)) / oldPriceNum) * 100);
            calculatedDiscount = `${pct}% off`;
          }
        }
      }

      const payload = {
        id: prodId,
        name: String(product.name || '').trim(),
        category: String(product.category || 'Health').trim(),
        price: formattedPrice,
        price_num: Number(rawPriceNum),
        old_price: formattedOldPrice,
        discount: calculatedDiscount,
        tag: product.tag ? String(product.tag).trim() : null,
        in_stock: product.inStock !== false && product.in_stock !== false,
        image: product.image ? String(product.image).trim() : '',
        description: product.description ? String(product.description).trim() : '',
        full_description: (product.fullDescription || product.full_description || product.description) ? String(product.fullDescription || product.full_description || product.description).trim() : '',
        benefits: cleanBenefits,
        featured: !!product.featured
      };

      try {
        // Attempt POST with on_conflict=id (handles both insert and update)
        const response = await fetch(`${cfg.url}/rest/v1/products?on_conflict=id`, {
          method: "POST",
          headers: {
            ...this.getHeaders(),
            "Prefer": "resolution=merge-duplicates,return=representation"
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log(`[Supabase] Successfully synced product ID ${prodId} ("${payload.name}")`);
          return { success: true, message: `Product "${payload.name}" saved to Supabase!` };
        }

        // If POST returned an error, attempt a direct PATCH on existing row as fallback
        const postErrorText = await response.text();
        console.warn(`[Supabase] POST on_conflict returned ${response.status}: ${postErrorText}. Trying PATCH fallback...`);

        const patchRes = await fetch(`${cfg.url}/rest/v1/products?id=eq.${prodId}`, {
          method: "PATCH",
          headers: {
            ...this.getHeaders(),
            "Prefer": "return=representation"
          },
          body: JSON.stringify(payload)
        });

        if (patchRes.ok) {
          const patchData = await patchRes.json();
          if (Array.isArray(patchData) && patchData.length > 0) {
            console.log(`[Supabase] PATCH fallback succeeded for product ID ${prodId}`);
            return { success: true, message: `Product "${payload.name}" updated in Supabase!` };
          }
        }

        const patchErrorText = await patchRes.text();
        console.error(`[Supabase] saveProduct failed (POST: ${response.status}, PATCH: ${patchRes.status} ${patchErrorText})`);
        return {
          success: false,
          message: `Database sync error (${response.status}): ${postErrorText || patchErrorText || 'Unknown error'}`
        };
      } catch (e) {
        console.error("[Supabase] Network/Fetch error saving product:", e);
        return { success: false, message: `Network error: ${e.message}` };
      }
    },

    /**
     * Delete a product by ID from Supabase
     */
    async deleteProduct(productId) {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return false;

      try {
        const response = await fetch(`${cfg.url}/rest/v1/products?id=eq.${productId}`, {
          method: "DELETE",
          headers: this.getHeaders()
        });

        return response.ok;
      } catch (e) {
        console.error("Error deleting product from Supabase:", e);
        return false;
      }
    },

    /**
     * Fetch store configuration from Supabase
     */
    async fetchStoreConfig() {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return null;

      try {
        const response = await fetch(`${cfg.url}/rest/v1/store_config?id=eq.default&select=*`, {
          method: "GET",
          headers: this.getHeaders()
        });

        if (!response.ok) return null;
        const data = await response.json();
        if (Array.isArray(data) && data[0]) {
          const row = data[0];
          return {
            storeName: row.store_name || "Health is Wealth",
            whatsappNumber: row.whatsapp_number || "2348084765252",
            phoneDisplay: row.phone_display || "08084765252",
            bankName: row.bank_name || "Sterling Bank",
            bankAccount: row.bank_account || "0097137583",
            accountName: row.account_name || "Ezema Emmanuel Tochukwu",
            currencySymbol: row.currency_symbol || "₦",
            location: row.location || "Enugu, Abuja & Lagos, Nigeria (Nationwide Delivery)",
            facebookUrl: row.facebook_url || "",
            instagramUrl: row.instagram_url || "",
            marqueeText: row.marquee_text || ""
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Save store configuration to Supabase with explicit on_conflict=id
     */
    async saveStoreConfig(storeConfig) {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return false;

      const payload = {
        id: "default",
        store_name: storeConfig.storeName || "Health is Wealth",
        whatsapp_number: storeConfig.whatsappNumber || "2348084765252",
        phone_display: storeConfig.phoneDisplay || "08084765252",
        bank_name: storeConfig.bankName || "Sterling Bank",
        bank_account: storeConfig.bankAccount || "0097137583",
        account_name: storeConfig.accountName || "Ezema Emmanuel Tochukwu",
        currency_symbol: storeConfig.currencySymbol || "₦",
        location: storeConfig.location || "Enugu, Abuja & Lagos, Nigeria (Nationwide Delivery)",
        facebook_url: storeConfig.facebookUrl || "",
        instagram_url: storeConfig.instagramUrl || "",
        marquee_text: storeConfig.marqueeText || ""
      };

      try {
        const response = await fetch(`${cfg.url}/rest/v1/store_config?on_conflict=id`, {
          method: "POST",
          headers: {
            ...this.getHeaders(),
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify(payload)
        });

        return response.ok;
      } catch (e) {
        console.error("Error saving store config to Supabase:", e);
        return false;
      }
    },

    /**
     * Fetch store categories from Supabase
     */
    async fetchCategories() {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return null;

      try {
        const response = await fetch(`${cfg.url}/rest/v1/categories?select=name&order=id.asc`, {
          method: "GET",
          headers: this.getHeaders()
        });

        if (!response.ok) return null;
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(c => c.name);
        }
        return null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Save/sync categories array to Supabase with on_conflict=name
     */
    async saveCategories(categoriesList) {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return false;

      const rows = categoriesList.map(name => ({
        name: name
      }));

      try {
        const response = await fetch(`${cfg.url}/rest/v1/categories?on_conflict=name`, {
          method: "POST",
          headers: {
            ...this.getHeaders(),
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify(rows)
        });

        return response.ok;
      } catch (e) {
        return false;
      }
    },

    /**
     * Submit an order to Supabase
     */
    async createOrder(orderData) {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return null;

      try {
        const response = await fetch(`${cfg.url}/rest/v1/orders`, {
          method: "POST",
          headers: {
            ...this.getHeaders(),
            "Prefer": "return=representation"
          },
          body: JSON.stringify(orderData)
        });

        if (!response.ok) return null;
        const result = await response.json();
        return Array.isArray(result) ? result[0] : result;
      } catch (e) {
        console.warn("Could not save order to Supabase:", e);
        return null;
      }
    },

    /**
     * Fetch all orders from Supabase (descending by created_at)
     */
    async fetchOrders() {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return [];

      try {
        const response = await fetch(`${cfg.url}/rest/v1/orders?select=*&order=created_at.desc`, {
          method: "GET",
          headers: this.getHeaders()
        });

        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (e) {
        console.warn("Could not fetch orders from Supabase:", e);
        return [];
      }
    },

    /**
     * Update order status in Supabase
     */
    async updateOrderStatus(orderId, status) {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return false;

      try {
        const response = await fetch(`${cfg.url}/rest/v1/orders?id=eq.${orderId}`, {
          method: "PATCH",
          headers: {
            ...this.getHeaders(),
            "Prefer": "return=representation"
          },
          body: JSON.stringify({ status })
        });
        return response.ok;
      } catch (e) {
        console.warn("Could not update order status in Supabase:", e);
        return false;
      }
    },

    /**
     * Delete an order by ID
     */
    async deleteOrder(orderId) {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return false;

      try {
        const response = await fetch(`${cfg.url}/rest/v1/orders?id=eq.${orderId}`, {
          method: "DELETE",
          headers: this.getHeaders()
        });
        return response.ok;
      } catch (e) {
        console.warn("Could not delete order from Supabase:", e);
        return false;
      }
    },

    /**
     * Add a single category to Supabase
     */
    async addCategory(name) {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured || !name) return false;

      try {
        const response = await fetch(`${cfg.url}/rest/v1/categories`, {
          method: "POST",
          headers: {
            ...this.getHeaders(),
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify({ name: String(name).trim() })
        });
        return response.ok;
      } catch (e) {
        console.warn("Could not add category to Supabase:", e);
        return false;
      }
    },

    /**
     * Delete a category from Supabase by name
     */
    async deleteCategory(name) {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured || !name) return false;

      try {
        const response = await fetch(`${cfg.url}/rest/v1/categories?name=eq.${encodeURIComponent(name)}`, {
          method: "DELETE",
          headers: this.getHeaders()
        });
        return response.ok;
      } catch (e) {
        console.warn("Could not delete category from Supabase:", e);
        return false;
      }
    },

    /**
     * Fast Chunked Bulk Push of all products, categories, and config to Supabase
     * Uploads in rapid batches with progress notifications to prevent timeouts
     */
    async pushAllToSupabase(products, categories, config, onProgress) {
      await this.ensureConfig();
      const cfg = this.getConfig();
      if (!cfg.isConfigured) {
        throw new Error("Supabase is not configured. Please enter your project URL and public anon key.");
      }

      const report = (step, total, text) => {
        if (typeof onProgress === "function") {
          try { onProgress(step, total, text); } catch (e) {}
        }
      };

      // 1. Categories
      report(1, 4, "Syncing categories...");
      if (Array.isArray(categories) && categories.length > 0) {
        await this.saveCategories(categories);
      }

      // 2. Store Config (including Sterling Bank details)
      report(2, 4, "Syncing Sterling Bank & store details...");
      if (config) {
        await this.saveStoreConfig(config);
      }

      // 3. Products in fast batches of 6
      if (Array.isArray(products) && products.length > 0) {
        const formatted = products.map(p => ({
          id: Number(p.id),
          name: p.name,
          category: p.category,
          price: p.price,
          price_num: Number(p.priceNum || (typeof p.price === 'string' ? p.price.replace(/[^0-9]/g, '') : 0) || 0),
          old_price: p.oldPrice || null,
          discount: p.discount || null,
          tag: p.tag || null,
          in_stock: p.inStock !== false,
          image: p.image,
          description: p.description,
          full_description: p.fullDescription || p.description,
          benefits: Array.isArray(p.benefits) ? p.benefits : [],
          featured: !!p.featured
        }));

        const batchSize = 6;
        const totalBatches = Math.ceil(formatted.length / batchSize);

        for (let i = 0; i < formatted.length; i += batchSize) {
          const batchNum = Math.floor(i / batchSize) + 1;
          const chunk = formatted.slice(i, i + batchSize);
          const startIdx = i + 1;
          const endIdx = Math.min(i + batchSize, formatted.length);
          report(3, 4, `Syncing products (${startIdx}-${endIdx} of ${formatted.length})...`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);

          try {
            const response = await fetch(`${cfg.url}/rest/v1/products?on_conflict=id`, {
              method: "POST",
              headers: {
                ...this.getHeaders(),
                "Prefer": "resolution=merge-duplicates"
              },
              body: JSON.stringify(chunk),
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
              const text = await response.text();
              throw new Error(`Batch ${batchNum} failed (${response.status}): ${text}`);
            }
          } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === "AbortError") {
              throw new Error(`Upload timed out on products ${startIdx}-${endIdx}. Please check your connection and retry.`);
            }
            throw err;
          }
        }
      }

      report(4, 4, "Sync completed!");
      return true;
    }
  };

  // Eagerly ensure configuration on script load
  SupabaseStore.ensureConfig().catch(() => {});

  window.SupabaseStore = SupabaseStore;
})(typeof window !== "undefined" ? window : globalThis);
