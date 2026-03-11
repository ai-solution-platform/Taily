/* ========== TAILY ADMIN - JS ========== */

let adminMerchants = [];
let adminEvents = [];
let merchantPage = 1;
const PAGE_SIZE = 20;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  const [mRes, eRes] = await Promise.all([
    fetch('../app/js/merchants.json').then(r => r.json()),
    fetch('../app/js/events.json').then(r => r.json())
  ]);
  adminMerchants = mRes.map(m => ({ ...m, status: ['active','active','active','pending','active'][Math.floor(Math.random()*5)] }));
  adminEvents = eRes;
});

// ===== LOGIN =====
function handleLogin(e) {
  e.preventDefault();
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
  renderDashboard();
  renderAdminMerchants();
  renderAdminEvents();
  renderRegistrations();
  renderAdminCoupons();
  renderProducts();
  renderOrders();
  renderSocial();
  renderAdoption();
  renderMembers();
  renderTopMerchants();
}

// ===== SIDEBAR =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(`sec-${name}`).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
}

// ===== DASHBOARD =====
function renderDashboard() {
  const container = document.getElementById('dashUpcomingEvents');
  const upcoming = adminEvents.filter(e => new Date(e.date) >= new Date()).slice(0, 5);
  container.innerHTML = upcoming.map(e => {
    const d = new Date(e.date);
    const thaiMonth = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const pct = Math.round((e.registered / e.capacity) * 100);
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--bg)">
        <div style="width:40px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:var(--primary)">${d.getDate()}</div>
          <div style="font-size:11px;color:var(--text-light)">${thaiMonth[d.getMonth()]}</div>
        </div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600">${e.titleTh}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${e.location}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;font-weight:600;color:${pct>=90?'var(--danger)':'var(--success)'}">
            ${e.registered}/${e.capacity}
          </div>
          <div style="font-size:11px;color:var(--text-light)">${pct}%</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== MERCHANTS TABLE =====
function renderAdminMerchants() {
  const filtered = getFilteredAdminMerchants();
  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (merchantPage - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('merchantTableBody');
  tbody.innerHTML = pageData.map(m => {
    const status = m.status || 'active';
    return `
      <tr>
        <td><input type="checkbox"></td>
        <td>${m.id}</td>
        <td>
          <div style="font-weight:600">${m.name}</div>
          <div style="font-size:11px;color:var(--text-light)">${m.description.slice(0,40)}...</div>
        </td>
        <td>${m.category}</td>
        <td>${m.province}</td>
        <td><span style="color:var(--accent)">★</span> ${m.rating}</td>
        <td>${m.priceLevel}</td>
        <td><span class="status-badge ${status}">${status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Inactive'}</span></td>
        <td>
          <button class="btn-sm" onclick="editMerchant(${m.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-danger" onclick="confirmDelete(${m.id},'merchant')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('merchantTableCount').textContent = `แสดง ${start+1}-${Math.min(start+PAGE_SIZE, total)} จาก ${total.toLocaleString()} รายการ`;

  // Pagination
  const pag = document.getElementById('merchantPagination');
  let pagHtml = '';
  if (merchantPage > 1) pagHtml += `<button onclick="goMerchantPage(${merchantPage-1})"><i class="fas fa-chevron-left"></i></button>`;
  for (let i = Math.max(1, merchantPage-2); i <= Math.min(totalPages, merchantPage+2); i++) {
    pagHtml += `<button class="${i===merchantPage?'active':''}" onclick="goMerchantPage(${i})">${i}</button>`;
  }
  if (merchantPage < totalPages) pagHtml += `<button onclick="goMerchantPage(${merchantPage+1})"><i class="fas fa-chevron-right"></i></button>`;
  pag.innerHTML = pagHtml;
}

function getFilteredAdminMerchants() {
  const search = (document.getElementById('adminMerchantSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('adminCatFilter')?.value || 'all';
  const region = document.getElementById('adminRegionFilter')?.value || 'all';
  const status = document.getElementById('adminStatusFilter')?.value || 'all';

  return adminMerchants.filter(m => {
    if (cat !== 'all' && m.category !== cat) return false;
    if (region !== 'all' && m.region !== region) return false;
    if (status !== 'all' && (m.status || 'active') !== status) return false;
    if (search && !m.name.toLowerCase().includes(search) && !m.province.includes(search)) return false;
    return true;
  });
}

function filterAdminMerchants() { merchantPage = 1; renderAdminMerchants(); }
function goMerchantPage(p) { merchantPage = p; renderAdminMerchants(); }

// ===== EVENTS TABLE =====
function renderAdminEvents() {
  const tbody = document.getElementById('eventTableBody');
  tbody.innerHTML = adminEvents.map(e => {
    const pct = Math.round((e.registered / e.capacity) * 100);
    const d = new Date(e.date);
    const now = new Date();
    const status = d < now ? 'completed' : 'upcoming';
    const thaiMonth = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return `
      <tr>
        <td>${e.id}</td>
        <td>
          <div style="font-weight:600">${e.titleTh}</div>
          <div style="font-size:11px;color:var(--text-light)">${e.category} | ${e.organizer}</div>
        </td>
        <td>${d.getDate()} ${thaiMonth[d.getMonth()]} ${d.getFullYear()+543}</td>
        <td>${e.location}</td>
        <td>
          <div>${e.registered}/${e.capacity}</div>
          <div style="width:60px;height:4px;background:var(--bg);border-radius:2px;margin-top:2px"><div style="width:${Math.min(pct,100)}%;height:100%;background:${pct>=90?'var(--danger)':'var(--primary)'};border-radius:2px"></div></div>
        </td>
        <td>${e.price}</td>
        <td><span class="status-badge ${status}">${status === 'upcoming' ? 'Upcoming' : 'Completed'}</span></td>
        <td>
          <button class="btn-sm"><i class="fas fa-edit"></i></button>
          <button class="btn-sm"><i class="fas fa-eye"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

// ===== REGISTRATIONS =====
function renderRegistrations() {
  const names = ['สมชาย ใจดี','สมหญิง รักหมา','วิชัย คนดี','พรทิพย์ แมวเหมียว','อนุชา สนุกสนาน','มาลี รักสัตว์','ธนา คนเก่ง','สุดา ใจดี','กมล สุขใจ','ปิยะ รักน้อง'];
  const events = ['Paws in the Park 2026','Pet First Aid Workshop','Songkran Pet Festival','Pattaya Beach Pet Party','Pet Health Fair 2026'];
  const statuses = ['confirmed','confirmed','confirmed','pending','confirmed','cancelled','confirmed','pending','confirmed','confirmed'];
  const payments = ['บัตรเครดิต','โอนเงิน','PromptPay','บัตรเครดิต','ฟรี','โอนเงิน','PromptPay','บัตรเครดิต','ฟรี','โอนเงิน'];

  const tbody = document.getElementById('regTableBody');
  tbody.innerHTML = names.map((n, i) => `
    <tr>
      <td><strong>REG-${2026}${String(i+1).padStart(4,'0')}</strong></td>
      <td>${n}</td>
      <td>${events[i % events.length]}</td>
      <td>${8-i} มี.ค. 2569</td>
      <td><span class="status-badge ${statuses[i]}">${statuses[i]==='confirmed'?'ยืนยันแล้ว':statuses[i]==='pending'?'รอยืนยัน':'ยกเลิก'}</span></td>
      <td>${payments[i]}</td>
      <td>
        <button class="btn-sm"><i class="fas fa-eye"></i></button>
        ${statuses[i]==='pending'?'<button class="btn-sm" style="color:var(--success)"><i class="fas fa-check"></i></button>':''}
      </td>
    </tr>
  `).join('');
}

// ===== COUPONS TABLE =====
function renderAdminCoupons() {
  const coupons = [
    { code:'TAILY10', merchant:'Jungle de Woof', detail:'ลด 10% สมาชิก', collected:342, used:89, expiry:'31 ธ.ค. 69', status:'active' },
    { code:'CAFE20', merchant:'Dog Runway', detail:'ลด 20 บาท เมนูเครื่องดื่ม', collected:256, used:120, expiry:'30 มิ.ย. 69', status:'active' },
    { code:'HOTEL15', merchant:'Pet-Friendly Resort', detail:'ลด 15% ค่าห้องพัก', collected:180, used:45, expiry:'28 ก.พ. 69', status:'inactive' },
    { code:'FREE-GR', merchant:'Pet Salon Premium', detail:'ฟรีกรูมมิ่ง 1 ครั้ง', collected:89, used:34, expiry:'31 มี.ค. 69', status:'active' },
    { code:'ISAN50', merchant:'ร้านอาหาร Pet Hub โคราช', detail:'ลด 50 บาท ขั้นต่ำ 300', collected:167, used:78, expiry:'30 เม.ย. 69', status:'active' },
    { code:'PHUKET', merchant:'Phuket Pet Paradise', detail:'ลด 500 บาท Pool Party', collected:200, used:145, expiry:'14 มิ.ย. 69', status:'active' },
  ];

  const tbody = document.getElementById('couponTableBody');
  tbody.innerHTML = coupons.map(c => `
    <tr>
      <td><strong>${c.code}</strong></td>
      <td>${c.merchant}</td>
      <td>${c.detail}</td>
      <td>${c.collected}</td>
      <td>${c.used}</td>
      <td>${c.expiry}</td>
      <td><span class="status-badge ${c.status}">${c.status==='active'?'Active':'Inactive'}</span></td>
      <td><button class="btn-sm"><i class="fas fa-edit"></i></button></td>
    </tr>
  `).join('');
}

// ===== MEMBERS TABLE =====
function renderMembers() {
  const members = [
    { id:'M001', name:'สมชาย รักน้องหมา', email:'somchai@email.com', tier:'Gold', points:5250, joined:'15 ม.ค. 68', status:'active' },
    { id:'M002', name:'สมหญิง แมวเหมียว', email:'somying@email.com', tier:'Platinum', points:22100, joined:'3 ธ.ค. 67', status:'active' },
    { id:'M003', name:'วิชัย เดินทาง', email:'wichai@email.com', tier:'Silver', points:2800, joined:'22 มี.ค. 68', status:'active' },
    { id:'M004', name:'พรทิพย์ คนรักหมา', email:'pornthip@email.com', tier:'Bronze', points:450, joined:'1 ม.ค. 69', status:'active' },
    { id:'M005', name:'ธนา Pet Lover', email:'thana@email.com', tier:'Gold', points:8900, joined:'10 ก.พ. 68', status:'active' },
    { id:'M006', name:'สุดา น่ารัก', email:'suda@email.com', tier:'Silver', points:1500, joined:'5 พ.ค. 68', status:'inactive' },
    { id:'M007', name:'กมล สุขสันต์', email:'kamol@email.com', tier:'Bronze', points:200, joined:'28 ก.พ. 69', status:'active' },
    { id:'M008', name:'มาลี รักแมว', email:'malee@email.com', tier:'Gold', points:6700, joined:'18 ก.ค. 68', status:'active' },
  ];

  const tbody = document.getElementById('memberTableBody');
  tbody.innerHTML = members.map(m => `
    <tr>
      <td><input type="checkbox"></td>
      <td>${m.id}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.email}</td>
      <td><span class="tier-badge ${m.tier.toLowerCase()}">${m.tier}</span></td>
      <td>${m.points.toLocaleString()}</td>
      <td>${m.joined}</td>
      <td><span class="status-badge ${m.status}">${m.status==='active'?'Active':'Inactive'}</span></td>
      <td>
        <button class="btn-sm"><i class="fas fa-eye"></i></button>
        <button class="btn-sm"><i class="fas fa-edit"></i></button>
      </td>
    </tr>
  `).join('');
}

// ===== TOP MERCHANTS (Reports) =====
function renderTopMerchants() {
  const container = document.getElementById('topMerchants');
  if (!container) return;
  const top = adminMerchants.slice(0, 10);
  container.innerHTML = top.map((m, i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:6px 0;border-bottom:1px solid var(--bg)">
      <span style="font-size:14px;font-weight:700;color:${i<3?'var(--primary)':'var(--text-light)'};width:24px">#${i+1}</span>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600">${m.name}</div>
        <div style="font-size:11px;color:var(--text-light)">${m.province}</div>
      </div>
      <span style="font-size:13px;font-weight:600;color:var(--accent)">★ ${m.rating}</span>
    </div>
  `).join('');
}

// ===== PRODUCTS TABLE =====
const productsData = [
  { id:1, img:'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=60', name:'อาหารสุนัข Royal Canin Adult', category:'อาหาร', price:890, discount:10, stock:245, sold:1230, status:'active' },
  { id:2, img:'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=60', name:'อาหารแมว Whiskas Tuna', category:'อาหาร', price:350, discount:5, stock:180, sold:890, status:'active' },
  { id:3, img:'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=60', name:'แชมพูอาบน้ำสุนัข สูตรอ่อนโยน', category:'กรูมมิ่ง', price:280, discount:15, stock:120, sold:567, status:'active' },
  { id:4, img:'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=60', name:'ของเล่นลูกบอลยาง สุนัข', category:'ของเล่น', price:150, discount:0, stock:300, sold:445, status:'active' },
  { id:5, img:'https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=60', name:'วิตามินบำรุงขน Omega 3', category:'สุขภาพ', price:590, discount:20, stock:85, sold:334, status:'active' },
  { id:6, img:'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=60', name:'เสื้อกันหนาวสุนัข ลายสก็อต', category:'แฟชั่น', price:450, discount:0, stock:60, sold:210, status:'active' },
  { id:7, img:'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=60', name:'หวีขนแมว Self-Cleaning', category:'กรูมมิ่ง', price:320, discount:10, stock:0, sold:678, status:'inactive' },
  { id:8, img:'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=60', name:'ปลอกคอ GPS Tracker สัตว์เลี้ยง', category:'สุขภาพ', price:1990, discount:5, stock:42, sold:156, status:'active' },
];

function renderProducts(filter) {
  filter = filter || 'all';
  const filtered = filter === 'all' ? productsData : productsData.filter(p => p.category === filter);
  const tbody = document.getElementById('productTableBody');
  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td>${p.id}</td>
      <td><img src="${p.img}" alt="${p.name}" style="width:40px;height:40px;border-radius:8px;object-fit:cover"></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="status-badge active">${p.category}</span></td>
      <td>฿${p.price.toLocaleString()}</td>
      <td>${p.discount > 0 ? '<span style="color:var(--danger);font-weight:600">-' + p.discount + '%</span>' : '-'}</td>
      <td>${p.stock > 0 ? p.stock : '<span style="color:var(--danger)">หมด</span>'}</td>
      <td>${p.sold.toLocaleString()}</td>
      <td><span class="status-badge ${p.status}">${p.status === 'active' ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="btn-sm"><i class="fas fa-edit"></i></button>
        <button class="btn-danger"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function filterProducts(cat, btn) {
  document.querySelectorAll('#sec-products .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProducts(cat);
}

// ===== ORDERS TABLE =====
const ordersData = [
  { code:'ORD-20260301', customer:'สมชาย รักน้องหมา', product:'อาหารสุนัข Royal Canin x2', amount:1780, status:'completed', date:'1 มี.ค. 69' },
  { code:'ORD-20260305', customer:'สมหญิง แมวเหมียว', product:'วิตามินบำรุงขน Omega 3', amount:472, status:'shipping', date:'5 มี.ค. 69' },
  { code:'ORD-20260307', customer:'วิชัย เดินทาง', product:'ปลอกคอ GPS Tracker', amount:1891, status:'pending', date:'7 มี.ค. 69' },
  { code:'ORD-20260308', customer:'พรทิพย์ คนรักหมา', product:'เสื้อกันหนาวสุนัข x3', amount:1350, status:'pending', date:'8 มี.ค. 69' },
  { code:'ORD-20260309', customer:'ธนา Pet Lover', product:'แชมพูอาบน้ำสุนัข x2, ของเล่นลูกบอล', amount:710, status:'completed', date:'9 มี.ค. 69' },
  { code:'ORD-20260310', customer:'มาลี รักแมว', product:'หวีขนแมว Self-Cleaning', amount:288, status:'cancelled', date:'10 มี.ค. 69' },
];

function renderOrders(filter) {
  filter = filter || 'all';
  const filtered = filter === 'all' ? ordersData : ordersData.filter(o => o.status === filter);
  const statusMap = { pending:'รอยืนยัน', shipping:'กำลังจัดส่ง', completed:'สำเร็จ', cancelled:'ยกเลิก' };
  const badgeMap = { pending:'badge-warning', shipping:'badge-info', completed:'active', cancelled:'badge-danger' };
  const tbody = document.getElementById('orderTableBody');
  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td><strong>${o.code}</strong></td>
      <td>${o.customer}</td>
      <td>${o.product}</td>
      <td><strong>฿${o.amount.toLocaleString()}</strong></td>
      <td><span class="status-badge ${badgeMap[o.status]}">${statusMap[o.status]}</span></td>
      <td>${o.date}</td>
      <td>
        <button class="btn-sm"><i class="fas fa-eye"></i></button>
        ${o.status === 'pending' ? '<button class="btn-sm" style="color:var(--success)"><i class="fas fa-check"></i></button>' : ''}
      </td>
    </tr>
  `).join('');
}

function filterOrders(status, btn) {
  document.querySelectorAll('#sec-orders .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderOrders(status);
}

// ===== SOCIAL TABLE =====
const socialData = [
  { id:1, user:'สมชาย รักน้องหมา', content:'พาน้องหมาไปเดินเล่นสวนลุม วันนี้อากาศดีมาก!', type:'โพสต์รูป', likes:89, reports:0, status:'approved' },
  { id:2, user:'แมวเหมียว FC', content:'แนะนำคาเฟ่แมวใหม่ย่านอารีย์ น่ารักมาก', type:'รีวิว', likes:156, reports:0, status:'approved' },
  { id:3, user:'Pet Health TH', content:'5 สัญญาณอันตรายที่ต้องพาน้องหมาไปหาหมอ', type:'บทความ', likes:234, reports:0, status:'approved' },
  { id:4, user:'ผู้ใช้ใหม่123', content:'ขายลูกสุนัข ราคาถูก ติดต่อ...', type:'โพสต์ข้อความ', likes:2, reports:12, status:'flagged' },
  { id:5, user:'สุดา น่ารัก', content:'น้องแมวหายไป 3 วันแล้ว ช่วยแชร์ด้วยนะคะ', type:'โพสต์รูป', likes:445, reports:0, status:'approved' },
  { id:6, user:'DogLover99', content:'โปรโมชั่นร้านกรูมมิ่งลด 50% จริงไหม?', type:'โพสต์ข้อความ', likes:23, reports:3, status:'pending' },
];

function renderSocial() {
  const statusMap = { approved:'อนุมัติ', flagged:'ถูกรายงาน', pending:'รอตรวจสอบ' };
  const badgeMap = { approved:'active', flagged:'badge-danger', pending:'badge-warning' };
  const tbody = document.getElementById('socialTableBody');
  tbody.innerHTML = socialData.map(s => `
    <tr>
      <td>${s.id}</td>
      <td><strong>${s.user}</strong></td>
      <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.content}</td>
      <td>${s.type}</td>
      <td><i class="fas fa-heart" style="color:var(--danger);font-size:11px"></i> ${s.likes}</td>
      <td>${s.reports > 0 ? '<span style="color:var(--danger);font-weight:600">' + s.reports + '</span>' : '0'}</td>
      <td><span class="status-badge ${badgeMap[s.status]}">${statusMap[s.status]}</span></td>
      <td>
        <button class="btn-sm" style="color:var(--success)" title="อนุมัติ"><i class="fas fa-check"></i></button>
        <button class="btn-sm" style="color:var(--warning)" title="ตั้งค่าสถานะ"><i class="fas fa-flag"></i></button>
        <button class="btn-danger" title="ลบ"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

// ===== ADOPTION TABLE =====
const adoptionData = [
  { id:1, img:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=60', name:'โกลเด้น', breed:'Golden Retriever', age:'2 ปี', status:'available', org:'มูลนิธิช่วยเหลือสัตว์' },
  { id:2, img:'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=60', name:'มิ้นท์', breed:'Scottish Fold', age:'1 ปี', status:'pending', org:'บ้านพักสัตว์ทองหล่อ' },
  { id:3, img:'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=60', name:'บราวนี่', breed:'ไทยหลังอาน', age:'8 เดือน', status:'available', org:'สมาคมรักสัตว์' },
  { id:4, img:'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=60', name:'สโนว์', breed:'Persian', age:'3 ปี', status:'adopted', org:'มูลนิธิช่วยเหลือสัตว์' },
  { id:5, img:'https://images.unsplash.com/photo-1587764379873-97837921fd44?w=60', name:'บัดดี้', breed:'Labrador', age:'5 เดือน', status:'available', org:'ศูนย์ดูแลสัตว์ กทม.' },
  { id:6, img:'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=60', name:'มีมี่', breed:'Siamese', age:'2 ปี', status:'pending', org:'บ้านพักสัตว์ทองหล่อ' },
];

function renderAdoption() {
  const statusMap = { available:'พร้อมรับเลี้ยง', pending:'รอดำเนินการ', adopted:'มีเจ้าของแล้ว' };
  const badgeMap = { available:'active', pending:'badge-purple', adopted:'completed' };
  const tbody = document.getElementById('adoptionTableBody');
  tbody.innerHTML = adoptionData.map(a => `
    <tr>
      <td>${a.id}</td>
      <td><img src="${a.img}" alt="${a.name}" style="width:40px;height:40px;border-radius:50%;object-fit:cover"></td>
      <td><strong>${a.name}</strong></td>
      <td>${a.breed}</td>
      <td>${a.age}</td>
      <td><span class="status-badge ${badgeMap[a.status]}">${statusMap[a.status]}</span></td>
      <td>${a.org}</td>
      <td>
        <button class="btn-sm"><i class="fas fa-eye"></i></button>
        <button class="btn-sm"><i class="fas fa-edit"></i></button>
      </td>
    </tr>
  `).join('');
}

// ===== ADD PRODUCT MODAL =====
function showAddProduct() {
  showAdminModal(`
    <div class="modal-title"><i class="fas fa-shopping-bag" style="color:var(--primary)"></i> เพิ่มสินค้าใหม่</div>
    <div class="form-grid">
      <div class="form-group"><label>ชื่อสินค้า</label><input type="text" placeholder="ชื่อสินค้า..."></div>
      <div class="form-group"><label>หมวดหมู่</label><select><option>อาหาร</option><option>กรูมมิ่ง</option><option>ของเล่น</option><option>สุขภาพ</option><option>แฟชั่น</option></select></div>
      <div class="form-group"><label>ราคา (บาท)</label><input type="number" placeholder="0"></div>
      <div class="form-group"><label>ส่วนลด (%)</label><input type="number" placeholder="0"></div>
      <div class="form-group"><label>จำนวนสต็อก</label><input type="number" placeholder="0"></div>
      <div class="form-group"><label>รูปภาพ URL</label><input type="url" placeholder="https://..."></div>
      <div class="form-group full"><label>รายละเอียดสินค้า</label><textarea placeholder="รายละเอียด..."></textarea></div>
    </div>
    <div class="form-actions">
      <button class="btn-outline" onclick="closeAdminModal()">ยกเลิก</button>
      <button class="btn-primary" onclick="closeAdminModal()"><i class="fas fa-save"></i> บันทึก</button>
    </div>
  `);
}

// ===== ADD PET MODAL =====
function showAddPet() {
  showAdminModal(`
    <div class="modal-title"><i class="fas fa-heart" style="color:var(--primary)"></i> เพิ่มสัตว์เลี้ยง</div>
    <div class="form-grid">
      <div class="form-group"><label>ชื่อสัตว์</label><input type="text" placeholder="ชื่อ..."></div>
      <div class="form-group"><label>ประเภท</label><select><option>สุนัข</option><option>แมว</option><option>อื่นๆ</option></select></div>
      <div class="form-group"><label>สายพันธุ์</label><input type="text" placeholder="สายพันธุ์..."></div>
      <div class="form-group"><label>อายุ</label><input type="text" placeholder="เช่น 2 ปี"></div>
      <div class="form-group"><label>องค์กร/มูลนิธิ</label><input type="text" placeholder="ชื่อองค์กร..."></div>
      <div class="form-group"><label>รูปภาพ URL</label><input type="url" placeholder="https://..."></div>
      <div class="form-group full"><label>รายละเอียดเพิ่มเติม</label><textarea placeholder="นิสัย สุขภาพ ฯลฯ..."></textarea></div>
    </div>
    <div class="form-actions">
      <button class="btn-outline" onclick="closeAdminModal()">ยกเลิก</button>
      <button class="btn-primary" onclick="closeAdminModal()"><i class="fas fa-save"></i> บันทึก</button>
    </div>
  `);
}

// ===== MODALS =====
function showAdminModal(content) {
  document.getElementById('adminModalContent').innerHTML = content;
  document.getElementById('adminModal').classList.add('show');
}
function closeAdminModal() {
  document.getElementById('adminModal').classList.remove('show');
}

function showAddMerchant() {
  showAdminModal(`
    <div class="modal-title"><i class="fas fa-plus-circle" style="color:var(--primary)"></i> เพิ่มร้านค้าใหม่</div>
    <div class="form-grid">
      <div class="form-group"><label>ชื่อสถานที่</label><input type="text" placeholder="ชื่อร้านค้า..."></div>
      <div class="form-group"><label>ประเภท</label><select><option>ร้านอาหาร</option><option>คาเฟ่</option><option>โรงแรม</option><option>สถานที่ท่องเที่ยว</option></select></div>
      <div class="form-group"><label>ภาค</label><select><option>ภาคกลาง</option><option>ภาคเหนือ</option><option>ภาคอีสาน</option><option>ภาคตะวันออก</option><option>ภาคตะวันตก</option><option>ภาคใต้</option></select></div>
      <div class="form-group"><label>จังหวัด</label><input type="text" placeholder="จังหวัด..."></div>
      <div class="form-group full"><label>คำอธิบาย</label><textarea placeholder="รายละเอียด..."></textarea></div>
      <div class="form-group"><label>สินค้า / บริการ</label><input type="text" placeholder="คั่นด้วย ,"></div>
      <div class="form-group"><label>โปรโมชั่น</label><input type="text" placeholder="โปรโมชั่น..."></div>
      <div class="form-group"><label>เวลาเปิด-ปิด</label><input type="text" placeholder="09:00-20:00"></div>
      <div class="form-group"><label>เบอร์โทร</label><input type="tel" placeholder="0xx-xxx-xxxx"></div>
      <div class="form-group"><label>ระดับราคา</label><select><option>$</option><option>$$</option><option>$$$</option><option>$$$$</option><option>ฟรี</option></select></div>
      <div class="form-group"><label>Google Maps Link</label><input type="url" placeholder="https://maps.app.goo.gl/..."></div>
      <div class="form-group full"><label>เงื่อนไข Pet-Friendly</label><textarea placeholder="รายละเอียดเงื่อนไข..."></textarea></div>
    </div>
    <div class="form-actions">
      <button class="btn-outline" onclick="closeAdminModal()">ยกเลิก</button>
      <button class="btn-primary" onclick="closeAdminModal()"><i class="fas fa-save"></i> บันทึก</button>
    </div>
  `);
}

function showAddEvent() {
  showAdminModal(`
    <div class="modal-title"><i class="fas fa-calendar-plus" style="color:var(--primary)"></i> สร้างกิจกรรมใหม่</div>
    <div class="form-grid">
      <div class="form-group"><label>ชื่อกิจกรรม (EN)</label><input type="text" placeholder="Event title..."></div>
      <div class="form-group"><label>ชื่อกิจกรรม (TH)</label><input type="text" placeholder="ชื่อกิจกรรม..."></div>
      <div class="form-group"><label>หมวดหมู่</label><select><option>งานรวมพล</option><option>เวิร์กชอป</option><option>เทศกาล</option><option>นิทรรศการ</option><option>กีฬา</option><option>ท่องเที่ยว</option><option>ประกวด</option><option>สุขภาพ</option></select></div>
      <div class="form-group"><label>สถานที่</label><input type="text" placeholder="สถานที่จัดงาน..."></div>
      <div class="form-group"><label>วันที่เริ่ม</label><input type="date"></div>
      <div class="form-group"><label>วันที่สิ้นสุด</label><input type="date"></div>
      <div class="form-group"><label>เวลา</label><input type="text" placeholder="09:00-18:00"></div>
      <div class="form-group"><label>จำนวนที่รับ</label><input type="number" placeholder="0"></div>
      <div class="form-group"><label>ราคา</label><input type="text" placeholder="ฟรี / 500 บาท"></div>
      <div class="form-group"><label>ผู้จัดงาน</label><input type="text" placeholder="ชื่อผู้จัด..."></div>
      <div class="form-group full"><label>รายละเอียด</label><textarea placeholder="รายละเอียดกิจกรรม..."></textarea></div>
      <div class="form-group full"><label>รูปภาพ URL</label><input type="url" placeholder="https://..."></div>
    </div>
    <div class="form-actions">
      <button class="btn-outline" onclick="closeAdminModal()">ยกเลิก</button>
      <button class="btn-primary" onclick="closeAdminModal()"><i class="fas fa-save"></i> สร้างกิจกรรม</button>
    </div>
  `);
}

function showAddCoupon() {
  showAdminModal(`
    <div class="modal-title"><i class="fas fa-ticket-alt" style="color:var(--primary)"></i> สร้างคูปองใหม่</div>
    <div class="form-grid">
      <div class="form-group"><label>รหัสคูปอง</label><input type="text" placeholder="เช่น TAILY10"></div>
      <div class="form-group"><label>ร้านค้า</label><select><option>ทุกร้านค้า</option><option>Jungle de Woof</option><option>Dog Runway</option></select></div>
      <div class="form-group"><label>ประเภทส่วนลด</label><select><option>เปอร์เซ็นต์</option><option>จำนวนเงิน</option><option>ฟรี</option></select></div>
      <div class="form-group"><label>มูลค่าส่วนลด</label><input type="text" placeholder="10% / 50 บาท"></div>
      <div class="form-group"><label>จำนวนจำกัด</label><input type="number" placeholder="0 = ไม่จำกัด"></div>
      <div class="form-group"><label>ขั้นต่ำ</label><input type="number" placeholder="0"></div>
      <div class="form-group"><label>วันเริ่มต้น</label><input type="date"></div>
      <div class="form-group"><label>วันหมดอายุ</label><input type="date"></div>
      <div class="form-group full"><label>เงื่อนไขการใช้</label><textarea placeholder="เงื่อนไข..."></textarea></div>
      <div class="form-group"><label>Target Segment</label><select><option>ทุกคน</option><option>Dog Lovers</option><option>Cat Lovers</option><option>VIP Spenders</option></select></div>
      <div class="form-group"><label>Target Tier</label><select><option>ทุก Tier</option><option>Bronze+</option><option>Silver+</option><option>Gold+</option><option>Platinum</option></select></div>
    </div>
    <div class="form-actions">
      <button class="btn-outline" onclick="closeAdminModal()">ยกเลิก</button>
      <button class="btn-primary" onclick="closeAdminModal()"><i class="fas fa-save"></i> สร้างคูปอง</button>
    </div>
  `);
}

function editMerchant(id) {
  const m = adminMerchants.find(x => x.id === id);
  if (!m) return;
  showAdminModal(`
    <div class="modal-title"><i class="fas fa-edit" style="color:var(--primary)"></i> แก้ไขร้านค้า #${m.id}</div>
    <div class="form-grid">
      <div class="form-group"><label>ชื่อสถานที่</label><input type="text" value="${m.name}"></div>
      <div class="form-group"><label>ประเภท</label><select>${['ร้านอาหาร','คาเฟ่','โรงแรม','สถานที่ท่องเที่ยว'].map(c=>`<option ${c===m.category?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label>จังหวัด</label><input type="text" value="${m.province}"></div>
      <div class="form-group"><label>ภาค</label><input type="text" value="${m.region}"></div>
      <div class="form-group full"><label>คำอธิบาย</label><textarea>${m.description}</textarea></div>
      <div class="form-group"><label>สินค้า / บริการ</label><input type="text" value="${m.services}"></div>
      <div class="form-group"><label>โปรโมชั่น</label><input type="text" value="${m.promotion}"></div>
      <div class="form-group"><label>เวลาเปิด-ปิด</label><input type="text" value="${m.hours}"></div>
      <div class="form-group"><label>เบอร์โทร</label><input type="tel" value="${m.phone}"></div>
      <div class="form-group"><label>Rating</label><input type="number" value="${m.rating}" step="0.1" min="0" max="5"></div>
      <div class="form-group"><label>ระดับราคา</label><select>${['$','$$','$$$','$$$$','ฟรี'].map(p=>`<option ${p===m.priceLevel?'selected':''}>${p}</option>`).join('')}</select></div>
      <div class="form-group"><label>สถานะ</label><select><option ${m.status==='active'?'selected':''}>active</option><option ${m.status==='pending'?'selected':''}>pending</option><option ${m.status==='inactive'?'selected':''}>inactive</option></select></div>
      <div class="form-group full"><label>เงื่อนไข Pet-Friendly</label><textarea>${m.petCondition}</textarea></div>
    </div>
    <div class="form-actions">
      <button class="btn-outline" onclick="closeAdminModal()">ยกเลิก</button>
      <button class="btn-primary" onclick="closeAdminModal()"><i class="fas fa-save"></i> บันทึกการเปลี่ยนแปลง</button>
    </div>
  `);
}

function confirmDelete(id, type) {
  showAdminModal(`
    <div style="text-align:center;padding:20px">
      <div style="font-size:48px;margin-bottom:12px">⚠️</div>
      <h3 style="margin-bottom:8px">ยืนยันการลบ?</h3>
      <p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px">การลบข้อมูลนี้ไม่สามารถกู้คืนได้</p>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn-outline" onclick="closeAdminModal()">ยกเลิก</button>
        <button class="btn-primary" style="background:var(--danger)" onclick="closeAdminModal()"><i class="fas fa-trash"></i> ลบ</button>
      </div>
    </div>
  `);
}

function exportMerchants() {
  showAdminModal(`
    <div style="text-align:center;padding:20px">
      <div style="font-size:48px;margin-bottom:12px">📥</div>
      <h3 style="margin-bottom:8px">Export ข้อมูลร้านค้า</h3>
      <p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px">เลือกรูปแบบที่ต้องการ</p>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn-outline" onclick="closeAdminModal()"><i class="fas fa-file-csv"></i> CSV</button>
        <button class="btn-outline" onclick="closeAdminModal()"><i class="fas fa-file-excel"></i> Excel</button>
        <button class="btn-primary" onclick="closeAdminModal()"><i class="fas fa-file-pdf"></i> PDF</button>
      </div>
    </div>
  `);
}
