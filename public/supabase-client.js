/**
 * HEALTH IS WEALTH - SUPABASE CLIENT & REST ADAPTER
 * Lightweight, zero-dependency connector to Supabase PostgreSQL Database.
 * Works seamlessly with environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * and allows direct configuration in the Admin Dashboard.
 */

(function(window) {
  const STORAGE_KEY_URL = "healthIsWealth_supabase_url";
  const STORAGE_KEY_KEY = "healthIsWealth_supabase_key";

  // Safely detect environment variables without ES module import.meta syntax
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

  const SupabaseStore = {
    /**
     * Get current credentials, prioritizing user-saved admin keys, then environment variables.
     */
    getConfig() {
      let customUrl = "";
      let customKey = "";
      try {
        customUrl = (localStorage.getItem(STORAGE_KEY_URL) || "").trim();
        customKey = (localStorage.getItem(STORAGE_KEY_KEY) || "").trim();
      } catch (e) {}

      const url = customUrl || envUrl || "";
      const key = customKey || envKey || "";
      const source = customUrl ? "custom" : (envUrl ? "environment" : "none");

      return {
        url: url.replace(/\/+$/, ""), // strip trailing slash
        key: key,
        source: source,
        isConfigured: !!(url && key)
      };
    },

    isConfigured() {
      return this.getConfig().isConfigured;
    },

    saveConfig(url, key) {
      const cleanUrl = (url || "").trim().replace(/\/+$/, "");
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
      const cfg = this.getConfig();
      if (!cfg.isConfigured) {
        return {
          success: false,
          message: "Supabase credentials are missing. Please enter your Supabase URL and Anon Key."
        };
      }

      try {
        const response = await fetch(`${cfg.url}/rest/v1/products?select=id&limit=1`, {
          method: "GET",
          headers: this.getHeaders()
        });

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
          // Normalize benefits and field names
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
     * Upsert a single product to Supabase
     */
    async saveProduct(product) {
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return false;

      const payload = {
        id: Number(product.id),
        name: product.name,
        category: product.category,
        price: product.price,
        price_num: Number(product.priceNum || 0),
        old_price: product.oldPrice || null,
        discount: product.discount || null,
        tag: product.tag || null,
        in_stock: product.inStock !== false,
        image: product.image,
        description: product.description,
        full_description: product.fullDescription || product.description,
        benefits: Array.isArray(product.benefits) ? product.benefits : [],
        featured: !!product.featured
      };

      try {
        const response = await fetch(`${cfg.url}/rest/v1/products`, {
          method: "POST",
          headers: {
            ...this.getHeaders(),
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify(payload)
        });

        return response.ok;
      } catch (e) {
        console.error("Error saving product to Supabase:", e);
        return false;
      }
    },

    /**
     * Delete a product by ID from Supabase
     */
    async deleteProduct(productId) {
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
            marqueeText: row.marquee_text || "",
            productsPerPage: Number(row.products_per_page || 8)
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Save store configuration to Supabase
     */
    async saveStoreConfig(storeConfig) {
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return false;

      const payload = {
        id: "default",
        store_name: storeConfig.storeName,
        whatsapp_number: storeConfig.whatsappNumber,
        phone_display: storeConfig.phoneDisplay,
        bank_name: storeConfig.bankName,
        bank_account: storeConfig.bankAccount,
        account_name: storeConfig.accountName,
        currency_symbol: storeConfig.currencySymbol || "₦",
        location: storeConfig.location,
        facebook_url: storeConfig.facebookUrl,
        instagram_url: storeConfig.instagramUrl,
        marquee_text: storeConfig.marqueeText,
        products_per_page: Number(storeConfig.productsPerPage || 8)
      };

      try {
        const response = await fetch(`${cfg.url}/rest/v1/store_config`, {
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
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return null;

      try {
        const response = await fetch(`${cfg.url}/rest/v1/categories?select=name&order=display_order.asc`, {
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
     * Save/sync categories array to Supabase
     */
    async saveCategories(categoriesList) {
      const cfg = this.getConfig();
      if (!cfg.isConfigured) return false;

      const rows = categoriesList.map((name, idx) => ({
        name: name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        display_order: idx + 1
      }));

      try {
        const response = await fetch(`${cfg.url}/rest/v1/categories`, {
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
     * Bulk Push all local products, categories, and config to Supabase
     */
    async pushAllToSupabase(products, categories, config) {
      const cfg = this.getConfig();
      if (!cfg.isConfigured) {
        throw new Error("Supabase is not configured.");
      }

      // 1. Categories
      if (Array.isArray(categories) && categories.length > 0) {
        await this.saveCategories(categories);
      }

      // 2. Store Config
      if (config) {
        await this.saveStoreConfig(config);
      }

      // 3. Products
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

        const response = await fetch(`${cfg.url}/rest/v1/products`, {
          method: "POST",
          headers: {
            ...this.getHeaders(),
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify(formatted)
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to upload products: ${text}`);
        }
      }

      return true;
    }
  };

  window.SupabaseStore = SupabaseStore;
})(typeof window !== "undefined" ? window : globalThis);
