/* ============================================
   Hobby-in — Guide Detail Page Logic
   ============================================ */

const GuidePage = {
  guide: null,

  init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      this.showEmpty();
      return;
    }

    this.guide = App.getGuideById(id);
    if (!this.guide) {
      this.showEmpty();
      return;
    }

    this.render();
    this.updateBreadcrumb();
    document.title = `${this.guide.title} | Hobby-in`;
  },

  showEmpty() {
    document.getElementById('guide-content').style.display = 'none';
    document.getElementById('guide-empty').style.display = 'block';
  },

  updateBreadcrumb() {
    const cat = App.getCategoryInfo(this.guide.category);
    const catLink = document.getElementById('breadcrumb-cat');
    const titleEl = document.getElementById('breadcrumb-title');

    if (cat) {
      catLink.textContent = cat.name;
      catLink.href = `category.html?cat=${cat.id}`;
    }
    titleEl.textContent = this.guide.title.length > 30
      ? this.guide.title.substring(0, 30) + '...'
      : this.guide.title;
  },

  render() {
    const container = document.getElementById('guide-content');
    const g = this.guide;
    const cat = App.getCategoryInfo(g.category);
    const subName = App.getSubcategoryName(g.category, g.subcategory);
    const isLiked = App.isLiked(g.id);
    const isScrapped = App.isScrapped(g.id);

    const tagsHtml = (g.tags || []).map(tagId => {
      const tag = TAGS.find(t => t.id === tagId);
      return tag ? `<a class="tag" href="category.html?tag=${tagId}" style="font-size:0.75rem">${tag.emoji} ${tag.name}</a>` : '';
    }).join('');

    container.innerHTML = `
      <!-- Guide Header -->
      <div class="guide-header">
        <span class="card-category guide-category-tag" style="background:${cat ? `${cat.color}22` : ''};color:${cat ? cat.color : ''}">${cat ? cat.icon : ''} ${cat ? cat.name : ''} · ${subName}</span>
        <h1>${g.title}</h1>
        <div class="guide-meta">
          <div class="author-info">
            <div class="avatar" style="width:32px;height:32px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:white">${g.author[0]}</div>
            <strong>${g.author}</strong>
          </div>
          <span>📅 ${App.formatDate(g.date)}</span>
          <span>❤️ ${g.likes + (isLiked ? 1 : 0)}</span>
          <span>📌 ${g.scraps + (isScrapped ? 1 : 0)}</span>
        </div>
        ${tagsHtml ? `<div class="tags-wrap" style="margin-top:var(--space-md)">${tagsHtml}</div>` : ''}
      </div>

      <!-- AI Summary -->
      <div class="ai-summary" id="ai-summary-box" style="margin-bottom:var(--space-2xl)">
        <div class="ai-header">
          <span class="sparkle">✨</span>
          <span>AI가 요약한 핵심 입문 가이드</span>
        </div>
        <ul class="ai-content" id="ai-summary-list">
          ${g.aiSummary.map(line => `<li>${line}</li>`).join('')}
        </ul>
      </div>

      <!-- Guide Body -->
      <div class="guide-body">

        <!-- Preparation -->
        <h2><span class="emoji">📦</span> 준비물</h2>
        <ul>
          ${g.sections.preparation.split('\n').map(item => `<li>${item.trim()}</li>`).join('')}
        </ul>

        <!-- First Day -->
        <h2><span class="emoji">📅</span> 1일차 추천 연습</h2>
        <ul>
          ${g.sections.firstDay.split('\n').map(item => `<li>${item.trim()}</li>`).join('')}
        </ul>

        <!-- Caution -->
        <h2><span class="emoji">⚠️</span> 주의점</h2>
        <ul>
          ${g.sections.caution.split('\n').map(item => `<li>${item.trim()}</li>`).join('')}
        </ul>

        <!-- Main Body -->
        <h2><span class="emoji">📝</span> 상세 가이드</h2>
        ${g.sections.body.split('\n\n').map(para => `<p>${para}</p>`).join('')}

      </div>

      <!-- Actions -->
      <div class="guide-actions">
        <button class="btn-like ${isLiked ? 'active' : ''}" id="btn-like" onclick="GuidePage.toggleLike()">
          <span id="like-icon">${isLiked ? '❤️' : '🤍'}</span>
          <span>좋아요</span>
          <span id="like-count">${g.likes + (isLiked ? 1 : 0)}</span>
        </button>
        <button class="btn-scrap ${isScrapped ? 'active' : ''}" id="btn-scrap" onclick="GuidePage.toggleScrap()">
          <span id="scrap-icon">${isScrapped ? '📌' : '🔖'}</span>
          <span>스크랩</span>
          <span id="scrap-count">${g.scraps + (isScrapped ? 1 : 0)}</span>
        </button>
        <a href="category.html?cat=${g.category}" class="btn btn-secondary" style="margin-left:auto">
          더 많은 ${cat ? cat.name : ''} 가이드 →
        </a>
      </div>
    `;

    // Animate AI summary typing effect
    this.animateAISummary();
  },

  animateAISummary() {
    const items = document.querySelectorAll('#ai-summary-list li');
    items.forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-10px)';
      item.style.transition = 'all 0.5s ease';
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, 300 + i * 200);
    });
  },

  toggleLike() {
    App.requireLogin(() => {
      const liked = App.toggleLike(this.guide.id);
      const btn = document.getElementById('btn-like');
      const icon = document.getElementById('like-icon');
      const count = document.getElementById('like-count');

      btn.classList.toggle('active', liked);
      icon.textContent = liked ? '❤️' : '🤍';
      count.textContent = this.guide.likes + (liked ? 1 : 0);

      if (liked) {
        icon.classList.add('heart-pop');
        setTimeout(() => icon.classList.remove('heart-pop'), 500);
        App.showToast('좋아요를 눌렀습니다! ❤️');
      } else {
        App.showToast('좋아요를 취소했습니다.');
      }
    });
  },

  toggleScrap() {
    App.requireLogin(() => {
      const scrapped = App.toggleScrap(this.guide.id);
      const btn = document.getElementById('btn-scrap');
      const icon = document.getElementById('scrap-icon');
      const count = document.getElementById('scrap-count');

      btn.classList.toggle('active', scrapped);
      icon.textContent = scrapped ? '📌' : '🔖';
      count.textContent = this.guide.scraps + (scrapped ? 1 : 0);

      App.showToast(scrapped ? '마이페이지에 스크랩했습니다! 📌' : '스크랩을 취소했습니다.');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => GuidePage.init());
