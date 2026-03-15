/* ========== TAILY MARKET TAB — Products, Cart, Checkout, Coupons, Orders v2.0 ========== */

let marketProducts = [];
let marketProductsPage = 1;
let marketProductsHasMore = true;
let marketCurrentCategory = 'all';
let marketCurrentCouponTab = 'all';
let marketCurrentOrderFilter = 'all';
let marketOrders = [];
let marketCoupons = [];
let promoBannerInterval = null;
let promoBannerIndex = 0;
let checkoutStep = 1;
let selectedPayment = 'promptpay';

// ===== INIT =====
async function initMarket() {
  initPromoBanner();

  const [productResult, coupons, orders] = await Promise.all([
    MockAPI.getProducts('all', 1),
    MockAPI.getCoupons(),
    MockAPI.getOrders().catch(() => [])
  ]);

  marketProducts = productResult.items;
  marketProductsHasMore = productResult.hasMore;
  marketCoupons = coupons;
  marketOrders = orders;

  renderProducts(productResult);
  renderCoupons();
  renderOrders();
}

// ===== MARKET TAB NAVIGATION =====
function showMarketTab(tab) {
  document.querySelectorAll('.market-sub').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.market-tab').forEach(t => t.classList.remove('active'));

  const sub = document.getElementById(`market-${tab}`);
  if (sub) sub.classList.add('active');

  const tabs = document.querySelectorAll('.market-tab');
  const tabMap = { shop: 0, coupons: 1, orders: 2 };
  if (tabs[tabMap[tab]]) tabs[tabMap[tab]].classList.add('active');
}

// ===== PROMO BANNER (Ads/Placement Banners) =====
function initPromoBanner() {
  const container = document.getElementById('promoBanner');
  const dotsContainer = document.getElementById('promoDots');
  if (!container || !dotsContainer) return;

  // Ads Placement System — each banner = purchasable ad slot for merchants/brands
  const banners = [
    {
      text: 'Grand Opening Sale!',
      headline: '\u0E25\u0E14\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 50%',
      sub: '\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E2A\u0E31\u0E15\u0E27\u0E4C\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E \u0E23\u0E32\u0E04\u0E32\u0E1E\u0E34\u0E40\u0E28\u0E29',
      cta: '\u0E14\u0E39\u0E42\u0E1B\u0E23\u0E42\u0E21\u0E0A\u0E31\u0E48\u0E19',
      gradient: 'linear-gradient(135deg, #FFC501, #E5A800)',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop',
      merchantId: null,
      adSlot: 'hero-1',
      badge: 'AD'
    },
    {
      text: '\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E19\u0E49\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22\u0E22\u0E2D\u0E14\u0E19\u0E34\u0E22\u0E21',
      headline: '\u0E2D\u0E32\u0E2B\u0E32\u0E23 \u0E02\u0E2D\u0E07\u0E40\u0E25\u0E48\u0E19 \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C',
      sub: '\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E19\u0E49\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E41\u0E25\u0E30\u0E19\u0E49\u0E2D\u0E07\u0E41\u0E21\u0E27',
      cta: '\u0E0A\u0E49\u0E2D\u0E1B\u0E40\u0E25\u0E22',
      gradient: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
      image: 'https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=800&h=400&fit=crop',
      merchantId: null,
      adSlot: 'hero-2',
      badge: null
    },
    {
      text: '\u0E04\u0E39\u0E1B\u0E2D\u0E07\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14\u0E1E\u0E34\u0E40\u0E28\u0E29!',
      headline: '\u0E40\u0E01\u0E47\u0E1A\u0E40\u0E25\u0E22 \u0E08\u0E33\u0E01\u0E31\u0E14\u0E08\u0E33\u0E19\u0E27\u0E19',
      sub: '\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E1E\u0E34\u0E40\u0E28\u0E29\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 Taily',
      cta: '\u0E23\u0E31\u0E1A\u0E04\u0E39\u0E1B\u0E2D\u0E07',
      gradient: 'linear-gradient(135deg, #FF8C42, #E65100)',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=200&fit=crop',
      merchantId: null,
      adSlot: 'hero-3',
      badge: 'AD'
    }
  ];

  container.innerHTML = banners.map((b, i) => `
    <div class="promo-slide${i === 0 ? ' active' : ''}" style="background:${b.gradient}" onclick="openPromoDetail(${i})">
      <div class="promo-image-wrap">
        <img src="${b.image}" alt="${b.text}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="promo-content">
        ${b.badge ? `<span class="promo-ad-badge">${b.badge}</span>` : ''}
        <div class="promo-text">${b.text}</div>
        <div class="promo-headline">${b.headline}</div>
        <div class="promo-sub">${b.sub}</div>
        <button class="promo-cta-btn">${b.cta} <i class="fas fa-chevron-right"></i></button>
      </div>
    </div>
  `).join('');

  dotsContainer.innerHTML = banners.map((_, i) => `
    <span class="promo-dot${i === 0 ? ' active' : ''}" onclick="goToPromoSlide(${i})"></span>
  `).join('');

  // Auto-scroll every 4 seconds
  if (promoBannerInterval) clearInterval(promoBannerInterval);
  promoBannerInterval = setInterval(() => {
    promoBannerIndex = (promoBannerIndex + 1) % banners.length;
    updatePromoSlide();
  }, 4000);
}

// ===== PROMO DETAIL PAGE (Ad Placement Detail) =====
function openPromoDetail(bannerIndex) {
  const promos = [
    {
      title: 'Grand Opening Sale!',
      subtitle: '\u0E25\u0E14\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 50% \u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E2A\u0E31\u0E15\u0E27\u0E4C\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop',
      desc: '\u0E09\u0E25\u0E2D\u0E07\u0E42\u0E1B\u0E23\u0E42\u0E21\u0E0A\u0E31\u0E48\u0E19\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E43\u0E2B\u0E21\u0E48! \u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E2A\u0E31\u0E15\u0E27\u0E4C\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E17\u0E38\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E25\u0E14\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 50% \u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E16\u0E36\u0E07\u0E2A\u0E34\u0E49\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19 \u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2A\u0E31\u0E15\u0E27\u0E4C\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07 \u0E02\u0E2D\u0E07\u0E40\u0E25\u0E48\u0E19 \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C \u0E41\u0E25\u0E30\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E41\u0E1F\u0E0A\u0E31\u0E48\u0E19\u0E2A\u0E31\u0E15\u0E27\u0E4C\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07 \u0E2A\u0E48\u0E07\u0E1F\u0E23\u0E35\u0E17\u0E31\u0E48\u0E27\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28',
      period: '11 - 31 \u0E21\u0E35.\u0E04. 2569',
      merchant: 'Taily Official Store',
      code: 'GRAND50'
    },
    {
      title: '\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E19\u0E49\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22\u0E22\u0E2D\u0E14\u0E19\u0E34\u0E22\u0E21',
      subtitle: '\u0E2D\u0E32\u0E2B\u0E32\u0E23 \u0E02\u0E2D\u0E07\u0E40\u0E25\u0E48\u0E19 \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E04\u0E23\u0E1A',
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop',
      desc: '\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E19\u0E49\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E41\u0E25\u0E30\u0E19\u0E49\u0E2D\u0E07\u0E41\u0E21\u0E27\u0E22\u0E2D\u0E14\u0E19\u0E34\u0E22\u0E21\u0E17\u0E35\u0E48\u0E04\u0E31\u0E14\u0E2A\u0E23\u0E23\u0E21\u0E32\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E38\u0E13 \u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E01\u0E23\u0E14\u0E1E\u0E23\u0E35\u0E40\u0E21\u0E35\u0E22\u0E21\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E2A\u0E39\u0E07 \u0E02\u0E2D\u0E07\u0E40\u0E25\u0E48\u0E19\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C\u0E14\u0E31\u0E07 \u0E41\u0E25\u0E30\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E2A\u0E27\u0E22\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2A\u0E31\u0E15\u0E27\u0E4C\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13',
      period: '1 - 30 \u0E40\u0E21.\u0E22. 2569',
      merchant: 'Pet Mart Central',
      code: 'PETLOVER'
    },
    {
      title: '\u0E04\u0E39\u0E1B\u0E2D\u0E07\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14\u0E1E\u0E34\u0E40\u0E28\u0E29!',
      subtitle: '\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 Taily \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop',
      desc: '\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 Taily \u0E23\u0E31\u0E1A\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E04\u0E39\u0E1B\u0E2D\u0E07\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14\u0E1E\u0E34\u0E40\u0E28\u0E29\u0E21\u0E32\u0E01\u0E21\u0E32\u0E22! \u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E01\u0E31\u0E1A\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E21\u0E34\u0E15\u0E23\u0E17\u0E31\u0E48\u0E27\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28 \u0E23\u0E31\u0E1A\u0E04\u0E39\u0E1B\u0E2D\u0E07\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E04\u0E39\u0E1B\u0E2D\u0E07 \u0E08\u0E33\u0E01\u0E31\u0E14\u0E08\u0E33\u0E19\u0E27\u0E19',
      period: '1 \u0E21\u0E35.\u0E04. - 30 \u0E40\u0E21.\u0E22. 2569',
      merchant: 'Taily Partners',
      code: 'MEMBER2026'
    }
  ];

  const p = promos[bannerIndex] || promos[0];
  showModal(`
    <div class="promo-detail-modal">
      <div class="promo-detail-hero">
        <img src="${p.image}" alt="${p.title}" onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,var(--primary),var(--accent))'">
        <div class="promo-detail-overlay"></div>
        <button class="promo-detail-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <div class="promo-detail-body">
        <h2>${p.title}</h2>
        <p class="promo-detail-subtitle">${p.subtitle}</p>
        <div class="promo-detail-meta">
          <div class="promo-meta-item"><i class="fas fa-calendar"></i> ${p.period}</div>
          <div class="promo-meta-item"><i class="fas fa-store"></i> ${p.merchant}</div>
        </div>
        <div class="promo-detail-desc">${p.desc}</div>
        <div class="promo-detail-code">
          <span>\u0E23\u0E2B\u0E31\u0E2A:</span>
          <strong>${p.code}</strong>
          <button onclick="copyCouponCode('${p.code}')"><i class="fas fa-copy"></i></button>
        </div>
        <button class="promo-detail-cta-btn" onclick="closeModal();showMarketTab('coupons')"><i class="fas fa-ticket-alt"></i> ดูคูปองทั้งหมด</button>
      </div>
    </div>
  `);
}

function goToPromoSlide(index) {
  promoBannerIndex = index;
  updatePromoSlide();
  // Reset timer
  if (promoBannerInterval) clearInterval(promoBannerInterval);
  promoBannerInterval = setInterval(() => {
    promoBannerIndex = (promoBannerIndex + 1) % 3;
    updatePromoSlide();
  }, 4000);
}

function updatePromoSlide() {
  const slides = document.querySelectorAll('#promoBanner .promo-slide');
  const dots = document.querySelectorAll('#promoDots .promo-dot');
  slides.forEach((s, i) => s.classList.toggle('active', i === promoBannerIndex));
  dots.forEach((d, i) => d.classList.toggle('active', i === promoBannerIndex));
}

// ===== PRODUCTS =====
function renderProducts(result) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const items = result.items || result;

  if (!items.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <i class="fas fa-search"></i>
        <p>\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(p => {
    const hasDiscount = p.discount && p.discount > 0;
    const originalPrice = hasDiscount ? Math.round(p.price / (1 - p.discount / 100)) : null;
    const ratingStars = '\u2605'.repeat(Math.floor(p.rating || 4)) + '\u2606'.repeat(5 - Math.floor(p.rating || 4));
    const badges = [];
    if (p.isNew) badges.push('<span class="product-badge new-badge">\u0E43\u0E2B\u0E21\u0E48</span>');
    if (p.isBestseller) badges.push('<span class="product-badge best-badge">\u0E02\u0E32\u0E22\u0E14\u0E35</span>');
    if (hasDiscount) badges.push(`<span class="product-badge discount-badge">-${p.discount}%</span>`);

    return `
      <div class="product-card" onclick="openProduct(${p.id})">
        <div class="product-img-wrap">
          <img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy"
               onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#FFC501,#FFD740)'">
          ${badges.join('')}
        </div>
        <div class="product-body">
          <div class="product-name">${p.name}</div>
          <div class="product-price-row">
            <span class="product-price">\u0E3F${p.price.toLocaleString()}</span>
            ${hasDiscount ? `<span class="product-price-old">\u0E3F${originalPrice.toLocaleString()}</span>` : ''}
          </div>
          <div class="product-rating">
            <span class="product-stars">${ratingStars}</span>
            <span class="product-reviews">(${p.reviewCount || 0})</span>
          </div>
          <div class="product-sold">\u0E02\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27 ${formatNumber(p.sold || 0)} \u0E0A\u0E34\u0E49\u0E19</div>
        </div>
      </div>
    `;
  }).join('');
}

async function filterProducts(category, el) {
  // Update active button
  if (el) {
    document.querySelectorAll('.mcat-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  }

  marketCurrentCategory = category;
  marketProductsPage = 1;

  const loader = document.getElementById('productLoader');
  if (loader) loader.style.display = 'flex';

  const result = await MockAPI.getProducts(category, 1);
  marketProducts = result.items;
  marketProductsHasMore = result.hasMore;
  renderProducts(result);

  if (loader) loader.style.display = 'none';
}

async function openProduct(id) {
  const product = await MockAPI.getProduct(id);
  if (!product) return;

  const hasDiscount = product.discount && product.discount > 0;
  const originalPrice = hasDiscount ? Math.round(product.price / (1 - product.discount / 100)) : null;
  const ratingStars = '\u2605'.repeat(Math.floor(product.rating || 4)) + '\u2606'.repeat(5 - Math.floor(product.rating || 4));

  const specsHtml = product.specs ? Object.entries(product.specs).map(([key, val]) => `
    <div class="spec-row">
      <span class="spec-key">${key}</span>
      <span class="spec-val">${val}</span>
    </div>
  `).join('') : '';

  document.getElementById('productDetail').innerHTML = `
    <div class="product-detail-page">
      <div class="pd-hero">
        <img src="${product.image}" alt="${product.name}"
             onerror="this.parentElement.style.background='linear-gradient(135deg,#FFC501,#FFD740)'">
        <button class="back-btn" onclick="goBack('market')"><i class="fas fa-chevron-left"></i></button>
        <button class="share-btn" onclick="showToast('\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E41\u0E25\u0E49\u0E27')"><i class="fas fa-share-alt"></i></button>
      </div>

      <div class="pd-body">
        <h1 class="pd-title">${product.name}</h1>
        <div class="pd-price-row">
          <span class="pd-price">\u0E3F${product.price.toLocaleString()}</span>
          ${hasDiscount ? `<span class="pd-original">\u0E3F${originalPrice.toLocaleString()}</span>` : ''}
          ${hasDiscount ? `<span class="pd-discount-badge">-${product.discount}%</span>` : ''}
        </div>
        <div class="pd-rating">
          <span class="pd-stars">${ratingStars}</span>
          <span class="pd-rating-num">${product.rating || 4.0}</span>
          <span class="pd-review-count">(${product.reviewCount || 0} \u0E23\u0E35\u0E27\u0E34\u0E27)</span>
          <span class="pd-sold">\u0E02\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27 ${formatNumber(product.sold || 0)}</span>
        </div>

        <div class="pd-section">
          <h3>\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</h3>
          <p class="pd-desc">${product.description || '\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2A\u0E31\u0E15\u0E27\u0E4C\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07'}</p>
        </div>

        ${specsHtml ? `
        <div class="pd-section">
          <h3>\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E33\u0E40\u0E1E\u0E32\u0E30</h3>
          <div class="pd-specs">${specsHtml}</div>
        </div>
        ` : ''}

        ${product.merchantName ? `
        <div class="pd-section">
          <div class="pd-merchant-row">
            <div class="pd-merchant-icon"><i class="fas fa-store"></i></div>
            <div class="pd-merchant-info">
              <div class="pd-merchant-name">${product.merchantName}</div>
              <div class="pd-merchant-label">\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32</div>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="pd-section">
          <h3>รีวิวจากผู้ซื้อ</h3>
          <div class="pd-review-summary">
            <span class="pd-review-big-score">${product.rating || 4.0}</span>
            <div class="pd-review-summary-right">
              <span class="pd-stars" style="font-size:16px">${ratingStars}</span>
              <span class="pd-review-total">${product.reviewCount || 0} รีวิว</span>
            </div>
          </div>
          <div class="pd-reviews">
            <div class="pd-review-item">
              <div class="pd-review-avatar"><i class="fas fa-user"></i></div>
              <div class="pd-review-content">
                <div class="pd-review-info">
                  <span class="pd-review-name">คุณแพรว</span>
                  <span class="pd-review-date">2 วันที่แล้ว</span>
                </div>
                <div class="pd-stars" style="font-size:12px">★★★★★</div>
                <p class="pd-review-text">น้องหมาชอบมากค่ะ คุณภาพดี ส่งเร็วมาก แพ็กอย่างดี แนะนำเลย!</p>
              </div>
            </div>
            <div class="pd-review-item">
              <div class="pd-review-avatar"><i class="fas fa-user"></i></div>
              <div class="pd-review-content">
                <div class="pd-review-info">
                  <span class="pd-review-name">คุณบอส</span>
                  <span class="pd-review-date">1 สัปดาห์ที่แล้ว</span>
                </div>
                <div class="pd-stars" style="font-size:12px">★★★★☆</div>
                <p class="pd-review-text">สินค้าดี ตรงปก คุ้มค่ากับราคา น้องแมวใช้ได้เลย</p>
              </div>
            </div>
            <div class="pd-review-item">
              <div class="pd-review-avatar"><i class="fas fa-user"></i></div>
              <div class="pd-review-content">
                <div class="pd-review-info">
                  <span class="pd-review-name">คุณมิ้นท์</span>
                  <span class="pd-review-date">2 สัปดาห์ที่แล้ว</span>
                </div>
                <div class="pd-stars" style="font-size:12px">★★★★★</div>
                <p class="pd-review-text">ซื้อซ้ำหลายรอบแล้วค่ะ ไม่เคยผิดหวัง บริการหลังขายดีมาก</p>
              </div>
            </div>
          </div>
        </div>

        <div class="pd-section">
          <div class="pd-qty-selector">
            <span class="pd-qty-label">\u0E08\u0E33\u0E19\u0E27\u0E19</span>
            <div class="pd-qty-controls">
              <button class="pd-qty-btn" onclick="changeProductQty(-1)"><i class="fas fa-minus"></i></button>
              <span class="pd-qty-value" id="pdQtyValue">1</span>
              <button class="pd-qty-btn" onclick="changeProductQty(1)"><i class="fas fa-plus"></i></button>
            </div>
          </div>
        </div>

        <div class="pd-actions">
          <button class="btn-primary pd-add-cart" onclick="addToCart(${product.id})">
            <i class="fas fa-cart-plus"></i> \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E07\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32
          </button>
          <button class="btn-outline pd-buy-now" onclick="addToCart(${product.id});closeCart();goCheckout()">
            \u0E0B\u0E37\u0E49\u0E2D\u0E40\u0E25\u0E22
          </button>
        </div>
      </div>
    </div>
  `;

  // Store current product for qty reference
  window._currentProduct = product;
  navigate('product');
}

function changeProductQty(delta) {
  const el = document.getElementById('pdQtyValue');
  if (!el) return;
  let qty = parseInt(el.textContent) || 1;
  qty = Math.max(1, Math.min(99, qty + delta));
  el.textContent = qty;
}

async function addToCart(productId) {
  let product = window._currentProduct;
  if (!product || product.id !== productId) {
    product = await MockAPI.getProduct(productId);
  }
  if (!product) return;

  const qtyEl = document.getElementById('pdQtyValue');
  const qty = qtyEl ? parseInt(qtyEl.textContent) || 1 : 1;

  TailyStore.addToCart(product, qty);
  // Update bottom nav cart badge
  if (typeof updateCartBadge === 'function') updateCartBadge();
  // Show enhanced toast with cart button
  const toastEl = document.getElementById('toast');
  if (toastEl) {
    toastEl.innerHTML = `
      <span>✅ เพิ่มลงตะกร้าแล้ว</span>
      <button onclick="openCart();this.closest('.toast').classList.remove('show')" style="margin-left:8px;padding:4px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.15);color:#fff;font-size:12px;font-weight:600;cursor:pointer">ดูตะกร้า</button>
    `;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3500);
  }
}

// ===== COUPONS =====
function renderCoupons() {
  const list = document.getElementById('couponsList');
  if (!list) return;

  let filtered = marketCoupons;
  if (marketCurrentCouponTab !== 'all') {
    if (marketCurrentCouponTab === 'special') {
      filtered = marketCoupons.filter(c => c.type === 'cash' || c.type === 'special');
    } else {
      filtered = marketCoupons.filter(c => c.type === marketCurrentCouponTab);
    }
  }

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-ticket-alt"></i>
        <h4>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E39\u0E1B\u0E2D\u0E07\u0E43\u0E19\u0E2B\u0E21\u0E27\u0E14\u0E19\u0E35\u0E49</h4>
        <p>\u0E25\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E14\u0E39\u0E2B\u0E21\u0E27\u0E14\u0E2D\u0E37\u0E48\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E01\u0E47\u0E1A\u0E04\u0E39\u0E1B\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32!</p>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(c => {
    const badgeHtml = c.badge
      ? `<span class="coupon-badge ${c.badge}">${c.badge === 'new' ? '\u0E43\u0E2B\u0E21\u0E48' : c.badge === 'hot' ? '\u0E22\u0E2D\u0E14\u0E19\u0E34\u0E22\u0E21' : '\u0E08\u0E33\u0E01\u0E31\u0E14'}</span>`
      : '';

    return `
      <div class="coupon-card type-${c.type}">
        <div class="coupon-left">
          <div class="coupon-discount">${c.discountText}</div>
          <div class="coupon-type">${c.discountLabel}</div>
        </div>
        <div class="coupon-dashed"></div>
        <div class="coupon-right">
          <div class="coupon-merchant-info">
            <span style="font-size:18px">${c.emoji}</span>
            <div class="coupon-merchant">${c.merchantName}${badgeHtml}</div>
          </div>
          <div class="coupon-detail">${c.promotion}</div>
          <div class="coupon-expiry"><i class="fas fa-clock"></i> \u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38: ${c.expiry}</div>
        </div>
        <button class="coupon-use-btn" onclick="useCoupon(${c.id})">\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E22</button>
      </div>
    `;
  }).join('');
}

function setCouponTab(tab, el) {
  document.querySelectorAll('.coupon-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  marketCurrentCouponTab = tab;
  renderCoupons();
}

function useCoupon(id) {
  const c = marketCoupons.find(x => x.id === id);
  if (!c) return;

  showModal(`
    <div class="modal-header">
      <h3>\u0E43\u0E0A\u0E49\u0E04\u0E39\u0E1B\u0E2D\u0E07</h3>
      <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:64px;margin-bottom:12px">\uD83C\uDFAB</div>
      <h3 style="margin-bottom:4px">${c.merchantName}</h3>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">${c.promotion}</p>
      <div style="background:var(--bg, #FFFBF0);border-radius:12px;padding:20px;margin:16px 0">
        <div style="font-size:12px;color:var(--text-light, #999)">\u0E23\u0E2B\u0E31\u0E2A\u0E04\u0E39\u0E1B\u0E2D\u0E07</div>
        <div style="font-size:28px;font-weight:800;color:var(--primary, #FFC501);letter-spacing:4px;margin:8px 0">${c.code || 'TAILY-' + c.id}</div>
        <button onclick="copyCouponCode('${c.code || 'TAILY-' + c.id}')" style="margin-top:8px;background:var(--primary);color:var(--primary-on);border:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer"><i class="fas fa-copy"></i> \u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E23\u0E2B\u0E31\u0E2A</button>
        <div style="width:200px;height:200px;margin:12px auto;background:var(--border, #eee);border-radius:12px;display:flex;align-items:center;justify-content:center">
          <div style="text-align:center">
            <i class="fas fa-qrcode" style="font-size:80px;color:var(--text-light, #999)"></i>
            <div style="font-size:11px;color:var(--text-light, #999);margin-top:8px">QR Code</div>
          </div>
        </div>
      </div>
      <button class="btn-primary" style="width:100%;padding:14px" onclick="closeModal()">\u0E1B\u0E34\u0E14</button>
    </div>
  `);
}

function copyCouponCode(code) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      showToast('\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E23\u0E2B\u0E31\u0E2A\u0E41\u0E25\u0E49\u0E27: ' + code);
    });
  } else {
    showToast('\u0E23\u0E2B\u0E31\u0E2A: ' + code);
  }
}

// ===== ORDERS =====
function renderOrders() {
  const list = document.getElementById('ordersList');
  if (!list) return;

  let filtered = marketOrders;
  if (marketCurrentOrderFilter !== 'all') {
    filtered = marketOrders.filter(o => o.status === marketCurrentOrderFilter);
  }

  if (!filtered || !filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-shopping-bag"></i>
        <p>\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D</p>
        <button class="btn-primary btn-sm" onclick="showMarketTab('shop')">\u0E44\u0E1B\u0E0A\u0E49\u0E2D\u0E1B\u0E1B\u0E34\u0E49\u0E07</button>
      </div>
    `;
    return;
  }

  const statusConfig = {
    ordered:   { label: '\u0E23\u0E2D\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19',   color: '#9E9E9E', icon: 'fa-clock' },
    confirmed: { label: '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21', color: '#2196F3', icon: 'fa-box' },
    shipped:   { label: '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E48\u0E07',    color: '#FF9800', icon: 'fa-truck' },
    delivered: { label: '\u0E2A\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27',     color: '#4CAF50', icon: 'fa-check-circle' },
    cancelled: { label: '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01',      color: '#E53935', icon: 'fa-times-circle' }
  };

  list.innerHTML = filtered.map(order => {
    const sc = statusConfig[order.status] || statusConfig.ordered;
    const itemsPreview = (order.items || []).slice(0, 3);
    const moreItems = (order.items || []).length > 3 ? `+${order.items.length - 3}` : '';

    return `
      <div class="order-card" onclick="openOrderDetail('${order.orderId}')">
        <div class="order-header">
          <div class="order-id">
            <i class="fas fa-receipt"></i>
            <span>${order.orderId}</span>
          </div>
          <span class="order-status" style="background:${sc.color}15;color:${sc.color}">
            <i class="fas ${sc.icon}"></i> ${sc.label}
          </span>
        </div>
        <div class="order-date"><i class="fas fa-calendar"></i> ${formatThaiDate(order.date || order.createdAt || '2026-03-10')}</div>
        <div class="order-items-preview">
          ${itemsPreview.map(item => `
            <div class="order-item-thumb">
              <img src="${item.image}" alt="${item.name}" loading="lazy"
                   onerror="this.style.display='none'">
            </div>
          `).join('')}
          ${moreItems ? `<div class="order-item-more">${moreItems}</div>` : ''}
          <div class="order-items-names">${itemsPreview.map(i => i.name).join(', ')}</div>
        </div>
        <div class="order-footer">
          <span class="order-total">\u0E23\u0E27\u0E21 \u0E3F${(order.total || 0).toLocaleString()}</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    `;
  }).join('');
}

function filterOrders(status, el) {
  document.querySelectorAll('.os-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  marketCurrentOrderFilter = status;
  renderOrders();
}

function openOrderDetail(orderId) {
  const order = marketOrders.find(o => o.orderId === orderId);
  if (!order) return;

  const statusConfig = {
    ordered:   { label: '\u0E23\u0E2D\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19',   color: '#9E9E9E', icon: 'fa-clock' },
    confirmed: { label: '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21', color: '#2196F3', icon: 'fa-box' },
    shipped:   { label: '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E48\u0E07',    color: '#FF9800', icon: 'fa-truck' },
    delivered: { label: '\u0E2A\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27',     color: '#4CAF50', icon: 'fa-check-circle' },
    cancelled: { label: '\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01',      color: '#E53935', icon: 'fa-times-circle' }
  };

  const allStatuses = ['ordered', 'confirmed', 'shipped', 'delivered'];
  const currentIndex = allStatuses.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  const timelineHtml = allStatuses.map((status, i) => {
    const sc = statusConfig[status];
    let stepClass = 'timeline-step';
    if (isCancelled) {
      stepClass += ' cancelled';
    } else if (i <= currentIndex) {
      stepClass += ' completed';
    } else {
      stepClass += ' pending';
    }

    return `
      <div class="${stepClass}">
        <div class="timeline-dot" style="background:${i <= currentIndex && !isCancelled ? sc.color : '#ddd'}">
          <i class="fas ${sc.icon}" style="color:${i <= currentIndex && !isCancelled ? '#fff' : '#999'}"></i>
        </div>
        ${i < allStatuses.length - 1 ? `<div class="timeline-line" style="background:${i < currentIndex && !isCancelled ? sc.color : '#ddd'}"></div>` : ''}
        <div class="timeline-label">${sc.label}</div>
      </div>
    `;
  }).join('');

  const itemsHtml = (order.items || []).map(item => `
    <div class="od-item">
      <img src="${item.image}" alt="${item.name}" loading="lazy"
           onerror="this.style.display='none'">
      <div class="od-item-info">
        <div class="od-item-name">${item.name}</div>
        <div class="od-item-meta">x${item.qty} \u00B7 \u0E3F${(item.price || 0).toLocaleString()}</div>
      </div>
      <div class="od-item-subtotal">\u0E3F${((item.price || 0) * (item.qty || 1)).toLocaleString()}</div>
    </div>
  `).join('');

  showModal(`
    <div class="modal-header">
      <h3>\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D</h3>
      <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>
    <div style="padding:16px 0">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:13px;color:var(--text-light, #999)">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D</div>
        <div style="font-size:20px;font-weight:800;color:var(--secondary, #3D2B1F)">${order.orderId}</div>
        <div style="font-size:12px;color:var(--text-secondary, #666);margin-top:4px">${formatThaiDate(order.date || order.createdAt || '2026-03-10')}</div>
      </div>

      <div style="margin-bottom:20px">
        <h4 style="font-size:14px;font-weight:600;margin-bottom:12px">\u0E2A\u0E16\u0E32\u0E19\u0E30</h4>
        <div class="order-timeline">${timelineHtml}</div>
      </div>

      <div style="margin-bottom:16px">
        <h4 style="font-size:14px;font-weight:600;margin-bottom:8px">\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</h4>
        ${itemsHtml}
      </div>

      ${order.address ? `
      <div style="margin-bottom:16px;padding:12px;background:var(--bg, #FFFBF0);border-radius:10px">
        <h4 style="font-size:13px;font-weight:600;margin-bottom:6px"><i class="fas fa-map-marker-alt"></i> \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E08\u0E31\u0E14\u0E2A\u0E48\u0E07</h4>
        <div style="font-size:13px;color:var(--text-secondary, #666);line-height:1.5">${order.address}</div>
      </div>` : ''}

      ${order.payment ? `
      <div style="margin-bottom:16px;padding:12px;background:var(--bg, #FFFBF0);border-radius:10px">
        <h4 style="font-size:13px;font-weight:600;margin-bottom:6px"><i class="fas fa-credit-card"></i> \u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19</h4>
        <div style="font-size:13px;color:var(--text-secondary, #666)">${order.payment}</div>
      </div>` : ''}

      ${order.tracking ? `
      <div style="margin-bottom:16px;padding:12px;background:var(--bg, #FFFBF0);border-radius:10px">
        <h4 style="font-size:13px;font-weight:600;margin-bottom:6px"><i class="fas fa-truck"></i> \u0E40\u0E25\u0E02\u0E1E\u0E31\u0E2A\u0E14\u0E38</h4>
        <div style="font-size:14px;font-weight:700;color:var(--primary, #FFC501);letter-spacing:1px">${order.tracking}</div>
      </div>` : ''}

      <div style="display:flex;justify-content:space-between;padding:12px;background:var(--bg, #FFFBF0);border-radius:10px;font-weight:700">
        <span>\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</span>
        <span style="color:var(--primary, #FFC501);font-size:18px">\u0E3F${(order.total || 0).toLocaleString()}</span>
      </div>
    </div>
  `);
}

// ===== CHECKOUT =====
function goCheckout() {
  closeCart();
  const cart = TailyStore.get('cart');
  if (!cart || !cart.length) {
    showToast('\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32\u0E27\u0E48\u0E32\u0E07');
    return;
  }
  checkoutStep = 1;
  selectedPayment = 'promptpay';
  renderCheckout();
  navigate('checkout');
}

function renderCheckout() {
  const container = document.getElementById('checkoutContent');
  if (!container) return;

  const cart = TailyStore.get('cart');
  const subtotal = TailyStore.getCartTotal();
  const shipping = cart.length > 0 ? 50 : 0;
  const total = subtotal + shipping;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  // Step indicators
  const stepsHtml = `
    <div class="checkout-steps">
      <div class="co-step ${checkoutStep >= 1 ? 'active' : ''}">
        <div class="co-step-num">${checkoutStep > 1 ? '<i class="fas fa-check" style="font-size:13px"></i>' : '1'}</div>
        <span>\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</span>
      </div>
      <div class="co-step-line ${checkoutStep >= 2 ? 'active' : ''}"></div>
      <div class="co-step ${checkoutStep >= 2 ? 'active' : ''}">
        <div class="co-step-num">${checkoutStep > 2 ? '<i class="fas fa-check" style="font-size:13px"></i>' : '2'}</div>
        <span>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</span>
      </div>
      <div class="co-step-line ${checkoutStep >= 3 ? 'active' : ''}"></div>
      <div class="co-step ${checkoutStep >= 3 ? 'active' : ''}">
        <div class="co-step-num">3</div>
        <span>\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19</span>
      </div>
    </div>
  `;

  let contentHtml = '';

  if (checkoutStep === 1) {
    // Step 1: Review cart items
    if (cart.length === 0) {
      contentHtml = `
        <div class="co-section">
          <div class="co-empty">
            <i class="fas fa-shopping-cart"></i>
            <p>ยังไม่มีสินค้าในตะกร้า</p>
            <button class="btn-primary" onclick="goBack('market')">เลือกซื้อสินค้า</button>
          </div>
        </div>
      `;
    } else {
    contentHtml = `
      <div class="co-section">
        <h3><i class="fas fa-shopping-cart"></i> \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</h3>
        <div class="co-items">
          ${cart.map(item => `
            <div class="co-item">
              <img src="${item.image}" alt="${item.name}" loading="lazy"
                   onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect fill=%22%23F0F0F0%22 width=%2264%22 height=%2264%22 rx=%228%22/><text x=%2232%22 y=%2236%22 text-anchor=%22middle%22 font-size=%2224%22>🛍️</text></svg>'">
              <div class="co-item-info">
                <div class="co-item-name">${item.name}</div>
                <div class="co-item-price">\u0E3F${item.price.toLocaleString()}</div>
              </div>
              <div class="co-item-qty">
                <button onclick="updateCheckoutQty(${item.productId}, -1)"><i class="fas fa-minus"></i></button>
                <span>${item.qty}</span>
                <button onclick="updateCheckoutQty(${item.productId}, 1)"><i class="fas fa-plus"></i></button>
              </div>
              <button class="co-item-delete" onclick="updateCheckoutQty(${item.productId}, -${item.qty})" title="\u0E25\u0E1A"><i class="fas fa-trash-alt"></i></button>
            </div>
          `).join('')}
        </div>
        <div class="co-summary">
          <div class="co-summary-row"><span>\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</span><span>\u0E3F${subtotal.toLocaleString()}</span></div>
          <div class="co-summary-row"><span>\u0E04\u0E48\u0E32\u0E08\u0E31\u0E14\u0E2A\u0E48\u0E07</span><span>\u0E3F${shipping}</span></div>
          <div class="co-summary-row total"><span>\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</span><span>\u0E3F${total.toLocaleString()}</span></div>
        </div>
      </div>
      <div class="co-fixed-bottom">
        <button class="btn-primary" onclick="checkoutStep=2;renderCheckout()">\u0E16\u0E31\u0E14\u0E44\u0E1B <i class="fas fa-arrow-right"></i></button>
      </div>
    `;
    }
  } else if (checkoutStep === 2) {
    // Step 2: Delivery address
    contentHtml = `
      <div class="co-section">
        <h3><i class="fas fa-map-marker-alt"></i> \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E08\u0E31\u0E14\u0E2A\u0E48\u0E07</h3>
        <div class="co-addresses">
          <div class="co-address selected" onclick="selectAddress(this)">
            <div class="co-address-radio"><i class="fas fa-check-circle"></i></div>
            <div class="co-address-info">
              <div class="co-address-label"><i class="fas fa-home"></i> \u0E1A\u0E49\u0E32\u0E19</div>
              <div class="co-address-name">\u0E2A\u0E21\u0E0A\u0E32\u0E22 \u0E23\u0E31\u0E01\u0E19\u0E49\u0E2D\u0E07\u0E2B\u0E21\u0E32</div>
              <div class="co-address-text">123/45 \u0E0B\u0E2D\u0E22\u0E2A\u0E38\u0E02\u0E38\u0E21\u0E27\u0E34\u0E17 39 \u0E41\u0E02\u0E27\u0E07\u0E04\u0E25\u0E2D\u0E07\u0E15\u0E31\u0E19\u0E40\u0E2B\u0E19\u0E37\u0E2D \u0E40\u0E02\u0E15\u0E27\u0E31\u0E12\u0E19\u0E32 \u0E01\u0E23\u0E38\u0E07\u0E40\u0E17\u0E1E\u0E21\u0E2B\u0E32\u0E19\u0E04\u0E23 10110</div>
              <div class="co-address-phone"><i class="fas fa-phone"></i> 081-234-5678</div>
            </div>
          </div>
          <div class="co-address" onclick="selectAddress(this)">
            <div class="co-address-radio"><i class="far fa-circle"></i></div>
            <div class="co-address-info">
              <div class="co-address-label"><i class="fas fa-building"></i> \u0E17\u0E35\u0E48\u0E17\u0E33\u0E07\u0E32\u0E19</div>
              <div class="co-address-name">\u0E2A\u0E21\u0E0A\u0E32\u0E22 \u0E23\u0E31\u0E01\u0E19\u0E49\u0E2D\u0E07\u0E2B\u0E21\u0E32</div>
              <div class="co-address-text">99 \u0E2D\u0E32\u0E04\u0E32\u0E23 Taily Tower \u0E0A\u0E31\u0E49\u0E19 15 \u0E16\u0E19\u0E19\u0E23\u0E31\u0E0A\u0E14\u0E32\u0E20\u0E34\u0E40\u0E29\u0E01 \u0E41\u0E02\u0E27\u0E07\u0E14\u0E34\u0E19\u0E41\u0E14\u0E07 \u0E40\u0E02\u0E15\u0E14\u0E34\u0E19\u0E41\u0E14\u0E07 \u0E01\u0E23\u0E38\u0E07\u0E40\u0E17\u0E1E\u0E21\u0E2B\u0E32\u0E19\u0E04\u0E23 10400</div>
              <div class="co-address-phone"><i class="fas fa-phone"></i> 02-123-4567</div>
            </div>
          </div>
        </div>
        <div class="co-fixed-bottom"><div class="co-nav-btns">
          <button class="btn-outline" onclick="checkoutStep=1;renderCheckout()"><i class="fas fa-arrow-left"></i> \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A</button>
          <button class="btn-primary" onclick="checkoutStep=3;renderCheckout()">\u0E16\u0E31\u0E14\u0E44\u0E1B <i class="fas fa-arrow-right"></i></button>
        </div></div>
      </div>
    `;
  } else if (checkoutStep === 3) {
    // Step 3: Payment method + confirm
    contentHtml = `
      <div class="co-section">
        <h3><i class="fas fa-credit-card"></i> \u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19</h3>
        <div class="co-payments">
          <div class="co-payment ${selectedPayment === 'promptpay' ? 'selected' : ''}" onclick="selectPayment('promptpay')">
            <div class="co-payment-radio"><i class="fas ${selectedPayment === 'promptpay' ? 'fa-check-circle' : 'fa-circle'}"></i></div>
            <div class="co-payment-icon" style="background:#1A237E;color:#fff"><i class="fas fa-qrcode"></i></div>
            <div class="co-payment-info">
              <div class="co-payment-name">PromptPay / QR Code</div>
              <div class="co-payment-desc">\u0E0A\u0E33\u0E23\u0E30\u0E1C\u0E48\u0E32\u0E19 QR Code \u0E17\u0E31\u0E19\u0E17\u0E35</div>
            </div>
          </div>
          <div class="co-payment ${selectedPayment === 'credit' ? 'selected' : ''}" onclick="selectPayment('credit')">
            <div class="co-payment-radio"><i class="fas ${selectedPayment === 'credit' ? 'fa-check-circle' : 'fa-circle'}"></i></div>
            <div class="co-payment-icon" style="background:#1565C0;color:#fff"><i class="fas fa-credit-card"></i></div>
            <div class="co-payment-info">
              <div class="co-payment-name">\u0E1A\u0E31\u0E15\u0E23\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15 / \u0E40\u0E14\u0E1A\u0E34\u0E15</div>
              <div class="co-payment-desc">Visa, Mastercard, JCB</div>
            </div>
          </div>
          <div class="co-payment ${selectedPayment === 'cod' ? 'selected' : ''}" onclick="selectPayment('cod')">
            <div class="co-payment-radio"><i class="fas ${selectedPayment === 'cod' ? 'fa-check-circle' : 'fa-circle'}"></i></div>
            <div class="co-payment-icon" style="background:#2E7D32;color:#fff"><i class="fas fa-money-bill-wave"></i></div>
            <div class="co-payment-info">
              <div class="co-payment-name">\u0E40\u0E01\u0E47\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 (COD)</div>
              <div class="co-payment-desc">\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</div>
            </div>
          </div>
        </div>
      </div>

      <div class="co-section">
        <h3><i class="fas fa-receipt"></i> \u0E2A\u0E23\u0E38\u0E1B\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D</h3>
        <div class="co-summary">
          <div class="co-summary-row"><span>\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 (${totalItems} \u0E0A\u0E34\u0E49\u0E19)</span><span>\u0E3F${subtotal.toLocaleString()}</span></div>
          <div class="co-summary-row"><span>\u0E04\u0E48\u0E32\u0E08\u0E31\u0E14\u0E2A\u0E48\u0E07</span><span>\u0E3F${shipping}</span></div>
          <div class="co-summary-row total"><span>\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</span><span>\u0E3F${total.toLocaleString()}</span></div>
        </div>
      </div>

      <div class="co-fixed-bottom"><div class="co-nav-btns">
          <button class="btn-outline" onclick="checkoutStep=2;renderCheckout()"><i class="fas fa-arrow-left"></i> \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A</button>
          <button class="btn-primary" onclick="placeOrder()" id="placeOrderBtn">
            <i class="fas fa-check-circle"></i> \u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D
          </button>
        </div></div>
    `;
  }

  container.innerHTML = `
    <div class="checkout-page">
      <div class="checkout-header">
        <button class="back-btn" onclick="goBack('market')" style="position:static"><i class="fas fa-chevron-left"></i></button>
        <h2>\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</h2>
      </div>
      ${stepsHtml}
      ${contentHtml}
    </div>
  `;
}

function selectAddress(el) {
  document.querySelectorAll('.co-address').forEach(a => {
    a.classList.remove('selected');
    a.querySelector('.co-address-radio i').className = 'far fa-circle';
  });
  el.classList.add('selected');
  el.querySelector('.co-address-radio i').className = 'fas fa-check-circle';
}

function selectPayment(method) {
  selectedPayment = method;
  renderCheckout();
}

function updateCheckoutQty(productId, delta) {
  const cart = TailyStore.get('cart');
  const item = cart.find(i => i.productId === productId);
  if (!item) return;

  const newQty = item.qty + delta;
  if (newQty <= 0) {
    TailyStore.removeFromCart(productId);
  } else {
    TailyStore.updateCartQty(productId, newQty);
  }

  // If cart is now empty, go back to market
  if (!TailyStore.get('cart').length) {
    showToast('\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32\u0E27\u0E48\u0E32\u0E07');
    goBack('market');
    return;
  }

  renderCheckout();
}

async function placeOrder() {
  const btn = document.getElementById('placeOrderBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D...';
  }

  const cart = TailyStore.get('cart');
  const selectedAddr = document.querySelector('.co-address.selected .co-address-text');
  const address = selectedAddr ? selectedAddr.textContent : '\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19';

  const paymentLabels = {
    promptpay: 'PromptPay / QR Code',
    credit: '\u0E1A\u0E31\u0E15\u0E23\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15 / \u0E40\u0E14\u0E1A\u0E34\u0E15',
    cod: '\u0E40\u0E01\u0E47\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07'
  };

  const result = await MockAPI.placeOrder(cart, address, paymentLabels[selectedPayment]);

  if (result.success) {
    // Clear cart
    TailyStore.set('cart', []);
    TailyStore.set('cartCount', 0);

    // Add order to local orders list
    marketOrders.unshift({
      orderId: result.orderId,
      date: new Date().toISOString(),
      status: 'ordered',
      items: cart.map(item => ({
        name: item.name,
        image: item.image,
        price: item.price,
        qty: item.qty
      })),
      total: result.total,
      address: address,
      payment: paymentLabels[selectedPayment],
      tracking: null
    });

    // Show success modal
    showModal(`
      <div style="text-align:center;padding:30px 20px">
        <div style="width:80px;height:80px;margin:0 auto 20px;background:var(--primary, #FFC501);border-radius:50%;display:flex;align-items:center;justify-content:center">
          <i class="fas fa-check" style="font-size:36px;color:#3D2B1F"></i>
        </div>
        <h2 style="font-size:22px;margin-bottom:8px">\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08!</h2>
        <p style="color:var(--text-secondary, #666);margin-bottom:20px">\u0E02\u0E2D\u0E1A\u0E04\u0E38\u0E13\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 Taily Market</p>
        <div style="background:var(--bg, #FFFBF0);border-radius:12px;padding:16px;margin-bottom:20px">
          <div style="font-size:12px;color:var(--text-light, #999)">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary, #FFC501);letter-spacing:2px;margin:4px 0">${result.orderId}</div>
          <div style="font-size:13px;color:var(--text-secondary, #666);margin-top:8px">
            <i class="fas fa-truck"></i> \u0E08\u0E31\u0E14\u0E2A\u0E48\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19 ${result.estimatedDelivery}
          </div>
        </div>
        <button class="btn-primary" style="width:100%;padding:14px;margin-bottom:10px" onclick="closeModal();showMarketTab('orders');renderOrders()">
          <i class="fas fa-box"></i> \u0E14\u0E39\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D
        </button>
        <button class="btn-outline" style="width:100%;padding:14px" onclick="closeModal();goBack('market');navigate('home')">
          <i class="fas fa-home"></i> \u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01
        </button>
      </div>
    `);
  } else {
    showToast('\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check-circle"></i> \u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D';
    }
  }
}
