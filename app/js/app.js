/* ========== TAILY APP — Core v2.0 ========== */

// ===== VIEWPORT HEIGHT FIX =====
function setAppHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 100));

// ===== TAB INITIALIZATION TRACKING =====
const tabInitialized = { home: false, explore: false, market: false, social: false, me: false };

// ===== NAVIGATION =====
function navigate(tab) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target page
  const page = document.getElementById(`page-${tab}`);
  if (page) page.classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Update header for different tabs
  updateHeaderForTab(tab);

  // Lazy-init tab
  if (!tabInitialized[tab]) {
    tabInitialized[tab] = true;
    switch(tab) {
      case 'home': initHome(); break;
      case 'explore': initExplore(); break;
      case 'market': initMarket(); break;
      case 'social': initSocial(); break;
      case 'me': initMe(); break;
    }
  }

  // Special: invalidate map size when switching to explore
  if (tab === 'explore' && typeof map !== 'undefined' && map) {
    setTimeout(() => map.invalidateSize(), 200);
  }

  TailyStore.set('activeTab', tab);
  window.location.hash = tab;

  // Scroll to top
  if (page) page.scrollTop = 0;
}

function updateHeaderForTab(tab) {
  // Header adjusts per tab (could hide/show search, etc.)
  const header = document.getElementById('appHeader');
  header.style.display = ''; // Always show header (all tabs including explore)
}

// ===== SUB-PAGE NAVIGATION =====
function goBack(toPage) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${toPage}`);
  if (target) target.classList.add('active');
}

// ===== MODAL SYSTEM =====
function showModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('show');
  document.getElementById('modalContent').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('modalContent').classList.remove('show');
  document.body.style.overflow = '';
}

// ===== TOAST SYSTEM =====
function showToast(text, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== COMING SOON =====
function showComingSoon(feature) {
  showModal(`
    <div style="text-align:center;padding:40px 20px">
      <div style="font-size:48px;margin-bottom:16px">🚧</div>
      <h3 style="margin-bottom:8px">${feature}</h3>
      <p style="color:var(--text-secondary)">ฟีเจอร์นี้กำลังพัฒนา<br>เร็วๆ นี้!</p>
      <button class="btn-primary" style="margin-top:20px" onclick="closeModal()">ตกลง</button>
    </div>
  `);
}

// ===== MORE ACTIONS =====
function showMoreActions() {
  showModal(`
    <div class="more-actions-modal">
      <h3 style="margin-bottom:16px;padding:0 4px"><i class="fas fa-ellipsis-h"></i> เพิ่มเติม</h3>
      <div class="qa-grid" style="padding:0">
        <button class="qa-item" onclick="closeModal();showComingSoon('Taily Med')"><div class="qa-icon" style="background:linear-gradient(135deg,#2196F3,#0D47A1)"><i class="fas fa-stethoscope"></i></div><span>สัตวแพทย์</span></button>
        <button class="qa-item" onclick="closeModal();showComingSoon('Insurance')"><div class="qa-icon" style="background:linear-gradient(135deg,#9C27B0,#4A148C)"><i class="fas fa-shield-dog"></i></div><span>ประกัน</span></button>
        <button class="qa-item" onclick="closeModal();showComingSoon('Training')"><div class="qa-icon" style="background:linear-gradient(135deg,#FF5722,#BF360C)"><i class="fas fa-graduation-cap"></i></div><span>ฝึกสัตว์</span></button>
        <button class="qa-item" onclick="closeModal();navigate('social');setTimeout(()=>showSocialTab('adoption'),100)"><div class="qa-icon" style="background:linear-gradient(135deg,#E91E63,#880E4F)"><i class="fas fa-heart"></i></div><span>รับเลี้ยง</span></button>
      </div>
    </div>
  `);
}

// ===== GLOBAL SEARCH =====
function openGlobalSearch() {
  document.getElementById('globalSearchOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('globalSearchInput').focus(), 100);
}

function closeGlobalSearch() {
  document.getElementById('globalSearchOverlay').style.display = 'none';
  document.getElementById('globalSearchInput').value = '';
}

async function handleGlobalSearch(query) {
  if (query.length < 2) return;
  const results = await MockAPI.globalSearch(query);
  const el = document.getElementById('globalSearchResults');
  let html = '';
  if (results.merchants.length) {
    html += `<div class="gs-group"><h4><i class="fas fa-map-marker-alt"></i> สถานที่</h4>`;
    results.merchants.forEach(m => {
      html += `<button class="gs-item" onclick="closeGlobalSearch();navigate('explore');setTimeout(()=>openMerchant(${m.id}),300)"><i class="fas fa-store"></i><span>${m.name}</span><small>${m.province}</small></button>`;
    });
    html += '</div>';
  }
  if (results.products.length) {
    html += `<div class="gs-group"><h4><i class="fas fa-shopping-bag"></i> สินค้า</h4>`;
    results.products.forEach(p => {
      html += `<button class="gs-item" onclick="closeGlobalSearch();navigate('market');setTimeout(()=>openProduct(${p.id}),300)"><i class="fas fa-box"></i><span>${p.name}</span><small>฿${p.price.toLocaleString()}</small></button>`;
    });
    html += '</div>';
  }
  if (results.events.length) {
    html += `<div class="gs-group"><h4><i class="fas fa-calendar"></i> กิจกรรม</h4>`;
    results.events.forEach(e => {
      html += `<button class="gs-item" onclick="closeGlobalSearch();navigate('explore');setTimeout(()=>{showExploreTab('events');openEvent(${e.id})},300)"><i class="fas fa-calendar-star"></i><span>${e.titleTh || e.title}</span></button>`;
    });
    html += '</div>';
  }
  if (!html) html = '<div class="gs-empty"><i class="fas fa-search"></i><p>ไม่พบผลลัพธ์</p></div>';
  el.innerHTML = html;
}

function quickGlobalSearch(query) {
  document.getElementById('globalSearchInput').value = query;
  handleGlobalSearch(query);
}

// ===== MESSAGES SHORTCUT =====
function openMessages() {
  navigate('social');
  setTimeout(() => showSocialTab('messages'), 100);
}

// ===== NOTIFICATIONS SHORTCUT =====
function openNotifications() {
  navigate('me');
  setTimeout(() => showMeSection('notifications'), 100);
}

// ===== CART MANAGEMENT =====
function openCart() {
  const sheet = document.getElementById('cartSheet');
  sheet.classList.add('show');
  document.getElementById('modalOverlay').classList.add('show');
  renderCart();
}

function closeCart() {
  document.getElementById('cartSheet').classList.remove('show');
  document.getElementById('modalOverlay').classList.remove('show');
}

function renderCart() {
  const cart = TailyStore.get('cart');
  const el = document.getElementById('cartItems');
  if (!cart.length) {
    el.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>ตะกร้าว่าง</p></div>';
    return;
  }
  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <span class="cart-item-price">฿${item.price.toLocaleString()}</span>
      </div>
      <div class="cart-item-qty">
        <button onclick="TailyStore.updateCartQty(${item.productId},${item.qty-1});renderCart()"><i class="fas fa-minus"></i></button>
        <span>${item.qty}</span>
        <button onclick="TailyStore.updateCartQty(${item.productId},${item.qty+1});renderCart()"><i class="fas fa-plus"></i></button>
      </div>
    </div>
  `).join('');
  document.getElementById('cartTotal').textContent = '฿' + TailyStore.getCartTotal().toLocaleString();
  document.getElementById('cartCountText').textContent = TailyStore.get('cartCount');
}

// ===== UTILITY FUNCTIONS =====
function formatThaiDate(dateStr) {
  const d = new Date(dateStr);
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function timeAgo(dateStr) {
  const now = new Date('2026-03-11T12:00:00');
  const d = new Date(dateStr);
  const diff = (now - d) / 1000;
  if (diff < 60) return 'เมื่อสักครู่';
  if (diff < 3600) return `${Math.floor(diff/60)} นาที`;
  if (diff < 86400) return `${Math.floor(diff/3600)} ชม.`;
  if (diff < 604800) return `${Math.floor(diff/86400)} วัน`;
  return formatThaiDate(dateStr);
}

function formatNumber(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toString();
}

// ===== CART BADGE UPDATE =====
function updateCartBadge() {
  const count = TailyStore.get('cartCount');
  const badge = document.getElementById('navCartBadge');
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
  // Init store
  TailyStore.init();

  // Listen for cart changes
  TailyStore.on('cartCount', updateCartBadge);
  updateCartBadge();

  // Load user profile
  const profile = await MockAPI.getUserProfile();
  TailyStore.set('user', profile);

  // Update header avatar
  if (profile && profile.user) {
    document.getElementById('headerAvatar').src = profile.user.avatar;
  }

  // Handle hash routing
  const hash = window.location.hash.replace('#', '') || 'home';

  // Splash screen
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      navigate(hash);
    }, 400);
  }, 1800);
});

// Hash change listener
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && ['home','explore','market','social','me'].includes(hash)) {
    navigate(hash);
  }
});

// ===== PHASE 8: POLISH UTILITIES =====

// --- Skeleton Loading Helper ---
function showSkeleton(containerId, type = 'feed', count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = '';
  for (let i = 0; i < count; i++) {
    if (type === 'feed') {
      html += `
        <div class="skeleton-feed-card">
          <div class="skeleton-feed-header">
            <div class="skeleton skeleton-feed-avatar"></div>
            <div class="skeleton-feed-meta">
              <div class="skeleton skeleton-text medium"></div>
              <div class="skeleton skeleton-text short"></div>
            </div>
          </div>
          <div class="skeleton skeleton-feed-image"></div>
          <div class="skeleton-feed-actions">
            <div class="skeleton skeleton-btn"></div>
            <div class="skeleton skeleton-btn"></div>
            <div class="skeleton skeleton-btn"></div>
          </div>
        </div>`;
    } else if (type === 'stories') {
      html += `
        <div class="skeleton-story">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-name"></div>
        </div>`;
    } else if (type === 'product') {
      html += `
        <div class="skeleton-product-card skeleton-card">
          <div class="skeleton skeleton-product-img"></div>
          <div class="skeleton-product-body">
            <div class="skeleton skeleton-text long"></div>
            <div class="skeleton skeleton-text short"></div>
          </div>
        </div>`;
    } else if (type === 'card') {
      html += `
        <div class="skeleton-card">
          <div class="skeleton skeleton-img"></div>
          <div class="skeleton-body">
            <div class="skeleton skeleton-text long"></div>
            <div class="skeleton skeleton-text medium"></div>
          </div>
        </div>`;
    }
  }
  container.innerHTML = html;
}

function hideSkeleton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const skeletons = container.querySelectorAll('[class*="skeleton"]');
  skeletons.forEach(el => el.remove());
}

// --- Image Lazy Load Observer ---
const imgObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
      img.classList.add('loaded');
      imgObserver.unobserve(img);
    }
  });
}, { rootMargin: '100px' });

// Observe all lazy images after page load
function observeLazyImages(container) {
  const imgs = (container || document).querySelectorAll('img[loading="lazy"]');
  imgs.forEach(img => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      imgObserver.observe(img);
    }
  });
}

// --- Card Press Effect ---
document.addEventListener('touchstart', (e) => {
  const card = e.target.closest('.card-pressable, .nearby-card, .featured-card, .upcoming-card, .deal-card, .home-feed-card');
  if (card) {
    card.style.transform = 'scale(0.97)';
    card.style.transition = 'transform 0.15s ease';
  }
}, { passive: true });

document.addEventListener('touchend', () => {
  document.querySelectorAll('[style*="scale(0.97)"]').forEach(el => {
    el.style.transform = '';
  });
}, { passive: true });

// --- Scroll Position Restoration ---
const scrollPositions = {};

function saveScrollPosition(tab) {
  const page = document.getElementById(`page-${tab}`);
  if (page) {
    scrollPositions[tab] = page.scrollTop;
  }
}

function restoreScrollPosition(tab) {
  if (scrollPositions[tab]) {
    const page = document.getElementById(`page-${tab}`);
    if (page) {
      requestAnimationFrame(() => {
        page.scrollTop = scrollPositions[tab];
      });
    }
  }
}

// --- Enhanced navigate() with scroll save/restore ---
const _originalNavigate = navigate;
navigate = function(tab) {
  // Save current tab scroll position before switching
  const currentActive = document.querySelector('.page.active');
  if (currentActive) {
    const currentTab = currentActive.id.replace('page-', '');
    saveScrollPosition(currentTab);
  }

  _originalNavigate(tab);

  // Restore scroll position for this tab (only if we've been here before)
  if (scrollPositions[tab] !== undefined) {
    restoreScrollPosition(tab);
  }

  // Observe lazy images in the new tab
  const page = document.getElementById(`page-${tab}`);
  if (page) {
    observeLazyImages(page);
  }
};
