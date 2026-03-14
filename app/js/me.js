/* ========== TAILY ME TAB v2.0 ========== */

// ===== INIT =====
async function initMe() {
  let profile;
  try {
    profile = TailyStore.get('user') || await MockAPI.getUserProfile();
  } catch (e) {
    profile = null;
  }

  if (profile && profile.user) {
    const u = profile.user;
    const nameEl = document.getElementById('meName');
    const bioEl = document.getElementById('meBio');
    const avatarEl = document.getElementById('meAvatar');
    const postCountEl = document.getElementById('mePostCount');
    const followersEl = document.getElementById('meFollowers');
    const followingEl = document.getElementById('meFollowing');

    if (nameEl) nameEl.textContent = u.name;
    if (bioEl) bioEl.textContent = u.bio || '';
    if (avatarEl) avatarEl.src = u.avatar;

    // Support both flat and nested stats
    const posts = u.stats?.posts ?? u.postCount ?? 45;
    const followers = u.stats?.followers ?? u.followers ?? 328;
    const following = u.stats?.following ?? u.following ?? 156;
    if (postCountEl) postCountEl.textContent = formatNumber(posts);
    if (followersEl) followersEl.textContent = formatNumber(followers);
    if (followingEl) followingEl.textContent = formatNumber(following);
  }

  // Render pet carousel
  if (profile && profile.pets) {
    renderMyPets(profile.pets);
  }

  // Render wallet card
  if (profile && profile.wallet) {
    renderWalletCard(profile.wallet);
  }

  // Render recent activity
  renderRecentActivity();
}

// ===================================================================
//  EDIT PROFILE
// ===================================================================

function editProfile() {
  showMeSection('editprofile');
}

function renderEditProfileSection(container) {
  const user = TailyStore.get('user') || {};
  const u = user?.user || {};

  container.innerHTML = `
    <div class="edit-profile-page">
      <div class="edit-profile-top-bar">
        <button class="back-text" onclick="goBack('me')"><i class="fas fa-arrow-left"></i></button>
        <span class="edit-profile-title">แก้ไขโปรไฟล์</span>
        <button class="save-text" onclick="saveProfile()">บันทึก</button>
      </div>

      <div class="edit-profile-avatar-center" onclick="showToast('เปลี่ยนรูปโปรไฟล์')">
        <div class="edit-avatar-wrap">
          <img src="${u.avatar || ''}" alt="avatar">
          <div class="edit-avatar-camera"><i class="fas fa-camera"></i></div>
        </div>
        <span class="edit-avatar-hint">เปลี่ยนรูป</span>
      </div>

      <div class="edit-field-group">
        <div class="edit-field-row">
          <label>ชื่อ</label>
          <input type="text" id="editName" value="${u.name || ''}" placeholder="ชื่อของคุณ">
        </div>
        <div class="edit-field-row">
          <label>ชื่อผู้ใช้</label>
          <div class="edit-username-wrap">
            <span class="edit-at-prefix">@</span>
            <input type="text" id="editUsername" value="${u.username || ''}" placeholder="username">
          </div>
        </div>
        <div class="edit-field-row edit-field-bio">
          <label>Bio</label>
          <textarea id="editBio" rows="2" maxlength="150" placeholder="เกี่ยวกับตัวคุณ..." oninput="updateBioCounter()">${u.bio || ''}</textarea>
        </div>
        <div class="edit-bio-counter"><span id="editBioCount">${(u.bio || '').length}</span>/150</div>
        <div class="edit-field-row">
          <label>เบอร์โทร</label>
          <input type="tel" id="editPhone" value="${u.phone || ''}" placeholder="0xx-xxx-xxxx">
        </div>
        <div class="edit-field-row">
          <label>อีเมล</label>
          <input type="email" id="editEmail" value="${u.email || ''}" placeholder="you@example.com">
        </div>
        <div class="edit-field-row">
          <label>เพศ</label>
          <select id="editGender">
            <option value="" ${!u.gender ? 'selected' : ''}>ไม่ระบุ</option>
            <option value="male" ${u.gender === 'male' ? 'selected' : ''}>ชาย</option>
            <option value="female" ${u.gender === 'female' ? 'selected' : ''}>หญิง</option>
            <option value="other" ${u.gender === 'other' ? 'selected' : ''}>อื่นๆ</option>
          </select>
        </div>
        <div class="edit-field-row">
          <label>วันเกิด</label>
          <input type="date" id="editBirthday" value="${u.birthday || ''}">
        </div>
      </div>
    </div>
  `;
}

function updateBioCounter() {
  const bio = document.getElementById('editBio');
  const counter = document.getElementById('editBioCount');
  if (bio && counter) counter.textContent = bio.value.length;
}

function saveProfile() {
  const nameVal = document.getElementById('editName')?.value?.trim();
  const bioVal = document.getElementById('editBio')?.value?.trim();
  const usernameVal = document.getElementById('editUsername')?.value?.trim();
  const phoneVal = document.getElementById('editPhone')?.value?.trim();
  const emailVal = document.getElementById('editEmail')?.value?.trim();
  const genderVal = document.getElementById('editGender')?.value;
  const birthdayVal = document.getElementById('editBirthday')?.value;
  const user = TailyStore.get('user') || {};

  if (nameVal && user.user) {
    user.user.name = nameVal;
    user.user.bio = bioVal || '';
    user.user.username = usernameVal || '';
    user.user.phone = phoneVal || '';
    user.user.email = emailVal || '';
    user.user.gender = genderVal || '';
    user.user.birthday = birthdayVal || '';
    TailyStore.set('user', user);

    const nameEl = document.getElementById('meName');
    const bioEl = document.getElementById('meBio');
    if (nameEl) nameEl.textContent = nameVal;
    if (bioEl) bioEl.textContent = bioVal || '';
  }

  goBack('me');
  showToast('บันทึกโปรไฟล์แล้ว');
}

// ===================================================================
//  PET CARDS CAROUSEL
// ===================================================================

function renderMyPets(pets) {
  const container = document.getElementById('myPetsCarousel');
  if (!container) return;

  container.innerHTML = pets.map((pet, idx) => {
    const speciesIcon = pet.species === 'dog' ? 'fa-dog' : 'fa-cat';
    const petImage = pet.avatar || pet.image || '';
    const weightStr = typeof pet.weight === 'number' ? pet.weight + ' kg' : (pet.weight || '');
    const vaccCount = (pet.vaccinations || []).length;
    const nextVacc = (pet.vaccinations || []).find(v => {
      const nd = v.nextDue || v.nextDate;
      return nd && new Date(nd) > new Date('2026-03-11');
    });

    return `
      <div class="my-pet-card" onclick="showPetProfile(${idx})">
        <div class="my-pet-img">
          <img src="${petImage}" alt="${pet.name}" loading="lazy">
          <span class="my-pet-species-badge"><i class="fas ${speciesIcon}"></i></span>
        </div>
        <div class="my-pet-info">
          <div class="my-pet-name">${pet.name}</div>
          <div class="my-pet-breed">${pet.breed}</div>
          <div class="my-pet-meta">
            <span>${pet.age}</span>
            ${weightStr ? `<span>&middot; ${weightStr}</span>` : ''}
          </div>
          ${nextVacc ? `<div class="my-pet-health-alert"><i class="fas fa-syringe"></i> นัดวัคซีนถัดไป</div>` : `<div class="my-pet-health-ok"><i class="fas fa-check-circle"></i> สุขภาพดี</div>`}
        </div>
      </div>
    `;
  }).join('');
}

// ===================================================================
//  WALLET CARD
// ===================================================================

function renderWalletCard(wallet) {
  const balanceEl = document.getElementById('walletBalance');
  const fillEl = document.getElementById('wpFill');

  // Support both data shapes
  const points = wallet.balance ?? wallet.points ?? 0;
  if (balanceEl) balanceEl.textContent = points.toLocaleString();

  const tp = wallet.tierProgress || {};
  const nextMin = tp.nextMin ?? wallet.nextTierPoints ?? 20000;
  const pct = tp.progress ?? Math.min(100, (points / nextMin) * 100);
  const nextTier = tp.next ?? wallet.nextTier ?? 'Platinum';

  if (fillEl) {
    fillEl.style.width = pct + '%';
    const wpText = fillEl.closest('.wallet-progress')?.querySelector('.wp-text');
    if (wpText) wpText.textContent = `${Number(pct).toFixed(1)}% ไป ${nextTier}`;
  }
}

// ===================================================================
//  RECENT ACTIVITY
// ===================================================================

function renderRecentActivity() {
  const container = document.getElementById('meActivity');
  if (!container) return;

  const activities = [
    { icon: 'fa-heart', color: '#E91E63', text: 'ถูกใจโพสต์ของ มินนี่', time: '2026-03-11T10:00:00' },
    { icon: 'fa-shopping-bag', color: '#FFC501', text: 'สั่งซื้อสินค้า 2 ชิ้น', time: '2026-03-10T14:30:00' },
    { icon: 'fa-users', color: '#4CAF50', text: 'เข้าร่วมกลุ่ม Cat Lovers BKK', time: '2026-03-09T16:00:00' },
    { icon: 'fa-comment', color: '#2196F3', text: 'แสดงความคิดเห็นในโพสต์ วิชัย', time: '2026-03-09T11:00:00' },
    { icon: 'fa-map-marker-alt', color: '#FF8C42', text: 'เช็คอิน Jungle de Woof', time: '2026-03-08T18:00:00' }
  ];

  container.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-icon" style="background:${a.color}"><i class="fas ${a.icon}"></i></div>
      <div class="activity-text">${a.text}</div>
      <div class="activity-time">${timeAgo(a.time)}</div>
    </div>
  `).join('');
}

// ===================================================================
//  ME SUB-SECTIONS
// ===================================================================

function showMeSection(section) {
  // Special redirects
  if (section === 'orders') {
    navigate('market');
    setTimeout(() => showMarketTab('orders'), 100);
    return;
  }
  if (section === 'coupons') {
    navigate('market');
    setTimeout(() => showMarketTab('coupons'), 100);
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-me-sub').classList.add('active');

  const container = document.getElementById('meSubContent');
  if (!container) return;

  switch (section) {
    case 'pets':
      renderPetsSection(container);
      break;
    case 'favorites':
      renderFavoritesSection(container);
      break;
    case 'petid':
      renderPetIdSection(container);
      break;
    case 'health':
      renderHealthSection(container);
      break;
    case 'wallet':
      renderWalletSection(container);
      break;
    case 'settings':
      renderSettingsSection(container);
      break;
    case 'notifications':
      renderNotificationsSection(container);
      break;
    case 'vet':
      renderVetSection(container);
      break;
    case 'insurance':
      renderInsuranceSection(container);
      break;
    case 'editprofile':
      renderEditProfileSection(container);
      break;
    case 'training':
      renderTrainingSection(container);
      break;
    case 'petsitting':
      renderPetSittingSection(container);
      break;
    case 'petprofile':
      renderPetProfilePage(container);
      break;
    default:
      container.innerHTML = `
        <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>กลับ</span></button>
        <div class="empty-state"><i class="fas fa-cog"></i><p>เร็วๆ นี้</p></div>
      `;
  }
}

// ===================================================================
//  FAVORITES
// ===================================================================

async function renderFavoritesSection(container) {
  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>รายการโปรด</span></button>
    <div class="me-sub-loading"><div class="spinner"></div></div>
  `;

  const favIds = TailyStore.get('favorites');
  if (!favIds || favIds.size === 0) {
    container.innerHTML = `
      <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>รายการโปรด</span></button>
      <div class="empty-state">
        <i class="fas fa-heart"></i>
        <p>ยังไม่มีรายการโปรด</p>
        <button class="btn-primary btn-sm" onclick="navigate('explore')">ไปสำรวจ</button>
      </div>
    `;
    return;
  }

  let merchants = [];
  try { merchants = await MockAPI.getMerchants(); } catch (e) { /* empty */ }
  const favMerchants = merchants.filter(m => favIds.has(m.id));

  if (!favMerchants.length) {
    container.innerHTML = `
      <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>รายการโปรด</span></button>
      <div class="empty-state">
        <i class="fas fa-heart"></i>
        <p>ยังไม่มีรายการโปรด</p>
        <button class="btn-primary btn-sm" onclick="navigate('explore')">ไปสำรวจ</button>
      </div>
    `;
    return;
  }

  const categoryEmojis = { 'ร้านอาหาร': '🍽️', 'คาเฟ่': '☕', 'โรงแรม': '🏨', 'สถานที่ท่องเที่ยว': '🌿' };

  const cardsHtml = favMerchants.map(m => {
    const emoji = categoryEmojis[m.category] || '🐾';
    return `
      <div class="fav-merchant-card">
        <div class="fav-merchant-emoji">${emoji}</div>
        <div class="fav-merchant-info">
          <div class="fav-merchant-name">${m.name}</div>
          <div class="fav-merchant-cat">${m.category} &middot; ${m.province || ''}</div>
          <div class="fav-merchant-rating"><span class="fav-stars">★</span> ${m.rating}</div>
        </div>
        <button class="fav-remove-btn" onclick="removeFavorite(${m.id}, this)">
          <i class="fas fa-heart" style="color:#E91E63"></i>
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>รายการโปรด (${favMerchants.length})</span></button>
    <div class="favorites-list">${cardsHtml}</div>
  `;
}

function removeFavorite(merchantId, el) {
  TailyStore.toggleFavorite(merchantId);
  const card = el.closest('.fav-merchant-card');
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateX(100%)';
    card.style.transition = 'all 0.3s ease';
    setTimeout(() => card.remove(), 300);
  }
  showToast('ลบออกจากรายการโปรดแล้ว');
}

// ===================================================================
//  PET ID (Digital Pet ID Card)
// ===================================================================

function renderPetIdSection(container) {
  const profile = TailyStore.get('user');
  const pets = profile?.pets || [];

  if (!pets.length) {
    container.innerHTML = `
      <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>Pet ID</span></button>
      <div class="empty-state"><i class="fas fa-id-card"></i><p>ยังไม่มีสัตว์เลี้ยง</p></div>
    `;
    return;
  }

  const cardsHtml = pets.map(pet => {
    const speciesIcon = pet.species === 'dog' ? 'fa-dog' : 'fa-cat';
    const speciesText = pet.species === 'dog' ? 'สุนัข' : 'แมว';
    const petImage = pet.avatar || pet.image || '';
    const genderText = pet.gender === 'male' ? 'ชาย' : pet.gender === 'female' ? 'หญิง' : pet.gender;
    const weightStr = typeof pet.weight === 'number' ? pet.weight + ' kg' : (pet.weight || '');

    const vaccBadges = (pet.vaccinations || []).map(v =>
      `<span class="petid-vacc-item"><i class="fas fa-check-circle" style="color:#4CAF50"></i> ${v.name}</span>`
    ).join('');

    return `
      <div class="petid-card">
        <div class="petid-card-header">
          <div class="petid-logo">
            <svg width="24" height="24" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="#FFC501"/><text x="11" y="52" font-family="Arial Black,Inter,sans-serif" font-size="22" font-weight="900" fill="#3D2B1F" letter-spacing="1">T</text><g transform="translate(24,28)"><ellipse cx="6" cy="14" rx="6" ry="5" fill="#3D2B1F"/><circle cx="1" cy="6" r="2.5" fill="#3D2B1F"/><circle cx="6" cy="3.5" r="2.5" fill="#3D2B1F"/><circle cx="11" cy="6" r="2.5" fill="#3D2B1F"/></g><text x="38" y="52" font-family="Arial Black,Inter,sans-serif" font-size="22" font-weight="900" fill="#3D2B1F" letter-spacing="1">ILY</text></svg>
          </div>
          <span class="petid-title">TAILY PET ID</span>
          <span class="petid-species-badge"><i class="fas ${speciesIcon}"></i> ${speciesText}</span>
        </div>

        <div class="petid-card-body">
          <div class="petid-photo-section">
            <img class="petid-photo" src="${petImage}" alt="${pet.name}" loading="lazy">
          </div>
          <div class="petid-info-section">
            <h3 class="petid-name">${pet.name}</h3>
            <div class="petid-detail"><span class="petid-label">สายพันธุ์</span><span>${pet.breed}</span></div>
            <div class="petid-detail"><span class="petid-label">อายุ</span><span>${pet.age}</span></div>
            <div class="petid-detail"><span class="petid-label">เพศ</span><span>${genderText}</span></div>
            <div class="petid-detail"><span class="petid-label">น้ำหนัก</span><span>${weightStr}</span></div>
          </div>
          <div class="petid-qr-column">
            <svg class="petid-qr" width="100" height="100" viewBox="0 0 80 80">
              <rect x="0" y="0" width="80" height="80" fill="#fff" stroke="#ddd" rx="8"/>
              <rect x="8" y="8" width="24" height="24" fill="#3D2B1F" rx="4"/>
              <rect x="48" y="8" width="24" height="24" fill="#3D2B1F" rx="4"/>
              <rect x="8" y="48" width="24" height="24" fill="#3D2B1F" rx="4"/>
              <rect x="14" y="14" width="12" height="12" fill="#FFC501" rx="2"/>
              <rect x="54" y="14" width="12" height="12" fill="#FFC501" rx="2"/>
              <rect x="14" y="54" width="12" height="12" fill="#FFC501" rx="2"/>
              <rect x="36" y="36" width="8" height="8" fill="#3D2B1F" rx="1"/>
              <rect x="48" y="48" width="8" height="8" fill="#3D2B1F" rx="1"/>
              <rect x="60" y="48" width="8" height="8" fill="#3D2B1F" rx="1"/>
              <rect x="48" y="60" width="8" height="8" fill="#3D2B1F" rx="1"/>
              <rect x="60" y="60" width="8" height="8" fill="#3D2B1F" rx="1"/>
            </svg>
            <div class="petid-chip-inline">
              <i class="fas fa-microchip"></i>
              <span>${pet.microchipId || 'ไม่ระบุ'}</span>
            </div>
            <span class="petid-qr-text">สแกนเพื่อดูข้อมูล</span>
          </div>
        </div>

        ${vaccBadges ? `
        <div class="petid-vacc-section">
          <h4><i class="fas fa-syringe"></i> วัคซีน</h4>
          <div class="petid-vacc-list">${vaccBadges}</div>
        </div>` : ''}

        <div class="petid-owner-section">
          <span class="petid-owner-label">เจ้าของ</span>
          <span class="petid-owner-name">${profile?.user?.name || 'ไม่ระบุ'}</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>Pet ID</span></button>
    <div class="petid-list">${cardsHtml}</div>
  `;
}

// ===================================================================
//  PETS SECTION (All Pets)
// ===================================================================

function renderPetsSection(container) {
  const profile = TailyStore.get('user');
  const pets = profile?.pets || [];

  const cardsHtml = pets.map(pet => {
    const speciesIcon = pet.species === 'dog' ? 'fa-dog' : 'fa-cat';
    const petImage = pet.avatar || pet.image || '';
    const weightStr = typeof pet.weight === 'number' ? pet.weight + ' kg' : (pet.weight || '');

    return `
      <div class="pets-section-card" onclick="showMeSection('petid')">
        <img class="pets-section-img" src="${petImage}" alt="${pet.name}" loading="lazy">
        <div class="pets-section-info">
          <h4><i class="fas ${speciesIcon}"></i> ${pet.name}</h4>
          <p>${pet.breed}</p>
          <span>${pet.age} &middot; ${weightStr}</span>
        </div>
        <i class="fas fa-chevron-right" style="color:var(--text-secondary);font-size:14px"></i>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>สัตว์เลี้ยงของฉัน</span></button>
    <div class="pets-section-list">${cardsHtml || '<div class="empty-state"><i class="fas fa-paw"></i><p>ยังไม่มีสัตว์เลี้ยง</p></div>'}</div>
  `;
}

// ===================================================================
//  HEALTH RECORDS
// ===================================================================

function renderHealthSection(container) {
  const profile = TailyStore.get('user');
  const pets = profile?.pets || [];

  const now = new Date('2026-03-11');

  let timelineHtml = '';
  pets.forEach(pet => {
    const speciesIcon = pet.species === 'dog' ? 'fa-dog' : 'fa-cat';
    timelineHtml += `<h3 class="health-pet-name"><i class="fas ${speciesIcon}"></i> ${pet.name}</h3>`;

    const records = (pet.vaccinations || []).map(v => {
      const vaccDate = new Date(v.date);
      const nextDateStr = v.nextDue || v.nextDate || '';
      const nextDate = nextDateStr ? new Date(nextDateStr) : null;
      const isPast = vaccDate <= now;

      // Color based on status field or date comparison
      let dotColor = '#4CAF50'; // default green (current)
      if (v.status === 'overdue') dotColor = '#E53935';
      else if (v.status === 'upcoming') dotColor = '#FF9800';
      else if (!isPast) dotColor = '#FF9800';

      return `
        <div class="health-timeline-item">
          <div class="health-timeline-dot" style="background:${dotColor}"></div>
          <div class="health-timeline-content">
            <div class="health-timeline-date">${formatThaiDate(v.date)}</div>
            <div class="health-timeline-name">${v.name}</div>
            ${v.vet ? `<div class="health-timeline-vet"><i class="fas fa-hospital"></i> ${v.vet}</div>` : ''}
            ${nextDateStr ? `<div class="health-timeline-next"><i class="fas fa-calendar-alt"></i> นัดถัดไป: ${formatThaiDate(nextDateStr)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    timelineHtml += `<div class="health-timeline">${records}</div>`;
  });

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>สุขภาพสัตว์เลี้ยง</span></button>
    <div class="health-section">
      ${timelineHtml || '<div class="empty-state"><i class="fas fa-notes-medical"></i><p>ยังไม่มีข้อมูลสุขภาพ</p></div>'}
    </div>
  `;
}

// ===================================================================
//  WALLET DETAIL
// ===================================================================

function renderWalletSection(container) {
  const profile = TailyStore.get('user');
  const wallet = profile?.wallet || {};

  // Support both data shapes
  const points = wallet.balance ?? wallet.points ?? 0;
  const tp = wallet.tierProgress || {};
  const tier = tp.current ?? wallet.tier ?? 'Gold';
  const nextTier = tp.next ?? wallet.nextTier ?? 'Platinum';
  const nextTierPoints = tp.nextMin ?? wallet.nextTierPoints ?? 20000;
  const pct = tp.progress ?? Math.min(100, (points / nextTierPoints) * 100);
  const transactions = wallet.transactions || wallet.history || [];

  const historyHtml = transactions.map(h => {
    const isEarn = h.type === 'earn';
    const amount = h.amount;
    const amountColor = isEarn ? '#4CAF50' : '#E53935';
    const amountPrefix = isEarn ? '+' : '';
    const icon = h.icon || (isEarn ? 'fa-plus-circle' : 'fa-minus-circle');

    return `
      <div class="wallet-history-item">
        <div class="wallet-history-icon" style="color:${amountColor}"><i class="fas ${icon}"></i></div>
        <div class="wallet-history-info">
          <div class="wallet-history-desc">${h.desc}</div>
          <div class="wallet-history-date">${formatThaiDate(h.date)}</div>
        </div>
        <div class="wallet-history-amount" style="color:${amountColor}">${amountPrefix}${Math.abs(amount).toLocaleString()}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>Taily Wallet</span></button>
    <div class="wallet-detail">
      <div class="wallet-detail-card">
        <div class="wallet-detail-top">
          <span class="wallet-detail-label"><i class="fas fa-wallet"></i> Taily Points</span>
          <span class="wallet-detail-tier"><i class="fas fa-crown"></i> ${tier}</span>
        </div>
        <div class="wallet-detail-balance">${points.toLocaleString()}</div>
        <div class="wallet-detail-sub">คะแนนสะสมของคุณ</div>
        <div class="wallet-detail-progress">
          <div class="wp-bar"><div class="wp-fill" style="width:${pct}%"></div></div>
          <span class="wp-text">${Number(pct).toFixed(1)}% ไป ${nextTier}</span>
        </div>
      </div>

      <div class="wallet-actions">
        <button class="wallet-action-btn" onclick="showComingSoon('เติมเงิน')"><i class="fas fa-plus-circle"></i><span>เติมคะแนน</span></button>
        <button class="wallet-action-btn" onclick="showComingSoon('แลกคะแนน')"><i class="fas fa-gift"></i><span>แลกรางวัล</span></button>
        <button class="wallet-action-btn" onclick="showComingSoon('โอนคะแนน')"><i class="fas fa-paper-plane"></i><span>โอนคะแนน</span></button>
      </div>

      ${historyHtml ? `
        <div class="wallet-history-section">
          <h3><i class="fas fa-clock-rotate-left"></i> ประวัติ</h3>
          ${historyHtml}
        </div>
      ` : ''}
    </div>
  `;
}

// ===================================================================
//  SETTINGS
// ===================================================================

function renderSettingsSection(container) {
  const profile = TailyStore.get('user');
  const u = profile?.user || {};

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>ตั้งค่า</span></button>
    <div class="settings-page">
      <div class="settings-group">
        <h4><i class="fas fa-bell"></i> การแจ้งเตือน</h4>
        <div class="settings-item">
          <span>การแจ้งเตือนทั่วไป</span>
          <label class="toggle-switch">
            <input type="checkbox" checked onchange="showToast(this.checked ? 'เปิดการแจ้งเตือน' : 'ปิดการแจ้งเตือน')">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-item">
          <span>การแจ้งเตือนโปรโมชัน</span>
          <label class="toggle-switch">
            <input type="checkbox" checked onchange="showToast(this.checked ? 'เปิดการแจ้งเตือนโปรโมชัน' : 'ปิดการแจ้งเตือนโปรโมชัน')">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-group">
        <h4><i class="fas fa-palette"></i> การแสดงผล</h4>
        <div class="settings-item">
          <span>โหมดมืด</span>
          <label class="toggle-switch">
            <input type="checkbox" onchange="showToast('โหมดมืด (เร็วๆ นี้)')">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-item">
          <span>ภาษา</span>
          <span class="settings-value">ไทย</span>
        </div>
      </div>

      <div class="settings-group">
        <h4><i class="fas fa-user"></i> บัญชี</h4>
        <div class="settings-item">
          <span>อีเมล</span>
          <span class="settings-value">${u.email || 'somchai@email.com'}</span>
        </div>
        <div class="settings-item">
          <span>เบอร์โทร</span>
          <span class="settings-value">${u.phone || '081-XXX-XXXX'}</span>
        </div>
        <div class="settings-item clickable" onclick="editProfile()">
          <span>แก้ไขโปรไฟล์</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>

      <div class="settings-group">
        <h4><i class="fas fa-info-circle"></i> เกี่ยวกับ</h4>
        <div class="settings-item">
          <span>เวอร์ชัน</span>
          <span class="settings-value">Taily v2.0</span>
        </div>
        <div class="settings-item clickable" onclick="showComingSoon('เงื่อนไขการใช้งาน')">
          <span>เงื่อนไขการใช้งาน</span>
          <i class="fas fa-chevron-right"></i>
        </div>
        <div class="settings-item clickable" onclick="showComingSoon('นโยบายความเป็นส่วนตัว')">
          <span>นโยบายความเป็นส่วนตัว</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>

      <button class="btn-outline btn-block settings-logout" onclick="showToast('ออกจากระบบแล้ว')">
        <i class="fas fa-sign-out-alt"></i> ออกจากระบบ
      </button>
    </div>
  `;
}

// ===================================================================
//  NOTIFICATIONS
// ===================================================================

async function renderNotificationsSection(container) {
  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>การแจ้งเตือน</span></button>
    <div class="me-sub-loading"><div class="spinner"></div></div>
  `;

  let notifications = [];
  try { notifications = await MockAPI.getNotifications(); } catch (e) { /* empty */ }

  if (!notifications || !notifications.length) {
    container.innerHTML = `
      <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>การแจ้งเตือน</span></button>
      <div class="empty-state"><i class="fas fa-bell-slash"></i><p>ไม่มีการแจ้งเตือน</p></div>
    `;
    return;
  }

  // Group by date
  const groups = {};
  const nowStr = '2026-03-11';
  const yesterdayStr = '2026-03-10';

  notifications.forEach(n => {
    const ts = n.timestamp || n.time || '';
    const dateStr = ts.substring(0, 10);
    let label;
    if (dateStr === nowStr) label = 'วันนี้';
    else if (dateStr === yesterdayStr) label = 'เมื่อวาน';
    else label = formatThaiDate(dateStr);

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });

  const typeIcons = {
    like:    { icon: 'fa-heart',       color: '#E91E63' },
    comment: { icon: 'fa-comment',     color: '#2196F3' },
    follow:  { icon: 'fa-user-plus',   color: '#4CAF50' },
    order:   { icon: 'fa-box',         color: '#FF8C42' },
    event:   { icon: 'fa-calendar-star',color: '#9C27B0' },
    coupon:  { icon: 'fa-ticket-alt',  color: '#FFC501' },
    system:  { icon: 'fa-info-circle', color: '#607D8B' },
    promo:   { icon: 'fa-tag',         color: '#FF8C42' },
    group:   { icon: 'fa-users',       color: '#4CAF50' },
    health:  { icon: 'fa-notes-medical',color: '#E53935' }
  };

  let html = '';
  Object.keys(groups).forEach(dateLabel => {
    html += `<div class="notif-date-group"><h4 class="notif-date-label">${dateLabel}</h4>`;
    groups[dateLabel].forEach(n => {
      const typeConfig = typeIcons[n.type] || { icon: 'fa-bell', color: '#9E9E9E' };
      const isUnread = n.read === false;
      const actionHash = n.action || '';
      const actionTab = actionHash.replace('#', '');

      html += `
        <div class="notif-item ${isUnread ? 'notif-unread' : ''}" onclick="handleNotifClick('${actionTab}')">
          <div class="notif-icon-wrap">
            ${n.image ? `<img class="notif-image" src="${n.image}" alt="" loading="lazy">` : `<div class="notif-icon" style="background:${typeConfig.color}"><i class="fas ${typeConfig.icon}"></i></div>`}
          </div>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            ${n.body ? `<div class="notif-body">${n.body}</div>` : ''}
            <div class="notif-time">${timeAgo(n.timestamp || n.time)}</div>
          </div>
          ${isUnread ? '<div class="notif-unread-dot"></div>' : ''}
        </div>
      `;
    });
    html += `</div>`;
  });

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>การแจ้งเตือน</span></button>
    <div class="notifications-list">${html}</div>
  `;
}

function handleNotifClick(actionTab) {
  if (actionTab && ['home', 'explore', 'market', 'social', 'me'].includes(actionTab)) {
    navigate(actionTab);
  } else if (actionTab === 'events') {
    navigate('explore');
    setTimeout(() => showExploreTab('events'), 100);
  } else if (actionTab === 'coupons') {
    navigate('market');
    setTimeout(() => showMarketTab('coupons'), 100);
  } else if (actionTab === 'profile') {
    navigate('me');
  }
}

// ===================================================================
//  VET (สัตวแพทย์) — Taily Med
// ===================================================================

function renderVetSection(container) {
  const profile = TailyStore.get('user');
  const pets = profile?.pets || [];

  // Mock vet clinics
  const vetClinics = [
    {
      id: 1, name: 'Taily Animal Hospital',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=250&fit=crop',
      rating: 4.9, reviews: 328, distance: '1.2 km',
      address: 'สุขุมวิท ซอย 39 กรุงเทพฯ',
      hours: '08:00 - 20:00', phone: '02-123-4567',
      services: ['ตรวจสุขภาพ', 'วัคซีน', 'ทำหมัน', 'ทำฟัน', 'ผ่าตัด'],
      isOpen: true, isPartner: true
    },
    {
      id: 2, name: 'Pet Wellness Clinic',
      image: 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=400&h=250&fit=crop',
      rating: 4.8, reviews: 215, distance: '2.5 km',
      address: 'ทองหล่อ ซอย 13 กรุงเทพฯ',
      hours: '09:00 - 21:00', phone: '02-234-5678',
      services: ['ตรวจสุขภาพ', 'วัคซีน', 'อัลตราซาวด์', 'Lab'],
      isOpen: true, isPartner: true
    },
    {
      id: 3, name: 'Happy Paws Vet',
      image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=250&fit=crop',
      rating: 4.7, reviews: 189, distance: '3.8 km',
      address: 'พระราม 9 ซอย 13 กรุงเทพฯ',
      hours: '10:00 - 19:00', phone: '02-345-6789',
      services: ['ตรวจสุขภาพ', 'วัคซีน', 'ทำหมัน', 'Grooming'],
      isOpen: false, isPartner: false
    },
    {
      id: 4, name: 'Bangkok Pet Hospital',
      image: 'https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=400&h=250&fit=crop',
      rating: 4.9, reviews: 456, distance: '5.1 km',
      address: 'ลาดพร้าว 71 กรุงเทพฯ',
      hours: '24 ชม.', phone: '02-456-7890',
      services: ['ฉุกเฉิน 24 ชม.', 'ผ่าตัด', 'ICU', 'วัคซีน', 'Lab'],
      isOpen: true, isPartner: true
    }
  ];

  // Mock upcoming appointments
  const appointments = [];
  if (pets.length > 0) {
    const pet = pets[0];
    const upcomingVacc = (pet.vaccinations || []).find(v => {
      const nd = v.nextDue || v.nextDate;
      return nd && new Date(nd) > new Date('2026-03-11');
    });
    if (upcomingVacc) {
      appointments.push({
        pet: pet.name,
        petIcon: pet.species === 'dog' ? 'fa-dog' : 'fa-cat',
        type: upcomingVacc.name,
        date: upcomingVacc.nextDue || upcomingVacc.nextDate,
        clinic: 'Taily Animal Hospital',
        status: 'upcoming'
      });
    }
  }

  const appointmentHtml = appointments.length ? appointments.map(apt => `
    <div class="vet-appointment-card">
      <div class="vet-apt-left">
        <div class="vet-apt-date">
          <span class="vet-apt-day">${new Date(apt.date).getDate()}</span>
          <span class="vet-apt-month">${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][new Date(apt.date).getMonth()]}</span>
        </div>
      </div>
      <div class="vet-apt-info">
        <div class="vet-apt-type"><i class="fas ${apt.petIcon}"></i> ${apt.pet} — ${apt.type}</div>
        <div class="vet-apt-clinic"><i class="fas fa-hospital"></i> ${apt.clinic}</div>
      </div>
      <span class="vet-apt-status">${apt.status === 'upcoming' ? 'นัดหมาย' : 'เสร็จสิ้น'}</span>
    </div>
  `).join('') : `
    <div class="vet-empty-apt">
      <i class="fas fa-calendar-check"></i>
      <p>ไม่มีนัดหมายที่กำลังจะถึง</p>
      <button class="btn-primary btn-sm" onclick="showToast('จองนัดหมาย (Demo)')">จองนัดหมาย</button>
    </div>
  `;

  const clinicsHtml = vetClinics.map(c => `
    <div class="vet-clinic-card" onclick="openVetClinicDetail(${c.id})">
      <div class="vet-clinic-img">
        <img src="${c.image}" alt="${c.name}" loading="lazy">
        ${c.isPartner ? '<span class="vet-partner-badge"><i class="fas fa-check-circle"></i> พาร์ทเนอร์</span>' : ''}
        <span class="vet-open-badge ${c.isOpen ? 'open' : 'closed'}">${c.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}</span>
      </div>
      <div class="vet-clinic-info">
        <h4>${c.name}</h4>
        <div class="vet-clinic-rating"><span class="vet-stars">★</span> ${c.rating} <span class="vet-review-count">(${c.reviews})</span></div>
        <div class="vet-clinic-meta"><i class="fas fa-map-marker-alt"></i> ${c.distance} &middot; ${c.address}</div>
        <div class="vet-clinic-meta"><i class="fas fa-clock"></i> ${c.hours}</div>
        <div class="vet-clinic-services">${c.services.slice(0, 3).map(s => `<span class="vet-service-tag">${s}</span>`).join('')}${c.services.length > 3 ? `<span class="vet-service-more">+${c.services.length - 3}</span>` : ''}</div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>Taily Med — สัตวแพทย์</span></button>

    <!-- Emergency Banner -->
    <div class="vet-emergency-banner">
      <div class="vet-emergency-icon"><i class="fas fa-phone-alt"></i></div>
      <div class="vet-emergency-text">
        <strong>ฉุกเฉิน 24 ชม.</strong>
        <span>โทรหาสัตวแพทย์ทันที</span>
      </div>
      <button class="vet-emergency-btn" onclick="showToast('กำลังโทร... (Demo)')"><i class="fas fa-phone"></i> โทรเลย</button>
    </div>

    <!-- Quick Services -->
    <div class="vet-quick-services">
      <button class="vet-quick-btn" onclick="showToast('จองตรวจสุขภาพ (Demo)')"><div class="vet-qb-icon" style="background:#E3F2FD;color:#1565C0"><i class="fas fa-stethoscope"></i></div><span>ตรวจสุขภาพ</span></button>
      <button class="vet-quick-btn" onclick="showToast('จองฉีดวัคซีน (Demo)')"><div class="vet-qb-icon" style="background:#E8F5E9;color:#2E7D32"><i class="fas fa-syringe"></i></div><span>วัคซีน</span></button>
      <button class="vet-quick-btn" onclick="showToast('จองทำหมัน (Demo)')"><div class="vet-qb-icon" style="background:#FFF3E0;color:#E65100"><i class="fas fa-cut"></i></div><span>ทำหมัน</span></button>
      <button class="vet-quick-btn" onclick="showToast('จองทำฟัน (Demo)')"><div class="vet-qb-icon" style="background:#F3E5F5;color:#7B1FA2"><i class="fas fa-tooth"></i></div><span>ทำฟัน</span></button>
    </div>

    <!-- Upcoming Appointments -->
    <div class="vet-section">
      <h3 class="vet-section-title"><i class="fas fa-calendar-alt"></i> นัดหมายที่กำลังจะถึง</h3>
      ${appointmentHtml}
    </div>

    <!-- Nearby Vet Clinics -->
    <div class="vet-section">
      <h3 class="vet-section-title"><i class="fas fa-hospital"></i> คลินิกสัตวแพทย์ใกล้คุณ</h3>
      <div class="vet-clinics-list">${clinicsHtml}</div>
    </div>
  `;
}

function openVetClinicDetail(clinicId) {
  // Show a detailed modal for the clinic
  const clinics = {
    1: { name: 'Taily Animal Hospital', image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=350&fit=crop', rating: 4.9, reviews: 328, address: 'สุขุมวิท ซอย 39 กรุงเทพฯ', hours: '08:00 - 20:00', phone: '02-123-4567', services: ['ตรวจสุขภาพทั่วไป', 'วัคซีนป้องกันโรค', 'ทำหมัน', 'ทำฟัน / ขูดหินปูน', 'ผ่าตัด', 'อัลตราซาวด์', 'เอกซเรย์', 'Lab ตรวจเลือด'], desc: 'โรงพยาบาลสัตว์ชั้นนำ พาร์ทเนอร์กับ Taily ให้บริการดูแลสุขภาพสัตว์เลี้ยงครบวงจร พร้อมทีมสัตวแพทย์ผู้เชี่ยวชาญ', isPartner: true },
    2: { name: 'Pet Wellness Clinic', image: 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=600&h=350&fit=crop', rating: 4.8, reviews: 215, address: 'ทองหล่อ ซอย 13 กรุงเทพฯ', hours: '09:00 - 21:00', phone: '02-234-5678', services: ['ตรวจสุขภาพ', 'วัคซีน', 'อัลตราซาวด์', 'Lab ตรวจเลือด', 'ตรวจผิวหนัง', 'โภชนาการ'], desc: 'คลินิกสุขภาพสัตว์เลี้ยงที่เน้นการดูแลสุขภาพเชิงป้องกัน ด้วยเครื่องมือทันสมัย', isPartner: true },
    3: { name: 'Happy Paws Vet', image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=350&fit=crop', rating: 4.7, reviews: 189, address: 'พระราม 9 ซอย 13 กรุงเทพฯ', hours: '10:00 - 19:00', phone: '02-345-6789', services: ['ตรวจสุขภาพ', 'วัคซีน', 'ทำหมัน', 'Grooming', 'Pet Hotel'], desc: 'คลินิกสัตว์เลี้ยงที่อบอุ่นเหมือนบ้าน พร้อมบริการ Grooming และ Pet Hotel', isPartner: false },
    4: { name: 'Bangkok Pet Hospital', image: 'https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=600&h=350&fit=crop', rating: 4.9, reviews: 456, address: 'ลาดพร้าว 71 กรุงเทพฯ', hours: '24 ชั่วโมง', phone: '02-456-7890', services: ['ฉุกเฉิน 24 ชม.', 'ผ่าตัดซับซ้อน', 'ICU สัตว์ป่วย', 'วัคซีน', 'Lab', 'เอกซเรย์', 'อัลตราซาวด์'], desc: 'โรงพยาบาลสัตว์เปิด 24 ชม. พร้อมห้อง ICU และทีมผ่าตัดเฉพาะทาง', isPartner: true }
  };
  const c = clinics[clinicId];
  if (!c) return;

  const modal = document.createElement('div');
  modal.className = 'vet-detail-modal';
  modal.innerHTML = `
    <div class="vet-detail-content">
      <div class="vet-detail-hero">
        <img src="${c.image}" alt="${c.name}" loading="lazy">
        <div class="vet-detail-hero-overlay"></div>
        <button class="vet-detail-close" onclick="this.closest('.vet-detail-modal').remove()"><i class="fas fa-times"></i></button>
        ${c.isPartner ? '<span class="vet-partner-badge lg"><i class="fas fa-check-circle"></i> Taily Partner</span>' : ''}
      </div>
      <div class="vet-detail-body">
        <h2>${c.name}</h2>
        <div class="vet-detail-rating"><span class="vet-stars">★</span> ${c.rating} <span>(${c.reviews} รีวิว)</span></div>
        <p class="vet-detail-desc">${c.desc}</p>

        <div class="vet-detail-info-list">
          <div class="vet-detail-info-item"><i class="fas fa-map-marker-alt"></i><span>${c.address}</span></div>
          <div class="vet-detail-info-item"><i class="fas fa-clock"></i><span>${c.hours}</span></div>
          <div class="vet-detail-info-item"><i class="fas fa-phone"></i><span>${c.phone}</span></div>
        </div>

        <h3>บริการ</h3>
        <div class="vet-detail-services">${c.services.map(s => `<span class="vet-service-tag lg">${s}</span>`).join('')}</div>

        <div class="vet-detail-actions">
          <button class="btn-primary btn-block" onclick="showToast('จองนัดหมาย (Demo)');this.closest('.vet-detail-modal').remove()"><i class="fas fa-calendar-plus"></i> จองนัดหมาย</button>
          <button class="btn-outline btn-block" onclick="showToast('กำลังโทร... (Demo)')"><i class="fas fa-phone"></i> โทรศัพท์</button>
          <button class="btn-outline btn-block" onclick="showToast('เปิดแผนที่ (Demo)')"><i class="fas fa-directions"></i> นำทาง</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));
}

// ===================================================================
//  INSURANCE (ประกัน)
// ===================================================================

function renderInsuranceSection(container) {
  const profile = TailyStore.get('user');
  const pets = profile?.pets || [];

  // Mock insurance plans
  const plans = [
    {
      id: 1, name: 'Taily Care Basic',
      icon: 'fa-shield-alt', color: '#2196F3',
      price: '299', period: '/เดือน',
      coverage: '50,000',
      features: ['ค่ารักษาพยาบาล สูงสุด 50,000/ปี', 'ค่าวัคซีนประจำปี 3,000', 'ค่าทำหมัน 5,000', 'ปรึกษาสัตวแพทย์ออนไลน์'],
      recommended: false
    },
    {
      id: 2, name: 'Taily Care Plus',
      icon: 'fa-shield-dog', color: '#FFC501',
      price: '599', period: '/เดือน',
      coverage: '150,000',
      features: ['ค่ารักษาพยาบาล สูงสุด 150,000/ปี', 'ค่าวัคซีนประจำปี 5,000', 'ค่าทำหมัน 8,000', 'ผ่าตัด 100,000/ครั้ง', 'ปรึกษาสัตวแพทย์ 24 ชม.', 'ค่า Grooming 500/เดือน'],
      recommended: true
    },
    {
      id: 3, name: 'Taily Care Premium',
      icon: 'fa-crown', color: '#9C27B0',
      price: '999', period: '/เดือน',
      coverage: '500,000',
      features: ['ค่ารักษาพยาบาล สูงสุด 500,000/ปี', 'ค่าวัคซีนทุกชนิด', 'ผ่าตัดไม่จำกัด', 'ปรึกษาสัตวแพทย์ 24 ชม.', 'ค่า Grooming 1,000/เดือน', 'Pet Hotel 3 วัน/เดือน', 'ชดเชยค่าเสียชีวิต 30,000'],
      recommended: false
    }
  ];

  // Mock active policies for user pets
  const activePolicies = pets.length > 0 ? [{
    pet: pets[0].name,
    petIcon: pets[0].species === 'dog' ? 'fa-dog' : 'fa-cat',
    plan: 'Taily Care Plus',
    policyNo: 'TLY-INS-2026-001',
    startDate: '2026-01-15',
    endDate: '2027-01-14',
    coverage: '150,000',
    status: 'active'
  }] : [];

  const policyHtml = activePolicies.length ? activePolicies.map(p => `
    <div class="ins-policy-card">
      <div class="ins-policy-header">
        <div class="ins-policy-pet"><i class="fas ${p.petIcon}"></i> ${p.pet}</div>
        <span class="ins-policy-status active"><i class="fas fa-check-circle"></i> คุ้มครองอยู่</span>
      </div>
      <div class="ins-policy-plan">${p.plan}</div>
      <div class="ins-policy-meta">
        <div><i class="fas fa-file-alt"></i> กรมธรรม์: ${p.policyNo}</div>
        <div><i class="fas fa-calendar"></i> ${formatThaiDate(p.startDate)} - ${formatThaiDate(p.endDate)}</div>
        <div><i class="fas fa-shield-alt"></i> วงเงินคุ้มครอง: ฿${p.coverage}</div>
      </div>
      <div class="ins-policy-actions">
        <button class="btn-outline btn-sm" onclick="showToast('ดูรายละเอียดกรมธรรม์ (Demo)')"><i class="fas fa-eye"></i> ดูรายละเอียด</button>
        <button class="btn-outline btn-sm" onclick="showToast('เคลม (Demo)')"><i class="fas fa-file-medical"></i> เคลมประกัน</button>
      </div>
    </div>
  `).join('') : '';

  const plansHtml = plans.map(p => `
    <div class="ins-plan-card ${p.recommended ? 'recommended' : ''}">
      ${p.recommended ? '<div class="ins-recommended-badge"><i class="fas fa-star"></i> แนะนำ</div>' : ''}
      <div class="ins-plan-header">
        <div class="ins-plan-icon" style="background:${p.color}"><i class="fas ${p.icon}"></i></div>
        <div>
          <h4>${p.name}</h4>
          <div class="ins-plan-coverage">วงเงินคุ้มครอง ฿${p.coverage}</div>
        </div>
      </div>
      <div class="ins-plan-price"><span class="ins-price-amount">฿${p.price}</span><span class="ins-price-period">${p.period}</span></div>
      <ul class="ins-plan-features">${p.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}</ul>
      <button class="btn-primary btn-block btn-sm" onclick="showToast('สมัครแผน ${p.name} (Demo)')"><i class="fas fa-shield-alt"></i> สมัครเลย</button>
    </div>
  `).join('');

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>ประกันสัตว์เลี้ยง</span></button>

    <!-- Insurance Hero -->
    <div class="ins-hero">
      <div class="ins-hero-bg">
        <img src="https://images.unsplash.com/photo-1450778869180-e77b3e76203b?w=600&h=300&fit=crop" alt="ประกันสัตว์เลี้ยง" loading="lazy">
        <div class="ins-hero-overlay"></div>
      </div>
      <div class="ins-hero-content">
        <h2><i class="fas fa-shield-dog"></i> Taily Insurance</h2>
        <p>คุ้มครองสัตว์เลี้ยงที่คุณรัก ตั้งแต่วันแรก</p>
      </div>
    </div>

    ${policyHtml ? `
      <div class="ins-section">
        <h3 class="ins-section-title"><i class="fas fa-file-contract"></i> กรมธรรม์ของฉัน</h3>
        ${policyHtml}
      </div>
    ` : ''}

    <!-- Insurance Plans -->
    <div class="ins-section">
      <h3 class="ins-section-title"><i class="fas fa-list-alt"></i> แผนประกัน</h3>
      <div class="ins-plans-list">${plansHtml}</div>
    </div>

    <!-- FAQ -->
    <div class="ins-section">
      <h3 class="ins-section-title"><i class="fas fa-question-circle"></i> คำถามที่พบบ่อย</h3>
      <div class="ins-faq-list">
        <div class="ins-faq-item" onclick="this.classList.toggle('open')">
          <div class="ins-faq-q"><span>สัตว์เลี้ยงอายุเท่าไหร่ที่สมัครได้?</span><i class="fas fa-chevron-down"></i></div>
          <div class="ins-faq-a">สุนัขและแมวอายุ 2 เดือน - 8 ปี สามารถสมัครประกันได้ โดยต้องมีประวัติวัคซีนครบถ้วน</div>
        </div>
        <div class="ins-faq-item" onclick="this.classList.toggle('open')">
          <div class="ins-faq-q"><span>เคลมประกันได้อย่างไร?</span><i class="fas fa-chevron-down"></i></div>
          <div class="ins-faq-a">กดปุ่ม "เคลมประกัน" ในแอป แนบใบเสร็จและรายงานจากสัตวแพทย์ ระบบจะตรวจสอบและโอนเงินภายใน 3-5 วันทำการ</div>
        </div>
        <div class="ins-faq-item" onclick="this.classList.toggle('open')">
          <div class="ins-faq-q"><span>มีระยะเวลารอคอยไหม?</span><i class="fas fa-chevron-down"></i></div>
          <div class="ins-faq-a">มีระยะเวลารอคอย 30 วันสำหรับการเจ็บป่วย แต่อุบัติเหตุคุ้มครองทันทีหลังสมัคร</div>
        </div>
      </div>
    </div>
  `;
}

// ===================================================================
//  PET PROFILE (Rich Profile Page)
// ===================================================================

let _petProfileIndex = 0;

function showPetProfile(petIndex) {
  _petProfileIndex = petIndex;
  showMeSection('petprofile');
}

function renderPetProfilePage(container) {
  const profile = TailyStore.get('user');
  const pet = profile?.pets?.[_petProfileIndex];
  if (!pet) {
    container.innerHTML = `
      <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>โปรไฟล์สัตว์เลี้ยง</span></button>
      <div class="empty-state"><i class="fas fa-paw"></i><p>ไม่พบข้อมูลสัตว์เลี้ยง</p></div>
    `;
    return;
  }

  const petImage = pet.avatar || pet.image || '';
  const genderText = pet.gender === 'male' ? 'ชาย' : pet.gender === 'female' ? 'หญิง' : (pet.gender || 'ไม่ระบุ');
  const weightStr = typeof pet.weight === 'number' ? pet.weight + ' kg' : (pet.weight || 'ไม่ระบุ');

  // Health timeline
  const vaccinations = pet.vaccinations || [];
  const today = new Date('2026-03-14');
  const timelineHtml = vaccinations.map((v, i) => {
    const nextDateStr = v.nextDue || v.nextDate || '';
    const nextDate = nextDateStr ? new Date(nextDateStr) : null;
    const isUpcoming = nextDate && nextDate > today;
    const dotClass = isUpcoming ? 'upcoming' : 'done';
    const showLine = i < vaccinations.length - 1;

    return `
      <div class="pet-timeline-item">
        <div style="position:relative;display:flex;flex-direction:column;align-items:center">
          <div class="pet-timeline-dot ${dotClass}"></div>
          ${showLine ? '<div class="pet-timeline-line"></div>' : ''}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px">${v.name}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${formatThaiDate(v.date)}</div>
          ${v.vet ? `<div style="font-size:12px;color:var(--text-secondary)"><i class="fas fa-hospital"></i> ${v.vet}</div>` : ''}
          ${nextDateStr ? `<div style="font-size:12px;color:${isUpcoming ? '#FF9800' : '#4CAF50'}"><i class="fas fa-calendar-alt"></i> นัดถัดไป: ${formatThaiDate(nextDateStr)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Mock photo gallery
  const petPhotos = pet.species === 'dog' ? [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1558929996-da64ba858215?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=200&h=200&fit=crop'
  ] : [
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=200&h=200&fit=crop'
  ];

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>โปรไฟล์สัตว์เลี้ยง</span></button>

    <!-- Hero -->
    <div class="pet-profile-hero">
      <img src="${petImage}" alt="${pet.name}" loading="lazy">
      <div class="pet-profile-hero-overlay">
        <h2 style="color:#fff;font-size:22px;margin:0">${pet.name}</h2>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:4px 0 0">${pet.breed}</p>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="pet-profile-info-grid">
      <div class="pet-info-card">
        <div class="label">อายุ</div>
        <div class="value">${pet.age || 'ไม่ระบุ'}</div>
      </div>
      <div class="pet-info-card">
        <div class="label">น้ำหนัก</div>
        <div class="value">${weightStr}</div>
      </div>
      <div class="pet-info-card">
        <div class="label">เพศ</div>
        <div class="value">${genderText}</div>
      </div>
      <div class="pet-info-card">
        <div class="label">ไมโครชิป</div>
        <div class="value" style="font-size:12px">${pet.microchipId || 'ไม่ระบุ'}</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="pet-profile-actions">
      <button class="pet-profile-action-btn" onclick="showMeSection('petid')"><i class="fas fa-id-card"></i> บัตร Pet ID</button>
      <button class="pet-profile-action-btn" onclick="showMeSection('health')"><i class="fas fa-notes-medical"></i> บันทึกสุขภาพ</button>
      <button class="pet-profile-action-btn" onclick="showToast('ฟีเจอร์แก้ไขเร็วๆ นี้')"><i class="fas fa-edit"></i> แก้ไข</button>
    </div>

    <!-- Health Timeline -->
    ${vaccinations.length ? `
    <div class="pet-health-timeline">
      <h3 style="font-size:16px;font-weight:700;margin:0 0 12px"><i class="fas fa-syringe"></i> ประวัติวัคซีน</h3>
      ${timelineHtml}
    </div>` : ''}

    <!-- Photo Gallery -->
    <div style="padding:0 16px 8px"><h3 style="font-size:16px;font-weight:700;margin:0"><i class="fas fa-camera"></i> อัลบั้มภาพ</h3></div>
    <div class="pet-photo-grid">
      ${petPhotos.map(src => `<img src="${src}" alt="pet photo" loading="lazy">`).join('')}
    </div>

    <!-- Notes -->
    <div style="padding:16px">
      <h3 style="font-size:16px;font-weight:700;margin:0 0 10px"><i class="fas fa-sticky-note"></i> บันทึก</h3>
      <div style="background:var(--bg-card);border-radius:12px;padding:14px;border:1px solid var(--border)">
        <div style="margin-bottom:8px"><span style="font-weight:600;font-size:13px;color:var(--text-secondary)">อาหาร:</span> <span style="font-size:14px">${pet.diet || 'อาหารเม็ดพรีเมียม + อาหารเปียกสลับ'}</span></div>
        <div style="margin-bottom:8px"><span style="font-weight:600;font-size:13px;color:var(--text-secondary)">ภูมิแพ้:</span> <span style="font-size:14px">${pet.allergies || 'ไม่มี'}</span></div>
        <div><span style="font-weight:600;font-size:13px;color:var(--text-secondary)">หมายเหตุ:</span> <span style="font-size:14px">${pet.notes || 'ชอบเล่น ร่าเริง สุขภาพดี'}</span></div>
      </div>
    </div>
  `;
}

// ===================================================================
//  PET TRAINING & PET SITTING SERVICE
// ===================================================================

function renderTrainingSection(container) {
  const trainingProviders = [
    {name:'K9 Academy BKK', image:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=200&fit=crop', specialty:'ฝึกพื้นฐาน, แก้ปัญหาพฤติกรรม', rating:4.8, price:'2,500-8,000', location:'สุขุมวิท, กรุงเทพฯ', distance:'2.1 km', desc:'ศูนย์ฝึกสุนัขมืออาชีพ ด้วยทีมครูฝึกที่มีประสบการณ์กว่า 10 ปี เน้นวิธีการฝึกเชิงบวก', services:['ฝึกพื้นฐาน (นั่ง, หมอบ, มา)', 'แก้ปัญหาพฤติกรรม', 'ฝึกเดินสายจูง', 'ฝึกสังคมกับสุนัขตัวอื่น', 'คอร์ส Private 1:1']},
    {name:'Happy Paws Training', image:'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop', specialty:'Agility, ฝึกมารยาท', rating:4.6, price:'1,800-5,000', location:'ลาดพร้าว, กรุงเทพฯ', distance:'4.5 km', desc:'โรงเรียนฝึกสุนัขที่เน้นความสนุกสนาน มีสนาม Agility และกิจกรรมกลุ่ม', services:['Agility Training', 'ฝึกมารยาท', 'Puppy Socialization', 'Group Classes', 'คอร์สสุดสัปดาห์']},
    {name:'Thai Dog Whisperer', image:'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300&h=200&fit=crop', specialty:'พฤติกรรมก้าวร้าว, ฝึกเชื่อฟัง', rating:4.9, price:'3,000-12,000', location:'รัชดาภิเษก, กรุงเทพฯ', distance:'3.2 km', desc:'ผู้เชี่ยวชาญด้านพฤติกรรมสัตว์ แก้ไขปัญหาพฤติกรรมที่ซับซ้อน รับปรึกษาเคสยาก', services:['แก้ปัญหาก้าวร้าว', 'ฝึกเชื่อฟังขั้นสูง', 'ปรับพฤติกรรมกลัว/วิตกกังวล', 'ให้คำปรึกษาที่บ้าน', 'ติดตามผลรายเดือน']},
    {name:'Pawsome School', image:'https://images.unsplash.com/photo-1558929996-da64ba858215?w=300&h=200&fit=crop', specialty:'Puppy Class, ฝึกสังคม', rating:4.5, price:'1,500-4,000', location:'อารีย์, กรุงเทพฯ', distance:'5.8 km', desc:'โรงเรียนสำหรับลูกสุนัข เน้นการฝึกสังคมและพื้นฐานที่ดีตั้งแต่เล็ก', services:['Puppy Kindergarten', 'ฝึกสังคม', 'ฝึกพื้นฐานสำหรับลูกสุนัข', 'เล่นกลุ่ม', 'คำแนะนำสำหรับเจ้าของมือใหม่']},
    {name:'Bangkok K9 Club', image:'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=300&h=200&fit=crop', specialty:'ฝึกขั้นสูง, สุนัขบริการ', rating:4.7, price:'5,000-15,000', location:'ทองหล่อ, กรุงเทพฯ', distance:'1.8 km', desc:'สโมสรฝึกสุนัขระดับพรีเมียม เชี่ยวชาญการฝึกสุนัขบริการและสุนัขทำงาน', services:['ฝึกสุนัขบริการ', 'ฝึกขั้นสูง (Off-leash)', 'Protection Training', 'คอร์สประจำเดือน', 'การแข่งขัน Obedience']}
  ];

  const sittingProviders = [
    {name:'Pet Paradise Bangkok', image:'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=200&fit=crop', svcText:'เลี้ยงรายวัน, ค้างคืน, พาเดิน', rating:4.7, price:'500-1,500/วัน', location:'เอกมัย, กรุงเทพฯ', distance:'2.3 km', desc:'สถานรับเลี้ยงสัตว์เลี้ยงพร้อมพื้นที่กว้างขวาง มีสนามหญ้าและสระว่ายน้ำ', serviceList:['เลี้ยงรายวัน (Day Care)', 'ค้างคืน (Overnight)', 'พาเดินเล่น', 'อาบน้ำ-ตัดขน', 'รับ-ส่งถึงบ้าน']},
    {name:'Fur Baby Hotel', image:'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=300&h=200&fit=crop', svcText:'โรงแรมสัตว์เลี้ยง, สปา, ว่ายน้ำ', rating:4.9, price:'800-2,500/วัน', location:'พระราม 9, กรุงเทพฯ', distance:'3.1 km', desc:'โรงแรมสัตว์เลี้ยงระดับ 5 ดาว ห้องพักส่วนตัวปรับอากาศ พร้อมสปาและสระว่ายน้ำ', serviceList:['ห้องพัก Deluxe ปรับอากาศ', 'สปา & Grooming', 'สระว่ายน้ำ', 'กล้องวงจรปิด 24 ชม.', 'อาหารพรีเมียม']},
    {name:'Happy Tails Care', image:'https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=300&h=200&fit=crop', svcText:'เลี้ยงที่บ้าน, รับ-ส่ง', rating:4.5, price:'400-1,000/วัน', location:'บางนา, กรุงเทพฯ', distance:'6.2 km', desc:'บริการเลี้ยงสัตว์เลี้ยงที่บ้านผู้ดูแล อบอุ่นเหมือนอยู่บ้านตัวเอง', serviceList:['เลี้ยงที่บ้าน (Home Boarding)', 'รับ-ส่งถึงบ้าน', 'รายงานภาพ/วิดีโอทุกวัน', 'ดูแลให้ยา', 'เลี้ยงหลายตัวได้']},
    {name:'Pawtel Bangkok', image:'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=300&h=200&fit=crop', svcText:'ห้องพักส่วนตัว, กล้องวงจรปิด', rating:4.8, price:'700-2,000/วัน', location:'สาทร, กรุงเทพฯ', distance:'4.0 km', desc:'โรงแรมสัตว์เลี้ยงทันสมัย มีกล้องวงจรปิดให้ดูผ่านแอปตลอด 24 ชม.', serviceList:['ห้องพักส่วนตัว', 'กล้องวงจรปิด Live', 'พื้นที่วิ่งเล่น', 'อาบน้ำก่อนรับกลับ', 'สัตวแพทย์ประจำ']},
    {name:'PetStay BKK', image:'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=300&h=200&fit=crop', svcText:'Day Care, Overnight, Grooming', rating:4.6, price:'600-1,800/วัน', location:'อ่อนนุช, กรุงเทพฯ', distance:'5.5 km', desc:'บริการ Day Care และค้างคืน พร้อม Grooming ครบวงจร ราคาเป็นกันเอง', serviceList:['Day Care', 'Overnight Stay', 'Grooming & Bath', 'Training เบื้องต้น', 'Pick-up & Drop-off']}
  ];

  function renderProviderCards(providers, type) {
    return providers.map((p, i) => {
      const chipText = type === 'training' ? p.specialty : p.svcText;
      const chips = chipText.split(', ').map(c =>
        `<span class="training-chip">${c}</span>`
      ).join('');
      const stars = '★'.repeat(Math.floor(p.rating)) + (p.rating % 1 >= 0.5 ? '½' : '');

      return `
        <div class="training-card" onclick="openTrainingDetail('${type}', ${i})">
          <img class="training-card-img" src="${p.image}" alt="${p.name}" loading="lazy">
          <div class="training-card-info">
            <div class="training-card-name">${p.name}</div>
            <div class="training-card-chips">${chips}</div>
            <div class="training-card-meta">
              <span style="color:#FFC501">${stars}</span>
              <span>${p.rating}</span>
              <span>&middot;</span>
              <span class="training-card-price">${p.price.startsWith('฿') ? '' : '฿'}${p.price}</span>
            </div>
            <div class="training-card-meta">
              <span><i class="fas fa-map-marker-alt"></i> ${p.distance}</span>
              <span>&middot;</span>
              <span>${p.location}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Store providers globally for detail view
  window._tailyTrainingProviders = trainingProviders;
  window._tailySittingProviders = sittingProviders;

  container.innerHTML = `
    <button class="sub-page-header" onclick="goBack('me')"><i class="fas fa-arrow-left"></i> <span>ฝึกสัตว์เลี้ยง</span></button>
    <div class="training-toggle-tabs">
      <button class="training-toggle-btn active" onclick="switchTrainingTab('training', this)"><i class="fas fa-dog"></i> ฝึกสัตว์</button>
      <button class="training-toggle-btn" onclick="switchTrainingTab('sitting', this)"><i class="fas fa-home"></i> รับเลี้ยงชั่วคราว</button>
    </div>
    <div class="training-list" id="trainingListContent">
      ${renderProviderCards(trainingProviders, 'training')}
    </div>
  `;

  // Store render functions for tab switching
  window._renderTrainingCards = () => renderProviderCards(trainingProviders, 'training');
  window._renderSittingCards = () => renderProviderCards(sittingProviders, 'sitting');
}

function switchTrainingTab(tab, btn) {
  document.querySelectorAll('.training-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const listContainer = document.getElementById('trainingListContent');
  if (!listContainer) return;

  if (tab === 'training') {
    listContainer.innerHTML = window._renderTrainingCards();
  } else {
    listContainer.innerHTML = window._renderSittingCards();
  }
}

function openTrainingDetail(type, index) {
  const providers = type === 'training' ? window._tailyTrainingProviders : window._tailySittingProviders;
  const p = providers?.[index];
  if (!p) return;

  const servicesList = (type === 'training' ? p.services : p.serviceList) || [];
  const servicesHtml = servicesList.map(s => `<li><i class="fas fa-check" style="color:#4CAF50"></i> ${s}</li>`).join('');

  const chipText = type === 'training' ? p.specialty : p.svcText;
  const chips = chipText.split(', ').map(c =>
    `<span class="training-chip">${c}</span>`
  ).join('');

  const stars = '★'.repeat(Math.floor(p.rating));

  // Mock reviews
  const reviews = [
    {name: 'คุณสมชาย', rating: 5, text: 'บริการดีมาก น้องหมากลับมาเชื่อฟังขึ้นเยอะ', date: '2026-02-28'},
    {name: 'คุณมินตรา', rating: 4, text: 'สถานที่สะอาด พนักงานใจดี แนะนำค่ะ', date: '2026-02-15'},
    {name: 'คุณวิชัย', rating: 5, text: 'ประทับใจมาก จะกลับมาใช้บริการอีก', date: '2026-01-20'}
  ];

  const reviewsHtml = reviews.map(r => `
    <div style="padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-weight:600;font-size:14px">${r.name}</span>
        <span style="color:#FFC501;font-size:12px">${'★'.repeat(r.rating)}</span>
      </div>
      <p style="font-size:13px;color:var(--text-secondary);margin:0">${r.text}</p>
      <span style="font-size:11px;color:var(--text-light)">${formatThaiDate(r.date)}</span>
    </div>
  `).join('');

  const modal = document.createElement('div');
  modal.className = 'vet-detail-modal';
  modal.innerHTML = `
    <div class="vet-detail-content">
      <div class="training-detail-hero">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <button class="vet-detail-close" onclick="this.closest('.vet-detail-modal').remove()"><i class="fas fa-times"></i></button>
      </div>
      <div class="training-detail-body">
        <div class="training-detail-name">${p.name}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="color:#FFC501">${stars}</span>
          <span style="font-weight:600">${p.rating}</span>
          <span style="color:var(--text-secondary);font-size:13px">&middot; ${p.location}</span>
        </div>
        <div style="margin-bottom:12px">${chips}</div>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.5;margin-bottom:16px">${p.desc}</p>

        <h3 style="font-size:15px;font-weight:700;margin:0 0 8px"><i class="fas fa-list-check"></i> บริการ</h3>
        <ul class="training-services-list">${servicesHtml}</ul>

        <div style="display:flex;align-items:center;gap:8px;padding:12px 0;font-size:15px">
          <i class="fas fa-tag" style="color:var(--primary)"></i>
          <span style="font-weight:600">ราคา:</span>
          <span class="training-card-price">${p.price.startsWith('฿') ? '' : '฿'}${p.price}</span>
        </div>

        <h3 style="font-size:15px;font-weight:700;margin:16px 0 8px"><i class="fas fa-star"></i> รีวิว</h3>
        ${reviewsHtml}

        <button class="training-book-btn" onclick="openBookingModal('${p.name.replace(/'/g, "\\'")}')"><i class="fas fa-calendar-check"></i> จองบริการ</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));
}

function openBookingModal(providerName) {
  document.querySelectorAll('.vet-detail-modal').forEach(m => m.remove());

  const profile = TailyStore.get('user');
  const pets = profile?.pets || [];
  const petOptions = pets.map((p, i) => `<option value="${i}">${p.name} (${p.breed})</option>`).join('');

  const modal = document.createElement('div');
  modal.className = 'vet-detail-modal';
  modal.innerHTML = `
    <div class="vet-detail-content">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--border)">
        <h3 style="margin:0;font-size:17px;font-weight:700">จองบริการ</h3>
        <button style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-secondary)" onclick="this.closest('.vet-detail-modal').remove()"><i class="fas fa-times"></i></button>
      </div>
      <div class="booking-modal">
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px"><i class="fas fa-store"></i> ${providerName}</div>

        <div class="booking-field">
          <label>เลือกสัตว์เลี้ยง</label>
          <select id="bookingPet">
            ${petOptions || '<option>ไม่มีสัตว์เลี้ยง</option>'}
          </select>
        </div>

        <div class="booking-field">
          <label>วันที่ต้องการ</label>
          <input type="date" id="bookingDate" value="2026-03-20" min="2026-03-15">
        </div>

        <div class="booking-field">
          <label>ประเภทบริการ</label>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:400;cursor:pointer">
              <input type="radio" name="bookingType" value="basic" checked> บริการพื้นฐาน
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:400;cursor:pointer">
              <input type="radio" name="bookingType" value="premium"> บริการพรีเมียม
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:400;cursor:pointer">
              <input type="radio" name="bookingType" value="vip"> VIP Package
            </label>
          </div>
        </div>

        <button class="training-book-btn" onclick="confirmBooking()"><i class="fas fa-check-circle"></i> ยืนยันการจอง</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));
}

function confirmBooking() {
  document.querySelectorAll('.vet-detail-modal').forEach(m => m.remove());
  showToast('จองสำเร็จ! เราจะติดต่อกลับภายใน 24 ชม.');
}

// ===================================================================
//  PET SITTING SERVICE (delegates to training with sitting tab)
// ===================================================================

function renderPetSittingSection(container) {
  renderTrainingSection(container);
  setTimeout(() => {
    const sittingBtn = document.querySelectorAll('.training-toggle-btn')[1];
    if (sittingBtn) switchTrainingTab('sitting', sittingBtn);
  }, 50);
}
