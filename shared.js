// ── Cart ──────────────────────────────────────────────────────────
let cart = [];
try { cart = JSON.parse(localStorage.getItem('svj_cart') || '[]'); } catch {}

function _saveCart() { try { localStorage.setItem('svj_cart', JSON.stringify(cart)); } catch {} }
function _parsePrice(s) { return parseFloat((s || '0').replace(/[^0-9.]/g, '')) || 0; }
function _fmtPrice(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function _cartTotal() { return cart.reduce((s, i) => s + _parsePrice(i.price) * i.qty, 0); }

function _cardStars(id) {
  const pool = [5,5,4,5,5,5,4,5,5,4,5,5,5,4,5,5,4,5,5,5,4,5,5,4,5];
  const r = pool[id % pool.length];
  const count = 23 + ((id * 17 + 11) % 61);
  return `<div class="card-stars"><span class="stars-gold">${'★'.repeat(r) + '☆'.repeat(5 - r)}</span><span class="stars-count">(${count})</span></div>`;
}

function _compareAt(p) {
  if (p.originalPrice) return p.originalPrice;
  const n = parseFloat((p.price || '0').replace(/[^0-9.]/g, ''));
  if (n >= 899) return '$1,699.99';
  return null;
}

function addToCart(productId) {
  const p = window.PRODUCTS.find(p => p.id === productId);
  if (!p) return;
  const ex = cart.find(i => i.id === productId);
  if (ex) { ex.qty += 1; }
  else { cart.push({ id: p.id, title: p.title, price: p.price, image: p.image, whopPlanId: p.whopPlanId || null, qty: 1 }); }
  _saveCart();
  updateCartBadge();
  const short = p.title.length > 34 ? p.title.slice(0, 34) + '…' : p.title;
  showToast(`${short} added to cart`);
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) { badge.textContent = total; badge.style.display = total > 0 ? 'flex' : 'none'; }
}

// ── Cart Drawer ───────────────────────────────────────────────────
function toggleCart() {
  if (!cart.length) { showToast('Your cart is empty'); return; }
  const drawer = document.getElementById('cartDrawer');
  if (drawer?.classList.contains('open')) closeCartDrawer();
  else openCartDrawer();
}

function openCartDrawer() {
  if (!cart.length) { showToast('Your cart is empty'); return; }
  _renderCartDrawer();
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartDrawerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartDrawerOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function _renderCartDrawer() {
  const total = _cartTotal();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cdCount').textContent = count;
  document.getElementById('cdSubtotal').textContent = _fmtPrice(total);
  document.getElementById('cdTotal').textContent = _fmtPrice(total);
  const listEl = document.getElementById('cartItemsList');
  if (!cart.length) {
    listEl.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
    return;
  }
  listEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image ? `<img src="${item.image}" alt="">` : '<span class="cart-item-gem">◆</span>'}
      </div>
      <div class="cart-item-info">
        <p class="cart-item-title">${item.title}</p>
        <p class="cart-item-price">${item.price}</p>
      </div>
      <div class="cart-item-controls">
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="cartAdjust(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="cartAdjust(${item.id}, 1)">+</button>
        </div>
        <button class="cart-item-remove" onclick="cartRemove(${item.id})">Remove</button>
      </div>
    </div>`).join('');
}

function cartAdjust(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(0, item.qty + delta);
  if (item.qty === 0) cart = cart.filter(i => i.id !== productId);
  _saveCart();
  updateCartBadge();
  _renderCartDrawer();
  if (!cart.length) closeCartDrawer();
}

function cartRemove(productId) {
  cart = cart.filter(i => i.id !== productId);
  _saveCart();
  updateCartBadge();
  _renderCartDrawer();
  if (!cart.length) closeCartDrawer();
}

// ── Cart Checkout ─────────────────────────────────────────────────
function openCartCheckout() {
  if (!cart.length) return;
  closeCartDrawer();
  const total = _cartTotal();
  document.getElementById('ccSubtotal').textContent = _fmtPrice(total);
  document.getElementById('ccTotal').textContent = _fmtPrice(total);
  document.getElementById('ccItemsList').innerHTML = cart.map(item => `
    <div class="checkout-cart-item">
      ${item.image ? `<img src="${item.image}" alt="">` : '<span class="co-cart-gem">◆</span>'}
      <div>
        <p class="checkout-product-title">${item.title}</p>
        <p class="checkout-product-price">${item.price}${item.qty > 1 ? ' &times; ' + item.qty : ''}</p>
      </div>
    </div>`).join('');
  document.getElementById('ccFormWrap').style.display = '';
  document.getElementById('ccWhopContainer').style.display = 'none';
  document.getElementById('ccWhopEmbed').innerHTML = '';
  document.getElementById('ccSuccess').style.display = 'none';
  document.getElementById('ccForm').reset();
  document.getElementById('ccSubmit').disabled = false;
  document.getElementById('ccSubmitText').textContent = 'Place Order';
  document.getElementById('ccOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartCheckout() {
  document.getElementById('ccOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function _showCartWhopEmbed(planId, sessionId) {
  document.getElementById('ccFormWrap').style.display = 'none';
  const returnUrl = window.location.origin + '/order-complete?status=paid';
  const sessionAttr = sessionId ? '\n    data-whop-checkout-session="' + sessionId + '"' : '';
  document.getElementById('ccWhopEmbed').innerHTML =
    '<div\n    data-whop-checkout-plan-id="' + planId + '"' + sessionAttr +
    '\n    data-whop-checkout-return-url="' + returnUrl + '"' +
    '\n    data-whop-checkout-theme="dark"' +
    '\n    data-whop-checkout-accent-color="#c9a96e"\n  ></div>';
  document.getElementById('ccWhopContainer').style.display = 'block';
  if (!document.getElementById('whop-checkout-script')) {
    const s = document.createElement('script');
    s.id = 'whop-checkout-script';
    s.src = 'https://js.whop.com/static/checkout/loader.js';
    document.head.appendChild(s);
  }
}

// ── Toast ─────────────────────────────────────────────────────────
let _tt = null;
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.innerHTML = '<span class="toast-gem">◆</span><span>' + msg + '</span>';
  t.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Header ────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 40);
});

function toggleMenu() {
  document.getElementById('nav').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('nav').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

// ── Buy Now Checkout modal ────────────────────────────────────────
let _cp = null;

function openCheckout(productId) {
  const p = window.PRODUCTS.find(p => p.id === productId);
  if (!p) return;
  _cp = p;
  const img = document.getElementById('coImg');
  img.src = p.image || '';
  img.style.display = p.image ? '' : 'none';
  document.getElementById('coTitle').textContent = p.title;
  document.getElementById('coPrice').textContent = p.price;
  document.getElementById('coSubtotal').textContent = p.price;
  document.getElementById('coTotal').textContent = p.price;
  document.getElementById('coFormWrap').style.display = '';
  document.getElementById('coWhopContainer').style.display = 'none';
  document.getElementById('coWhopEmbed').innerHTML = '';
  document.getElementById('coSuccess').style.display = 'none';
  document.getElementById('coForm').reset();
  document.getElementById('coSubmit').disabled = false;
  document.getElementById('coSubmitText').textContent = 'Place Order';
  document.getElementById('coOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('coOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function _showWhopEmbed(planId) {
  document.getElementById('coFormWrap').style.display = 'none';
  const returnUrl = window.location.origin + '/order-complete?status=paid';
  document.getElementById('coWhopEmbed').innerHTML =
    '<div\n    data-whop-checkout-plan-id="' + planId + '"' +
    '\n    data-whop-checkout-return-url="' + returnUrl + '"' +
    '\n    data-whop-checkout-theme="dark"' +
    '\n    data-whop-checkout-accent-color="#c9a96e"\n  ></div>';
  document.getElementById('coWhopContainer').style.display = 'block';
  if (!document.getElementById('whop-checkout-script')) {
    const s = document.createElement('script');
    s.id = 'whop-checkout-script';
    s.src = 'https://js.whop.com/static/checkout/loader.js';
    document.head.appendChild(s);
  }
}

// ── DOM Ready ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Cart Drawer ─────────────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend',
    '<div class="cart-drawer-overlay" id="cartDrawerOverlay"></div>' +
    '<div class="cart-drawer" id="cartDrawer">' +
      '<div class="cart-drawer-head">' +
        '<p class="cart-drawer-label">Cart (<span id="cdCount">0</span>)</p>' +
        '<button class="cart-drawer-close" id="cdClose" aria-label="Close cart">\xd7</button>' +
      '</div>' +
      '<div class="cart-items-list" id="cartItemsList"></div>' +
      '<div class="cart-drawer-foot">' +
        '<div class="cart-foot-row"><span>Subtotal</span><span id="cdSubtotal">$0.00</span></div>' +
        '<div class="cart-foot-row"><span>Shipping</span><span class="checkout-free">Free</span></div>' +
        '<div class="cart-foot-row cart-foot-total"><span>Total</span><span id="cdTotal">$0.00</span></div>' +
        '<button class="btn-gold cart-checkout-btn" onclick="openCartCheckout()">Proceed to Checkout</button>' +
      '</div>' +
    '</div>');

  document.getElementById('cdClose').addEventListener('click', closeCartDrawer);
  document.getElementById('cartDrawerOverlay').addEventListener('click', closeCartDrawer);

  // ── 2. Cart Checkout Modal (cc*) ───────────────────────────────
  document.body.insertAdjacentHTML('beforeend',
    '<div class="checkout-overlay" id="ccOverlay">' +
      '<div class="checkout-modal">' +
        '<button class="checkout-close" id="ccClose" aria-label="Close">\xd7</button>' +
        '<div class="checkout-summary">' +
          '<p class="checkout-label">◆ Order Summary</p>' +
          '<div id="ccItemsList"></div>' +
          '<div class="checkout-totals">' +
            '<div class="checkout-line"><span>Subtotal</span><span id="ccSubtotal"></span></div>' +
            '<div class="checkout-line"><span>Shipping</span><span class="checkout-free">Free</span></div>' +
            '<div class="checkout-line checkout-total-line"><span>Total</span><span id="ccTotal"></span></div>' +
          '</div>' +
          '<p class="checkout-secure"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Secure checkout</p>' +
        '</div>' +
        '<div class="checkout-form-wrap">' +
          '<div id="ccFormWrap">' +
            '<p class="checkout-step-label">Contact & Shipping</p>' +
            '<form id="ccForm" autocomplete="on">' +
              '<div class="form-row">' +
                '<div class="form-group"><label>First Name</label><input name="firstName" required placeholder="John" autocomplete="given-name"></div>' +
                '<div class="form-group"><label>Last Name</label><input name="lastName" required placeholder="Doe" autocomplete="family-name"></div>' +
              '</div>' +
              '<div class="form-group"><label>Email</label><input type="email" name="email" required placeholder="john@example.com" autocomplete="email"></div>' +
              '<div class="form-group"><label>Phone (optional)</label><input type="tel" name="phone" placeholder="+1 (555) 000-0000" autocomplete="tel"></div>' +
              '<div class="form-group"><label>Street Address</label><input name="address" required placeholder="123 Main Street" autocomplete="street-address"></div>' +
              '<div class="form-row">' +
                '<div class="form-group"><label>City</label><input name="city" required placeholder="New York" autocomplete="address-level2"></div>' +
                '<div class="form-group"><label>State / Province</label><input name="state" required placeholder="NY" autocomplete="address-level1"></div>' +
              '</div>' +
              '<div class="form-row">' +
                '<div class="form-group"><label>ZIP / Postal</label><input name="zip" required placeholder="10001" autocomplete="postal-code"></div>' +
                '<div class="form-group"><label>Country</label><input name="country" required placeholder="United States" autocomplete="country-name"></div>' +
              '</div>' +
              '<button type="submit" class="btn-checkout-submit" id="ccSubmit">' +
                '<span id="ccSubmitText">Place Order</span><span>→</span>' +
              '</button>' +
              '<p class="whop-note">Payment powered by Whop</p>' +
            '</form>' +
          '</div>' +
          '<div id="ccWhopContainer" style="display:none">' +
            '<p class="checkout-step-label">Complete Your Payment</p>' +
            '<div id="ccWhopEmbed"></div>' +
          '</div>' +
          '<div class="checkout-success" id="ccSuccess" style="display:none">' +
            '<span class="success-gem">◆</span>' +
            '<h3>Order Received!</h3>' +
            '<p id="ccOrderId" class="success-order-id"></p>' +
            '<p>We\'ll reach out within 24 hours to confirm your order.</p>' +
            '<button class="btn-gold" onclick="closeCartCheckout()">Continue Shopping</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>');

  document.getElementById('ccClose').addEventListener('click', closeCartCheckout);
  document.getElementById('ccOverlay').addEventListener('click', e => { if (e.target.id === 'ccOverlay') closeCartCheckout(); });

  document.getElementById('ccForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const btn = document.getElementById('ccSubmit');
    const txt = document.getElementById('ccSubmitText');
    btn.disabled = true; txt.textContent = 'Processing…';
    try {
      const res = await fetch('/api/cart-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: f.firstName.value.trim(), lastName: f.lastName.value.trim(),
          email: f.email.value.trim(), phone: f.phone.value.trim(),
          address: f.address.value.trim(), city: f.city.value.trim(),
          state: f.state.value.trim(), zip: f.zip.value.trim(), country: f.country.value.trim(),
          items: cart.map(item => ({ id: item.id, title: item.title, price: item.price, qty: item.qty, whopPlanId: item.whopPlanId })),
        })
      });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      if (data.whop) {
        _showCartWhopEmbed(data.whop.planId, data.whop.sessionId);
      } else if (data.whopPlanId) {
        _showCartWhopEmbed(data.whopPlanId, null);
      } else if (data.success) {
        cart = []; _saveCart(); updateCartBadge();
        document.getElementById('ccFormWrap').style.display = 'none';
        document.getElementById('ccOrderId').textContent = 'Order ID: ' + data.orderId;
        document.getElementById('ccSuccess').style.display = 'flex';
      }
    } catch {
      showToast('Server offline — start with: node server.js');
      btn.disabled = false; txt.textContent = 'Place Order';
    }
  });

  // ── 3. Buy Now Checkout Modal (co*) ───────────────────────────
  document.body.insertAdjacentHTML('beforeend',
    '<div class="checkout-overlay" id="coOverlay">' +
      '<div class="checkout-modal">' +
        '<button class="checkout-close" id="coClose" aria-label="Close">\xd7</button>' +
        '<div class="checkout-summary">' +
          '<p class="checkout-label">◆ Order Summary</p>' +
          '<div class="checkout-product">' +
            '<img id="coImg" src="" alt="">' +
            '<div><p id="coTitle" class="checkout-product-title"></p><p id="coPrice" class="checkout-product-price"></p></div>' +
          '</div>' +
          '<div class="checkout-totals">' +
            '<div class="checkout-line"><span>Subtotal</span><span id="coSubtotal"></span></div>' +
            '<div class="checkout-line"><span>Shipping</span><span class="checkout-free">Free</span></div>' +
            '<div class="checkout-line checkout-total-line"><span>Total</span><span id="coTotal"></span></div>' +
          '</div>' +
          '<p class="checkout-secure"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Secure checkout</p>' +
        '</div>' +
        '<div class="checkout-form-wrap">' +
          '<div id="coFormWrap">' +
            '<p class="checkout-step-label">Contact & Shipping</p>' +
            '<form id="coForm" autocomplete="on">' +
              '<div class="form-row">' +
                '<div class="form-group"><label>First Name</label><input name="firstName" required placeholder="John" autocomplete="given-name"></div>' +
                '<div class="form-group"><label>Last Name</label><input name="lastName" required placeholder="Doe" autocomplete="family-name"></div>' +
              '</div>' +
              '<div class="form-group"><label>Email</label><input type="email" name="email" required placeholder="john@example.com" autocomplete="email"></div>' +
              '<div class="form-group"><label>Phone (optional)</label><input type="tel" name="phone" placeholder="+1 (555) 000-0000" autocomplete="tel"></div>' +
              '<div class="form-group"><label>Street Address</label><input name="address" required placeholder="123 Main Street" autocomplete="street-address"></div>' +
              '<div class="form-row">' +
                '<div class="form-group"><label>City</label><input name="city" required placeholder="New York" autocomplete="address-level2"></div>' +
                '<div class="form-group"><label>State / Province</label><input name="state" required placeholder="NY" autocomplete="address-level1"></div>' +
              '</div>' +
              '<div class="form-row">' +
                '<div class="form-group"><label>ZIP / Postal</label><input name="zip" required placeholder="10001" autocomplete="postal-code"></div>' +
                '<div class="form-group"><label>Country</label><input name="country" required placeholder="United States" autocomplete="country-name"></div>' +
              '</div>' +
              '<button type="submit" class="btn-checkout-submit" id="coSubmit">' +
                '<span id="coSubmitText">Place Order</span><span>→</span>' +
              '</button>' +
              '<p class="whop-note">Payment powered by Whop</p>' +
            '</form>' +
          '</div>' +
          '<div id="coWhopContainer" style="display:none">' +
            '<p class="checkout-step-label">Complete Your Payment</p>' +
            '<div id="coWhopEmbed"></div>' +
          '</div>' +
          '<div class="checkout-success" id="coSuccess" style="display:none">' +
            '<span class="success-gem">◆</span>' +
            '<h3>Order Received!</h3>' +
            '<p id="coOrderId" class="success-order-id"></p>' +
            '<p>We\'ll reach out within 24 hours to confirm your order.</p>' +
            '<button class="btn-gold" onclick="closeCheckout()">Continue Shopping</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>');

  document.getElementById('coClose').addEventListener('click', closeCheckout);
  document.getElementById('coOverlay').addEventListener('click', e => { if (e.target.id === 'coOverlay') closeCheckout(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCheckout(); closeCartCheckout(); closeCartDrawer(); }
  });

  document.getElementById('coForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const btn = document.getElementById('coSubmit');
    const txt = document.getElementById('coSubmitText');
    btn.disabled = true; txt.textContent = 'Processing…';
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: f.firstName.value.trim(), lastName: f.lastName.value.trim(),
          email: f.email.value.trim(), phone: f.phone.value.trim(),
          address: f.address.value.trim(), city: f.city.value.trim(),
          state: f.state.value.trim(), zip: f.zip.value.trim(), country: f.country.value.trim(),
          product: { id: _cp.id, title: _cp.title, price: _cp.price, whopPlanId: _cp.whopPlanId || null }
        })
      });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      if (data.redirect) { window.location.href = data.redirect; return; }
      if (data.whopPlanId) {
        _showWhopEmbed(data.whopPlanId);
      } else if (data.success) {
        document.getElementById('coFormWrap').style.display = 'none';
        document.getElementById('coOrderId').textContent = 'Order ID: ' + data.orderId;
        document.getElementById('coSuccess').style.display = 'flex';
      }
    } catch {
      showToast('Server offline — start with: node server.js');
      btn.disabled = false; txt.textContent = 'Place Order';
    }
  });

  updateCartBadge();
});
