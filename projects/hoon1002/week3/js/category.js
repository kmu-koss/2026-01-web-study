/* ============================================
   Hobby-in — Category/Search Page Logic
   ============================================ */

const CategoryPage = {
  currentCategory: null,
  currentSubcategory: null,
  currentSearch: null,
  currentTag: null,
  activeTags: [],

  init() {
    this.parseParams();
    this.renderCategoryTabs();
    this.renderFilterTags();
    this.applyFilters();
  },

  parseParams() {
    const params = new URLSearchParams(window.location.search);
    this.currentCategory = params.get('cat');
    this.currentSubcategory = params.get('sub');
    this.currentSearch = params.get('search');
    this.currentTag = params.get('tag');

    if (this.currentTag) {
      this.activeTags = [this.currentTag];
    }

    // Update breadcrumb & title
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    const pageTitle = document.getElementById('page-title');

    if (this.currentSearch) {
      breadcrumbCurrent.textContent = `"${this.currentSearch}" 검색 결과`;
      pageTitle.innerHTML = `🔍 "<span class="highlight">${this.currentSearch}</span>" 검색 결과`;

      const searchInput = document.getElementById('cat-search-input');
      if (searchInput) searchInput.value = this.currentSearch;
    } else if (this.currentCategory) {
      const cat = App.getCategoryInfo(this.currentCategory);
      if (cat) {
        breadcrumbCurrent.textContent = cat.name;
        pageTitle.innerHTML = `${cat.icon} <span class="highlight">${cat.name}</span> 입문 가이드`;
      }
    } else if (this.currentTag) {
      const tag = TAGS.find(t => t.id === this.currentTag);
      if (tag) {
        breadcrumbCurrent.textContent = tag.name;
        pageTitle.innerHTML = `🏷️ <span class="highlight">${tag.name}</span> 가이드`;
      }
    }
  },

  renderCategoryTabs() {
    const area = document.getElementById('category-tabs-area');
    if (!area) return;

    let html = '<div class="tags-wrap" style="margin-bottom:var(--space-xl)">';
    html += `<button class="tag ${!this.currentCategory ? 'active' : ''}" onclick="window.location.href='category.html'" id="cat-tab-all">전체</button>`;
    CATEGORIES.forEach(cat => {
      const isActive = this.currentCategory === cat.id;
      html += `<button class="tag ${isActive ? 'active' : ''}" onclick="window.location.href='category.html?cat=${cat.id}'" id="cat-tab-${cat.id}">${cat.icon} ${cat.name}</button>`;
    });
    html += '</div>';

    // Subcategory tabs if category selected
    if (this.currentCategory) {
      const cat = App.getCategoryInfo(this.currentCategory);
      if (cat && cat.subcategories.length > 0) {
        html += '<div class="tags-wrap" style="margin-bottom:var(--space-lg)">';
        html += `<button class="tag ${!this.currentSubcategory ? 'active' : ''}" onclick="window.location.href='category.html?cat=${this.currentCategory}'" style="font-size:0.75rem" id="sub-tab-all">전체</button>`;
        cat.subcategories.forEach(sub => {
          const isActive = this.currentSubcategory === sub.id;
          html += `<button class="tag ${isActive ? 'active' : ''}" onclick="window.location.href='category.html?cat=${this.currentCategory}&sub=${sub.id}'" style="font-size:0.75rem" id="sub-tab-${sub.id}">${sub.name}</button>`;
        });
        html += '</div>';
      }
    }

    area.innerHTML = html;
  },

  renderFilterTags() {
    const container = document.getElementById('filter-tags');
    if (!container) return;

    container.innerHTML = TAGS.map(tag => {
      const isActive = this.activeTags.includes(tag.id);
      return `<button class="tag ${isActive ? 'active' : ''}" onclick="CategoryPage.toggleTag('${tag.id}')" id="filter-tag-${tag.id}" style="font-size:0.75rem">${tag.emoji} ${tag.name}</button>`;
    }).join('');
  },

  toggleTag(tagId) {
    const idx = this.activeTags.indexOf(tagId);
    if (idx > -1) {
      this.activeTags.splice(idx, 1);
    } else {
      this.activeTags.push(tagId);
    }
    this.renderFilterTags();
    this.applyFilters();
  },

  applyFilters() {
    let guides = App.getAllGuides();

    // Category filter
    if (this.currentCategory) {
      guides = guides.filter(g => g.category === this.currentCategory);
    }

    // Subcategory filter
    if (this.currentSubcategory) {
      guides = guides.filter(g => g.subcategory === this.currentSubcategory);
    }

    // Search filter
    if (this.currentSearch) {
      const q = this.currentSearch.toLowerCase();
      guides = guides.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.author.toLowerCase().includes(q) ||
        (g.sections.body && g.sections.body.toLowerCase().includes(q))
      );
    }

    // Tag filter
    if (this.activeTags.length > 0) {
      guides = guides.filter(g =>
        this.activeTags.some(tag => g.tags && g.tags.includes(tag))
      );
    }

    // Sorting
    const sortBy = document.getElementById('filter-sort')?.value || 'popular';
    if (sortBy === 'popular') {
      guides.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'recent') {
      guides.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'name') {
      guides.sort((a, b) => a.title.localeCompare(b.title));
    }

    this.renderGuides(guides);
  },

  renderGuides(guides) {
    const container = document.getElementById('guide-list');
    const emptyState = document.getElementById('empty-state');

    if (guides.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      container.innerHTML = guides.map((g, i) => App.createGuideCard(g, i)).join('');
    }
  },

  doSearch() {
    const input = document.getElementById('cat-search-input');
    const query = input.value.trim();
    if (query) {
      window.location.href = `category.html?search=${encodeURIComponent(query)}`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Setup search enter
  const searchInput = document.getElementById('cat-search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') CategoryPage.doSearch();
    });
  }
  CategoryPage.init();
});
