/* ========== TAILY APP - Main JS ========== */

let merchants = [];
let events = [];
let map, markerCluster, markers = [];
let userLocation = null;
let currentFilters = { category: 'all', region: 'all', province: 'all', price: 'all', search: '' };
let currentEventFilter = 'all';
let currentEventView = 'list';
let calendarDate = new Date(2026, 0, 1);
let sheetState = 'peek'; // 'peek', 'half', 'full'
let currentCouponTab = 'all';

// ===== MOCK COUPON DATA (10 diverse coupons) =====
let myCoupons = [
  { id: 1, merchantName: 'Jungle de Woof', promotion: 'ลด 10% ค่าอาหารสำหรับสมาชิก Taily', category: 'ร้านอาหาร', type: 'discount', discountText: '10%', discountLabel: 'ส่วนลด', expiry: '30 มิ.ย. 2569', badge: 'hot', emoji: '🍽️' },
  { id: 2, merchantName: 'Baan Bark Cafe', promotion: 'ฟรีเครื่องดื่ม 1 แก้ว เมื่อสั่ง 2 เมนูขึ้นไป', category: 'คาเฟ่', type: 'free', discountText: 'FREE', discountLabel: '1 แก้ว', expiry: '15 เม.ย. 2569', badge: 'new', emoji: '☕' },
  { id: 3, merchantName: 'Pawsome Hotel Hua Hin', promotion: 'ลด 500 บาท สำหรับห้อง Pet-Friendly Suite', category: 'โรงแรม', type: 'discount', discountText: '500฿', discountLabel: 'ส่วนลด', expiry: '31 พ.ค. 2569', badge: '', emoji: '🏨' },
  { id: 4, merchantName: 'Meow Meow Cat Cafe', promotion: 'ลด 15% ทุกเมนูขนมและเครื่องดื่ม ทุกวันจันทร์-พฤหัส', category: 'คาเฟ่', type: 'discount', discountText: '15%', discountLabel: 'ลดเมนูขนม', expiry: '28 ก.พ. 2569', badge: 'limited', emoji: '🐱' },
  { id: 5, merchantName: 'Dog Park Adventure', promotion: 'ฟรีค่าเข้าสวนสุนัข (ปกติ 100 บาท) สำหรับสมาชิกใหม่', category: 'สถานที่ท่องเที่ยว', type: 'free', discountText: 'FREE', discountLabel: 'ค่าเข้า', expiry: '30 เม.ย. 2569', badge: 'new', emoji: '🐕' },
  { id: 6, merchantName: 'Pet Grooming Spa BKK', promotion: 'ลด 20% แพ็คเกจอาบน้ำตัดขน Premium', category: 'ร้านอาหาร', type: 'discount', discountText: '20%', discountLabel: 'Grooming', expiry: '31 มี.ค. 2569', badge: 'hot', emoji: '✂️' },
  { id: 7, merchantName: 'Happy Paws Restaurant', promotion: 'ส่วนลด 200 บาท เมื่อทานอาหารครบ 1,000 บาท', category: 'ร้านอาหาร', type: 'discount', discountText: '200฿', discountLabel: 'ขั้นต่ำ 1,000฿', expiry: '30 มิ.ย. 2569', badge: '', emoji: '🍔' },
  { id: 8, merchantName: 'Cat Kingdom Cafe', promotion: 'ซื้อ 1 แถม 1 เมนู Afternoon Tea Set ทุกวันเสาร์-อาทิตย์', category: 'คาเฟ่', type: 'special', discountText: '1+1', discountLabel: 'Buy 1 Get 1', expiry: '15 พ.ค. 2569', badge: 'hot', emoji: '🍰' },
  { id: 9, merchantName: 'Bark & Brunch Thonglor', promotion: 'ลด 30% เมนูอาหารเช้า สำหรับสมาชิก Gold ขึ้นไป', category: 'ร้านอาหาร', type: 'special', discountText: '30%', discountLabel: 'Gold เท่านั้น', expiry: '31 มี.ค. 2569', badge: 'limited', emoji: '🥐' },
  { id: 10, merchantName: 'PetVille Resort Kanchanaburi', promotion: 'ลดพิเศษ 1,000 บาท แพ็คเกจ 2 วัน 1 คืน พร้อมอาหารเช้า', category: 'โรงแรม', type: 'special', discountText: '1,000฿', discountLabel: 'Resort Package', expiry: '31 ก.ค. 2569', badge: 'new', emoji: '🏖️' }
];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  const [mRes, eRes] = await Promise.all([
    fetch('js/merchants.json').then(r => r.json()),
    fetch('js/events.json').then(r => r.json())
  ]);
  merchants = mRes;
  events = eRes;

  const provinces = [...new Set(merchants.map(m => m.province))].sort();
  const sel = document.getElementById('provinceFilter');
  provinces.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = p;
    sel.appendChild(opt);
  });

  initMap();
  initBottomSheet();
  renderMerchantList();
  renderEvents();
  renderCoupons();

  setTimeout(() => {
    document.getElementById('splash').classList.add('hide');
    document.getElementById('app').style.display = 'flex';
    setTimeout(() => { map.invalidateSize(); }, 100);
  }, 2000);
});

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
      if (sheetState === 'peek') setSheetState('half');
      else if (sheetState === 'half') setSheetState('full');
    } else if (diff < -30) {
      if (sheetState === 'full') setSheetState('half');
      else if (sheetState === 'half') setSheetState('peek');
    }
  }, { passive: true });

  handle.addEventListener('click', (e) => {
    if (e.target.closest('.sheet-close-btn')) return;
    cycleSheet();
  });
}

function cycleSheet() {
  if (sheetState === 'peek') setSheetState('half');
  else if (sheetState === 'half') setSheetState('full');
  else setSheetState('peek');
}

function setSheetState(state) {
  const sheet = document.getElementById('bottomSheet');
  sheet.classList.remove('half', 'full');
  if (state === 'half') sheet.classList.add('half');
  else if (state === 'full') sheet.classList.add('full');
  sheetState = state;
  setTimeout(() => { map.invalidateSize(); }, 350);
}

// ===== MAP =====
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

function getCategoryIcon(cat) {
  switch(cat) {
    case 'ร้านอาหาร': return { icon: 'fa-utensils', cls: 'marker-restaurant', emoji: '🍽️' };
    case 'คาเฟ่': return { icon: 'fa-mug-hot', cls: 'marker-cafe', emoji: '☕' };
    case 'โรงแรม': return { icon: 'fa-bed', cls: 'marker-hotel', emoji: '🏨' };
    case 'สถานที่ท่องเที่ยว': return { icon: 'fa-mountain-sun', cls: 'marker-tourist', emoji: '🌿' };
    default: return { icon: 'fa-paw', cls: 'marker-restaurant', emoji: '🐾' };
  }
}

function addMarkers(data) {
  markerCluster.clearLayers();
  markers = [];
  data.forEach(m => {
    const cat = getCategoryIcon(m.category);
    const icon = L.divIcon({
      html: `<div class="custom-marker ${cat.cls}"><i class="fas ${cat.icon}"></i></div>`,
      iconSize: [36, 36], iconAnchor: [18, 18], className: ''
    });
    const marker = L.marker([m.lat, m.lng], { icon });
    marker.merchantId = m.id;
    const promoHtml = m.promotion && m.promotion !== 'ไม่มี'
      ? `<div class="popup-promo"><i class="fas fa-gift"></i>${m.promotion}</div>` : '';
    marker.bindPopup(`
      <div class="map-popup">
        <div class="popup-header">${cat.emoji}</div>
        <div class="popup-body">
          <span class="popup-category">${m.category}</span>
          <div class="popup-name">${m.name}</div>
          <div class="popup-desc">${m.description}</div>
          <div class="popup-meta">
            <span class="card-rating"><i class="fas fa-star"></i> ${m.rating}</span>
            <span>${m.reviews} รีวิว</span><span>${m.priceLevel}</span>
          </div>
          <div class="popup-meta"><span><i class="fas fa-clock"></i> ${m.hours}</span></div>
          <div class="popup-meta"><span><i class="fas fa-phone"></i> ${m.phone}</span></div>
          ${promoHtml}
          <div class="popup-actions">
            <button class="popup-btn popup-btn-primary" onclick="openMerchant(${m.id})"><i class="fas fa-store"></i> ดูร้านค้า</button>
            <button class="popup-btn popup-btn-outline" onclick="openNavigation('${m.mapLink}')"><i class="fas fa-diamond-turn-right"></i> นำทาง</button>
          </div>
        </div>
      </div>
    `, { maxWidth: 300, minWidth: 280, closeButton: true });
    markers.push(marker);
    markerCluster.addLayer(marker);
  });
}

function openNavigation(link) { window.open(link, '_blank'); }

// ===== FILTERS =====
function toggleFilters() {
  const panel = document.getElementById('filterPanel');
  const btn = document.querySelector('.filter-toggle-btn');
  panel.classList.toggle('show');
  btn.classList.toggle('active');
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
  clearBtn.style.display = currentFilters.search ? 'block' : 'none';

  const filtered = merchants.filter(m => {
    if (currentFilters.category !== 'all' && m.category !== currentFilters.category) return false;
    if (currentFilters.region !== 'all' && m.region !== currentFilters.region) return false;
    if (currentFilters.province !== 'all' && m.province !== currentFilters.province) return false;
    if (currentFilters.price !== 'all' && m.priceLevel !== currentFilters.price) return false;
    if (currentFilters.search) {
      const s = currentFilters.search;
      if (!m.name.toLowerCase().includes(s) && !m.description.toLowerCase().includes(s) &&
          !m.province.includes(s) && !m.services.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  addMarkers(filtered);
  renderMerchantList(filtered);
  document.getElementById('mapCount').textContent = `${filtered.length.toLocaleString()} สถานที่`;
  document.getElementById('filterCount').textContent = filtered.length.toLocaleString();

  if (filtered.length > 0 && filtered.length <= 50) {
    const bounds = L.latLngBounds(filtered.map(m => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }
}

function clearSearch() {
  document.getElementById('mapSearch').value = '';
  filterMerchants();
}

// ===== NEARBY =====
function findNearby() {
  const btn = document.getElementById('nearbyBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>กำลังหา...</span>';
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map.setView([userLocation.lat, userLocation.lng], 13);
      const userIcon = L.divIcon({
        html: '<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(66,133,244,0.3)"></div>',
        iconSize: [16, 16], className: ''
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map).bindPopup('คุณอยู่ที่นี่');
      const sorted = merchants.map(m => {
        m._dist = getDistance(userLocation.lat, userLocation.lng, m.lat, m.lng);
        return m;
      }).sort((a, b) => a._dist - b._dist).slice(0, 50);
      addMarkers(sorted);
      renderMerchantList(sorted);
      btn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span>ใกล้ฉัน</span>';
      showToast('แสดง 50 สถานที่ใกล้คุณ');
    }, () => {
      btn.innerHTML = '<i class="fas fa-location-crosshairs"></i><span>ใกล้ฉัน</span>';
      showToast('ไม่สามารถเข้าถึงตำแหน่งได้');
    });
  }
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ===== MERCHANT LIST =====
function renderMerchantList(data) {
  const list = document.getElementById('merchantList');
  const items = data || merchants;
  const show = items.slice(0, 50);

  list.innerHTML = show.map(m => {
    const cat = getCategoryIcon(m.category);
    const dist = m._dist ? `<span class="card-province">${m._dist.toFixed(1)} km</span>` : `<span class="card-province">${m.province}</span>`;
    return `
      <div class="merchant-card" onclick="openMerchant(${m.id})">
        <div class="card-img">${cat.emoji}</div>
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
    list.innerHTML += `<div class="empty-state" style="padding:12px"><p>แสดง ${show.length} จาก ${items.length} สถานที่ | ใช้ตัวกรองเพื่อจำกัดผลลัพธ์</p></div>`;
  }
}

function setListView(view, el) {
  const list = document.getElementById('merchantList');
  el.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  list.classList.toggle('grid-view', view === 'grid');
}

// ===== MERCHANT DETAIL =====
function openMerchant(id) {
  const m = merchants.find(x => x.id === id);
  if (!m) return;
  map.closePopup();
  const cat = getCategoryIcon(m.category);
  const services = m.services.split(/[,、]/).map(s => s.trim());
  const hasPromo = m.promotion && m.promotion !== 'ไม่มี';

  document.getElementById('merchantDetail').innerHTML = `
    <div class="merchant-detail-page">
      <div class="merchant-hero">
        <span class="hero-icon">${cat.emoji}</span>
        <button class="back-btn" onclick="goBack('map')"><i class="fas fa-chevron-left"></i></button>
        <button class="share-btn" onclick="shareMerchant(${m.id})"><i class="fas fa-share-alt"></i></button>
      </div>
      <div class="merchant-info">
        <span class="mi-category">${m.category}</span>
        <h1 class="mi-name">${m.name}</h1>
        <p class="mi-province"><i class="fas fa-map-marker-alt"></i> ${m.province} | ${m.region}</p>
        <div class="mi-rating">
          <span class="stars">${'★'.repeat(Math.floor(m.rating))}${'☆'.repeat(5-Math.floor(m.rating))}</span>
          <span class="rating-text">${m.rating}</span>
          <span class="reviews">(${m.reviews} รีวิว)</span>
        </div>
        <p class="mi-desc">${m.description}</p>
        <div class="merchant-actions">
          <button class="action-btn" onclick="window.open('tel:${m.phone}')"><i class="fas fa-phone"></i><span>โทร</span></button>
          <button class="action-btn" onclick="openNavigation('${m.mapLink}')"><i class="fas fa-diamond-turn-right"></i><span>นำทาง</span></button>
          <button class="action-btn" onclick="shareMerchant(${m.id})"><i class="fas fa-share-alt"></i><span>แชร์</span></button>
          <button class="action-btn" onclick="saveFavorite(${m.id})"><i class="fas fa-heart"></i><span>บันทึก</span></button>
        </div>
      </div>
      ${hasPromo ? `
      <div class="merchant-section">
        <h3><i class="fas fa-gift"></i> โปรโมชั่น</h3>
        <div class="promo-card">
          <div class="promo-badge">สิทธิพิเศษ</div>
          <div class="promo-text">${m.promotion}</div>
          <button class="promo-btn" onclick="collectCoupon(${m.id})"><i class="fas fa-ticket-alt"></i> เก็บคูปอง</button>
        </div>
      </div>` : ''}
      <div class="merchant-section">
        <h3><i class="fas fa-concierge-bell"></i> สินค้า & บริการ</h3>
        <div class="service-tags">${services.map(s => `<span class="service-tag">${s}</span>`).join('')}</div>
      </div>
      <div class="merchant-section">
        <h3><i class="fas fa-info-circle"></i> ข้อมูลทั่วไป</h3>
        <div class="info-row"><i class="fas fa-clock"></i><div><div class="info-label">เวลาเปิด-ปิด</div><div class="info-value">${m.hours}</div></div></div>
        <div class="info-row"><i class="fas fa-phone"></i><div><div class="info-label">โทรศัพท์</div><div class="info-value">${m.phone}</div></div></div>
        <div class="info-row"><i class="fas fa-dollar-sign"></i><div><div class="info-label">ระดับราคา</div><div class="info-value">${m.priceLevel}</div></div></div>
        <div class="info-row"><i class="fas fa-hashtag"></i><div><div class="info-label">Social Media</div><div class="info-value">${m.social} — ${m.socialLink}</div></div></div>
      </div>
      <div class="merchant-section">
        <h3><i class="fas fa-paw"></i> นโยบาย Pet-Friendly</h3>
        <div class="pet-badge"><i class="fas fa-check-circle"></i> Pet-Friendly</div>
        <p style="margin-top:8px;font-size:14px;color:var(--text-secondary);line-height:1.6">${m.petCondition}</p>
      </div>
      <div class="merchant-section" style="text-align:center">
        <button class="btn-primary" style="width:100%;padding:14px;font-size:15px" onclick="openNavigation('${m.mapLink}')">
          <i class="fas fa-diamond-turn-right"></i> นำทางไปยังสถานที่
        </button>
      </div>
    </div>
  `;
  navigate('merchant');
}

function collectCoupon(merchantId) {
  const m = merchants.find(x => x.id === merchantId);
  if (!m) return;
  if (myCoupons.find(c => c.merchantName === m.name)) {
    showToast('คุณเก็บคูปองนี้แล้ว');
    return;
  }
  myCoupons.push({
    id: Date.now(), merchantName: m.name, promotion: m.promotion,
    category: m.category, type: 'discount', discountText: '%', discountLabel: 'ส่วนลด',
    expiry: '31 ธ.ค. 2569', badge: 'new', emoji: getCategoryIcon(m.category).emoji
  });
  renderCoupons();
  showToast('เก็บคูปองสำเร็จ! 🎉');
}

function saveFavorite(id) { showToast('บันทึกเป็นรายการโปรดแล้ว ❤️'); }
function shareMerchant(id) { showToast('คัดลอกลิงก์แล้ว 📋'); }

// ===== EVENTS =====
function renderEvents() {
  if (currentEventView === 'list') renderEventsList();
  else if (currentEventView === 'gallery') renderEventsGallery();
  else renderEventsCalendar();
}

function filterEvents() { renderEvents(); }

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
  const search = document.getElementById('eventSearch')?.value?.toLowerCase() || '';
  return events.filter(e => {
    if (currentEventFilter !== 'all' && e.category !== currentEventFilter) return false;
    if (search && !e.title.toLowerCase().includes(search) && !e.titleTh.includes(search) && !e.location.includes(search)) return false;
    return true;
  });
}

function renderEventsList() {
  const filtered = getFilteredEvents();
  const container = document.getElementById('eventsContent');
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-xmark"></i><h4>ไม่พบกิจกรรม</h4><p>ลองเปลี่ยนตัวกรองดู</p></div>';
    return;
  }
  container.innerHTML = filtered.map(e => {
    const date = new Date(e.date);
    const thaiMonth = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
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
              ${full ? 'เต็ม' : `${e.registered}/${e.capacity}`}
              <span class="capacity-bar"><span class="fill" style="width:${Math.min(pct,100)}%;background:${full?'var(--danger)':'var(--primary)'}"></span></span>
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderEventsGallery() {
  const filtered = getFilteredEvents();
  const container = document.getElementById('eventsContent');
  container.innerHTML = `<div class="events-gallery">${filtered.map(e => {
    const date = new Date(e.date);
    const thaiMonth = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return `
      <div class="event-card-gallery" onclick="openEvent(${e.id})">
        <div class="gallery-img"><img src="${e.image}" alt="${e.title}" onerror="this.style.display='none'"></div>
        <div class="gallery-body">
          <span class="event-date-badge"><i class="fas fa-calendar"></i> ${date.getDate()} ${thaiMonth[date.getMonth()]}</span>
          <div class="gallery-title">${e.titleTh}</div>
          <div class="gallery-meta">${e.price} · ${e.location.split(' ')[0]}</div>
        </div>
      </div>
    `;
  }).join('')}</div>`;
}

function renderEventsCalendar() {
  const container = document.getElementById('eventsContent');
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const dayNames = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const monthEvents = events.filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month; });
  const eventDays = {};
  monthEvents.forEach(e => { const d = new Date(e.date).getDate(); if (!eventDays[d]) eventDays[d] = []; eventDays[d].push(e); });

  let daysHtml = dayNames.map(d => `<div class="cal-header">${d}</div>`).join('');
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) daysHtml += `<div class="cal-day other-month">${prevDays - i}</div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const hasEvent = eventDays[d];
    const dotClass = hasEvent && hasEvent.length > 1 ? 'event-dot event-multi' : 'event-dot';
    daysHtml += `<div class="cal-day${isToday ? ' today' : ''}" onclick="${hasEvent ? `scrollToCalEvent(${d})` : ''}">${d}${hasEvent ? `<span class="${dotClass}"></span>` : ''}</div>`;
  }
  const totalCells = firstDay + daysInMonth;
  const remaining = 7 - (totalCells % 7);
  if (remaining < 7) for (let i = 1; i <= remaining; i++) daysHtml += `<div class="cal-day other-month">${i}</div>`;

  const eventsList = monthEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).map(e => {
    const d = new Date(e.date);
    return `<div class="cal-event-item" onclick="openEvent(${e.id})" id="cal-event-${d.getDate()}"><div class="cal-event-date">${d.getDate()}<br>${thaiMonths[month].slice(0,3)}</div><div class="cal-event-info"><div class="cal-event-title">${e.titleTh}</div><div class="cal-event-loc"><i class="fas fa-map-marker-alt"></i> ${e.location}</div></div></div>`;
  }).join('');

  container.innerHTML = `<div class="calendar-container"><div class="calendar-nav"><button onclick="changeMonth(-1)"><i class="fas fa-chevron-left"></i></button><h3>${thaiMonths[month]} ${year + 543}</h3><button onclick="changeMonth(1)"><i class="fas fa-chevron-right"></i></button></div><div class="calendar-grid">${daysHtml}</div><div class="cal-events">${eventsList || '<div class="empty-state" style="padding:16px"><p>ไม่มีกิจกรรมในเดือนนี้</p></div>'}</div></div>`;
}

function changeMonth(delta) { calendarDate.setMonth(calendarDate.getMonth() + delta); renderEventsCalendar(); }
function scrollToCalEvent(day) { const el = document.getElementById(`cal-event-${day}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

// ===== EVENT DETAIL =====
function openEvent(id) {
  const e = events.find(x => x.id === id);
  if (!e) return;
  const date = new Date(e.date);
  const endDate = new Date(e.endDate);
  const thaiMonth = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const dateStr = e.date === e.endDate
    ? `${date.getDate()} ${thaiMonth[date.getMonth()]} ${date.getFullYear() + 543}`
    : `${date.getDate()} - ${endDate.getDate()} ${thaiMonth[endDate.getMonth()]} ${endDate.getFullYear() + 543}`;
  const pct = Math.round((e.registered / e.capacity) * 100);
  const full = pct >= 100;

  document.getElementById('eventDetail').innerHTML = `
    <div class="event-detail-page">
      <div class="event-hero">
        <img src="${e.image}" alt="${e.title}" onerror="this.parentElement.style.background='linear-gradient(135deg,var(--primary),var(--accent))'">
        <div class="hero-overlay"></div>
        <button class="back-btn" onclick="goBack('events')"><i class="fas fa-chevron-left"></i></button>
        <div class="event-hero-info"><span class="event-hero-cat">${e.category}</span><div class="event-hero-title">${e.titleTh}</div></div>
      </div>
      <div class="event-detail-body">
        <div class="event-detail-section">
          <div class="event-info-grid">
            <div class="event-info-item"><i class="fas fa-calendar"></i><div><div class="eii-label">วันที่</div><div class="eii-value">${dateStr}</div></div></div>
            <div class="event-info-item"><i class="fas fa-clock"></i><div><div class="eii-label">เวลา</div><div class="eii-value">${e.time}</div></div></div>
            <div class="event-info-item"><i class="fas fa-map-marker-alt"></i><div><div class="eii-label">สถานที่</div><div class="eii-value">${e.location}</div></div></div>
            <div class="event-info-item"><i class="fas fa-ticket-alt"></i><div><div class="eii-label">ค่าเข้าร่วม</div><div class="eii-value">${e.price}</div></div></div>
          </div>
        </div>
        <div class="event-detail-section"><h3>รายละเอียด</h3><p style="font-size:14px;line-height:1.7;color:var(--text-secondary)">${e.description}</p><div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">${e.tags.map(t => `<span class="service-tag">#${t}</span>`).join('')}</div></div>
        <div class="event-detail-section"><h3>จำนวนผู้ลงทะเบียน</h3><div class="event-progress"><div class="progress-text"><span>${e.registered.toLocaleString()} คน</span><span>${e.capacity.toLocaleString()} คน</span></div><div class="progress-bar"><div class="fill" style="width:${Math.min(pct,100)}%"></div></div><div class="progress-text"><span>${full ? 'เต็มแล้ว' : `เหลืออีก ${(e.capacity - e.registered).toLocaleString()} ที่`}</span><span>${pct}%</span></div></div></div>
        <div class="event-detail-section"><h3>ผู้จัดงาน</h3><div style="display:flex;align-items:center;gap:12px"><div style="width:48px;height:48px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-size:20px"><i class="fas fa-building"></i></div><div><div style="font-size:15px;font-weight:600">${e.organizer}</div><div style="font-size:13px;color:var(--text-secondary)">ผู้จัดกิจกรรม</div></div></div></div>
        <button class="register-btn ${full ? 'full' : ''}" onclick="${full ? '' : `registerEvent(${e.id})`}">${full ? '<i class="fas fa-ban"></i> เต็มแล้ว' : '<i class="fas fa-check-circle"></i> ลงทะเบียนเข้าร่วม'}</button>
      </div>
    </div>
  `;
  navigate('event-detail');
}

function registerEvent(id) {
  showModal(`
    <div class="modal-header"><h3>ลงทะเบียนสำเร็จ!</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:64px;margin-bottom:12px">🎉</div>
      <h3 style="font-size:20px;margin-bottom:8px">ยืนยันการลงทะเบียน</h3>
      <p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">คุณได้ลงทะเบียนเข้าร่วมกิจกรรมเรียบร้อยแล้ว<br>รายละเอียดจะส่งไปยังอีเมลของคุณ</p>
      <div style="background:var(--bg);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-light)">หมายเลขการลงทะเบียน</div>
        <div style="font-size:24px;font-weight:800;color:var(--primary);letter-spacing:2px">TLY-${id}-${Date.now().toString().slice(-6)}</div>
      </div>
      <button class="btn-primary" style="width:100%;padding:14px;font-size:15px" onclick="closeModal()">เสร็จสิ้น</button>
    </div>
  `);
}

// ===== COUPONS =====
function setCouponTab(tab, el) {
  document.querySelectorAll('.coupon-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentCouponTab = tab;
  renderCoupons();
}

function renderCoupons() {
  const list = document.getElementById('couponsList');
  const filtered = currentCouponTab === 'all' ? myCoupons
    : myCoupons.filter(c => c.type === currentCouponTab);

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-ticket-alt"></i><h4>ไม่มีคูปองในหมวดนี้</h4><p>ลองเลือกดูหมวดอื่น หรือเก็บคูปองจากร้านค้า!</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(c => {
    const badgeHtml = c.badge ? `<span class="coupon-badge ${c.badge}">${c.badge === 'new' ? 'ใหม่' : c.badge === 'hot' ? 'ยอดนิยม' : 'จำกัด'}</span>` : '';
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
        <div class="coupon-expiry"><i class="fas fa-clock"></i> หมดอายุ: ${c.expiry}</div>
      </div>
      <button class="coupon-use-btn" onclick="useCoupon(${c.id})">ใช้เลย</button>
    </div>
    `;
  }).join('');
}

function useCoupon(id) {
  const c = myCoupons.find(x => x.id === id);
  showModal(`
    <div class="modal-header"><h3>ใช้คูปอง</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:64px;margin-bottom:12px">🎫</div>
      <h3 style="margin-bottom:4px">${c ? c.merchantName : 'คูปอง'}</h3>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">${c ? c.promotion : ''}</p>
      <div style="background:var(--bg);border-radius:12px;padding:20px;margin:16px 0">
        <div style="font-size:12px;color:var(--text-light)">รหัสคูปอง</div>
        <div style="font-size:28px;font-weight:800;color:var(--primary);letter-spacing:4px;margin:8px 0">TAILY-${id}</div>
        <div style="width:200px;height:200px;margin:12px auto;background:var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--text-light)">[QR Code]</div>
      </div>
      <button class="btn-primary" style="width:100%;padding:14px" onclick="closeModal()">ปิด</button>
    </div>
  `);
}

// ===== NAVIGATION =====
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = { map: 0, events: 1, coupons: 2 };
  if (navMap[page] !== undefined) document.querySelectorAll('.nav-item')[navMap[page]].classList.add('active');
  if (page === 'map') setTimeout(() => map.invalidateSize(), 100);
}

function goBack(page) { navigate(page); }

// ===== MODAL =====
function showModal(content) {
  document.getElementById('modalOverlay').classList.add('show');
  const modal = document.getElementById('modalContent');
  modal.innerHTML = content;
  modal.classList.add('show');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('modalContent').classList.remove('show');
}

// ===== NOTIFICATIONS =====
function showNotifications() {
  showModal(`
    <div class="modal-header"><h3>การแจ้งเตือน</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
    <div class="notif-item"><div class="notif-icon promo"><i class="fas fa-gift"></i></div><div class="notif-body"><div class="notif-title">โปรโมชั่นใหม่!</div><div class="notif-desc">Jungle de Woof ลด 10% สำหรับสมาชิก Taily</div><div class="notif-time">2 ชั่วโมงที่แล้ว</div></div></div>
    <div class="notif-item"><div class="notif-icon event"><i class="fas fa-calendar"></i></div><div class="notif-body"><div class="notif-title">กิจกรรมใกล้ถึง</div><div class="notif-desc">Pet Adoption Day - Hua Hin เริ่ม 7 มี.ค. นี้!</div><div class="notif-time">1 วันที่แล้ว</div></div></div>
    <div class="notif-item"><div class="notif-icon system"><i class="fas fa-paw"></i></div><div class="notif-body"><div class="notif-title">ยินดีต้อนรับ!</div><div class="notif-desc">สมัครสมาชิก Taily สำเร็จ รับ 100 Taily Points</div><div class="notif-time">3 วันที่แล้ว</div></div></div>
  `);
}

// ===== PROFILE =====
function showProfile() {
  showModal(`
    <div class="modal-header"><h3>โปรไฟล์</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
    <div class="profile-content">
      <div class="profile-avatar"><i class="fas fa-user"></i></div>
      <div class="profile-name">สมชาย รักน้องหมา</div>
      <div class="profile-email">somchai@email.com</div>
      <div class="profile-tier"><i class="fas fa-crown"></i> Gold Member</div>
      <div class="profile-stats">
        <div class="profile-stat"><div class="stat-num">1,250</div><div class="stat-label">Taily Points</div></div>
        <div class="profile-stat"><div class="stat-num">${myCoupons.length}</div><div class="stat-label">คูปอง</div></div>
        <div class="profile-stat"><div class="stat-num">12</div><div class="stat-label">รายการโปรด</div></div>
      </div>
      <div class="profile-menu">
        <div class="profile-menu-item" onclick="closeModal();showProfileSub('favorites')"><i class="fas fa-heart"></i><span>รายการโปรด</span><i class="fas fa-chevron-right arrow"></i></div>
        <div class="profile-menu-item" onclick="closeModal();showProfileSub('mycoupons')"><i class="fas fa-ticket-alt"></i><span>คูปองของฉัน</span><i class="fas fa-chevron-right arrow"></i></div>
        <div class="profile-menu-item" onclick="closeModal();showProfileSub('history')"><i class="fas fa-history"></i><span>ประวัติการใช้งาน</span><i class="fas fa-chevron-right arrow"></i></div>
        <div class="profile-menu-item" onclick="closeModal();showProfileSub('pets')"><i class="fas fa-paw"></i><span>สัตว์เลี้ยงของฉัน</span><i class="fas fa-chevron-right arrow"></i></div>
        <div class="profile-menu-item" onclick="closeModal();showProfileSub('points')"><i class="fas fa-star"></i><span>Taily Points</span><i class="fas fa-chevron-right arrow"></i></div>
        <div class="profile-menu-item" onclick="closeModal();showProfileSub('settings')"><i class="fas fa-cog"></i><span>ตั้งค่า</span><i class="fas fa-chevron-right arrow"></i></div>
        <div class="profile-menu-item" onclick="showToast('ออกจากระบบแล้ว')"><i class="fas fa-sign-out-alt" style="color:var(--danger)"></i><span style="color:var(--danger)">ออกจากระบบ</span></div>
      </div>
    </div>
  `);
}

// ===== PROFILE SUB-PAGES =====
function showProfileSub(page) {
  const content = document.getElementById('profileSubContent');
  const titles = { favorites:'รายการโปรด', mycoupons:'คูปองของฉัน', history:'ประวัติการใช้งาน', pets:'สัตว์เลี้ยงของฉัน', points:'Taily Points', settings:'ตั้งค่า' };
  const header = `<div class="profile-sub-header"><button class="profile-sub-back" onclick="navigate('map')"><i class="fas fa-chevron-left"></i></button><h3>${titles[page]}</h3></div>`;

  if (page === 'favorites') {
    const favMerchants = merchants.slice(0, 12);
    content.innerHTML = header + `<div class="profile-sub-body">${favMerchants.map(m => {
      const cat = getCategoryIcon(m.category);
      return `<div class="fav-item" onclick="openMerchant(${m.id})"><div class="fav-icon" style="background:${m.category==='ร้านอาหาร'?'rgba(229,57,53,0.1)':m.category==='คาเฟ่'?'rgba(141,110,99,0.1)':m.category==='โรงแรม'?'rgba(30,136,229,0.1)':'rgba(67,160,71,0.1)'}">${cat.emoji}</div><div class="fav-body"><h4>${m.name}</h4><p>${m.category} · ${m.province}</p></div><button class="fav-remove" onclick="event.stopPropagation();showToast('ลบจากรายการโปรดแล้ว')"><i class="fas fa-heart" style="color:var(--danger)"></i></button></div>`;
    }).join('')}</div>`;

  } else if (page === 'mycoupons') {
    content.innerHTML = header + `<div class="profile-sub-body">${myCoupons.map(c => {
      const badgeHtml = c.badge ? `<span class="coupon-badge ${c.badge}">${c.badge === 'new' ? 'ใหม่' : c.badge === 'hot' ? 'ยอดนิยม' : 'จำกัด'}</span>` : '';
      return `<div class="coupon-card type-${c.type}"><div class="coupon-left"><div class="coupon-discount">${c.discountText}</div><div class="coupon-type">${c.discountLabel}</div></div><div class="coupon-dashed"></div><div class="coupon-right"><div class="coupon-merchant">${c.merchantName}${badgeHtml}</div><div class="coupon-detail">${c.promotion}</div><div class="coupon-expiry"><i class="fas fa-clock"></i> หมดอายุ: ${c.expiry}</div></div><button class="coupon-use-btn" onclick="useCoupon(${c.id})">ใช้เลย</button></div>`;
    }).join('')}</div>`;

  } else if (page === 'history') {
    const historyData = [
      { action: 'เยี่ยมชม Jungle de Woof', detail: 'ร้านอาหาร · กรุงเทพมหานคร', time: 'วันนี้ 14:30', visited: true },
      { action: 'เก็บคูปอง Baan Bark Cafe', detail: 'ฟรีเครื่องดื่ม 1 แก้ว', time: 'วันนี้ 11:15', visited: false },
      { action: 'ลงทะเบียน Pet Adoption Day', detail: 'กิจกรรม · หัวหิน', time: 'เมื่อวาน 16:45', visited: true },
      { action: 'เยี่ยมชม Pawsome Hotel', detail: 'โรงแรม · หัวหิน', time: 'เมื่อวาน 10:00', visited: true },
      { action: 'ใช้คูปอง Happy Paws', detail: 'ส่วนลด 200 บาท', time: '3 วันที่แล้ว', visited: false },
      { action: 'เยี่ยมชม Cat Kingdom Cafe', detail: 'คาเฟ่ · สีลม', time: '5 วันที่แล้ว', visited: true },
      { action: 'รับ Taily Points +50', detail: 'โบนัสเข้าใช้งานรายวัน', time: '1 สัปดาห์ที่แล้ว', visited: false },
      { action: 'สมัครสมาชิก Taily', detail: 'รับ 100 Taily Points ต้อนรับ', time: '2 สัปดาห์ที่แล้ว', visited: false }
    ];
    content.innerHTML = header + `<div class="profile-sub-body">${historyData.map(h => `
      <div class="history-item">
        <div class="history-dot${h.visited?' visited':''}"></div>
        <div class="history-body"><h4>${h.action}</h4><p>${h.detail}</p></div>
        <div class="history-time">${h.time}</div>
      </div>
    `).join('')}</div>`;

  } else if (page === 'pets') {
    const petsData = [
      { name: 'บราวนี่', breed: 'พันธุ์โกลเด้น รีทรีฟเวอร์', age: '3 ปี', weight: '28 kg', emoji: '🐕', tags: ['ฉีดวัคซีนแล้ว','ทำหมันแล้ว','ไมโครชิป'] },
      { name: 'มีมี่', breed: 'พันธุ์สก็อตติช โฟลด์', age: '2 ปี', weight: '4 kg', emoji: '🐱', tags: ['ฉีดวัคซีนแล้ว','ทำหมันแล้ว'] }
    ];
    content.innerHTML = header + `<div class="profile-sub-body">${petsData.map(p => `
      <div class="pet-card">
        <div class="pet-avatar">${p.emoji}</div>
        <div class="pet-info">
          <h4>${p.name}</h4>
          <div class="pet-breed">${p.breed} · ${p.age} · ${p.weight}</div>
          <div class="pet-tags">${p.tags.map(t => `<span class="pet-tag">${t}</span>`).join('')}</div>
        </div>
      </div>
    `).join('')}
    <button class="pet-add-btn" onclick="showToast('ฟีเจอร์เพิ่มสัตว์เลี้ยงกำลังพัฒนา')"><i class="fas fa-plus-circle"></i> เพิ่มสัตว์เลี้ยง</button>
    </div>`;

  } else if (page === 'points') {
    const pointsHistory = [
      { desc: 'เก็บคูปอง Jungle de Woof', date: '10 มี.ค. 2569', amount: '+20', type: 'earn' },
      { desc: 'เข้าใช้งานรายวัน', date: '10 มี.ค. 2569', amount: '+10', type: 'earn' },
      { desc: 'แลกส่วนลด Pet Grooming Spa', date: '8 มี.ค. 2569', amount: '-200', type: 'spend' },
      { desc: 'ลงทะเบียน Pet Adoption Day', date: '7 มี.ค. 2569', amount: '+50', type: 'earn' },
      { desc: 'รีวิวร้าน Pawsome Hotel', date: '5 มี.ค. 2569', amount: '+30', type: 'earn' },
      { desc: 'แลกคูปอง Cat Kingdom Cafe', date: '3 มี.ค. 2569', amount: '-150', type: 'spend' },
      { desc: 'เข้าใช้งานรายวัน x5', date: '1 มี.ค. 2569', amount: '+50', type: 'earn' },
      { desc: 'โบนัสสมาชิกใหม่', date: '25 ก.พ. 2569', amount: '+100', type: 'earn' }
    ];
    content.innerHTML = header + `<div class="profile-sub-body">
      <div class="points-card">
        <div class="points-balance">1,250</div>
        <div class="points-label">Taily Points</div>
        <div class="points-tier"><i class="fas fa-crown"></i> Gold Member</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px">
        <div style="background:white;border-radius:12px;padding:12px;text-align:center;box-shadow:var(--shadow)">
          <div style="font-size:20px;font-weight:800;color:var(--success)">+310</div>
          <div style="font-size:11px;color:var(--text-secondary)">ได้รับเดือนนี้</div>
        </div>
        <div style="background:white;border-radius:12px;padding:12px;text-align:center;box-shadow:var(--shadow)">
          <div style="font-size:20px;font-weight:800;color:var(--danger)">-350</div>
          <div style="font-size:11px;color:var(--text-secondary)">ใช้ไปเดือนนี้</div>
        </div>
        <div style="background:white;border-radius:12px;padding:12px;text-align:center;box-shadow:var(--shadow)">
          <div style="font-size:20px;font-weight:800;color:var(--primary)">750</div>
          <div style="font-size:11px;color:var(--text-secondary)">อีก...ถึง Platinum</div>
        </div>
      </div>
      <h4 style="font-size:16px;font-weight:700;margin-bottom:8px">ประวัติ Points</h4>
      ${pointsHistory.map(p => `
        <div class="points-history-item">
          <div class="ph-left">
            <div class="ph-icon ${p.type}"><i class="fas fa-${p.type === 'earn' ? 'arrow-down' : 'arrow-up'}"></i></div>
            <div class="ph-text"><h4>${p.desc}</h4><p>${p.date}</p></div>
          </div>
          <div class="ph-amount ${p.type === 'earn' ? 'positive' : 'negative'}">${p.amount}</div>
        </div>
      `).join('')}
    </div>`;

  } else if (page === 'settings') {
    content.innerHTML = header + `<div class="profile-sub-body">
      <div class="setting-group">
        <div class="setting-group-title">บัญชี</div>
        <div class="setting-item"><i class="fas fa-user"></i><div class="setting-label">ชื่อแสดง</div><div class="setting-value">สมชาย รักน้องหมา</div><i class="fas fa-chevron-right arrow"></i></div>
        <div class="setting-item"><i class="fas fa-envelope"></i><div class="setting-label">อีเมล</div><div class="setting-value">somchai@email.com</div><i class="fas fa-chevron-right arrow"></i></div>
        <div class="setting-item"><i class="fas fa-phone"></i><div class="setting-label">เบอร์โทร</div><div class="setting-value">081-xxx-xxxx</div><i class="fas fa-chevron-right arrow"></i></div>
      </div>
      <div class="setting-group">
        <div class="setting-group-title">การแจ้งเตือน</div>
        <div class="setting-item"><i class="fas fa-bell"></i><div class="setting-label">การแจ้งเตือนทั่วไป</div><div class="toggle-switch on" onclick="this.classList.toggle('on')"></div></div>
        <div class="setting-item"><i class="fas fa-gift"></i><div class="setting-label">โปรโมชั่น</div><div class="toggle-switch on" onclick="this.classList.toggle('on')"></div></div>
        <div class="setting-item"><i class="fas fa-calendar"></i><div class="setting-label">กิจกรรม</div><div class="toggle-switch on" onclick="this.classList.toggle('on')"></div></div>
      </div>
      <div class="setting-group">
        <div class="setting-group-title">แอปพลิเคชัน</div>
        <div class="setting-item"><i class="fas fa-globe"></i><div class="setting-label">ภาษา</div><div class="setting-value">ไทย</div><i class="fas fa-chevron-right arrow"></i></div>
        <div class="setting-item"><i class="fas fa-moon"></i><div class="setting-label">โหมดมืด</div><div class="toggle-switch" onclick="this.classList.toggle('on')"></div></div>
        <div class="setting-item"><i class="fas fa-map"></i><div class="setting-label">แผนที่เริ่มต้น</div><div class="setting-value">ทั่วประเทศ</div><i class="fas fa-chevron-right arrow"></i></div>
      </div>
      <div class="setting-group">
        <div class="setting-group-title">เกี่ยวกับ</div>
        <div class="setting-item"><i class="fas fa-info-circle"></i><div class="setting-label">เวอร์ชัน</div><div class="setting-value">1.0.0</div></div>
        <div class="setting-item"><i class="fas fa-file-alt"></i><div class="setting-label">นโยบายความเป็นส่วนตัว</div><i class="fas fa-chevron-right arrow"></i></div>
        <div class="setting-item"><i class="fas fa-gavel"></i><div class="setting-label">ข้อกำหนดการใช้งาน</div><i class="fas fa-chevron-right arrow"></i></div>
      </div>
    </div>`;
  }
  navigate('profile-sub');
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}
