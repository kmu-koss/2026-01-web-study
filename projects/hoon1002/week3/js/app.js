/* ============================================
   Hobby-in — App Core (Shared Utilities)
   ============================================ */

const App = {
  // --- User Management ---
  currentUser: null,

  init() {
    this.loadUser();
    this.renderNavbar();
    this.setupNavScroll();
    this.setupMobileNav();
    this.loadGuides();
  },

  loadUser() {
    const saved = localStorage.getItem('hobbyinUser');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  },

  saveUser(user) {
    this.currentUser = user;
    localStorage.setItem('hobbyinUser', JSON.stringify(user));
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('hobbyinUser');
    window.location.reload();
  },

  // --- Guide Management (localStorage) ---
  loadGuides() {
    const custom = localStorage.getItem('hobbyinCustomGuides');
    if (custom) {
      window.CUSTOM_GUIDES = JSON.parse(custom);
    } else {
      window.CUSTOM_GUIDES = [];
    }
  },

  getAllGuides() {
    return [...SAMPLE_GUIDES, ...(window.CUSTOM_GUIDES || [])];
  },

  saveGuide(guide) {
    guide.id = Date.now();
    guide.date = new Date().toISOString().split('T')[0];
    guide.likes = 0;
    guide.scraps = 0;
    window.CUSTOM_GUIDES.push(guide);
    localStorage.setItem('hobbyinCustomGuides', JSON.stringify(window.CUSTOM_GUIDES));
    return guide;
  },

  deleteGuide(id) {
    window.CUSTOM_GUIDES = window.CUSTOM_GUIDES.filter(g => g.id !== id);
    localStorage.setItem('hobbyinCustomGuides', JSON.stringify(window.CUSTOM_GUIDES));
  },

  getGuideById(id) {
    return this.getAllGuides().find(g => g.id === Number(id));
  },

  // --- Likes ---
  getLikes() {
    const saved = localStorage.getItem('hobbyinLikes');
    return saved ? JSON.parse(saved) : [];
  },

  toggleLike(guideId) {
    const likes = this.getLikes();
    const idx = likes.indexOf(guideId);
    if (idx > -1) {
      likes.splice(idx, 1);
    } else {
      likes.push(guideId);
    }
    localStorage.setItem('hobbyinLikes', JSON.stringify(likes));
    return idx === -1; // true if now liked
  },

  isLiked(guideId) {
    return this.getLikes().includes(guideId);
  },

  // --- Scraps ---
  getScraps() {
    const saved = localStorage.getItem('hobbyinScraps');
    return saved ? JSON.parse(saved) : [];
  },

  toggleScrap(guideId) {
    const scraps = this.getScraps();
    const idx = scraps.indexOf(guideId);
    if (idx > -1) {
      scraps.splice(idx, 1);
    } else {
      scraps.push(guideId);
    }
    localStorage.setItem('hobbyinScraps', JSON.stringify(scraps));
    return idx === -1; // true if now scrapped
  },

  isScrapped(guideId) {
    return this.getScraps().includes(guideId);
  },

  // --- Navigation ---
  renderNavbar() {
    const navEl = document.getElementById('main-nav');
    if (!navEl) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    navEl.innerHTML = `
      <a href="index.html" class="nav-logo" id="nav-logo">
        <span class="logo-icon">🎯</span>
        <span class="logo-text">Hobby-in</span>
      </a>
      <nav class="nav-links" id="nav-links">
        <a href="index.html" class="${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}" id="nav-home">홈</a>
        <a href="category.html" class="${currentPage === 'category.html' ? 'active' : ''}" id="nav-category">카테고리</a>
        <a href="write.html" class="${currentPage === 'write.html' ? 'active' : ''}" id="nav-write">글쓰기</a>
        <a href="mypage.html" class="${currentPage === 'mypage.html' ? 'active' : ''}" id="nav-mypage">마이페이지</a>
      </nav>
      <div class="nav-actions">
        ${this.currentUser
          ? `<button class="nav-user" id="nav-user-btn" onclick="App.showUserMenu()">
               <span>👤</span>
               <span>${this.currentUser.nickname}</span>
             </button>`
          : `<button class="btn btn-primary" id="nav-login-btn" onclick="App.showLoginModal()" style="padding:8px 18px;font-size:0.85rem">
               로그인
             </button>`
        }
        <div class="nav-toggle" id="nav-toggle" onclick="App.toggleMobileNav()">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
  },

  setupNavScroll() {
    const navbar = document.getElementById('main-nav');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  },

  setupMobileNav() {
    // handled via onclick
  },

  toggleMobileNav() {
    const links = document.getElementById('nav-links');
    if (links) {
      links.classList.toggle('open');
    }
  },

  // --- Login Modal ---
  showLoginModal(callback) {
    this._loginCallback = callback;
    let overlay = document.getElementById('login-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'login-modal';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <h2>🎯 Hobby-in 시작하기</h2>
          <p>닉네임을 입력하면 바로 시작할 수 있어요!</p>
          <input type="text" class="form-input" id="login-nickname" placeholder="닉네임을 입력하세요" maxlength="12">
          <div style="margin-top:var(--space-md)">
            <button class="btn btn-primary" id="login-submit" onclick="App.handleLogin()">시작하기 ✨</button>
          </div>
          <button class="btn btn-ghost" style="margin-top:var(--space-sm);width:100%" onclick="App.hideLoginModal()">나중에 할게요</button>
        </div>
      `;
      document.body.appendChild(overlay);

      // Enter key
      document.getElementById('login-nickname').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') App.handleLogin();
      });
    }
    requestAnimationFrame(() => overlay.classList.add('active'));
    setTimeout(() => document.getElementById('login-nickname').focus(), 300);
  },

  hideLoginModal() {
    const overlay = document.getElementById('login-modal');
    if (overlay) {
      overlay.classList.remove('active');
    }
  },

  handleLogin() {
    const input = document.getElementById('login-nickname');
    const nickname = input.value.trim();
    if (!nickname) {
      input.style.borderColor = 'var(--accent-red)';
      input.setAttribute('placeholder', '닉네임을 입력해주세요!');
      return;
    }
    this.saveUser({ nickname, role: 'newbie', joinDate: new Date().toISOString().split('T')[0] });
    this.hideLoginModal();
    this.renderNavbar();
    this.showToast(`환영합니다, ${nickname}님! 🎉`);
    if (this._loginCallback) {
      this._loginCallback();
      this._loginCallback = null;
    }
  },

  showUserMenu() {
    if (confirm(`${this.currentUser.nickname}님, 로그아웃 하시겠습니까?`)) {
      this.logout();
    }
  },

  requireLogin(callback) {
    if (this.currentUser) {
      callback();
    } else {
      this.showLoginModal(callback);
    }
  },

  // --- Toast ---
  showToast(message, duration = 3000) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
  },

  // --- Helpers ---
  getCategoryInfo(categoryId) {
    return CATEGORIES.find(c => c.id === categoryId);
  },

  getSubcategoryName(categoryId, subcategoryId) {
    const cat = this.getCategoryInfo(categoryId);
    if (!cat) return '';
    const sub = cat.subcategories.find(s => s.id === subcategoryId);
    return sub ? sub.name : '';
  },

  getTagName(tagId) {
    const tag = TAGS.find(t => t.id === tagId);
    return tag ? tag.name : tagId;
  },

  formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '오늘';
    if (diff === 1) return '어제';
    if (diff < 7) return `${diff}일 전`;
    if (diff < 30) return `${Math.floor(diff / 7)}주 전`;
    return dateStr;
  },

  // Guide card HTML generator
  createGuideCard(guide, index = 0) {
    const cat = this.getCategoryInfo(guide.category);
    const catName = cat ? cat.name : guide.category;
    const subName = this.getSubcategoryName(guide.category, guide.subcategory);
    const isLiked = this.isLiked(guide.id);

    return `
      <article class="card guide-card fade-in fade-in-delay-${(index % 4) + 1}" onclick="window.location.href='guide.html?id=${guide.id}'" id="guide-card-${guide.id}">
        <div class="card-thumbnail" style="display:flex;align-items:center;justify-content:center;font-size:4rem;background:${cat ? cat.gradient : 'var(--gradient-primary)'};opacity:0.8">
          ${guide.thumbnailEmoji || '📖'}
        </div>
        <span class="card-category" style="background:${cat ? `${cat.color}22` : ''};color:${cat ? cat.color : ''}">${catName} · ${subName}</span>
        <h3 class="card-title">${guide.title}</h3>
        <div class="card-meta">
          <div class="card-author">
            <div class="avatar">${guide.author[0]}</div>
            <span>${guide.author}</span>
          </div>
          <div class="card-stats">
            <span class="stat">${isLiked ? '❤️' : '🤍'} ${guide.likes + (isLiked ? 1 : 0)}</span>
            <span class="stat">📌 ${guide.scraps}</span>
          </div>
        </div>
      </article>
    `;
  },

  // BG Orbs
  renderBgOrbs() {
    const existing = document.querySelector('.bg-orbs');
    if (existing) return;
    const orbs = document.createElement('div');
    orbs.className = 'bg-orbs';
    orbs.innerHTML = '<div class="orb"></div><div class="orb"></div><div class="orb"></div>';
    document.body.prepend(orbs);
  },

  // --- Scroll to Top Button ---
  renderScrollTopBtn() {
    const btn = document.createElement('button');
    btn.className = 'scroll-top-btn';
    btn.id = 'scroll-top-btn';
    btn.innerHTML = '↑';
    btn.setAttribute('aria-label', '맨 위로 가기');
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });
  }
};

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.renderBgOrbs();
  App.renderScrollTopBtn();
  App.init();
});
