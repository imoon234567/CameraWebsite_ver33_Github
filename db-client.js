// /CameraWebsite_ver25/db-client.js
(() => {
  // ===== Config
  const API_BASE = (window.DB_API_BASE || 'api').replace(/\/$/, '');
  const normId = s => String(s || '').trim().toLowerCase();

  const fmt = (n, c='USD', loc='en-US') =>
    new Intl.NumberFormat(loc, { style:'currency', currency:c }).format(Number(n));

  if (typeof window.formatPrice !== 'function') {
    window.formatPrice = (n, c='USD') => fmt(n, c);
  }

  // ===== Fetch price map from PHP (no cache)
  async function loadPriceMap(force=false){
    if (!force && window.__PRICE_MAP) return window.__PRICE_MAP;

    const bust = Date.now();
    const url  = `${API_BASE}/prices.php?_=${bust}`;
    console.log('[db-client] fetching:', url);

    const res  = await fetch(url, { cache:'no-store' });
    const json = await res.json();

    if (!json.ok) throw new Error(json.error || 'prices failed');

    // Normalize ids → lowercase
    const m = {};
    for (const [k, v] of Object.entries(json.data || {})) {
      const id = normId(k);
      m[id] = { price: Number(v?.price ?? NaN), currency: v?.currency || 'USD' };
    }
    window.__PRICE_MAP = m;

    const count = Object.keys(m).length;
    console.log(`[db-client] Hydrated ${count} ids from DB`, m);
    return m;
  }

  function priceOf(id){
    const m = window.__PRICE_MAP || {};
    return m[normId(id)] ? m[normId(id)].price : null;
  }

  // ===== Apply to Catalog cards
  function applyToCatalog(){
    const cards = document.querySelectorAll('.Catalog_Product_Item[data-id]');
    if (!cards.length) return;

    let touched = 0;
    cards.forEach(card => {
      const id = card.dataset.id;
      const p  = priceOf(id);
      if (p != null) {
        const priceEl = card.querySelector('.price');
        if (priceEl) priceEl.textContent = window.formatPrice(p);
        card.dataset.price = p; // keep sorting correct
        touched++;
      }
    });
    if (touched) console.log(`[db-client] Catalog updated (${touched} cards)`);
  }

  // ===== Apply to Product page
  function applyToProduct(){
    const section = document.querySelector('.Product_Section');
    if (!section) return;

    const params = new URLSearchParams(location.search);
    let id = params.get('id') || '';

    if (!id) {
      const title = document.getElementById('prodTitle')?.textContent?.trim() || '';
      if (title) id = title.toLowerCase().replace(/\s+/g,'-');
    }
    if (!id) return;

    const p = priceOf(id);
    if (p != null) {
      const el = document.getElementById('prodPrice');
      if (el) el.textContent = window.formatPrice(p);
    }

    // helper for product.html buildItem()
    window.__getLatestPriceById = (pid) => priceOf(pid);
  }

  // ===== Sync Cart/Wishlist objects in localStorage
  function syncLS(key){
    try{
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(arr) || !arr.length) return;
      let changed = false;
      arr.forEach(it => {
        const latest = priceOf(it.id);
        if (latest != null && Number(it.price) !== Number(latest)) {
          it.price = Number(latest);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(key, JSON.stringify(arr));
        console.log(`[db-client] ${key} updated from DB`);
      }
    }catch{}
  }

  function syncCartFromDB(){ syncLS('cart'); }
  function syncWishlistFromDB(){ syncLS('wishlist'); }

  // Public (optional)
  window.DB = { loadPriceMap, priceOf, applyToCatalog, applyToProduct, syncCartFromDB, syncWishlistFromDB };

  // Auto-run on every page; re-apply twice to catch late DOM
  document.addEventListener('DOMContentLoaded', async () => {
    try{
      await loadPriceMap(true);
      applyToCatalog();
      applyToProduct();
      syncCartFromDB();
      syncWishlistFromDB();

      setTimeout(() => { applyToCatalog(); applyToProduct(); }, 300);
      setTimeout(() => { applyToCatalog(); applyToProduct(); }, 1200);
    }catch(e){
      console.error('[db-client] Price hydration failed:', e);
    }
  });
})();
