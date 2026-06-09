const BRANDS = {
  cartier: {
    label: 'Cartier Santos',
    title: 'Moissanite Cartier',
    sub: 'The iconic Santos silhouette, fully iced in VVS moissanite. Heritage luxury reinvented.',
    eyebrow: 'Cartier Collection',
    pageTitle: 'Moissanite Cartier Santos Watches | SV Jewels — Iced Out VVS Timepieces',
    metaDesc: 'Shop iced-out Cartier Santos moissanite watches at SV Jewels. VVS brilliance, free worldwide shipping. From $899.',
    ogImage: 'https://svjewelsshop.com/wp-content/uploads/2025/09/cartier1.webp',
  },
  ap: {
    label: 'Audemars Piguet',
    title: 'Moissanite AP',
    sub: 'The legendary Royal Oak octagon, bust down in brilliant moissanite diamonds.',
    eyebrow: 'AP Collection',
    pageTitle: 'Moissanite Audemars Piguet Royal Oak Watches | SV Jewels',
    metaDesc: 'Fully iced Audemars Piguet Royal Oak moissanite watches. VVS diamonds, elegant design. Free worldwide shipping from SV Jewels.',
    ogImage: 'https://svjewelsshop.com/wp-content/uploads/2025/09/Snapinsta.app_1080_326754414_874895150291116_56080898839176145_n.webp',
  },
  rolex: {
    label: 'Rolex',
    title: 'Moissanite Rolex',
    sub: 'Swiss precision and VVS moissanite brilliance — the most coveted crown, fully iced.',
    eyebrow: 'Rolex Collection',
    pageTitle: 'Moissanite Rolex Watches | Datejust, Yacht-Master & Sky-Dweller | SV Jewels',
    metaDesc: 'Browse iced-out Rolex moissanite watches at SV Jewels. Datejust, Yacht-Master, Sky-Dweller and more — all VVS-set. Free shipping.',
    ogImage: 'https://svjewelsshop.com/wp-content/uploads/2025/09/Moissanite_Rolex_Date-Just_Iced_Out_Dual_tone_Jubilee_Diamond_watch_Front.webp',
  },
};

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

(function () {
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  const brand = BRANDS[path];

  if (!brand) {
    window.location.replace('/');
    return;
  }

  // Page content
  document.getElementById('collectionEyebrow').textContent = brand.eyebrow;
  document.getElementById('collectionTitle').textContent = brand.title;
  document.getElementById('collectionSub').textContent = brand.sub;

  // Mark active nav link
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === '/' + path) a.classList.add('active');
  });

  // SEO — title, description, canonical, OG
  document.title = brand.pageTitle;

  const _sm = (sel, attr, val) => {
    let el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      const [a, v] = sel.replace(/[\[\]"]/g, '').split('=');
      el.setAttribute(a, v); document.head.appendChild(el);
    }
    el.setAttribute(attr, val);
  };

  const canonUrl = `https://svvjewels.shop/${path}`;
  _sm('meta[name="description"]', 'content', brand.metaDesc);
  let can = document.querySelector('link[rel="canonical"]');
  if (!can) { can = document.createElement('link'); can.rel = 'canonical'; document.head.appendChild(can); }
  can.href = canonUrl;

  _sm('meta[property="og:title"]', 'content', brand.pageTitle);
  _sm('meta[property="og:description"]', 'content', brand.metaDesc);
  _sm('meta[property="og:url"]', 'content', canonUrl);
  _sm('meta[property="og:image"]', 'content', brand.ogImage);
  _sm('meta[name="twitter:title"]', 'content', brand.pageTitle);
  _sm('meta[name="twitter:description"]', 'content', brand.metaDesc);
  _sm('meta[name="twitter:image"]', 'content', brand.ogImage);

  // JSON-LD CollectionPage
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: brand.pageTitle,
    description: brand.metaDesc,
    url: canonUrl,
    image: brand.ogImage,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://svvjewels.shop/' },
        { '@type': 'ListItem', position: 2, name: brand.label, item: canonUrl },
      ],
    },
  });
  document.head.appendChild(ld);

  // Render products — featured first
  let list = window.PRODUCTS.filter(p => p.brand === path);
  list = [...list.filter(p => p.featured), ...list.filter(p => !p.featured)];

  const grid = document.getElementById('productsGrid');
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state">No products found. Check back soon.</div>';
  } else {
    grid.innerHTML = list.map((p, i) => cardHTML(p, String(i + 1).padStart(2, '0'))).join('');
  }

  // Sub-filters (sizes/styles) — could be expanded; for now shows count
  const filterBar = document.getElementById('filterBar');
  filterBar.innerHTML = `<span class="collection-count">${list.length} pieces</span>`;
})();
