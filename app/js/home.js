/* ========== TAILY HOME TAB — Feed, Stories, Carousels v2.0 ========== */

let homeFeedPage = 1;
let homeFeedLoading = false;
let homeFeedHasMore = true;

// ===== INIT =====
async function initHome() {
  // Load all home sections in parallel
  const [stories, feedResult, nearby, featured, upcoming, coupons] = await Promise.all([
    MockAPI.getStories(),
    MockAPI.getFeed(1),
    MockAPI.getNearbyMerchants(13.7563, 100.5018, 8),
    MockAPI.getFeaturedMerchants(8),
    MockAPI.getUpcomingEvents(5),
    MockAPI.getCoupons()
  ]);

  renderStories(stories);
  renderHomeFeed(feedResult.items);
  homeFeedHasMore = feedResult.hasMore;
  renderNearbyPlaces(nearby);
  renderFeaturedMerchants(featured);
  renderUpcomingEvents(upcoming);
  renderHomeDeals(coupons.slice(0, 4));
}

// ===== STORIES =====
function renderStories(stories) {
  const scroll = document.querySelector('#storiesBar .stories-scroll');
  if (!scroll) return;

  // Remove old dynamic stories (keep the first .my-story item)
  const existing = scroll.querySelectorAll('.story-item:not(.my-story)');
  existing.forEach(el => el.remove());

  const viewedStories = TailyStore.get('viewedStories');

  stories.forEach(story => {
    if (story.isMine) return; // Skip own story — already rendered as my-story
    const viewed = viewedStories.has(story.id);
    const ringClass = viewed ? 'story-ring-seen' : 'story-ring-unseen';

    const item = document.createElement('div');
    item.className = 'story-item';
    item.onclick = () => showStory(story.id);
    item.innerHTML = `
      <div class="story-avatar-wrap ${ringClass}">
        <img src="${story.userAvatar}" alt="${story.userName}" loading="lazy">
      </div>
      <span class="story-name">${story.userName}</span>
    `;
    scroll.appendChild(item);
  });
}

function createStory() {
  showToast('กำลังพัฒนา');
}

async function showStory(id) {
  const stories = await MockAPI.getStories();
  const story = stories.find(s => s.id === id);
  if (!story) return;

  // Mark as viewed
  const viewedStories = new Set(TailyStore.get('viewedStories'));
  viewedStories.add(id);
  TailyStore.set('viewedStories', viewedStories);

  // Update the ring color in the story bar
  const storyItems = document.querySelectorAll('#storiesBar .story-item:not(.my-story)');
  storyItems.forEach(item => {
    const nameEl = item.querySelector('.story-name');
    if (nameEl && nameEl.textContent === story.userName) {
      const wrap = item.querySelector('.story-avatar-wrap');
      wrap.classList.remove('story-ring-unseen');
      wrap.classList.add('story-ring-seen');
    }
  });

  // Build full-screen overlay
  const overlay = document.createElement('div');
  overlay.className = 'story-overlay';
  overlay.id = 'storyOverlay';
  overlay.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;
    background:#000;display:flex;flex-direction:column;
  `;

  overlay.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;z-index:2;padding:8px 12px;">
      <div style="height:3px;background:rgba(255,255,255,0.3);border-radius:2px;overflow:hidden;margin-bottom:12px">
        <div class="story-progress-fill" style="height:100%;background:#fff;border-radius:2px;width:0%;transition:width 5s linear"></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${story.userAvatar}" style="width:36px;height:36px;border-radius:50%;border:2px solid #fff" alt="">
        <div style="flex:1">
          <div style="color:#fff;font-size:14px;font-weight:600">${story.userName}</div>
          <div style="color:rgba(255,255,255,0.7);font-size:11px">${timeAgo(story.timestamp)}</div>
        </div>
        <button onclick="closeStoryOverlay()" style="background:none;border:none;color:#fff;font-size:22px;padding:8px;cursor:pointer">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
    <img src="${story.image}" style="width:100%;height:100%;object-fit:cover" alt="">
  `;

  document.body.appendChild(overlay);

  // Start progress bar
  requestAnimationFrame(() => {
    const fill = overlay.querySelector('.story-progress-fill');
    if (fill) fill.style.width = '100%';
  });

  // Auto-close after 5 seconds
  overlay._timer = setTimeout(() => closeStoryOverlay(), 5000);

  // Close on tap outside close button
  overlay.addEventListener('click', (e) => {
    if (!e.target.closest('button')) {
      closeStoryOverlay();
    }
  });
}

function closeStoryOverlay() {
  const overlay = document.getElementById('storyOverlay');
  if (overlay) {
    if (overlay._timer) clearTimeout(overlay._timer);
    overlay.remove();
  }
}

// ===== HOME FEED =====
function renderHomeFeed(posts) {
  const container = document.getElementById('homeFeed');
  if (!container) return;

  const likedPosts = TailyStore.get('likedPosts');
  const bookmarkedPosts = TailyStore.get('bookmarkedPosts');

  const html = posts.map(post => {
    const isLiked = likedPosts.has(post.id);
    const isBookmarked = bookmarkedPosts.has(post.id);
    const tierColors = { Gold: '#FFC501', Platinum: '#9C27B0', Silver: '#9E9E9E', Bronze: '#CD7F32' };
    const tierColor = tierColors[post.userTier] || '#9E9E9E';
    const mainImage = Array.isArray(post.images) ? post.images[0] : '';

    // Truncate caption
    const fullCaption = post.caption || '';
    const shortCaption = fullCaption.length > 80 ? fullCaption.substring(0, 80) : fullCaption;
    const needsMore = fullCaption.length > 80;

    return `
      <div class="home-feed-card" data-post-id="${post.id}">
        <div class="hfc-header">
          <img class="hfc-avatar" src="${post.userAvatar}" alt="" loading="lazy">
          <div class="hfc-user-info">
            <div class="hfc-user-name">
              ${post.userName}
              <span class="hfc-tier-badge" style="background:${tierColor};color:${post.userTier === 'Gold' ? '#3D2B1F' : '#fff'}">${post.userTier}</span>
            </div>
            <div class="hfc-user-meta">${post.location || ''} &middot; ${timeAgo(post.timestamp)}</div>
          </div>
        </div>
        <div class="hfc-image">
          <img src="${mainImage}" alt="" loading="lazy"
               onerror="this.parentElement.style.background='linear-gradient(135deg,#FFC501,#FF8C42)'">
        </div>
        <div class="hfc-actions">
          <div class="hfc-actions-left">
            <button class="hfc-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleHomeLike(${post.id}, this)">
              <i class="fa${isLiked ? 's' : 'r'} fa-heart"></i>
              <span>${formatNumber(post.likes + (isLiked && !post.isLiked ? 1 : 0))}</span>
            </button>
            <button class="hfc-action-btn" onclick="navigate('social')">
              <i class="far fa-comment"></i>
              <span>${formatNumber(post.comments)}</span>
            </button>
            <button class="hfc-action-btn" onclick="showToast('แชร์โพสต์แล้ว')">
              <i class="far fa-paper-plane"></i>
            </button>
          </div>
          <button class="hfc-action-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleHomeBookmark(${post.id}, this)">
            <i class="fa${isBookmarked ? 's' : 'r'} fa-bookmark"></i>
          </button>
        </div>
        <div class="hfc-caption">
          <span class="hfc-caption-user">${post.userName.split(' ')[0]}</span>
          <span class="hfc-caption-text">${shortCaption}${needsMore ? '...<span class="hfc-more" onclick="expandCaption(this, `' + fullCaption.replace(/`/g, "'") + '`)">เพิ่มเติม</span>' : ''}</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function expandCaption(el, fullText) {
  const captionTextEl = el.closest('.hfc-caption-text');
  if (captionTextEl) {
    const userName = captionTextEl.previousElementSibling.textContent;
    captionTextEl.innerHTML = fullText;
  }
}

// ===== NEARBY PLACES =====
// Pet-friendly place photos by category (Unsplash)
const placePhotos = {
  'ร้านอาหาร': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400&h=300&fit=crop'
  ],
  'คาเฟ่': [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=300&fit=crop'
  ],
  'โรงแรม': [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop'
  ],
  'สถานที่ท่องเที่ยว': [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop'
  ]
};

// Counter per category for unique photos
const _photoIdx = {};
function getPlacePhoto(category) {
  const photos = placePhotos[category] || placePhotos['คาเฟ่'];
  if (!_photoIdx[category]) _photoIdx[category] = 0;
  const idx = _photoIdx[category] % photos.length;
  _photoIdx[category]++;
  return photos[idx];
}

function renderNearbyPlaces(merchants) {
  const container = document.getElementById('nearbyPlaces');
  if (!container) return;

  const categoryIcons = {
    'ร้านอาหาร': { icon: 'fa-utensils', color: '#E53935' },
    'คาเฟ่': { icon: 'fa-mug-hot', color: '#795548' },
    'โรงแรม': { icon: 'fa-bed', color: '#1E88E5' },
    'สถานที่ท่องเที่ยว': { icon: 'fa-mountain-sun', color: '#43A047' }
  };

  container.innerHTML = merchants.map(m => {
    const catInfo = categoryIcons[m.category] || { icon: 'fa-paw', color: '#FFC501' };
    const photo = getPlacePhoto(m.category);
    const ratingStars = '★'.repeat(Math.floor(m.rating)) + '☆'.repeat(5 - Math.floor(m.rating));
    const distText = m.distance ? `${m.distance.toFixed(1)} km` : '';

    return `
      <div class="nearby-card" onclick="navigate('explore');setTimeout(()=>openMerchant(${m.id}),300)">
        <div class="nearby-img">
          <img src="${photo}" alt="${m.name}" loading="lazy">
          <span class="nearby-cat-badge" style="background:${catInfo.color}"><i class="fas ${catInfo.icon}"></i></span>
        </div>
        <div class="nearby-body">
          <div class="nearby-name">${m.name}</div>
          <div class="nearby-cat">${m.category}${distText ? ' &middot; ' + distText : ''}</div>
          <div class="nearby-rating">
            <span class="nearby-stars">${ratingStars}</span>
            <span>${m.rating}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== FEATURED MERCHANTS =====
function renderFeaturedMerchants(merchants) {
  const container = document.getElementById('featuredMerchants');
  if (!container) return;

  const categoryIcons = {
    'ร้านอาหาร': { icon: 'fa-utensils', color: '#E53935' },
    'คาเฟ่': { icon: 'fa-mug-hot', color: '#795548' },
    'โรงแรม': { icon: 'fa-bed', color: '#1E88E5' },
    'สถานที่ท่องเที่ยว': { icon: 'fa-mountain-sun', color: '#43A047' }
  };

  container.innerHTML = merchants.map(m => {
    const catInfo = categoryIcons[m.category] || { icon: 'fa-paw', color: '#FFC501' };
    const photo = getPlacePhoto(m.category);
    const ratingStars = '★'.repeat(Math.floor(m.rating)) + '☆'.repeat(5 - Math.floor(m.rating));

    return `
      <div class="featured-card" onclick="navigate('explore');setTimeout(()=>openMerchant(${m.id}),300)">
        <div class="featured-img">
          <img src="${photo}" alt="${m.name}" loading="lazy">
          <div class="featured-badge">แนะนำ</div>
          <span class="nearby-cat-badge" style="background:${catInfo.color}"><i class="fas ${catInfo.icon}"></i></span>
        </div>
        <div class="featured-body">
          <div class="featured-name">${m.name}</div>
          <div class="featured-cat">${m.category}</div>
          <div class="featured-rating">
            <span class="featured-stars">${ratingStars}</span>
            <span>${m.rating}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== UPCOMING EVENTS =====
function renderUpcomingEvents(events) {
  const container = document.getElementById('upcomingEvents');
  if (!container) return;

  const thaiMonthShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  container.innerHTML = events.map(e => {
    const date = new Date(e.date);
    const day = date.getDate();
    const month = thaiMonthShort[date.getMonth()];
    const pct = Math.round((e.registered / e.capacity) * 100);
    const full = pct >= 100;

    return `
      <div class="upcoming-card" onclick="navigate('explore');setTimeout(()=>{showExploreTab('events');openEvent(${e.id})},300)">
        <div class="upcoming-img">
          <img src="${e.image}" alt="${e.title}" loading="lazy"
               onerror="this.parentElement.style.background='linear-gradient(135deg,#FFC501,#FF8C42)'">
          <div class="upcoming-date-badge">
            <span class="upcoming-day">${day}</span>
            <span class="upcoming-month">${month}</span>
          </div>
        </div>
        <div class="upcoming-body">
          <div class="upcoming-title">${e.titleTh}</div>
          <div class="upcoming-loc"><i class="fas fa-map-marker-alt"></i> ${e.location.length > 25 ? e.location.substring(0, 25) + '...' : e.location}</div>
          <div class="upcoming-progress">
            <div class="upcoming-progress-bar">
              <div class="upcoming-progress-fill" style="width:${Math.min(pct, 100)}%;background:${full ? 'var(--danger, #E53935)' : 'var(--primary, #FFC501)'}"></div>
            </div>
            <span class="upcoming-progress-text">${full ? 'เต็ม' : `${e.registered}/${e.capacity}`}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== HOME DEALS (Coupons) =====
function renderHomeDeals(coupons) {
  const container = document.getElementById('homeDeals');
  if (!container) return;

  container.innerHTML = coupons.map(c => {
    return `
      <div class="deal-card" onclick="navigate('market');setTimeout(()=>showMarketTab('coupons'),100)">
        <div class="deal-emoji">${c.emoji}</div>
        <div class="deal-info">
          <div class="deal-discount">${c.discountText}</div>
          <div class="deal-merchant">${c.merchantName}</div>
          <div class="deal-expiry"><i class="fas fa-clock"></i> ${c.expiry}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== FEED INTERACTIONS =====
function toggleHomeLike(postId, el) {
  const isNowLiked = TailyStore.toggleLike(postId);
  const icon = el.querySelector('i');
  const count = el.querySelector('span');

  if (isNowLiked) {
    el.classList.add('liked');
    icon.className = 'fas fa-heart';
    // Bounce animation
    icon.style.transform = 'scale(1.3)';
    setTimeout(() => { icon.style.transform = 'scale(1)'; }, 200);
  } else {
    el.classList.remove('liked');
    icon.className = 'far fa-heart';
  }

  // Update count text — parse current and adjust
  if (count) {
    const currentText = count.textContent;
    let currentNum = 0;
    if (currentText.includes('K')) {
      currentNum = parseFloat(currentText) * 1000;
    } else if (currentText.includes('M')) {
      currentNum = parseFloat(currentText) * 1000000;
    } else {
      currentNum = parseInt(currentText) || 0;
    }
    const newNum = isNowLiked ? currentNum + 1 : Math.max(0, currentNum - 1);
    count.textContent = formatNumber(newNum);
  }
}

function toggleHomeBookmark(postId, el) {
  const isNowBookmarked = TailyStore.toggleBookmark(postId);
  const icon = el.querySelector('i');

  if (isNowBookmarked) {
    el.classList.add('bookmarked');
    icon.className = 'fas fa-bookmark';
    showToast('บันทึกโพสต์แล้ว');
  } else {
    el.classList.remove('bookmarked');
    icon.className = 'far fa-bookmark';
    showToast('ยกเลิกการบันทึก');
  }
}
