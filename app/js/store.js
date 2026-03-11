/* ========== TAILY STORE — State Management v2.0 ========== */
const TailyStore = {
  _state: {
    user: null,           // User profile object
    activeTab: 'home',    // Current active tab
    cart: [],             // Shopping cart items [{productId, name, image, price, qty}]
    cartCount: 0,         // Cart item count (for badge)
    notifCount: 0,        // Unread notification count
    unreadMessages: 0,    // Unread DM count
    likedPosts: new Set(),    // Set of liked post IDs
    bookmarkedPosts: new Set(), // Set of bookmarked post IDs
    viewedStories: new Set(),  // Set of viewed story IDs
    joinedGroups: new Set([1, 3]), // Pre-joined group IDs
    favorites: new Set(),  // Favorite merchant IDs
    isLoading: false,      // Global loading state
    searchHistory: [],     // Recent searches
  },
  _listeners: {},

  get(key) { return this._state[key]; },

  set(key, val) {
    this._state[key] = val;
    (this._listeners[key] || []).forEach(fn => fn(val));
    this._persist();
  },

  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
    return () => { this._listeners[key] = this._listeners[key].filter(f => f !== fn); };
  },

  // Cart helpers
  addToCart(product, qty = 1) {
    const cart = [...this._state.cart];
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        qty: qty
      });
    }
    this.set('cart', cart);
    this.set('cartCount', cart.reduce((sum, item) => sum + item.qty, 0));
  },

  removeFromCart(productId) {
    const cart = this._state.cart.filter(item => item.productId !== productId);
    this.set('cart', cart);
    this.set('cartCount', cart.reduce((sum, item) => sum + item.qty, 0));
  },

  updateCartQty(productId, qty) {
    const cart = [...this._state.cart];
    const item = cart.find(i => i.productId === productId);
    if (item) {
      if (qty <= 0) {
        this.removeFromCart(productId);
      } else {
        item.qty = qty;
        this.set('cart', cart);
        this.set('cartCount', cart.reduce((sum, i) => sum + i.qty, 0));
      }
    }
  },

  getCartTotal() {
    return this._state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  },

  // Like/Bookmark helpers
  toggleLike(postId) {
    const likes = new Set(this._state.likedPosts);
    if (likes.has(postId)) likes.delete(postId); else likes.add(postId);
    this.set('likedPosts', likes);
    return likes.has(postId);
  },

  toggleBookmark(postId) {
    const bookmarks = new Set(this._state.bookmarkedPosts);
    if (bookmarks.has(postId)) bookmarks.delete(postId); else bookmarks.add(postId);
    this.set('bookmarkedPosts', bookmarks);
    return bookmarks.has(postId);
  },

  toggleFavorite(merchantId) {
    const favs = new Set(this._state.favorites);
    if (favs.has(merchantId)) favs.delete(merchantId); else favs.add(merchantId);
    this.set('favorites', favs);
    return favs.has(merchantId);
  },

  // Persistence
  _persist() {
    try {
      const toSave = {
        cart: this._state.cart,
        likedPosts: [...this._state.likedPosts],
        bookmarkedPosts: [...this._state.bookmarkedPosts],
        viewedStories: [...this._state.viewedStories],
        joinedGroups: [...this._state.joinedGroups],
        favorites: [...this._state.favorites],
        searchHistory: this._state.searchHistory,
      };
      localStorage.setItem('taily_store', JSON.stringify(toSave));
    } catch(e) { /* localStorage not available */ }
  },

  _restore() {
    try {
      const saved = JSON.parse(localStorage.getItem('taily_store'));
      if (saved) {
        this._state.cart = saved.cart || [];
        this._state.cartCount = (saved.cart || []).reduce((s, i) => s + i.qty, 0);
        this._state.likedPosts = new Set(saved.likedPosts || []);
        this._state.bookmarkedPosts = new Set(saved.bookmarkedPosts || []);
        this._state.viewedStories = new Set(saved.viewedStories || []);
        this._state.joinedGroups = new Set(saved.joinedGroups || [1, 3]);
        this._state.favorites = new Set(saved.favorites || []);
        this._state.searchHistory = saved.searchHistory || [];
      }
    } catch(e) { /* localStorage not available */ }
  },

  init() {
    this._restore();
  }
};
