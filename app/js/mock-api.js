/* ========== TAILY MOCK API — Simulated Backend v2.0 ========== */
const MockAPI = {
  _cache: {},

  async _delay(min = 150, max = 500) {
    return new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
  },

  async _loadJSON(path) {
    if (this._cache[path]) return this._cache[path];
    const res = await fetch(path);
    const data = await res.json();
    this._cache[path] = data;
    return data;
  },

  // ===== USER =====
  async getUserProfile() {
    await this._delay(100, 300);
    return this._loadJSON('data/user-profile.json');
  },

  // ===== MERCHANTS =====
  async getMerchants() {
    // No delay for map — needs to be fast
    return this._loadJSON('data/merchants.json');
  },

  async getMerchant(id) {
    await this._delay(100, 200);
    const merchants = await this._loadJSON('data/merchants.json');
    return merchants.find(m => m.id === id);
  },

  async getNearbyMerchants(lat, lng, limit = 10) {
    await this._delay(200, 400);
    const merchants = await this._loadJSON('data/merchants.json');
    // Sort by distance (simplified)
    const withDist = merchants.map(m => ({
      ...m,
      distance: Math.sqrt(Math.pow(m.lat - lat, 2) + Math.pow(m.lng - lng, 2)) * 111
    }));
    withDist.sort((a, b) => a.distance - b.distance);
    return withDist.slice(0, limit);
  },

  async getFeaturedMerchants(limit = 8) {
    await this._delay(200, 400);
    const merchants = await this._loadJSON('data/merchants.json');
    // Return top-rated merchants
    const sorted = [...merchants].sort((a, b) => b.rating - a.rating);
    return sorted.slice(0, limit);
  },

  // ===== EVENTS =====
  async getEvents() {
    await this._delay(100, 300);
    return this._loadJSON('data/events.json');
  },

  async getUpcomingEvents(limit = 5) {
    await this._delay(200, 400);
    const events = await this._loadJSON('data/events.json');
    const now = new Date();
    return events.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, limit);
  },

  // ===== SOCIAL FEED =====
  async getFeed(page = 1, limit = 10) {
    await this._delay(300, 600);
    const posts = await this._loadJSON('data/posts.json');
    const start = (page - 1) * limit;
    return {
      items: posts.slice(start, start + limit),
      hasMore: start + limit < posts.length,
      total: posts.length
    };
  },

  async getPost(id) {
    await this._delay(100, 200);
    const posts = await this._loadJSON('data/posts.json');
    return posts.find(p => p.id === id);
  },

  // ===== STORIES =====
  async getStories() {
    await this._delay(200, 400);
    return this._loadJSON('data/stories.json');
  },

  // ===== PRODUCTS =====
  async getProducts(category = 'all', page = 1, limit = 10) {
    await this._delay(300, 500);
    let products = await this._loadJSON('data/products.json');
    if (category !== 'all') {
      products = products.filter(p => p.category === category);
    }
    const start = (page - 1) * limit;
    return {
      items: products.slice(start, start + limit),
      hasMore: start + limit < products.length,
      total: products.length
    };
  },

  async getProduct(id) {
    await this._delay(100, 200);
    const products = await this._loadJSON('data/products.json');
    return products.find(p => p.id === id);
  },

  async searchProducts(query) {
    await this._delay(300, 500);
    const products = await this._loadJSON('data/products.json');
    const q = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q))
    );
  },

  // ===== ORDERS =====
  async getOrders() {
    await this._delay(200, 400);
    return this._loadJSON('data/orders.json');
  },

  async placeOrder(cart, address, payment) {
    await this._delay(1000, 2000); // Simulate payment processing
    const orderId = 'ORD-' + Date.now().toString().slice(-8);
    return {
      success: true,
      orderId: orderId,
      total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0) + 50,
      estimatedDelivery: '3-5 วันทำการ'
    };
  },

  // ===== GROUPS =====
  async getGroups() {
    await this._delay(200, 400);
    return this._loadJSON('data/groups.json');
  },

  // ===== MESSAGES =====
  async getConversations() {
    await this._delay(200, 400);
    return this._loadJSON('data/messages.json');
  },

  async sendMessage(chatId, text) {
    await this._delay(200, 500);
    return { success: true, messageId: Date.now(), time: new Date().toISOString() };
  },

  // ===== ADOPTION =====
  async getAdoptionPets() {
    await this._delay(200, 400);
    return this._loadJSON('data/adoption.json');
  },

  // ===== NOTIFICATIONS =====
  async getNotifications() {
    await this._delay(200, 400);
    return this._loadJSON('data/notifications.json');
  },

  // ===== COUPONS (existing mock data) =====
  async getCoupons() {
    await this._delay(100, 300);
    // Return hardcoded coupons (same as existing app)
    return [
      {id:1, merchantName:'Jungle de Woof', promotion:'ลด 10%', category:'ร้านอาหาร', type:'discount', discountText:'10%', discountLabel:'ส่วนลด', expiry:'30 เม.ย. 2569', badge:'hot', emoji:'🍖', code:'TAILY10'},
      {id:2, merchantName:'Meow Café', promotion:'ลด 20%', category:'คาเฟ่', type:'discount', discountText:'20%', discountLabel:'ส่วนลด', expiry:'15 พ.ค. 2569', badge:'new', emoji:'☕', code:'CAFE20'},
      {id:3, merchantName:'Pet Paradise Hotel', promotion:'ลด 15%', category:'โรงแรม', type:'discount', discountText:'15%', discountLabel:'ส่วนลด', expiry:'31 พ.ค. 2569', badge:'', emoji:'🏨', code:'HOTEL15'},
      {id:4, merchantName:'Happy Grooming', promotion:'Grooming ฟรี', category:'บริการ', type:'free', discountText:'ฟรี', discountLabel:'บริการฟรี', expiry:'30 มิ.ย. 2569', badge:'hot', emoji:'✂️', code:'FREE-GR'},
      {id:5, merchantName:'อีสาน Pet Café', promotion:'ลด 50 บาท', category:'คาเฟ่', type:'cash', discountText:'฿50', discountLabel:'ส่วนลด', expiry:'31 ก.ค. 2569', badge:'', emoji:'🐕', code:'ISAN50'},
      {id:6, merchantName:'Phuket Pet Resort', promotion:'ส่วนลด 500 บาท', category:'โรงแรม', type:'cash', discountText:'฿500', discountLabel:'ส่วนลด', expiry:'31 ส.ค. 2569', badge:'new', emoji:'🏖️', code:'PHUKET'},
      {id:7, merchantName:'Pet Mart Central', promotion:'ลด 25%', category:'ร้านค้า', type:'discount', discountText:'25%', discountLabel:'ส่วนลด', expiry:'15 เม.ย. 2569', badge:'limited', emoji:'🛒', code:'MART25'},
      {id:8, merchantName:'Dog Park Cafe BKK', promotion:'แถมเครื่องดื่มฟรี', category:'คาเฟ่', type:'free', discountText:'ฟรี', discountLabel:'ของแถม', expiry:'20 เม.ย. 2569', badge:'', emoji:'🥤', code:'DOGPARK'},
      {id:9, merchantName:'Cat Clinic สุขุมวิท', promotion:'ตรวจสุขภาพลด 30%', category:'บริการ', type:'discount', discountText:'30%', discountLabel:'ส่วนลด', expiry:'30 มิ.ย. 2569', badge:'hot', emoji:'🏥', code:'VET30'},
      {id:10, merchantName:'Taily Official', promotion:'ส่วนลดวันเกิด', category:'พิเศษ', type:'cash', discountText:'฿100', discountLabel:'ส่วนลด', expiry:'31 มี.ค. 2569', badge:'limited', emoji:'🎂', code:'BDAY100'}
    ];
  },

  // ===== SEARCH =====
  async globalSearch(query) {
    await this._delay(300, 600);
    const [merchants, events, products, posts] = await Promise.all([
      this._loadJSON('data/merchants.json'),
      this._loadJSON('data/events.json'),
      this._loadJSON('data/products.json'),
      this._loadJSON('data/posts.json')
    ]);
    const q = query.toLowerCase();
    return {
      merchants: merchants.filter(m => m.name.toLowerCase().includes(q) || m.province.includes(q)).slice(0, 5),
      events: events.filter(e => e.title.toLowerCase().includes(q) || e.titleTh.includes(q)).slice(0, 3),
      products: products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5),
      posts: posts.filter(p => p.caption.includes(q)).slice(0, 3)
    };
  }
};
