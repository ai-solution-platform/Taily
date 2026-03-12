/* ========== TAILY EXPLORE — Map, Merchants & Events v2.0 ========== */

let merchants = [];
let events = [];
let map, markerCluster, markers = [];
let userLocation = null;
let currentFilters = { category: 'all', region: 'all', province: 'all', price: 'all', search: '' };
let currentEventFilter = 'all';
let currentEventView = 'list';
let calendarDate = new Date(2026, 0, 1);
let sheetState = 'peek';
let currentListView = 'list';

// ===== INIT EXPLORE =====
async function initExplore() {
  const [merchantData, eventData] = await Promise.all([
    MockAPI.getMerchants(),
    MockAPI.getEvents()
  ]);
  merchants = merchantData;
  events = eventData;

  // Populate province dropdown from unique merchant provinces
  const provinces = [...new Set(merchants.map(m => m.province))].sort();
  const sel = document.getElementById('provinceFilter');
  if (sel) {
    sel.innerHTML = '<option value="all">\u0E17\u0E38\u0E01\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14</option>';
    provinces.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      sel.appendChild(opt);
    });
  }

  initMap();
  initBottomSheet();
  renderMerchantList();
  renderEvents();

  // Update initial count display
  const mapCountEl = document.getElementById('mapCount');
  const filterCountEl = document.getElementById('filterCount');
  if (mapCountEl) mapCountEl.textContent = `${merchants.length.toLocaleString()} \u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48`;
  if (filterCountEl) filterCountEl.textContent = merchants.length.toLocaleString();
}

// ===== EXPLORE SUB-TABS =====
function showExploreTab(tab) {
  document.querySelectorAll('.explore-sub').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.explore-tab').forEach(t => t.classList.remove('active'));

  const sub = document.getElementById(`explore-${tab}`);
  if (sub) sub.classList.add('active');

  const tabBtns = document.querySelectorAll('.explore-tab');
  tabBtns.forEach(t => {
    if ((tab === 'map' && t.textContent.includes('\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48')) ||
        (tab === 'events' && t.textContent.includes('\u0E01\u0E34\u0E08\u0E01\u0E23\u0E23\u0E21'))) {
      t.classList.add('active');
    }
  });

  if (tab === 'map' && map) {
    setTimeout(() => map.invalidateSize(), 200);
  }
}

// ===== MAP INITIALIZATION =====
function initMap() {
  map = L.map('map', {
    center: [13.7563, 100.5018],
    zoom: 6,
    zoomControl: false,
    attributionControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  markerCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      let size = count < 20 ? 'small' : count < 100 ? 'medium' : 'large';
      return L.divIcon({
        html: '<div>' + count + '</div>',
        className: 'marker-cluster marker-cluster-' + size,
        iconSize: [40, 40]
      });
    }
  });

  addMarkers(merchants);
  map.addLayer(markerCluster);
}

// ===== CATEGORY ICON HELPER =====
function getCategoryIcon(cat) {
  switch(cat) {
    case '\u0E23\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23':
      return { icon: 'fa-utensils', cls: 'marker-restaurant', cardCls: 'cat-restaurant', emoji: '\uD83C\uDF7D\uFE0F' };
    case '\u0E04\u0E32\u0E40\u0E1F\u0E48':
      return { icon: 'fa-mug-hot', cls: 'marker-cafe', cardCls: 'cat-cafe', emoji: '\u2615' };
    case '\u0E42\u0E23\u0E07\u0E41\u0E23\u0E21':
      return { icon: 'fa-bed', cls: 'marker-hotel', cardCls: 'cat-hotel', emoji: '\uD83C\uDFE8' };
    case '\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E48\u0E2D\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E27':
      return { icon: 'fa-mountain-sun', cls: 'marker-tourist', cardCls: 'cat-tourist', emoji: '\uD83C\uDF3F' };
    default:
      return { icon: 'fa-paw', cls: 'marker-restaurant', cardCls: '', emoji: '\uD83D\uDC3E' };
  }
}

// ===== ADD MARKERS TO MAP =====
function addMarkers(data) {
  markerCluster.clearLayers();
  markers = [];

  data.forEach(m => {
    const cat = getCategoryIcon(m.category);
    const icon = L.divIcon({
      html: `<div class="custom-marker ${cat.cls}"><i class="fas ${cat.icon}"></i></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      className: ''
    });
    const marker = L.marker([m.lat, m.lng], { icon });
    marker.merchantId = m.id;

    const promoHtml = m.promotion && m.promotion !== '\u0E44\u0E21\u0E48\u0E21\u0E35'
      ? `<div class="popup-promo"><i class="fas fa-gift"></i>${m.promotion}</div>` : '';

    marker.bindPopup(`
      <div class="map-popup">
        <div class="popup-header ${cat.cardCls}">${cat.emoji}</div>
        <div class="popup-body">
          <span class="popup-category">${m.category}</span>
          <div class="popup-name">${m.name}</div>
          <div class="popup-desc">${m.description}</div>
          <div class="popup-meta">
            <span class="card-rating"><i class="fas fa-star"></i> ${m.rating}</span>
            <span>${m.reviews} \u0E23\u0E35\u0E27\u0E34\u0E27</span>
            <span>${m.priceLevel}</span>
          </div>
          <div class="popup-meta"><span><i class="fas fa-clock"></i> ${m.hours}</span></div>
          <div class="popup-meta"><span><i class="fas fa-phone"></i> ${m.phone}</span></div>
          ${promoHtml}
          <div class="popup-actions">
            <button class="popup-btn popup-btn-primary" onclick="openMerchant(${m.id})"><i class="fas fa-store"></i> \u0E14\u0E39\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32</button>
            <button class="popup-btn popup-btn-outline" onclick="openNavigation('${m.mapLink}')"><i class="fas fa-diamond-turn-right"></i> \u0E19\u0E33\u0E17\u0E32\u0E07</button>
          </div>
        </div>
      </div>
    `, { maxWidth: 300, minWidth: 280, closeButton: true });

    markers.push(marker);
    markerCluster.addLayer(marker);
  });
}

// ===== OPEN NAVIGATION =====
function openNavigation(link) {
  if (link && link !== '#') {
    window.open(link, '_blank');
  } else {
    showToast('\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48');
  }
}

// ===== FILTER PANEL =====
function toggleFilters() {
  const panel = document.getElementById('filterPanel');
  const btn = document.querySelector('.filter-toggle-btn');
  if (panel) panel.classList.toggle('active');
  if (btn) btn.classList.toggle('active');
}

function setFilter(type, el) {
  const parent = el.parentElement;
  parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentFilters[type] = el.dataset.val;
  filterMerchants();
}

function resetFilters() {
  currentFilters = { category: 'all', region: 'all', province: 'all', price: 'all', search: '' };
  document.getElementById('mapSearch').value = '';
  document.getElementById('provinceFilter').value = 'all';
  document.querySelectorAll('.filter-chips .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.val === 'all');
  });
  filterMerchants();
}

function filterMerchants() {
  currentFilters.search = document.getElementById('mapSearch').value.toLowerCase();
  currentFilters.province = document.getElementById('provinceFilter').value;

  const clearBtn = document.querySelector('.search-clear');
  if (clearBtn) clearBtn.style.display = currentFilters.search ? 'block' : 'none';

  const filtered = merchants.filter(m => {
    if (currentFilters.category !== 'all' && m.category !== currentFilters.category) return false;
    if (currentFilters.region !== 'all' && m.region !== currentFilters.region) return false;
    if (currentFilters.province !== 'all' && m.province !== currentFilters.province) return false;
    if (currentFilters.price !== 'all' && m.priceLevel !== currentFilters.price) return false;
    if (currentFilters.search) {
      const s = currentFilters.search;
      if (!m.name.toLowerCase().includes(s) &&
          !m.description.toLowerCase().includes(s) &&
          !m.province.includes(s) &&
          !m.services.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  addMarkers(filtered);
  renderMerchantList(filtered);

  const mapCountEl = document.getElementById('mapCount');
  const filterCountEl = document.getElementById('filterCount');
  if (mapCountEl) mapCountEl.textContent = `${filtered.length.toLocaleString()} \u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48`;
  if (filterCountEl) filterCountEl.textContent = filtered.length.toLocaleString();

  // Fit bounds only if results are manageable
  if (filtered.length > 0 && filtered.length <= 50) {
    const bounds = L.latLngBounds(filtered.map(m => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }
}

function clearSearch() {
  document.getElementById('mapSearch').value = '';
  filterMerchants();
}

function quickSearch(query) {
  document.getElementById('mapSearch').value = query;
  filterMerchants();
}

// ===== FIND NEARBY =====
function findNearby() {
  const btn = document.getElementById('nearbyBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2B\u0E32...</span>';

  if (!navigator.geolocation) {
    if (btn) btn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span>\u0E43\u0E01\u0E25\u0E49\u0E09\u0E31\u0E19</span>';
    showToast('\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A Geolocation');
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    map.setView([userLocation.lat, userLocation.lng], 13);

    // Add blue user location marker
    const userIcon = L.divIcon({
      html: '<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(66,133,244,0.3)"></div>',
      iconSize: [16, 16],
      className: ''
    });
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup('\u0E04\u0E38\u0E13\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48');

    // Sort by distance and show closest 50
    const sorted = merchants.map(m => {
      m._dist = getDistance(userLocation.lat, userLocation.lng, m.lat, m.lng);
      return m;
    }).sort((a, b) => a._dist - b._dist).slice(0, 50);

    addMarkers(sorted);
    renderMerchantList(sorted);
    setSheetState('half');

    if (btn) btn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span>\u0E43\u0E01\u0E25\u0E49\u0E09\u0E31\u0E19</span>';
    showToast('\u0E41\u0E2A\u0E14\u0E07 50 \u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E43\u0E01\u0E25\u0E49\u0E04\u0E38\u0E13');
  }, () => {
    if (btn) btn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span>\u0E43\u0E01\u0E25\u0E49\u0E09\u0E31\u0E19</span>';
    showToast('\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E44\u0E14\u0E49');
  });
}

// ===== HAVERSINE DISTANCE =====
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===== MERCHANT LIST =====
function renderMerchantList(data) {
  const list = document.getElementById('merchantList');
  if (!list) return;

  const items = data || merchants;
  const show = items.slice(0, 50);

  if (show.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-map-marker-alt"></i><h4>\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48</h4><p>\u0E25\u0E2D\u0E07\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E14\u0E39</p></div>';
    return;
  }

  list.innerHTML = show.map(m => {
    const cat = getCategoryIcon(m.category);
    const dist = m._dist
      ? `<span class="card-province">${m._dist.toFixed(1)} km</span>`
      : `<span class="card-province">${m.province}</span>`;
    return `
      <div class="merchant-card" onclick="openMerchant(${m.id})">
        <div class="card-img ${cat.cardCls}">${cat.emoji}</div>
        <div class="card-body">
          <span class="card-category">${m.category}</span>
          <div class="card-name">${m.name}</div>
          <div class="card-desc">${m.description}</div>
          <div class="card-meta">
            <span class="card-rating"><i class="fas fa-star"></i> ${m.rating}</span>
            <span class="card-price">${m.priceLevel}</span>
            ${dist}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (show.length < items.length) {
    list.innerHTML += `<div class="empty-state" style="padding:12px"><p>\u0E41\u0E2A\u0E14\u0E07 ${show.length} \u0E08\u0E32\u0E01 ${items.length} \u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48 | \u0E43\u0E0A\u0E49\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E08\u0E33\u0E01\u0E31\u0E14\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C</p></div>`;
  }
}

function setListView(view, el) {
  const list = document.getElementById('merchantList');
  if (!list) return;
  if (el) {
    el.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  }
  currentListView = view;
  list.classList.toggle('grid-view', view === 'grid');
}

// ===== MERCHANT DETAIL =====
function openMerchant(id) {
  const m = merchants.find(x => x.id === id);
  if (!m) return;
  if (map) map.closePopup();

  const cat = getCategoryIcon(m.category);
  const services = m.services.split(/[,\u3001]/).map(s => s.trim()).filter(Boolean);
  const hasPromo = m.promotion && m.promotion !== '\u0E44\u0E21\u0E48\u0E21\u0E35';
  const isFav = TailyStore.get('favorites').has(id);
  const stars = '\u2605'.repeat(Math.floor(m.rating)) + '\u2606'.repeat(5 - Math.floor(m.rating));

  // Category gradient backgrounds
  const gradients = {
    '\u0E23\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23': 'linear-gradient(135deg, #E53935 0%, #FF7043 100%)',
    '\u0E04\u0E32\u0E40\u0E1F\u0E48': 'linear-gradient(135deg, #6D4C41 0%, #A1887F 100%)',
    '\u0E42\u0E23\u0E07\u0E41\u0E23\u0E21': 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
    '\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E48\u0E2D\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E27': 'linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%)'
  };
  const heroGradient = gradients[m.category] || 'linear-gradient(135deg, #FFC501 0%, #FF8C42 100%)';

  document.getElementById('merchantDetail').innerHTML = `
    <div class="merchant-detail-page">
      <div class="merchant-hero ${cat.cardCls}" style="background:${heroGradient};position:relative;height:200px;display:flex;align-items:center;justify-content:center;border-radius:0 0 24px 24px">
        <span class="hero-icon" style="font-size:72px;opacity:0.9">${cat.emoji}</span>
        <button class="back-btn" onclick="goBack('explore')" style="position:absolute;top:16px;left:16px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.9);border:none;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#333;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="share-btn" onclick="shareMerchant(${m.id})" style="position:absolute;top:16px;right:16px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.9);border:none;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#333;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
          <i class="fas fa-share-alt"></i>
        </button>
      </div>

      <div class="merchant-info" style="padding:20px 16px">
        <span class="mi-category" style="display:inline-block;background:${m.category==='\u0E23\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23'?'rgba(229,57,53,0.1)':m.category==='\u0E04\u0E32\u0E40\u0E1F\u0E48'?'rgba(109,76,65,0.1)':m.category==='\u0E42\u0E23\u0E07\u0E41\u0E23\u0E21'?'rgba(21,101,192,0.1)':'rgba(46,125,50,0.1)'};color:${m.category==='\u0E23\u0E49\u0E32\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23'?'#E53935':m.category==='\u0E04\u0E32\u0E40\u0E1F\u0E48'?'#6D4C41':m.category==='\u0E42\u0E23\u0E07\u0E41\u0E23\u0E21'?'#1565C0':'#2E7D32'};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:8px">${m.category}</span>
        <h1 class="mi-name" style="font-size:22px;font-weight:700;margin:8px 0 4px;color:var(--text-primary)">${m.name}</h1>
        <p class="mi-province" style="font-size:13px;color:var(--text-secondary);margin-bottom:10px"><i class="fas fa-map-marker-alt" style="color:var(--accent)"></i> ${m.province} | ${m.region}</p>

        <div class="mi-rating" style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
          <span class="stars" style="color:#FFC501;font-size:16px;letter-spacing:1px">${stars}</span>
          <span class="rating-text" style="font-weight:700;font-size:15px;color:var(--text-primary)">${m.rating}</span>
          <span class="reviews" style="font-size:13px;color:var(--text-secondary)">(${m.reviews} \u0E23\u0E35\u0E27\u0E34\u0E27)</span>
          <span style="font-size:13px;color:var(--text-secondary);margin-left:4px">${m.priceLevel}</span>
        </div>

        <p class="mi-desc" style="font-size:14px;line-height:1.7;color:var(--text-secondary);margin-bottom:16px">${m.description}</p>

        <div class="merchant-actions" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px">
          <button class="action-btn" onclick="window.open('tel:${m.phone}')" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 4px;border:1px solid var(--border);border-radius:12px;background:white;cursor:pointer;font-size:11px;color:var(--text-secondary)">
            <i class="fas fa-phone" style="font-size:18px;color:#4CAF50"></i><span>\u0E42\u0E17\u0E23</span>
          </button>
          <button class="action-btn" onclick="openNavigation('${m.mapLink}')" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 4px;border:1px solid var(--border);border-radius:12px;background:white;cursor:pointer;font-size:11px;color:var(--text-secondary)">
            <i class="fas fa-diamond-turn-right" style="font-size:18px;color:#2196F3"></i><span>\u0E19\u0E33\u0E17\u0E32\u0E07</span>
          </button>
          <button class="action-btn" onclick="shareMerchant(${m.id})" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 4px;border:1px solid var(--border);border-radius:12px;background:white;cursor:pointer;font-size:11px;color:var(--text-secondary)">
            <i class="fas fa-share-alt" style="font-size:18px;color:#FF9800"></i><span>\u0E41\u0E0A\u0E23\u0E4C</span>
          </button>
          <button class="action-btn" id="favBtn-${m.id}" onclick="saveFavorite(${m.id})" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 4px;border:1px solid var(--border);border-radius:12px;background:white;cursor:pointer;font-size:11px;color:var(--text-secondary)">
            <i class="fas fa-heart" style="font-size:18px;color:${isFav ? '#E91E63' : '#ccc'}"></i><span>${isFav ? '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27' : '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01'}</span>
          </button>
        </div>
      </div>

      ${hasPromo ? `
      <div class="merchant-section" style="padding:0 16px 16px">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px"><i class="fas fa-gift" style="color:var(--accent)"></i> \u0E42\u0E1B\u0E23\u0E42\u0E21\u0E0A\u0E31\u0E48\u0E19\u0E1E\u0E34\u0E40\u0E28\u0E29</h3>
        <div class="promo-card" style="background:linear-gradient(135deg,#FFF9E6,#FFF3CC);border:1.5px solid #FFC501;border-radius:16px;padding:16px;position:relative;overflow:hidden">
          <div class="promo-badge" style="position:absolute;top:0;right:0;background:var(--primary);color:var(--primary-on);padding:4px 12px;border-radius:0 0 0 12px;font-size:11px;font-weight:700">\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E1E\u0E34\u0E40\u0E28\u0E29</div>
          <div class="promo-text" style="font-size:14px;font-weight:500;line-height:1.6;color:var(--text-primary);padding-right:60px">${m.promotion}</div>
          <button class="promo-btn" onclick="collectCoupon(${m.id})" style="margin-top:12px;background:var(--primary);color:var(--primary-on);border:none;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">
            <i class="fas fa-ticket-alt"></i> \u0E40\u0E01\u0E47\u0E1A\u0E04\u0E39\u0E1B\u0E2D\u0E07
          </button>
        </div>
      </div>` : ''}

      <div class="merchant-section" style="padding:0 16px 16px">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px"><i class="fas fa-concierge-bell" style="color:var(--accent)"></i> \u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 & \u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23</h3>
        <div class="service-tags" style="display:flex;flex-wrap:wrap;gap:8px">
          ${services.map(s => `<span class="service-tag" style="background:var(--bg);border:1px solid var(--border);padding:6px 14px;border-radius:20px;font-size:13px;color:var(--text-secondary)">${s}</span>`).join('')}
        </div>
      </div>

      <div class="merchant-section" style="padding:0 16px 16px">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px"><i class="fas fa-info-circle" style="color:var(--accent)"></i> \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B</h3>
        <div class="info-rows" style="display:flex;flex-direction:column;gap:12px">
          <div class="info-row" style="display:flex;align-items:flex-start;gap:12px">
            <i class="fas fa-clock" style="color:var(--primary);margin-top:2px;width:18px;text-align:center"></i>
            <div><div class="info-label" style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">\u0E40\u0E27\u0E25\u0E32\u0E40\u0E1B\u0E34\u0E14-\u0E1B\u0E34\u0E14</div><div class="info-value" style="font-size:14px;color:var(--text-primary);font-weight:500">${m.hours}</div></div>
          </div>
          <div class="info-row" style="display:flex;align-items:flex-start;gap:12px">
            <i class="fas fa-phone" style="color:var(--primary);margin-top:2px;width:18px;text-align:center"></i>
            <div><div class="info-label" style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C</div><div class="info-value" style="font-size:14px;color:var(--text-primary);font-weight:500">${m.phone}</div></div>
          </div>
          <div class="info-row" style="display:flex;align-items:flex-start;gap:12px">
            <i class="fas fa-map-marker-alt" style="color:var(--primary);margin-top:2px;width:18px;text-align:center"></i>
            <div>
              <div class="info-label" style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</div>
              <div class="info-value" style="font-size:14px;color:var(--text-primary);font-weight:500">${m.province}, ${m.region}</div>
              <button onclick="openNavigation('${m.mapLink}')" style="margin-top:4px;color:var(--accent);background:none;border:none;font-size:13px;cursor:pointer;padding:0;font-weight:500"><i class="fas fa-directions"></i> \u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48</button>
            </div>
          </div>
          <div class="info-row" style="display:flex;align-items:flex-start;gap:12px">
            <i class="fas fa-dollar-sign" style="color:var(--primary);margin-top:2px;width:18px;text-align:center"></i>
            <div><div class="info-label" style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E23\u0E32\u0E04\u0E32</div><div class="info-value" style="font-size:14px;color:var(--text-primary);font-weight:500">${m.priceLevel}</div></div>
          </div>
          <div class="info-row" style="display:flex;align-items:flex-start;gap:12px">
            <i class="fas fa-hashtag" style="color:var(--primary);margin-top:2px;width:18px;text-align:center"></i>
            <div><div class="info-label" style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">Social Media</div><div class="info-value" style="font-size:14px;color:var(--text-primary);font-weight:500">${m.social || '-'}</div></div>
          </div>
        </div>
      </div>

      <div class="merchant-section" style="padding:0 16px 16px">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px"><i class="fas fa-paw" style="color:var(--accent)"></i> \u0E19\u0E42\u0E22\u0E1A\u0E32\u0E22 Pet-Friendly</h3>
        <div class="pet-badge" style="display:inline-flex;align-items:center;gap:6px;background:#E8F5E9;color:#2E7D32;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:8px">
          <i class="fas fa-check-circle"></i> Pet-Friendly
        </div>
        <p style="margin-top:8px;font-size:14px;color:var(--text-secondary);line-height:1.7">${m.petCondition}</p>
      </div>

      <div class="merchant-section" style="padding:0 16px 24px;text-align:center">
        <button class="btn-primary" onclick="openNavigation('${m.mapLink}')" style="width:100%;padding:14px;font-size:15px;border-radius:14px;border:none;background:var(--primary);color:var(--primary-on);font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
          <i class="fas fa-diamond-turn-right"></i> \u0E19\u0E33\u0E17\u0E32\u0E07\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48
        </button>
      </div>
    </div>
  `;

  // Navigate to merchant detail page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-merchant').classList.add('active');
}

// ===== COLLECT COUPON =====
function collectCoupon(merchantId) {
  const m = merchants.find(x => x.id === merchantId);
  if (!m) return;
  showToast('\u0E40\u0E01\u0E47\u0E1A\u0E04\u0E39\u0E1B\u0E2D\u0E07\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08!');
}

// ===== SAVE FAVORITE =====
function saveFavorite(id) {
  const added = TailyStore.toggleFavorite(id);
  const favBtn = document.getElementById(`favBtn-${id}`);
  if (favBtn) {
    const icon = favBtn.querySelector('i');
    const label = favBtn.querySelector('span');
    if (icon) icon.style.color = added ? '#E91E63' : '#ccc';
    if (label) label.textContent = added ? '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27' : '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01';
  }
  showToast(added ? '\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E42\u0E1B\u0E23\u0E14\u0E41\u0E25\u0E49\u0E27' : '\u0E25\u0E1A\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E42\u0E1B\u0E23\u0E14');
}

// ===== SHARE MERCHANT =====
function shareMerchant(id) {
  showToast('\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E41\u0E25\u0E49\u0E27');
}

// ===== BOTTOM SHEET =====
function initBottomSheet() {
  const handle = document.getElementById('sheetHandle');
  if (!handle) return;

  let startY = 0;

  handle.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    document.getElementById('bottomSheet').style.transition = 'none';
  }, { passive: true });

  handle.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });

  handle.addEventListener('touchend', (e) => {
    const endY = e.changedTouches[0].clientY;
    const diff = startY - endY;
    document.getElementById('bottomSheet').style.transition = '';

    if (Math.abs(diff) < 15) {
      cycleSheet();
      return;
    }

    if (diff > 30) {
      // Swipe up
      if (sheetState === 'peek') setSheetState('half');
      else if (sheetState === 'half') setSheetState('full');
    } else if (diff < -30) {
      // Swipe down
      if (sheetState === 'full') setSheetState('half');
      else if (sheetState === 'half') setSheetState('peek');
    }
  }, { passive: true });

  handle.addEventListener('click', (e) => {
    if (e.target.closest('.sheet-close-btn')) return;
    cycleSheet();
  });

  // Set initial state
  setSheetState('peek');
}

function setSheetState(state) {
  const sheet = document.getElementById('bottomSheet');
  if (!sheet) return;
  sheet.classList.remove('peek', 'half', 'full');
  sheet.classList.add(state);
  sheetState = state;
  if (map) setTimeout(() => map.invalidateSize(), 350);
}

function cycleSheet() {
  if (sheetState === 'peek') setSheetState('half');
  else if (sheetState === 'half') setSheetState('full');
  else setSheetState('peek');
}

// ===== EVENTS =====
function renderEvents() {
  if (currentEventView === 'list') renderEventsList();
  else if (currentEventView === 'gallery') renderEventsGallery();
  else renderEventsCalendar();
}

function filterEvents() {
  renderEvents();
}

function setEventFilter(el) {
  el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentEventFilter = el.dataset.val;
  renderEvents();
}

function setEventView(view, el) {
  el.parentElement.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentEventView = view;
  renderEvents();
}

function getFilteredEvents() {
  const searchEl = document.getElementById('eventSearch');
  const search = searchEl ? searchEl.value.toLowerCase() : '';
  return events.filter(e => {
    if (currentEventFilter !== 'all' && e.category !== currentEventFilter) return false;
    if (search && !e.title.toLowerCase().includes(search) &&
        !e.titleTh.includes(search) && !e.location.includes(search)) return false;
    return true;
  });
}

// ===== EVENTS LIST VIEW =====
function renderEventsList() {
  const filtered = getFilteredEvents();
  const container = document.getElementById('eventsContent');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-xmark"></i><h4>\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E01\u0E34\u0E08\u0E01\u0E23\u0E23\u0E21</h4><p>\u0E25\u0E2D\u0E07\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E14\u0E39</p></div>';
    return;
  }

  const thaiMonth = ['\u0E21.\u0E04.','\u0E01.\u0E1E.','\u0E21\u0E35.\u0E04.','\u0E40\u0E21.\u0E22.','\u0E1E.\u0E04.','\u0E21\u0E34.\u0E22.','\u0E01.\u0E04.','\u0E2A.\u0E04.','\u0E01.\u0E22.','\u0E15.\u0E04.','\u0E1E.\u0E22.','\u0E18.\u0E04.'];

  container.innerHTML = filtered.map(e => {
    const date = new Date(e.date);
    const dateStr = `${date.getDate()} ${thaiMonth[date.getMonth()]} ${date.getFullYear() + 543}`;
    const pct = Math.round((e.registered / e.capacity) * 100);
    const full = pct >= 100;
    return `
      <div class="event-card-list" onclick="openEvent(${e.id})">
        <div class="event-img"><img src="${e.image}" alt="${e.title}" onerror="this.style.display='none'"></div>
        <div class="event-body">
          <span class="event-date-badge"><i class="fas fa-calendar"></i> ${dateStr}</span>
          <div class="event-title">${e.titleTh}</div>
          <div class="event-loc"><i class="fas fa-map-marker-alt"></i> ${e.location}</div>
          <div class="event-bottom">
            <span class="event-price">${e.price}</span>
            <span class="event-capacity">
              ${full ? '\u0E40\u0E15\u0E47\u0E21' : `${e.registered}/${e.capacity}`}
              <span class="capacity-bar"><span class="fill" style="width:${Math.min(pct,100)}%;background:${full?'var(--danger)':'var(--primary)'}"></span></span>
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== EVENTS GALLERY VIEW =====
function renderEventsGallery() {
  const filtered = getFilteredEvents();
  const container = document.getElementById('eventsContent');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-xmark"></i><h4>\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E01\u0E34\u0E08\u0E01\u0E23\u0E23\u0E21</h4><p>\u0E25\u0E2D\u0E07\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E14\u0E39</p></div>';
    return;
  }

  const thaiMonth = ['\u0E21.\u0E04.','\u0E01.\u0E1E.','\u0E21\u0E35.\u0E04.','\u0E40\u0E21.\u0E22.','\u0E1E.\u0E04.','\u0E21\u0E34.\u0E22.','\u0E01.\u0E04.','\u0E2A.\u0E04.','\u0E01.\u0E22.','\u0E15.\u0E04.','\u0E1E.\u0E22.','\u0E18.\u0E04.'];

  container.innerHTML = `<div class="events-gallery">${filtered.map(e => {
    const date = new Date(e.date);
    return `
      <div class="event-card-gallery" onclick="openEvent(${e.id})">
        <div class="gallery-img"><img src="${e.image}" alt="${e.title}" onerror="this.style.display='none'"></div>
        <div class="gallery-body">
          <span class="event-date-badge"><i class="fas fa-calendar"></i> ${date.getDate()} ${thaiMonth[date.getMonth()]}</span>
          <div class="gallery-title">${e.titleTh}</div>
          <div class="gallery-meta">${e.price} \u00B7 ${e.location.split(' ')[0]}</div>
        </div>
      </div>
    `;
  }).join('')}</div>`;
}

// ===== EVENTS CALENDAR VIEW =====
function renderEventsCalendar() {
  const container = document.getElementById('eventsContent');
  if (!container) return;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const thaiMonths = ['\u0E21\u0E01\u0E23\u0E32\u0E04\u0E21','\u0E01\u0E38\u0E21\u0E20\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E4C','\u0E21\u0E35\u0E19\u0E32\u0E04\u0E21','\u0E40\u0E21\u0E29\u0E32\u0E22\u0E19','\u0E1E\u0E24\u0E29\u0E20\u0E32\u0E04\u0E21','\u0E21\u0E34\u0E16\u0E38\u0E19\u0E32\u0E22\u0E19','\u0E01\u0E23\u0E01\u0E0E\u0E32\u0E04\u0E21','\u0E2A\u0E34\u0E07\u0E2B\u0E32\u0E04\u0E21','\u0E01\u0E31\u0E19\u0E22\u0E32\u0E22\u0E19','\u0E15\u0E38\u0E25\u0E32\u0E04\u0E21','\u0E1E\u0E24\u0E28\u0E08\u0E34\u0E01\u0E32\u0E22\u0E19','\u0E18\u0E31\u0E19\u0E27\u0E32\u0E04\u0E21'];
  const dayNames = ['\u0E2D\u0E32','\u0E08','\u0E2D','\u0E1E','\u0E1E\u0E24','\u0E28','\u0E2A'];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Gather events for this month
  const monthEvents = events.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const eventDays = {};
  monthEvents.forEach(e => {
    const d = new Date(e.date).getDate();
    if (!eventDays[d]) eventDays[d] = [];
    eventDays[d].push(e);
  });

  // Build calendar grid
  let daysHtml = dayNames.map(d => `<div class="cal-header">${d}</div>`).join('');

  // Previous month trailing days
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    daysHtml += `<div class="cal-day other-month">${prevDays - i}</div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const hasEvent = eventDays[d];
    const dotClass = hasEvent && hasEvent.length > 1 ? 'event-dot event-multi' : 'event-dot';
    const clickHandler = hasEvent ? `scrollToCalEvent(${d})` : '';
    daysHtml += `<div class="cal-day${isToday ? ' today' : ''}" onclick="${clickHandler}">${d}${hasEvent ? `<span class="${dotClass}"></span>` : ''}</div>`;
  }

  // Next month leading days
  const totalCells = firstDay + daysInMonth;
  const remaining = 7 - (totalCells % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      daysHtml += `<div class="cal-day other-month">${i}</div>`;
    }
  }

  // Events list for calendar
  const sortedEvents = monthEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  const eventsList = sortedEvents.map(e => {
    const d = new Date(e.date);
    return `
      <div class="cal-event-item" onclick="openEvent(${e.id})" id="cal-event-${d.getDate()}">
        <div class="cal-event-date">${d.getDate()}<br>${thaiMonths[month].slice(0, 3)}</div>
        <div class="cal-event-info">
          <div class="cal-event-title">${e.titleTh}</div>
          <div class="cal-event-loc"><i class="fas fa-map-marker-alt"></i> ${e.location}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="calendar-container">
      <div class="calendar-nav">
        <button onclick="changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
        <h3>${thaiMonths[month]} ${year + 543}</h3>
        <button onclick="changeMonth(1)"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="calendar-grid">${daysHtml}</div>
      <div class="cal-events">
        ${eventsList || '<div class="empty-state" style="padding:16px"><p>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E34\u0E08\u0E01\u0E23\u0E23\u0E21\u0E43\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49</p></div>'}
      </div>
    </div>
  `;
}

function changeMonth(delta) {
  calendarDate.setMonth(calendarDate.getMonth() + delta);
  renderEventsCalendar();
}

function scrollToCalEvent(day) {
  const el = document.getElementById(`cal-event-${day}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== EVENT DETAIL =====
function openEvent(id) {
  const e = events.find(x => x.id === id);
  if (!e) return;

  const date = new Date(e.date);
  const endDate = new Date(e.endDate);
  const thaiMonth = ['\u0E21\u0E01\u0E23\u0E32\u0E04\u0E21','\u0E01\u0E38\u0E21\u0E20\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E4C','\u0E21\u0E35\u0E19\u0E32\u0E04\u0E21','\u0E40\u0E21\u0E29\u0E32\u0E22\u0E19','\u0E1E\u0E24\u0E29\u0E20\u0E32\u0E04\u0E21','\u0E21\u0E34\u0E16\u0E38\u0E19\u0E32\u0E22\u0E19','\u0E01\u0E23\u0E01\u0E0E\u0E32\u0E04\u0E21','\u0E2A\u0E34\u0E07\u0E2B\u0E32\u0E04\u0E21','\u0E01\u0E31\u0E19\u0E22\u0E32\u0E22\u0E19','\u0E15\u0E38\u0E25\u0E32\u0E04\u0E21','\u0E1E\u0E24\u0E28\u0E08\u0E34\u0E01\u0E32\u0E22\u0E19','\u0E18\u0E31\u0E19\u0E27\u0E32\u0E04\u0E21'];
  const dateStr = e.date === e.endDate
    ? `${date.getDate()} ${thaiMonth[date.getMonth()]} ${date.getFullYear() + 543}`
    : `${date.getDate()} - ${endDate.getDate()} ${thaiMonth[endDate.getMonth()]} ${endDate.getFullYear() + 543}`;
  const pct = Math.round((e.registered / e.capacity) * 100);
  const full = pct >= 100;

  document.getElementById('eventDetail').innerHTML = `
    <div class="event-detail-page">
      <div class="event-hero" style="position:relative;height:240px;overflow:hidden">
        <img src="${e.image}" alt="${e.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.background='linear-gradient(135deg,var(--primary),var(--accent))'">
        <div class="hero-overlay" style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)"></div>
        <button class="back-btn" onclick="goBack('explore')" style="position:absolute;top:16px;left:16px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.9);border:none;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#333;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="event-hero-info" style="position:absolute;bottom:20px;left:16px;right:16px;color:white">
          <span class="event-hero-cat" style="display:inline-block;background:rgba(255,255,255,0.2);backdrop-filter:blur(4px);padding:4px 12px;border-radius:20px;font-size:12px;margin-bottom:8px">${e.category}</span>
          <div class="event-hero-title" style="font-size:22px;font-weight:700;line-height:1.3">${e.titleTh}</div>
        </div>
      </div>

      <div class="event-detail-body" style="padding:20px 16px 32px">
        <!-- Info Grid Card -->
        <div class="ed-card" style="background:var(--bg-card);border-radius:18px;padding:16px;margin-bottom:16px;box-shadow:0 2px 10px rgba(0,0,0,0.05)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="display:flex;align-items:flex-start;gap:10px;padding:14px;background:var(--bg);border-radius:14px">
              <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,197,1,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-calendar" style="color:var(--primary-dark);font-size:15px"></i></div>
              <div><div style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">วันที่</div><div style="font-size:13px;font-weight:600;color:var(--text-primary)">${dateStr}</div></div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:10px;padding:14px;background:var(--bg);border-radius:14px">
              <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,140,66,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-clock" style="color:var(--accent);font-size:15px"></i></div>
              <div><div style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">เวลา</div><div style="font-size:13px;font-weight:600;color:var(--text-primary)">${e.time}</div></div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:10px;padding:14px;background:var(--bg);border-radius:14px">
              <div style="width:36px;height:36px;border-radius:10px;background:rgba(76,175,80,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-map-marker-alt" style="color:#2E7D32;font-size:15px"></i></div>
              <div><div style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">สถานที่</div><div style="font-size:13px;font-weight:600;color:var(--text-primary)">${e.location}</div></div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:10px;padding:14px;background:var(--bg);border-radius:14px">
              <div style="width:36px;height:36px;border-radius:10px;background:rgba(33,150,243,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-ticket-alt" style="color:#1565C0;font-size:15px"></i></div>
              <div><div style="font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">ค่าเข้าร่วม</div><div style="font-size:13px;font-weight:600;color:var(--text-primary)">${e.price}</div></div>
            </div>
          </div>
        </div>

        <!-- Description Card -->
        <div class="ed-card" style="background:var(--bg-card);border-radius:18px;padding:20px;margin-bottom:16px;box-shadow:0 2px 10px rgba(0,0,0,0.05)">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px"><i class="fas fa-info-circle" style="color:var(--primary-dark)"></i> รายละเอียด</h3>
          <p style="font-size:14px;line-height:1.8;color:var(--text-secondary);margin-bottom:14px">${e.description}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${e.tags.map(t => `<span style="background:linear-gradient(135deg,rgba(255,197,1,0.1),rgba(255,140,66,0.1));border:1px solid rgba(255,197,1,0.25);padding:5px 14px;border-radius:20px;font-size:12px;color:var(--primary-dark);font-weight:500">#${t}</span>`).join('')}
          </div>
        </div>

        <!-- Registration Progress Card -->
        <div class="ed-card" style="background:var(--bg-card);border-radius:18px;padding:20px;margin-bottom:16px;box-shadow:0 2px 10px rgba(0,0,0,0.05)">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px"><i class="fas fa-users" style="color:var(--primary-dark)"></i> จำนวนผู้ลงทะเบียน</h3>
          <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);margin-bottom:8px">
            <span>${e.registered.toLocaleString()} คน</span>
            <span>${e.capacity.toLocaleString()} คน</span>
          </div>
          <div style="height:10px;background:var(--border);border-radius:5px;overflow:hidden">
            <div style="width:${Math.min(pct,100)}%;height:100%;background:${full?'var(--danger)':'linear-gradient(90deg,var(--primary),var(--accent))'};border-radius:5px;transition:width 0.5s ease"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);margin-top:6px">
            <span>${full ? 'เต็มแล้ว' : `เหลืออีก ${(e.capacity - e.registered).toLocaleString()} ที่`}</span>
            <span style="font-weight:600;color:${full ? 'var(--danger)' : 'var(--primary-dark)'}">${pct}%</span>
          </div>
        </div>

        <!-- Organizer Card -->
        <div class="ed-card" style="background:var(--bg-card);border-radius:18px;padding:20px;margin-bottom:24px;box-shadow:0 2px 10px rgba(0,0,0,0.05)">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px"><i class="fas fa-building" style="color:var(--primary-dark)"></i> ผู้จัดงาน</h3>
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:flex;align-items:center;justify-content:center;color:var(--primary-on);font-size:22px;flex-shrink:0">
              <i class="fas fa-building"></i>
            </div>
            <div>
              <div style="font-size:15px;font-weight:700">${e.organizer}</div>
              <div style="font-size:13px;color:var(--text-secondary)">ผู้จัดกิจกรรม</div>
            </div>
          </div>
        </div>

        <!-- Register Button -->
        <button class="register-btn ${full ? 'full' : ''}" onclick="${full ? '' : `registerEvent(${e.id})`}" style="width:100%;padding:16px;border-radius:16px;border:none;font-size:15px;font-weight:700;cursor:${full?'not-allowed':'pointer'};display:flex;align-items:center;justify-content:center;gap:8px;${full ? 'background:#f0f0f0;color:#999' : 'background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:var(--primary-on);box-shadow:0 4px 12px rgba(255,197,1,0.3)'}">
          ${full ? '<i class="fas fa-ban"></i> เต็มแล้ว' : '<i class="fas fa-check-circle"></i> ลงทะเบียนเข้าร่วม'}
        </button>
      </div>
    </div>
  `;

  // Navigate to event detail page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-event-detail').classList.add('active');
}

// ===== REGISTER EVENT =====
function registerEvent(id) {
  showModal(`
    <div class="modal-header"><h3>\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08!</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:64px;margin-bottom:12px">\uD83C\uDF89</div>
      <h3 style="font-size:20px;margin-bottom:8px">\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19</h3>
      <p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">\u0E04\u0E38\u0E13\u0E44\u0E14\u0E49\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E40\u0E02\u0E49\u0E32\u0E23\u0E48\u0E27\u0E21\u0E01\u0E34\u0E08\u0E01\u0E23\u0E23\u0E21\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27<br>\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E08\u0E30\u0E2A\u0E48\u0E07\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13</p>
      <div style="background:var(--bg);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-light)">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E01\u0E32\u0E23\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19</div>
        <div style="font-size:24px;font-weight:800;color:var(--primary);letter-spacing:2px">TLY-${id}-${Date.now().toString().slice(-6)}</div>
      </div>
      <button class="btn-primary" style="width:100%;padding:14px;font-size:15px;border-radius:14px;border:none;background:var(--primary);color:var(--primary-on);font-weight:700;cursor:pointer" onclick="closeModal()">\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19</button>
    </div>
  `);
}
