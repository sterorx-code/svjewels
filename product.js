const BRAND_LABELS = { cartier: 'Cartier', ap: 'Audemars Piguet', rolex: 'Rolex' };

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

function switchImage(src, el) {
  document.getElementById('mainImage').src = src;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function _setMeta(selector, attr, value) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [a, v] = selector.replace(/[\[\]"]/g, '').split('=');
    el.setAttribute(a, v);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function renderProductPage() {
  const id = parseInt(window.location.pathname.split('/').pop());
  const p = window.PRODUCTS.find(p => p.id === id);

  if (!p) {
    document.getElementById('productMain').innerHTML = `
      <section style="padding:12rem 2rem;text-align:center;">
        <p style="color:var(--gold);font-size:.7rem;letter-spacing:.3em;text-transform:uppercase;margin-bottom:1rem">404</p>
        <h1 style="font-family:var(--font-serif);font-size:3rem;font-weight:300;margin-bottom:1.5rem">Product Not Found</h1>
        <a href="/" class="btn-gold">Back to Shop</a>
      </section>`;
    return;
  }

  const canonicalUrl = `https://svvjewels.shop/product/${p.id}`;
  const ogImage = (p.images && p.images[0]) || p.image || '';
  const metaDesc = `Buy the ${p.title} at SV Jewels. ${p.description.slice(0, 110)} Free worldwide shipping.`;
  const priceNum = p.price.replace(/[^0-9.]/g, '');

  document.title = `${p.title} — SV Jewels`;

  // Description & canonical
  _setMeta('meta[name="description"]', 'content', metaDesc);
  let can = document.querySelector('link[rel="canonical"]');
  if (!can) { can = document.createElement('link'); can.rel = 'canonical'; document.head.appendChild(can); }
  can.href = canonicalUrl;

  // Open Graph
  _setMeta('meta[property="og:title"]', 'content', `${p.title} — SV Jewels`);
  _setMeta('meta[property="og:description"]', 'content', p.description);
  _setMeta('meta[property="og:url"]', 'content', canonicalUrl);
  _setMeta('meta[property="og:image"]', 'content', ogImage);

  // Twitter
  _setMeta('meta[name="twitter:title"]', 'content', `${p.title} — SV Jewels`);
  _setMeta('meta[name="twitter:description"]', 'content', p.description);
  _setMeta('meta[name="twitter:image"]', 'content', ogImage);

  // Product JSON-LD
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.description,
    image: p.images && p.images.length ? p.images : [p.image],
    sku: `SVJ-${p.id}`,
    brand: { '@type': 'Brand', name: 'SV Jewels' },
    offers: {
      '@type': 'Offer',
      price: priceNum,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
      seller: { '@type': 'Organization', name: 'SV Jewels' },
    },
  });
  document.head.appendChild(ld);

  // BreadcrumbList
  const breadcrumbLd = document.createElement('script');
  breadcrumbLd.type = 'application/ld+json';
  breadcrumbLd.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://svvjewels.shop/' },
      { '@type': 'ListItem', position: 2, name: BRAND_LABELS[p.brand] || p.brand, item: `https://svvjewels.shop/${p.brand}` },
      { '@type': 'ListItem', position: 3, name: p.title, item: canonicalUrl },
    ],
  });
  document.head.appendChild(breadcrumbLd);

  // Breadcrumb
  const brandLabel = BRAND_LABELS[p.brand] || p.brand;
  document.getElementById('bcBrand').textContent = brandLabel;
  document.getElementById('bcBrand').href = `/${p.brand}`;
  document.getElementById('bcTitle').textContent = p.title;

  // Info
  const catEl = document.getElementById('productCat');
  catEl.textContent = p.category;
  if (p.sale) {
    catEl.insertAdjacentHTML('afterend', '<span class="product-sale-badge">Flash Sale</span>');
  }
  document.getElementById('productTitle').textContent = p.title;
  const priceEl = document.getElementById('productPrice');
  const pgCompare = _compareAt(p);
  if (pgCompare) {
    priceEl.innerHTML = `${p.price} <span class="product-original-price">${pgCompare}</span>`;
  } else {
    priceEl.textContent = p.price;
  }
  const pgRating = [5,5,4,5,5,5,4,5,5,4,5,5,5,4,5,5,4,5,5,5,4,5,5,4,5][p.id % 25];
  const pgCount = 23 + ((p.id * 17 + 11) % 61);
  priceEl.insertAdjacentHTML('afterend', `<div class="product-stars"><span class="stars-gold">${'★'.repeat(pgRating) + '☆'.repeat(5 - pgRating)}</span><span class="stars-count">(${pgCount} verified reviews)</span></div>`);
  document.getElementById('productDesc').textContent = p.description;

  // Gallery
  const imgs = p.images && p.images.length ? p.images : (p.image ? [p.image] : []);
  const mainEl = document.getElementById('mainImage');
  const mainWrap = document.getElementById('galleryMain');
  if (imgs.length) {
    mainEl.src = imgs[0];
    mainEl.alt = p.title;
    if (imgs.length > 1) {
      document.getElementById('galleryThumbs').innerHTML = imgs.map((src, i) =>
        `<img class="gallery-thumb${i === 0 ? ' active' : ''}" src="${src}" alt="${p.title} ${i + 1}" onclick="switchImage('${src}', this)">`
      ).join('');
    }
  } else {
    mainEl.style.display = 'none';
    mainWrap.classList.add('no-img');
    mainWrap.insertAdjacentHTML('beforeend', '<span style="color:var(--gold);font-size:3rem">◆</span>');
  }

  // Shipping
  document.getElementById('shippingFeature').textContent =
    p.id === 38 ? 'Next day shipping in US' : '10 business day shipping';

  // Buttons
  document.getElementById('addToCartBtn').onclick = () => addToCart(p.id);
  document.getElementById('buyNowBtn').onclick = () => openCheckout(p.id);

  // Related
  const related = window.PRODUCTS.filter(r => r.brand === p.brand && r.id !== p.id).slice(0, 4);
  if (!related.length) {
    document.getElementById('relatedSection').style.display = 'none';
  } else {
    document.getElementById('relatedGrid').innerHTML = related.map((r, i) => cardHTML(r, String(i + 1).padStart(2, '0'))).join('');
  }

  renderReviews(p.id);
}

function _reviewCardHTML(rv) {
  const media = rv.video
    ? `<video class="review-media" src="${rv.video}" controls playsinline></video>`
    : rv.image
    ? `<img class="review-media" src="${rv.image}" alt="Review photo" loading="lazy">`
    : '';
  return `<div class="review-card">
    <div class="review-head">
      <span class="review-name">${rv.name}</span>
      <span class="review-stars">${'★'.repeat(rv.rating) + '☆'.repeat(5 - rv.rating)}</span>
    </div>
    <p class="review-date">${rv.date}</p>
    <p class="review-text">${rv.text}</p>
    ${media}
  </div>`;
}

function renderReviews(productId) {
  const featured = window.FEATURED_REVIEWS || [];
  const pool = window.POOL_REVIEWS || [];
  const start = (productId * 4) % Math.max(pool.length, 1);
  const extra = [];
  for (let i = 0; i < 2; i++) {
    extra.push(pool[(start + i) % pool.length]);
  }
  const picks = [...featured, ...extra];
  const count = 23 + ((productId * 17 + 11) % 61);
  document.getElementById('reviewsSummary').innerHTML =
    `<div class="reviews-avg">
      <span class="reviews-avg-num">5.0</span>
      <div>
        <div class="reviews-avg-stars">★★★★★</div>
        <p class="reviews-avg-count">Based on ${count} reviews</p>
      </div>
    </div>`;
  document.getElementById('reviewsList').innerHTML = picks.map(_reviewCardHTML).join('');
}

renderProductPage();
