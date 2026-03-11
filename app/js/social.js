/* ========== TAILY SOCIAL TAB v2.0 ========== */

let socialFeedPage = 1;
let socialFeedLoading = false;
let socialFeedHasMore = true;
let allGroups = [];
let allAdoptionPets = [];

// ===== INIT =====
async function initSocial() {
  try {
    const [feedResult, groups, conversations, adoptionPets] = await Promise.all([
      MockAPI.getFeed(1).catch(() => ({ items: [], hasMore: false })),
      MockAPI.getGroups().catch(() => []),
      MockAPI.getConversations().catch(() => []),
      MockAPI.getAdoptionPets().catch(() => [])
    ]);

    renderSocialFeed(feedResult.items || [], false);
    socialFeedHasMore = feedResult.hasMore;

    allGroups = groups || [];
    renderGroups(allGroups);

    renderConversations(conversations || []);

    allAdoptionPets = adoptionPets || [];
    renderAdoptionPets(allAdoptionPets);
  } catch (e) {
    console.error('initSocial error:', e);
  }
}

// ===== TAB NAVIGATION =====
function showSocialTab(tab) {
  document.querySelectorAll('#page-social .social-sub').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`social-${tab}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('#page-social .social-tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`#page-social .social-tab[onclick*="'${tab}'"]`);
  if (btn) btn.classList.add('active');
}

// ===================================================================
//  SOCIAL FEED
// ===================================================================

function renderSocialFeed(posts, append) {
  const container = document.getElementById('socialFeed');
  if (!container) return;

  const likedPosts = TailyStore.get('likedPosts');
  const bookmarkedPosts = TailyStore.get('bookmarkedPosts');
  const tierColors = { Gold: '#FFC501', Platinum: '#9C27B0', Silver: '#9E9E9E', Bronze: '#CD7F32' };

  const html = posts.map(post => {
    const isLiked = likedPosts.has(post.id);
    const isBookmarked = bookmarkedPosts.has(post.id);
    const tierColor = tierColors[post.userTier] || '#9E9E9E';
    const mainImage = Array.isArray(post.images) ? post.images[0] : '';
    const multipleImages = Array.isArray(post.images) && post.images.length > 1;
    const fullCaption = post.caption || '';
    const shortCaption = fullCaption.length > 120 ? fullCaption.substring(0, 120) : fullCaption;
    const needsMore = fullCaption.length > 120;
    const hashtagsHtml = (post.hashtags || []).map(h => `<span class="social-hashtag">${h}</span>`).join(' ');

    return `
      <div class="social-feed-card" data-post-id="${post.id}">
        <div class="sfc-header">
          <img class="sfc-avatar" src="${post.userAvatar}" alt="${post.userName}" loading="lazy">
          <div class="sfc-user-info">
            <div class="sfc-user-name">
              ${post.userName}
              <span class="sfc-tier-badge" style="background:${tierColor};color:${post.userTier === 'Gold' ? '#3D2B1F' : '#fff'}">${post.userTier}</span>
            </div>
            <div class="sfc-meta">${post.location || ''} &middot; ${timeAgo(post.timestamp)}</div>
          </div>
          <button class="sfc-menu-btn" onclick="showPostMenu(${post.id})"><i class="fas fa-ellipsis-h"></i></button>
        </div>

        <div class="sfc-image" onclick="openPost(${post.id})">
          <img src="${mainImage}" alt="" loading="lazy"
               onerror="this.parentElement.style.background='linear-gradient(135deg,#FFC501,#FF8C42)'">
          ${multipleImages ? '<div class="sfc-multi-badge"><i class="fas fa-clone"></i></div>' : ''}
        </div>

        <div class="sfc-actions">
          <div class="sfc-actions-left">
            <button class="sfc-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleSocialLike(${post.id}, this)">
              <i class="fa${isLiked ? 's' : 'r'} fa-heart"></i>
              <span>${formatNumber(post.likes + (isLiked && !post.isLiked ? 1 : 0))}</span>
            </button>
            <button class="sfc-action-btn" onclick="openPost(${post.id})">
              <i class="far fa-comment"></i>
              <span>${formatNumber(post.comments)}</span>
            </button>
            <button class="sfc-action-btn" onclick="sharePost(${post.id})">
              <i class="far fa-paper-plane"></i>
            </button>
          </div>
          <button class="sfc-action-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleSocialBookmark(${post.id}, this)">
            <i class="fa${isBookmarked ? 's' : 'r'} fa-bookmark"></i>
          </button>
        </div>

        <div class="sfc-caption">
          <span class="sfc-caption-user">${post.userName.split(' ')[0]}</span>
          <span class="sfc-caption-text">${shortCaption}${needsMore ? '... <span class="sfc-more" onclick="openPost(' + post.id + ')">เพิ่มเติม</span>' : ''}</span>
        </div>
        ${hashtagsHtml ? '<div class="sfc-hashtags">' + hashtagsHtml + '</div>' : ''}
        ${post.comments > 0 ? '<button class="sfc-view-comments" onclick="openPost(' + post.id + ')">ดูความคิดเห็นทั้งหมด ' + post.comments + ' รายการ</button>' : ''}
      </div>
    `;
  }).join('');

  if (append) {
    container.insertAdjacentHTML('beforeend', html);
  } else {
    container.innerHTML = html;
  }
}

function setFeedTab(tab, el) {
  document.querySelectorAll('.feed-tabs .ftab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  // Re-render same data (mock — both tabs show same feed)
  const container = document.getElementById('socialFeed');
  if (container) container.scrollTop = 0;
}

function toggleSocialLike(postId, el) {
  const isNowLiked = TailyStore.toggleLike(postId);
  const icon = el.querySelector('i');
  const count = el.querySelector('span');

  if (isNowLiked) {
    el.classList.add('liked');
    icon.className = 'fas fa-heart';
    icon.style.transform = 'scale(1.3)';
    setTimeout(() => { icon.style.transform = 'scale(1)'; }, 200);
  } else {
    el.classList.remove('liked');
    icon.className = 'far fa-heart';
  }

  if (count) {
    const currentText = count.textContent;
    let currentNum = 0;
    if (currentText.includes('K')) currentNum = parseFloat(currentText) * 1000;
    else if (currentText.includes('M')) currentNum = parseFloat(currentText) * 1000000;
    else currentNum = parseInt(currentText) || 0;
    const newNum = isNowLiked ? currentNum + 1 : Math.max(0, currentNum - 1);
    count.textContent = formatNumber(newNum);
  }
}

function toggleSocialBookmark(postId, el) {
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

function sharePost(postId) {
  showToast('แชร์โพสต์แล้ว');
}

function showPostMenu(postId) {
  showModal(`
    <div style="padding:20px">
      <h3 style="margin-bottom:16px"><i class="fas fa-ellipsis-h"></i> ตัวเลือก</h3>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn-outline btn-block" onclick="closeModal();showToast('บันทึกโพสต์แล้ว')"><i class="fas fa-bookmark"></i> บันทึกโพสต์</button>
        <button class="btn-outline btn-block" onclick="closeModal();sharePost(${postId})"><i class="fas fa-share"></i> แชร์โพสต์</button>
        <button class="btn-outline btn-block" onclick="closeModal();showToast('รายงานโพสต์แล้ว')"><i class="fas fa-flag"></i> รายงานโพสต์</button>
        <button class="btn-outline btn-block" onclick="closeModal()"><i class="fas fa-times"></i> ปิด</button>
      </div>
    </div>
  `);
}

// ===================================================================
//  POST DETAIL
// ===================================================================

async function openPost(postId) {
  const post = await MockAPI.getPost(postId);
  if (!post) { showToast('ไม่พบโพสต์'); return; }

  const likedPosts = TailyStore.get('likedPosts');
  const bookmarkedPosts = TailyStore.get('bookmarkedPosts');
  const isLiked = likedPosts.has(post.id);
  const isBookmarked = bookmarkedPosts.has(post.id);
  const tierColors = { Gold: '#FFC501', Platinum: '#9C27B0', Silver: '#9E9E9E', Bronze: '#CD7F32' };
  const tierColor = tierColors[post.userTier] || '#9E9E9E';
  const hashtagsHtml = (post.hashtags || []).map(h => `<span class="social-hashtag">${h}</span>`).join(' ');

  const commentsHtml = (post.commentsList || []).map(c => `
    <div class="post-comment">
      <img class="post-comment-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.userName.charAt(0))}&background=FFC501&color=3D2B1F&size=60" alt="">
      <div class="post-comment-body">
        <span class="post-comment-user">${c.userName}</span>
        <span class="post-comment-text">${c.text}</span>
        <span class="post-comment-time">${c.time}</span>
      </div>
    </div>
  `).join('');

  const imagesHtml = (post.images || []).map((img, i) => `
    <img src="${img}" alt="" loading="lazy" class="post-detail-img" style="${i > 0 ? 'margin-top:4px' : ''}"
         onerror="this.style.background='linear-gradient(135deg,#FFC501,#FF8C42)'">
  `).join('');

  document.getElementById('postDetail').innerHTML = `
    <div class="post-detail-page">
      <button class="sub-page-header" onclick="goBack('social')">
        <i class="fas fa-arrow-left"></i> <span>โพสต์</span>
      </button>

      <div class="post-detail-header">
        <img class="post-detail-avatar" src="${post.userAvatar}" alt="" loading="lazy">
        <div class="post-detail-user-info">
          <div class="post-detail-user-name">
            ${post.userName}
            <span class="sfc-tier-badge" style="background:${tierColor};color:${post.userTier === 'Gold' ? '#3D2B1F' : '#fff'}">${post.userTier}</span>
          </div>
          <div class="post-detail-meta">${post.location || ''} &middot; ${timeAgo(post.timestamp)}</div>
        </div>
      </div>

      <div class="post-detail-images">${imagesHtml}</div>

      <div class="post-detail-actions">
        <div class="sfc-actions-left">
          <button class="sfc-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleSocialLike(${post.id}, this)">
            <i class="fa${isLiked ? 's' : 'r'} fa-heart"></i>
            <span>${formatNumber(post.likes)}</span>
          </button>
          <button class="sfc-action-btn">
            <i class="far fa-comment"></i>
            <span>${formatNumber(post.comments)}</span>
          </button>
          <button class="sfc-action-btn" onclick="sharePost(${post.id})">
            <i class="far fa-paper-plane"></i>
          </button>
        </div>
        <button class="sfc-action-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleSocialBookmark(${post.id}, this)">
          <i class="fa${isBookmarked ? 's' : 'r'} fa-bookmark"></i>
        </button>
      </div>

      <div class="post-detail-caption">
        <span class="sfc-caption-user">${post.userName.split(' ')[0]}</span>
        <span>${post.caption || ''}</span>
      </div>
      ${hashtagsHtml ? '<div class="post-detail-hashtags">' + hashtagsHtml + '</div>' : ''}

      <div class="post-detail-comments">
        <h4><i class="fas fa-comment"></i> ความคิดเห็น (${post.comments})</h4>
        ${commentsHtml || '<p class="no-comments">ยังไม่มีความคิดเห็น</p>'}
      </div>

      <div class="post-detail-comment-input">
        <img class="comment-input-avatar" src="${TailyStore.get('user')?.user?.avatar || 'https://ui-avatars.com/api/?name=SC&background=FFC501&color=3D2B1F&size=60'}" alt="">
        <input type="text" id="commentInput_${post.id}" placeholder="เขียนความคิดเห็น..." onkeydown="if(event.key==='Enter')sendComment(${post.id})">
        <button class="comment-send-btn" onclick="sendComment(${post.id})"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-post').classList.add('active');
}

function sendComment(postId) {
  const input = document.getElementById(`commentInput_${postId}`);
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();
  const user = TailyStore.get('user');
  const userName = user?.user?.name || 'คุณ';
  const avatar = user?.user?.avatar || 'https://ui-avatars.com/api/?name=SC&background=FFC501&color=3D2B1F&size=60';

  const commentsContainer = input.closest('.post-detail-page').querySelector('.post-detail-comments');
  const noComments = commentsContainer.querySelector('.no-comments');
  if (noComments) noComments.remove();

  const commentEl = document.createElement('div');
  commentEl.className = 'post-comment';
  commentEl.innerHTML = `
    <img class="post-comment-avatar" src="${avatar}" alt="">
    <div class="post-comment-body">
      <span class="post-comment-user">${userName.split(' ')[0]}</span>
      <span class="post-comment-text">${text}</span>
      <span class="post-comment-time">เมื่อสักครู่</span>
    </div>
  `;
  commentsContainer.appendChild(commentEl);

  input.value = '';
  showToast('แสดงความคิดเห็นแล้ว');
}

// ===================================================================
//  CREATE POST
// ===================================================================

function openCreatePost() {
  showModal(`
    <div class="create-post-modal">
      <div class="create-post-header">
        <h3><i class="fas fa-plus-circle"></i> สร้างโพสต์</h3>
        <button onclick="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <div class="create-post-body">
        <div class="create-post-photo" onclick="showToast('เลือกรูปภาพ')">
          <i class="fas fa-camera"></i>
          <span>เพิ่มรูปภาพ</span>
        </div>
        <textarea class="create-post-caption" placeholder="เขียนอะไรสักหน่อย..." rows="4"></textarea>
        <div class="create-post-options">
          <button class="create-post-option" onclick="showToast('เลือกตำแหน่ง')">
            <i class="fas fa-map-marker-alt"></i> เพิ่มตำแหน่ง
          </button>
          <div class="create-post-hashtags">
            <span class="create-hashtag-label">แฮชแท็กแนะนำ:</span>
            <button class="chip" onclick="addHashtag(this, '#TailyPet')">#TailyPet</button>
            <button class="chip" onclick="addHashtag(this, '#คนรักสัตว์')">#คนรักสัตว์</button>
            <button class="chip" onclick="addHashtag(this, '#PetFriendly')">#PetFriendly</button>
            <button class="chip" onclick="addHashtag(this, '#หมาน่ารัก')">#หมาน่ารัก</button>
            <button class="chip" onclick="addHashtag(this, '#แมวน่ารัก')">#แมวน่ารัก</button>
          </div>
        </div>
        <button class="btn-primary btn-block" onclick="submitCreatePost()">
          <i class="fas fa-paper-plane"></i> โพสต์
        </button>
      </div>
    </div>
  `);
}

function addHashtag(el, tag) {
  const textarea = document.querySelector('.create-post-caption');
  if (textarea) {
    const current = textarea.value;
    if (!current.includes(tag)) {
      textarea.value = current + (current ? ' ' : '') + tag;
    }
  }
  el.classList.toggle('active');
}

function submitCreatePost() {
  closeModal();
  showToast('โพสต์สำเร็จ!');
}

// ===================================================================
//  GROUPS
// ===================================================================

function renderGroups(groups) {
  const container = document.getElementById('groupsList');
  if (!container) return;

  const joinedGroups = TailyStore.get('joinedGroups');

  container.innerHTML = groups.map(group => {
    const isJoined = joinedGroups.has(group.id);
    const emoji = group.emoji || '';
    const coverImage = group.coverImage || '';

    return `
      <div class="group-card" onclick="openGroup(${group.id})">
        <div class="group-card-cover">
          ${coverImage ? `<img src="${coverImage}" alt="" loading="lazy">` : `<div class="group-card-emoji">${emoji}</div>`}
          <div class="group-card-overlay">
            <span class="group-card-emoji-badge">${emoji}</span>
          </div>
        </div>
        <div class="group-card-body">
          <h4 class="group-card-name">${group.nameTh || group.name}</h4>
          <div class="group-card-stats">
            <span><i class="fas fa-users"></i> ${formatNumber(group.memberCount)} สมาชิก</span>
          </div>
          <button class="btn-sm ${isJoined ? 'btn-success' : 'btn-primary'}" onclick="event.stopPropagation();toggleJoinGroup(${group.id},this)">
            ${isJoined ? '<i class="fas fa-check"></i> เข้ากลุ่ม' : '<i class="fas fa-plus"></i> เข้าร่วม'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleJoinGroup(groupId, el) {
  const joinedGroups = new Set(TailyStore.get('joinedGroups'));
  const wasJoined = joinedGroups.has(groupId);

  if (wasJoined) {
    joinedGroups.delete(groupId);
    el.className = 'btn-sm btn-primary';
    el.innerHTML = '<i class="fas fa-plus"></i> เข้าร่วม';
    showToast('ออกจากกลุ่มแล้ว');
  } else {
    joinedGroups.add(groupId);
    el.className = 'btn-sm btn-success';
    el.innerHTML = '<i class="fas fa-check"></i> เข้ากลุ่ม';
    showToast('เข้าร่วมกลุ่มแล้ว!');
  }
  TailyStore.set('joinedGroups', joinedGroups);
}

async function openGroup(groupId) {
  let groups;
  try { groups = await MockAPI.getGroups(); } catch (e) { groups = allGroups; }
  const group = (groups || allGroups).find(g => g.id === groupId);
  if (!group) { showToast('ไม่พบกลุ่ม'); return; }

  const joinedGroups = TailyStore.get('joinedGroups');
  const isJoined = joinedGroups.has(groupId);
  const coverImage = group.coverImage || '';

  const recentPostsHtml = (group.recentPosts || []).map(p => `
    <div class="group-recent-post">
      <div class="group-rp-header">
        <i class="fas fa-file-alt"></i>
        <span class="group-rp-author">${p.author}</span>
      </div>
      <p class="group-rp-title">${p.title}</p>
      <span class="group-rp-likes"><i class="fas fa-heart"></i> ${p.likes}</span>
    </div>
  `).join('');

  const rulesHtml = (group.rules || []).map((r, i) => `
    <div class="group-rule"><span class="group-rule-num">${i + 1}</span> ${r}</div>
  `).join('');

  const adminsHtml = (group.admins || []).map(a => `
    <div class="group-admin">
      <img src="${a.avatar}" alt="" loading="lazy">
      <span>${a.name}</span>
    </div>
  `).join('');

  document.getElementById('groupDetail').innerHTML = `
    <div class="group-detail-page">
      <button class="sub-page-header" onclick="goBack('social')">
        <i class="fas fa-arrow-left"></i> <span>กลุ่ม</span>
      </button>

      <div class="group-detail-cover">
        ${coverImage ? `<img src="${coverImage}" alt="" loading="lazy">` : ''}
        <div class="group-detail-cover-overlay">
          <span class="group-detail-emoji">${group.emoji || ''}</span>
        </div>
      </div>

      <div class="group-detail-info">
        <h2>${group.nameTh || group.name}</h2>
        <p class="group-detail-desc">${group.description || ''}</p>
        <div class="group-detail-stats">
          <div class="group-stat"><strong>${formatNumber(group.memberCount)}</strong><span>สมาชิก</span></div>
          <div class="group-stat"><strong>${formatNumber(group.postCount)}</strong><span>โพสต์</span></div>
        </div>
        <button class="btn-block ${isJoined ? 'btn-success' : 'btn-primary'}" onclick="toggleJoinGroup(${groupId},this)">
          ${isJoined ? '<i class="fas fa-check"></i> เข้ากลุ่มแล้ว' : '<i class="fas fa-plus"></i> เข้าร่วมกลุ่ม'}
        </button>
      </div>

      ${recentPostsHtml ? `
        <div class="group-detail-section">
          <h3><i class="fas fa-fire"></i> โพสต์ล่าสุด</h3>
          ${recentPostsHtml}
        </div>
      ` : ''}

      ${rulesHtml ? `
        <div class="group-detail-section">
          <h3><i class="fas fa-clipboard-list"></i> กฎของกลุ่ม</h3>
          ${rulesHtml}
        </div>
      ` : ''}

      ${adminsHtml ? `
        <div class="group-detail-section">
          <h3><i class="fas fa-user-shield"></i> ผู้ดูแลกลุ่ม</h3>
          ${adminsHtml}
        </div>
      ` : ''}
    </div>
  `;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-group').classList.add('active');
}

// ===================================================================
//  MESSAGES / CHAT
// ===================================================================

function renderConversations(conversations) {
  const container = document.getElementById('conversationsList');
  if (!container) return;

  container.innerHTML = conversations.map(conv => {
    const unreadClass = conv.unread > 0 ? 'conversation-unread' : '';
    const lastTime = conv.lastMessageTime || conv.lastMessage?.time || conv.timestamp || '';

    return `
      <div class="conversation-item ${unreadClass}" onclick="openChat(${conv.id})">
        <div class="conversation-avatar-wrap">
          <img class="conversation-avatar" src="${conv.participantAvatar || conv.avatar}" alt="" loading="lazy">
          ${conv.online ? '<span class="conversation-online"></span>' : ''}
        </div>
        <div class="conversation-info">
          <div class="conversation-name">${conv.participantName || conv.name}</div>
          <div class="conversation-preview">${conv.lastMessage || ''}</div>
        </div>
        <div class="conversation-right">
          <div class="conversation-time">${timeAgo(lastTime)}</div>
          ${conv.unread > 0 ? `<span class="conversation-unread-badge">${conv.unread}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function openChat(chatId) {
  let conversations;
  try { conversations = await MockAPI.getConversations(); } catch (e) { conversations = []; }
  const chat = (conversations || []).find(c => c.id === chatId);
  if (!chat) { showToast('ไม่พบการสนทนา'); return; }

  const participantName = chat.participantName || chat.name || 'ผู้ใช้';
  const participantAvatar = chat.participantAvatar || chat.avatar || '';
  const messages = chat.messages || [];

  const messagesHtml = messages.map(msg => {
    const isMine = msg.senderId === 'me' || msg.sender === 'me';
    return `
      <div class="chat-bubble-wrap ${isMine ? 'chat-mine' : 'chat-theirs'}">
        <div class="chat-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}">
          ${msg.text}
        </div>
        <div class="chat-bubble-time">${timeAgo(msg.time)}</div>
      </div>
    `;
  }).join('');

  document.getElementById('chatContent').innerHTML = `
    <div class="chat-page">
      <div class="chat-header">
        <button class="chat-back-btn" onclick="goBack('social')"><i class="fas fa-arrow-left"></i></button>
        <img class="chat-header-avatar" src="${participantAvatar}" alt="" loading="lazy">
        <div class="chat-header-info">
          <div class="chat-header-name">${participantName}</div>
          <div class="chat-header-status">${chat.online ? 'ออนไลน์' : 'ออฟไลน์'}</div>
        </div>
      </div>

      <div class="chat-messages" id="chatMessages_${chatId}">
        ${messagesHtml}
      </div>

      <div class="chat-input-bar">
        <button class="chat-attach-btn" onclick="showToast('แนบไฟล์')"><i class="fas fa-plus"></i></button>
        <input type="text" id="chatInput_${chatId}" class="chat-input" placeholder="พิมพ์ข้อความ..."
               onkeydown="if(event.key==='Enter')sendChatMessage(${chatId})">
        <button class="chat-send-btn" onclick="sendChatMessage(${chatId})"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-chat').classList.add('active');

  // Scroll to bottom
  setTimeout(() => {
    const messagesEl = document.getElementById(`chatMessages_${chatId}`);
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }, 100);
}

async function sendChatMessage(chatId) {
  const input = document.getElementById(`chatInput_${chatId}`);
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();
  input.value = '';

  // Add my bubble immediately
  const messagesEl = document.getElementById(`chatMessages_${chatId}`);
  if (messagesEl) {
    const bubbleWrap = document.createElement('div');
    bubbleWrap.className = 'chat-bubble-wrap chat-mine';
    bubbleWrap.innerHTML = `
      <div class="chat-bubble bubble-mine">${text}</div>
      <div class="chat-bubble-time">เมื่อสักครู่</div>
    `;
    messagesEl.appendChild(bubbleWrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Call mock API
  try {
    await MockAPI.sendMessage(chatId, text);
  } catch (e) { /* ignore */ }

  // Simulate auto-reply after 1.5s
  setTimeout(() => {
    if (messagesEl) {
      const replies = [
        'ได้เลยค่ะ!',
        'โอเคค่ะ',
        'ขอบคุณนะคะ',
        'เดี๋ยวตอบกลับนะคะ',
        'น่าสนใจมากเลยค่ะ!'
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const replyWrap = document.createElement('div');
      replyWrap.className = 'chat-bubble-wrap chat-theirs';
      replyWrap.innerHTML = `
        <div class="chat-bubble bubble-theirs">${reply}</div>
        <div class="chat-bubble-time">เมื่อสักครู่</div>
      `;
      messagesEl.appendChild(replyWrap);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }, 1500);
}

// ===================================================================
//  ADOPTION
// ===================================================================

function renderAdoptionPets(pets) {
  const container = document.getElementById('adoptionGrid');
  if (!container) return;

  if (!pets || !pets.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>ไม่พบสัตว์เลี้ยง</p></div>';
    return;
  }

  container.innerHTML = pets.map(pet => {
    const genderIcon = pet.gender === 'ชาย' || pet.gender === 'male' ? 'fa-mars' : 'fa-venus';
    const genderColor = pet.gender === 'ชาย' || pet.gender === 'male' ? '#2196F3' : '#E91E63';
    const speciesIcon = pet.species === 'dog' ? 'fa-dog' : 'fa-cat';

    return `
      <div class="adoption-card" onclick="openAdoptionDetail(${pet.id})">
        <div class="adoption-card-img">
          <img src="${pet.image}" alt="${pet.name}" loading="lazy"
               onerror="this.parentElement.style.background='linear-gradient(135deg,#FFC501,#FF8C42)'">
          <span class="adoption-species-badge"><i class="fas ${speciesIcon}"></i></span>
        </div>
        <div class="adoption-card-body">
          <div class="adoption-card-name">
            ${pet.name}
            <i class="fas ${genderIcon}" style="color:${genderColor};font-size:12px"></i>
          </div>
          <div class="adoption-card-breed">${pet.breed}</div>
          <div class="adoption-card-info">
            <span>${pet.age}</span>
            ${pet.vaccinated ? '<span class="adoption-vacc-badge"><i class="fas fa-syringe"></i> วัคซีนครบ</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterAdoption(species, el) {
  document.querySelectorAll('.adoption-filters .chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');

  if (species === 'all') {
    renderAdoptionPets(allAdoptionPets);
  } else {
    const filtered = allAdoptionPets.filter(p => p.species === species);
    renderAdoptionPets(filtered);
  }
}

async function openAdoptionDetail(petId) {
  let pets;
  try { pets = await MockAPI.getAdoptionPets(); } catch (e) { pets = allAdoptionPets; }
  const pet = (pets || allAdoptionPets).find(p => p.id === petId);
  if (!pet) { showToast('ไม่พบข้อมูล'); return; }

  const genderIcon = pet.gender === 'ชาย' || pet.gender === 'male' ? 'fa-mars' : 'fa-venus';
  const genderColor = pet.gender === 'ชาย' || pet.gender === 'male' ? '#2196F3' : '#E91E63';
  const genderText = pet.gender === 'male' ? 'ชาย' : pet.gender === 'female' ? 'หญิง' : pet.gender;

  const personalityHtml = (pet.personality || []).map(p => `<span class="chip">${p}</span>`).join('');
  const goodWithHtml = (pet.goodWith || []).map(g => `<span class="chip">${g}</span>`).join('');

  document.getElementById('adoptionDetail').innerHTML = `
    <div class="adoption-detail-page">
      <button class="sub-page-header" onclick="goBack('social')">
        <i class="fas fa-arrow-left"></i> <span>รับเลี้ยง</span>
      </button>

      <div class="adoption-detail-hero">
        <img src="${pet.image}" alt="${pet.name}" loading="lazy">
      </div>

      <div class="adoption-detail-info">
        <div class="adoption-detail-name-row">
          <h2>${pet.name}</h2>
          <i class="fas ${genderIcon}" style="color:${genderColor};font-size:20px"></i>
        </div>
        <p class="adoption-detail-breed">${pet.breed}</p>

        <div class="adoption-detail-stats">
          <div class="adoption-stat">
            <i class="fas fa-birthday-cake"></i>
            <span>อายุ</span>
            <strong>${pet.age}</strong>
          </div>
          <div class="adoption-stat">
            <i class="fas fa-weight-hanging"></i>
            <span>น้ำหนัก</span>
            <strong>${pet.weight}</strong>
          </div>
          <div class="adoption-stat">
            <i class="fas ${genderIcon}" style="color:${genderColor}"></i>
            <span>เพศ</span>
            <strong>${genderText}</strong>
          </div>
          ${pet.size ? `
          <div class="adoption-stat">
            <i class="fas fa-ruler"></i>
            <span>ขนาด</span>
            <strong>${pet.size}</strong>
          </div>` : ''}
        </div>

        <div class="adoption-detail-badges">
          ${pet.vaccinated ? '<span class="adoption-badge badge-green"><i class="fas fa-syringe"></i> วัคซีนครบ</span>' : '<span class="adoption-badge badge-gray"><i class="fas fa-syringe"></i> ยังไม่ครบ</span>'}
          ${pet.neutered ? '<span class="adoption-badge badge-green"><i class="fas fa-check-circle"></i> ทำหมันแล้ว</span>' : '<span class="adoption-badge badge-gray"><i class="fas fa-times-circle"></i> ยังไม่ทำหมัน</span>'}
          ${pet.microchipped ? '<span class="adoption-badge badge-green"><i class="fas fa-microchip"></i> มีไมโครชิป</span>' : ''}
          ${pet.houseTrained ? '<span class="adoption-badge badge-green"><i class="fas fa-home"></i> ฝึกเข้าห้องน้ำแล้ว</span>' : ''}
        </div>

        ${personalityHtml ? `
        <div class="adoption-detail-section">
          <h3><i class="fas fa-star"></i> นิสัย</h3>
          <div class="adoption-chips">${personalityHtml}</div>
        </div>` : ''}

        ${goodWithHtml ? `
        <div class="adoption-detail-section">
          <h3><i class="fas fa-heart"></i> เข้ากันได้กับ</h3>
          <div class="adoption-chips">${goodWithHtml}</div>
        </div>` : ''}

        <div class="adoption-detail-section">
          <h3><i class="fas fa-info-circle"></i> รายละเอียด</h3>
          <p class="adoption-detail-desc">${pet.description}</p>
        </div>

        <div class="adoption-detail-section">
          <h3><i class="fas fa-map-marker-alt"></i> ตำแหน่ง</h3>
          <p>${pet.location}</p>
        </div>

        <div class="adoption-detail-contact">
          <div class="adoption-contact-info">
            <span class="adoption-contact-org"><i class="fas fa-building"></i> ${pet.org || pet.contactName || ''}</span>
            ${pet.views ? `<span class="adoption-views"><i class="fas fa-eye"></i> ดู ${pet.views} ครั้ง</span>` : ''}
          </div>
          <button class="btn-primary btn-block" onclick="showAdoptionContact('${pet.name}','${pet.org || pet.contactName || ''}','${pet.phone || pet.contactPhone || ''}')">
            <i class="fas fa-phone"></i> ติดต่อรับเลี้ยง
          </button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-adoption-detail').classList.add('active');
}

function showAdoptionContact(petName, orgName, phone) {
  showModal(`
    <div style="text-align:center;padding:30px 20px">
      <div style="font-size:48px;margin-bottom:12px"><i class="fas fa-heart" style="color:#E91E63"></i></div>
      <h3 style="margin-bottom:8px">ติดต่อรับเลี้ยง ${petName}</h3>
      <p style="color:var(--text-secondary);margin-bottom:16px">${orgName}</p>
      <div style="background:var(--bg-card,#fff);border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.08)">
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">เบอร์โทรติดต่อ</p>
        <p style="font-size:20px;font-weight:700;color:var(--primary,#FFC501)">${phone}</p>
      </div>
      <button class="btn-primary btn-block" onclick="closeModal();showToast('คัดลอกเบอร์โทรแล้ว')">
        <i class="fas fa-copy"></i> คัดลอกเบอร์โทร
      </button>
      <button class="btn-outline btn-block" style="margin-top:8px" onclick="closeModal()">ปิด</button>
    </div>
  `);
}
