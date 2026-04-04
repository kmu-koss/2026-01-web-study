/* ============================================
   Hobby-in — Home Page Logic
   ============================================ */

const Home = {
  typingTexts: ['여기서 시작하세요', '기타를 배워볼까요?', '오늘부터 헬스 입문!', '요리의 세계로!', '그림을 그려봐요'],
  typingIndex: 0,
  charIndex: 0,
  isDeleting: false,

  init() {
    this.renderCategories();
    this.renderBestGuides();
    this.renderRecentGuides();
    this.renderTags();
    this.setupSearch();
    this.startTyping();
  },

  // --- Typing Animation ---
  startTyping() {
    const target = document.getElementById('typing-target');
    if (!target) return;

    const currentText = this.typingTexts[this.typingIndex];

    if (!this.isDeleting) {
      target.textContent = currentText.substring(0, this.charIndex + 1);
      this.charIndex++;
      if (this.charIndex === currentText.length) {
        this.isDeleting = true;
        setTimeout(() => this.startTyping(), 2000);
        return;
      }
      setTimeout(() => this.startTyping(), 80);
    } else {
      target.textContent = currentText.substring(0, this.charIndex - 1);
      this.charIndex--;
      if (this.charIndex === 0) {
        this.isDeleting = false;
        this.typingIndex = (this.typingIndex + 1) % this.typingTexts.length;
        setTimeout(() => this.startTyping(), 400);
        return;
      }
      setTimeout(() => this.startTyping(), 40);
    }
  },

  // --- Categories ---
  renderCategories() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;

    const allGuides = App.getAllGuides();

    grid.innerHTML = CATEGORIES.map((cat, i) => {
      const count = allGuides.filter(g => g.category === cat.id).length;
      return `
        <div class="card category-card fade-in fade-in-delay-${(i % 4) + 1}" onclick="window.location.href='category.html?cat=${cat.id}'" id="cat-card-${cat.id}">
          <span class="cat-icon">${cat.icon}</span>
          <div class="cat-name">${cat.name}</div>
          <div class="cat-count">가이드 ${count}개</div>
          <div class="cat-gradient" style="background:${cat.gradient}"></div>
        </div>
      `;
    }).join('');
  },

  // --- Best Guides (sorted by likes) ---
  renderBestGuides() {
    const container = document.getElementById('best-guides');
    if (!container) return;

    const guides = App.getAllGuides()
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 3);

    container.innerHTML = guides.map((g, i) => App.createGuideCard(g, i)).join('');
  },

  // --- Recent Guides ---
  renderRecentGuides() {
    const container = document.getElementById('recent-guides');
    if (!container) return;

    const guides = App.getAllGuides()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    container.innerHTML = guides.map((g, i) => App.createGuideCard(g, i)).join('');
  },

  // --- Tags ---
  renderTags() {
    const container = document.getElementById('popular-tags');
    if (!container) return;

    container.innerHTML = TAGS.map(tag =>
      `<button class="tag" onclick="Home.searchByTag('${tag.id}')" id="tag-${tag.id}">${tag.emoji} ${tag.name}</button>`
    ).join('');
  },

  searchByTag(tagId) {
    window.location.href = `category.html?tag=${tagId}`;
  },

  // --- Search ---
  setupSearch() {
    const input = document.getElementById('hero-search-input');
    const suggestions = document.getElementById('hero-suggestions');
    if (!input || !suggestions) return;

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      if (query.length < 1) {
        suggestions.classList.remove('active');
        return;
      }

      const allGuides = App.getAllGuides();
      const matches = [];

      // Search categories
      CATEGORIES.forEach(cat => {
        if (cat.name.includes(query)) {
          matches.push({ type: 'category', text: `${cat.icon} ${cat.name}`, link: `category.html?cat=${cat.id}` });
        }
        cat.subcategories.forEach(sub => {
          if (sub.name.toLowerCase().includes(query)) {
            matches.push({ type: 'subcategory', text: `${cat.icon} ${sub.name}`, link: `category.html?cat=${cat.id}&sub=${sub.id}` });
          }
        });
      });

      // Search guides
      allGuides.forEach(guide => {
        if (guide.title.toLowerCase().includes(query)) {
          matches.push({ type: 'guide', text: `📖 ${guide.title}`, link: `guide.html?id=${guide.id}` });
        }
      });

      if (matches.length > 0) {
        suggestions.innerHTML = matches.slice(0, 6).map(m =>
          `<div class="suggestion-item" onclick="window.location.href='${m.link}'">${m.text}</div>`
        ).join('');
        suggestions.classList.add('active');
      } else {
        suggestions.innerHTML = '<div class="suggestion-item" style="color:var(--text-muted)">검색 결과가 없습니다</div>';
        suggestions.classList.add('active');
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        suggestions.classList.remove('active');
      }
    });
  },

  handleSearch() {
    const input = document.getElementById('hero-search-input');
    const query = input.value.trim();
    if (query) {
      window.location.href = `category.html?search=${encodeURIComponent(query)}`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Home.init());
