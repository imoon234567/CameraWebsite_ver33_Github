// ===== Nav links & mobile toggles =====
const navLinks = document.querySelectorAll(".Navigation_Menu .nav-link");
const menuOpenButton  = document.querySelector("#Menu_Open_Button");
const menuCloseButton = document.querySelector("#Menu_Close_Button");

// Shared search refs
const searchForm  = document.querySelector('#Navigation_Search_Form');
const searchInput = document.querySelector('#Navigation_Search_Input');

// Old "Menu section" bits (kept for compatibility)
const menuSectionEl = document.querySelector('#menu'); // safe if missing
const menuItems     = document.querySelectorAll('.Third_Page_List .Third_Page_Item');

// ---------- Utilities ----------
const norm = (s) => (s || '')
  .toString()
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9\s]+/g,' ')
  .replace(/\s+/g,' ')
  .trim();

function debounce(fn, ms=200){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Simple Levenshtein distance
function lev(a, b){
  a = norm(a); b = norm(b);
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({length:m+1}, (_,i)=>[i,...Array(n).fill(0)]);
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i-1][j]+1,
        dp[i][j-1]+1,
        dp[i-1][j-1]+cost
      );
    }
  }
  return dp[m][n];
}

// Score how close candidate is to query (higher = better)
function scoreText(query, text){
  const q = norm(query);
  const t = norm(text);
  if (!q) return 0;
  if (!t) return 0;

  let score = 0;

  // Exact substring & prefix boosts
  if (t.includes(q)) score += 100;
  if (t.startsWith(q)) score += 20;

  // Token overlap
  const qt = q.split(' ');
  const tt = new Set(t.split(' '));
  let overlap = 0;
  qt.forEach(tok => { if (tt.has(tok)) overlap++; });
  score += overlap * 12;

  // Edit similarity (1 - dist/maxLen) * weight
  const d = lev(q, t);
  const sim = 1 - d / Math.max(q.length, t.length);
  score += Math.max(0, sim) * 80;

  return score;
}

// ---------- Old Menu filter (kept) ----------
function filterMenu(query) {
  const term = (query || '').trim().toLowerCase();
  menuItems.forEach(item => {
    const name = (item.querySelector('.name')?.textContent || '').toLowerCase();
    const match = term === '' || name.includes(term);
    item.classList.toggle('hidden', !match);
    item.classList.toggle('match',  match && term !== '');
  });
}

// ---------- Catalog search ----------
function getCatalogList(){ return document.querySelector('.Catalog_Product_List'); }
function getCatalogItems(){ return Array.from(document.querySelectorAll('.Catalog_Product_List .Catalog_Product_Item')); }

// Preserve original order so we can restore when query is empty
(function stashOriginalOrder(){
  const items = getCatalogItems();
  items.forEach((el, idx) => { if (!el.dataset._orig) el.dataset._orig = String(idx); });
})();

function ensureNoResultsNode(){
  const list = getCatalogList();
  if (!list) return null;
  let node = list.querySelector('#Search_NoResults');
  if (!node){
    node = document.createElement('li');
    node.id = 'Search_NoResults';
    node.className = 'Catalog_Product_Item';
    node.style.display = 'none';
    node.style.padding = '22px';
    node.style.textAlign = 'center';
    node.style.width = '100%';
    node.style.background = '#fff';
    node.style.border = '1px solid #eee';
    node.style.borderRadius = '10px';
    node.textContent = 'No results found.';
    list.appendChild(node);
  }
  return node;
}

function catalogFilterAndRank(query){
  const list  = getCatalogList();
  const items = getCatalogItems();
  const emptyNode = ensureNoResultsNode();
  if (!list || !items.length) return;

  const q = norm(query);

  if (!q){
    // show all, restore original order
    items.forEach(el => { el.style.display = ''; });
    emptyNode && (emptyNode.style.display = 'none');
    items
      .sort((a,b) => Number(a.dataset._orig||0) - Number(b.dataset._orig||0))
      .forEach(el => list.appendChild(el));
    return;
  }

  // Build scored results
  const results = items.map(el => {
    const name = el.querySelector('.name')?.textContent || '';
    const desc = el.querySelector('.text')?.textContent || '';
    const id   = el.dataset.id || '';
    // Name weight > desc > id
    const s = scoreText(q, name) * 1.0 +
              scoreText(q, desc) * 0.45 +
              scoreText(q, id)   * 0.35;
    return { el, s, name, desc };
  });

  // Keep items with minimally reasonable score, sort high→low
  const KEEP_THRESHOLD = 25;
  const kept = results.filter(r => r.s >= KEEP_THRESHOLD).sort((a,b)=> b.s - a.s);

  // Show/hide
  const keptSet = new Set(kept.map(r => r.el));
  items.forEach(el => { el.style.display = keptSet.has(el) ? '' : 'none'; });

  // Reorder DOM by score
  kept.forEach(r => list.appendChild(r.el));

  // Toggle "no results"
  if (!kept.length) {
    emptyNode && (emptyNode.style.display = '');
  } else {
    emptyNode && (emptyNode.style.display = 'none');
  }
}

// Handle typing on catalog (live), and enter/submit on all pages
const runCatalogSearch = debounce((val) => catalogFilterAndRank(val), 120);

function onSearchSubmit(e){
  if (!searchInput) return;
  const val = searchInput.value || '';

  // If we are on the catalog page, prevent navigation and run filter
  if (getCatalogList()) {
    e?.preventDefault?.();
    catalogFilterAndRank(val);
    // Keep focus nice
    searchInput.focus();
  } else {
    // Else navigate to catalog with q=...
    e?.preventDefault?.();
    const params = new URLSearchParams({ q: val.trim() });
    window.location.href = `catalog.html?${params.toString()}`;
  }

  // Keep old menu behavior (if that section exists on current page)
  if (menuSectionEl && menuItems.length) {
    filterMenu(val);
    menuSectionEl.scrollIntoView({ behavior: 'smooth' });
  }

  // Close mobile menu after submit on small screens
  if (document.body.classList.contains('show-mobile-menu')) {
    menuOpenButton?.click();
  }
}

// Wire events if search exists
if (searchForm && searchInput){
  // Submit (Enter)
  searchForm.addEventListener('submit', onSearchSubmit);

  // Live typing only on catalog page
  // (also keep old behavior: if #menu exists we still call filterMenu)
  const onType = (e) => {
    const v = e.target.value;
    if (getCatalogList()) runCatalogSearch(v);
    if (menuSectionEl && menuItems.length) filterMenu(v);
  };
  searchInput.addEventListener('input', onType);
}

// If we arrive on catalog with ?q=, auto-run
(function handleInitialQuery(){
  if (!getCatalogList()) return;
  const params = new URLSearchParams(location.search);
  const q = params.get('q');
  if (q) {
    if (searchInput) searchInput.value = q;
    catalogFilterAndRank(q);
  }
})();

// ===== Mobile menu open/close =====
menuOpenButton?.addEventListener("click", () => {
  document.body.classList.toggle("show-mobile-menu");
});
menuCloseButton?.addEventListener("click", () => menuOpenButton?.click());
navLinks.forEach(link => link.addEventListener("click", () => {
  if (document.body.classList.contains('show-mobile-menu')) menuOpenButton?.click();
}));

// ===== Hero Swiper (only if present) =====
if (document.querySelector('.First_Page_Swiper')) {
  new Swiper('.First_Page_Swiper', {
    loop: true,
    speed: 800,
    grabCursor: true,
    autoplay: { delay: 4000, disableOnInteraction: false },
    pagination: { el: '.First_Page_Pagination', clickable: true },
    navigation: { nextEl: '.First_Page_Next', prevEl: '.First_Page_Previous' }
  });
}

// ===== Testimonials Swiper (only if present) =====
if (document.querySelector('.Slider_Container')) {
  new Swiper('.Slider_Container', {
    loop: true,
    grabCursor: true,
    spaceBetween: 25,
    pagination: { el: '.Swiper_Pagination', clickable: true, dynamicBullets: true },
    navigation: { nextEl: '.Swiper_Button_Next', prevEl: '.Swiper_Button_Previous' },
    breakpoints: { 0:{slidesPerView:1}, 768:{slidesPerView:2}, 1024:{slidesPerView:3} }
  });
}

/* =======================
   Auth Modal + Local Auth
   ======================= */
const accountBtn = document.getElementById('Open_Account');
const authModal  = document.getElementById('Auth_Modal');

function setCurrentUser(username){
  localStorage.setItem('currentUser', username);
  const el = document.getElementById('Open_Account');
  if (el) el.textContent = username;
}

function clearCurrentUser(){
  localStorage.removeItem('currentUser');
  const el = document.getElementById('Open_Account');
  if (el) el.textContent = 'Account';
}

// Show saved user label on load
(() => {
  const saved = localStorage.getItem('currentUser');
  const el = document.getElementById('Open_Account');
  if (el) el.textContent = saved || 'Account';
})();

if (accountBtn) {
  if (!authModal) {
    accountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Auth modal is missing on this page. Paste the Auth_Modal HTML into this file (see instructions).');
    });
  } else {
    const dialog     = authModal.querySelector('.auth-dialog');
    const closeBtn   = authModal.querySelector('.auth-close');
    const tabsWrap   = authModal.querySelector('.auth-tabs');
    const tabButtons = authModal.querySelectorAll('.auth-tab');
    const panels     = authModal.querySelectorAll('.auth-panel');
    const loginForm  = document.getElementById('Login_Form');
    const signupForm = document.getElementById('Signup_Form');
    const loginMsg   = document.getElementById('loginMsg');
    const signupMsg  = document.getElementById('signupMsg');
    const titleEl    = authModal.querySelector('#authTitle');

    // Create a "logout-only" panel once; reuse later
    let logoutPanel  = authModal.querySelector('#Logout_Panel');
    let logoutUserEl, logoutBtn;

    function ensureLogoutPanel(){
      if (logoutPanel) return;
      logoutPanel = document.createElement('div');
      logoutPanel.id = 'Logout_Panel';
      logoutPanel.className = 'auth-panel';

      logoutPanel.innerHTML = `
        <p class="auth-label" style="margin-top:6px;">Signed in as <strong id="Logout_User"></strong></p>

        <a id="Account_Settings_Button"
          href="address.html"
          class="auth-submit"
          style="display:block; text-align:center; background:#fff; color:#333; border:1px solid #ddd; margin-top:8px;">
        Account Settings
        </a>

        <a id="Order_History_Button" href="orderhistory.html"
          class="auth-submit" style="display:block; text-align:center; background:#fff; color:#333; border:1px solid #ddd; margin-top:8px;">
          Order History
        </a>
        <button id="Logout_Button" class="auth-submit" type="button" style="margin-top:10px;">Log out</button>
        `;

      dialog.appendChild(logoutPanel);
      logoutUserEl = logoutPanel.querySelector('#Logout_User');
      logoutBtn    = logoutPanel.querySelector('#Logout_Button');

      logoutBtn.addEventListener('click', () => {
        clearCurrentUser();
        closeAuth();
        alert('You have been logged out.');
      });
    }

    function showModalBase(){
      authModal.classList.add('show');
      document.body.classList.add('auth-open');
      authModal.setAttribute('aria-hidden','false');
    }
    function hideModalBase(){
      authModal.classList.remove('show');
      document.body.classList.remove('auth-open');
      authModal.setAttribute('aria-hidden','true');
    }

    function openAuth(tab = 'login'){
      if (tabsWrap) tabsWrap.style.display = '';
      tabButtons.forEach(b => b.style.display = '');
      panels.forEach(p  => p.classList.toggle('is-hidden', p.dataset.panel !== tab));
      if (logoutPanel) logoutPanel.style.display = 'none';

      if (titleEl) titleEl.textContent = 'Welcome';
      showModalBase();
    }

    function openLogoutOnly(){
      ensureLogoutPanel();
      if (tabsWrap) tabsWrap.style.display = 'none';
      tabButtons.forEach(b => b.style.display = 'none');
      panels.forEach(p  => p.classList.add('is-hidden'));
      logoutPanel.style.display = 'block';

      const saved = localStorage.getItem('currentUser') || '';
      if (logoutUserEl) logoutUserEl.textContent = saved;

      if (titleEl) titleEl.textContent = 'Account';
      showModalBase();
    }

    function closeAuth(){
      hideModalBase();
      if (loginMsg)  loginMsg.textContent = '';
      if (signupMsg) signupMsg.textContent = '';
    }

    accountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const saved = localStorage.getItem('currentUser');
      if (saved) openLogoutOnly();
      else openAuth('login');
    });

    closeBtn?.addEventListener('click', closeAuth);
    tabButtons.forEach(btn => btn.addEventListener('click', () => openAuth(btn.dataset.tab)));

    // LocalStorage "database" (demo only)
    function getUsers(){
      try { return JSON.parse(localStorage.getItem('users') || '{}'); }
      catch { return {}; }
    }
    function setUsers(obj){ localStorage.setItem('users', JSON.stringify(obj)); }

    // Signup
    signupForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(signupForm);
      const username = String(formData.get('username') || '').trim().toLowerCase();
      const password = String(formData.get('password') || '');

      if (!username || !password){ if (signupMsg) signupMsg.textContent = 'Please fill all fields.'; return; }

      const users = getUsers();
      if (users[username]){
        if (signupMsg) signupMsg.textContent = 'That username is already taken.';
        return;
      }
      users[username] = { password };
      setUsers(users);

      if (signupMsg) {
        signupMsg.style.color = '#1b7e1b';
        signupMsg.textContent = 'Account created! You can log in now.';
      }
      setTimeout(() => openAuth('login'), 600);
    });

    // Login
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const username = String(formData.get('username') || '').trim().toLowerCase();
      const password = String(formData.get('password') || '');

      const users = getUsers();
      const user  = users[username];

      if (!user || user.password !== password){
        if (loginMsg) loginMsg.textContent = 'Invalid account';
        return;
      }
      setCurrentUser(username);
      closeAuth();
      alert(`Welcome back, ${username}!`);
    });

    // Google Sign-In callback (only if GIS present)
    window.handleCredentialResponse = (resp) => {
      try{
        const payload = parseJwt(resp.credential);
        const email = (payload.email || '').toLowerCase();
        if (!email) return;

        const users = getUsers();
        if (!users[email]) users[email] = { google: true };
        setUsers(users);

        setCurrentUser(email);
        closeAuth();
        alert(`Signed in as ${payload.name || email}`);
      }catch(err){
        console.error(err);
        alert('Google sign-in failed.');
      }
    };

    function parseJwt (token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }
  }
}

/* ===== Policy Modal (Privacy / Refund) ===== */
(function(){
  const modal = document.getElementById('Policy_Modal');
  const body  = document.getElementById('policyBody');
  const title = document.getElementById('policyTitle');
  const btnClose = document.getElementById('Policy_Close');
  const links = document.querySelectorAll('.policy-link[data-policy]');

  if (!modal || !body || !title || !btnClose || !links.length) return;

  const PRIVACY_HTML = `
    <p>We respect your privacy. This policy explains what data we collect, why, and how we protect it.</p>
    <h4>What we collect</h4>
    <ul>
      <li>Account info you provide (username, email).</li>
      <li>Order and wishlist details you choose to save.</li>
      <li>Basic device and usage data to improve site performance.</li>
    </ul>
    <h4>How we use data</h4>
    <ul>
      <li>To process orders, manage your account, and improve our catalog.</li>
      <li>To respond to support requests you submit.</li>
      <li>To detect abuse and keep the site secure.</li>
    </ul>
    <h4>Data sharing</h4>
    <p>We don’t sell your personal data. Limited sharing may occur with payment, analytics, or shipping partners strictly to provide services you request.</p>
    <h4>Your choices</h4>
    <ul>
      <li>Update or delete your account data in <em>Account Settings</em>.</li>
      <li>Contact support to request export or deletion of your data.</li>
    </ul>
    <p>Questions? Email us at <strong>info@GreatestCameraLover.com</strong>.</p>
  `;

  const REFUND_HTML = `
    <p>We want you to love your gear. If something isn’t right, this policy outlines returns and refunds.</p>
    <h4>Return window</h4>
    <p>Eligible items can be returned within <strong>30 days</strong> of delivery, in original condition with all accessories and packaging.</p>
    <h4>Not eligible</h4>
    <ul>
      <li>Items with heavy wear, physical damage, or missing parts.</li>
      <li>Downloadable software or licenses once activated.</li>
      <li>Clearance items marked “Final Sale”.</li>
    </ul>
    <h4>How refunds work</h4>
    <ul>
      <li>After inspection, refunds are issued to the original payment method.</li>
      <li>Processing typically takes 3–7 business days after approval.</li>
      <li>Shipping fees are non-refundable unless the return is due to our error.</li>
    </ul>
    <h4>Start a return</h4>
    <p>Contact support with your order number at <strong>info@GreatestCameraLover.com</strong>.</p>
  `;

  function openPolicy(which){
    title.textContent = which === 'refund' ? 'Refund policy' : 'Privacy policy';
    body.innerHTML = which === 'refund' ? REFUND_HTML : PRIVACY_HTML;
    modal.classList.add('show');
    document.body.classList.add('policy-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closePolicy(){
    modal.classList.remove('show');
    document.body.classList.remove('policy-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  links.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const which = a.dataset.policy === 'refund' ? 'refund' : 'privacy';
      openPolicy(which);
    });
  });

  btnClose.addEventListener('click', closePolicy);

  // NOTE: Do not close on backdrop click; only via button.
})();
