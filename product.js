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

const PRODUCT_REVIEWS = [
  { name: "Marcus T.", rating: 5, date: "April 12, 2025", text: "Absolutely stunning piece. The moissanite catches light like nothing I've ever seen. Got so many compliments at my brother's wedding." },
  { name: "ashley", rating: 5, date: "March 28, 2025", text: "i was skeptical at first but wow. looks exactly like the photos, maybe even better in person. very fast shipping too" },
  { name: "DeShawn Williams", rating: 5, date: "February 14, 2025", text: "Bought this for Valentine's Day and my girl thought it was real diamonds lol. Quality is insane for the price. Will be ordering again." },
  { name: "Priya M.", rating: 4, date: "May 2, 2025", text: "Beautiful watch, great quality overall. The stones are super sparkly. Docking one star only because the packaging could be a bit nicer but the watch itself is perfect." },
  { name: "jake", rating: 5, date: "January 19, 2025", text: "no way this is moissanite. looks like the real thing. been wearing it for 2 months no issues. definitely buying the rolex version next" },
  { name: "Samantha R.", rating: 5, date: "April 30, 2025", text: "Third purchase from SV Jewels and they never disappoint. The craftsmanship keeps getting better. This Cartier Santos is my favorite one yet." },
  { name: "darius", rating: 4, date: "March 15, 2025", text: "solid watch man. stones are tight, nothing loose. clasp is sturdy. only thing is shipping took a lil longer than expected but customer service was helpful" },
  { name: "Keisha Thompkins", rating: 5, date: "May 18, 2025", text: "I've compared this side by side with watches that cost 10x more at the store. The difference is honestly minimal. SV Jewels is the real deal." },
  { name: "mike l.", rating: 5, date: "February 28, 2025", text: "bought one for me and one for my dad. both look incredible. the face is crystal clear and the band feels premium. 100% recommend" },
  { name: "Tiffany Cruz", rating: 5, date: "April 8, 2025", text: "Exceeded every expectation. The weight feels substantial and luxurious, not cheap at all. The moissanite sparkles are blinding in sunlight." },
  { name: "brandon k", rating: 4, date: "January 5, 2025", text: "Really nice watch. Fits perfectly, stones are all secure. Would give 5 stars but I'm still waiting to see how it holds up long term. So far so good though." },
  { name: "Aaliyah J.", rating: 5, date: "May 25, 2025", text: "Got this as a gift for my boyfriend and he literally gasped when he opened it. He wears it every single day. Absolutely worth every penny." },
  { name: "ricky", rating: 5, date: "March 3, 2025", text: "bro the fire in these stones is CRAZY. took it to a jeweler just to mess with him and he was impressed lol. quality is legit" },
  { name: "Vanessa Okafor", rating: 5, date: "February 20, 2025", text: "Elegant, well-crafted, and truly stunning. I wear this to work and clients regularly ask where I got my watch. It feels like true luxury." },
  { name: "Chris M.", rating: 4, date: "April 22, 2025", text: "Solid piece. The iced out bezel is clean and the stones are consistent. Shipping was a bit slow but the watch makes up for it. Would order again." },
  { name: "jazmine", rating: 5, date: "May 10, 2025", text: "omg i can't stop staring at my wrist lol. this is so gorgeous. the pictures don't even do it justice honestly" },
  { name: "Emmanuel Adeyemi", rating: 5, date: "January 30, 2025", text: "Phenomenal quality. I've worn luxury watches before and this moissanite alternative is genuinely impressive. The clarity and brilliance of each stone is remarkable." },
  { name: "Kim S.", rating: 5, date: "March 20, 2025", text: "Second order from here. My first watch still looks brand new after 6 months of daily wear. These hold up really well. Very happy customer." },
  { name: "Lil Ray", rating: 4, date: "April 15, 2025", text: "Clean watch, stones are nice and bright. Packaging was simple but the watch itself is fire. Fits true to size on my 7.5 inch wrist." },
  { name: "natasha w.", rating: 5, date: "February 8, 2025", text: "I bought this after seeing someone wear it on instagram. Looks even better in real life. So sparkly and elegant. Fast delivery and great communication." },
  { name: "Devon Pierce", rating: 5, date: "May 5, 2025", text: "My whole crew has been asking where I got this. Already sent 3 of them the link. The AP Royal Oak style is absolutely fire, stones are flawless." },
  { name: "sara t", rating: 4, date: "January 22, 2025", text: "pretty watch, very sparkly. i was worried about quality from an online shop but it's legitimately impressive. the clasp could be a tiny bit smoother but overall love it" },
  { name: "Jordan L.", rating: 5, date: "March 10, 2025", text: "Bought as a groomsmen gift for myself and it stole the show at the reception. Everyone thought it was a real Cartier. Incredible value." },
  { name: "monique", rating: 5, date: "April 28, 2025", text: "this is my third purchase and each time the quality gets better. the moissanite sparkles way more than i expected. highly recommend to anyone looking for luxury on a budget" },
  { name: "Tyler B.", rating: 5, date: "May 15, 2025", text: "Outstanding. The attention to detail on this watch is remarkable. Stones are perfectly set, the finish is immaculate. You'd never know it wasn't a $10k+ watch." },
];

function renderReviews(productId) {
  const start = (productId * 4) % PRODUCT_REVIEWS.length;
  const picks = [];
  for (let i = 0; i < 6; i++) {
    picks.push(PRODUCT_REVIEWS[(start + i) % PRODUCT_REVIEWS.length]);
  }
  const r = [5,5,4,5,5,5,4,5,5,4,5,5,5,4,5,5,4,5,5,5,4,5,5,4,5][productId % 25];
  const count = 23 + ((productId * 17 + 11) % 61);
  document.getElementById('reviewsSummary').innerHTML =
    `<div class="reviews-avg">
      <span class="reviews-avg-num">${r}.0</span>
      <div>
        <div class="reviews-avg-stars">${'★'.repeat(r) + '☆'.repeat(5 - r)}</div>
        <p class="reviews-avg-count">Based on ${count} reviews</p>
      </div>
    </div>`;
  document.getElementById('reviewsList').innerHTML = picks.map(rv =>
    `<div class="review-card">
      <div class="review-head">
        <span class="review-name">${rv.name}</span>
        <span class="review-stars">${'★'.repeat(rv.rating) + '☆'.repeat(5 - rv.rating)}</span>
      </div>
      <p class="review-date">${rv.date}</p>
      <p class="review-text">${rv.text}</p>
    </div>`
  ).join('');
}

renderProductPage();
