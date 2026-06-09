// Index page — uses window.PRODUCTS from products-data.js, addToCart/openCheckout from shared.js

const grid = document.getElementById('productsGrid');
const filterBar = document.getElementById('filterBar');

function cardHTML(p, num) {
  const img = p.image
    ? `<img src="${p.image}" alt="${p.title}" loading="lazy">`
    : `<span style="color:var(--gold);font-size:2rem">◆</span>`;
  const saleBadge = p.sale ? `<span class="card-sale-badge">Flash Sale</span>` : '';
  const compareAt = _compareAt(p);
  const priceHTML = compareAt
    ? `<span class="card-price">${p.price}</span><span class="card-price-original">${compareAt}</span>`
    : `<span class="card-price">${p.price}</span>`;
  return `
    <div class="product-card${p.featured ? ' product-card--featured' : ''}">
      <a class="card-img-link${p.image ? '' : ' no-image'}" href="/product/${p.id}">
        ${img}<span class="card-num">${num}</span>${saleBadge}
      </a>
      <div class="card-body">
        <p class="card-cat">${p.category}</p>
        ${_cardStars(p.id)}
        <a class="card-title-link" href="/product/${p.id}"><h3 class="card-title">${p.title}</h3></a>
        <p class="card-desc">${p.description}</p>
        <div class="card-foot">
          <div class="card-price-wrap">${priceHTML}</div>
          <div class="card-actions">
            <button class="btn-cart" onclick="addToCart(${p.id})">+ Cart</button>
            <button class="btn-buy" onclick="openCheckout(${p.id})">Buy Now →</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderProducts(filter) {
  let list = filter === 'all' ? window.PRODUCTS : window.PRODUCTS.filter(p => p.brand === filter);
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state">No products found. Check back soon.</div>';
    return;
  }
  // Pin featured products first
  list = [...list.filter(p => p.featured), ...list.filter(p => !p.featured)];
  grid.innerHTML = list.map((p, i) => cardHTML(p, String(i + 1).padStart(2, '0'))).join('');
}

filterBar.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn || btn.disabled) return;
  filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts(btn.dataset.filter);
});

// Handle ?brand= param from product page breadcrumb links
const _brand = new URLSearchParams(window.location.search).get('brand');
if (_brand) {
  const btn = filterBar.querySelector(`[data-filter="${_brand}"]`);
  if (btn && !btn.disabled) {
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(_brand);
    requestAnimationFrame(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }));
  } else {
    renderProducts('all');
  }
} else {
  renderProducts('all');
}
