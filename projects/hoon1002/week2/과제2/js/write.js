/* ============================================
   Hobby-in — Write Page Logic
   ============================================ */

const WritePage = {
  selectedTags: [],

  init() {
    this.renderCategories();
    this.renderTags();
  },

  renderCategories() {
    const select = document.getElementById('write-category');
    if (!select) return;

    CATEGORIES.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.icon} ${cat.name}`;
      select.appendChild(option);
    });
  },

  updateSubcategories() {
    const catId = document.getElementById('write-category').value;
    const subSelect = document.getElementById('write-subcategory');
    subSelect.innerHTML = '<option value="">선택하세요</option>';

    if (!catId) return;

    const cat = App.getCategoryInfo(catId);
    if (!cat) return;

    cat.subcategories.forEach(sub => {
      const option = document.createElement('option');
      option.value = sub.id;
      option.textContent = sub.name;
      subSelect.appendChild(option);
    });
  },

  renderTags() {
    const container = document.getElementById('write-tags');
    if (!container) return;

    container.innerHTML = TAGS.map(tag =>
      `<button type="button" class="tag" id="write-tag-${tag.id}" onclick="WritePage.toggleTag('${tag.id}')">${tag.emoji} ${tag.name}</button>`
    ).join('');
  },

  toggleTag(tagId) {
    const idx = this.selectedTags.indexOf(tagId);
    if (idx > -1) {
      this.selectedTags.splice(idx, 1);
    } else {
      this.selectedTags.push(tagId);
    }

    const btn = document.getElementById(`write-tag-${tagId}`);
    if (btn) {
      btn.classList.toggle('active', this.selectedTags.includes(tagId));
    }
  },

  getFormData() {
    return {
      title: document.getElementById('write-title').value.trim(),
      category: document.getElementById('write-category').value,
      subcategory: document.getElementById('write-subcategory').value,
      tags: [...this.selectedTags],
      thumbnailEmoji: this.getEmojiForCategory(document.getElementById('write-category').value),
      sections: {
        preparation: document.getElementById('write-prep').value.trim(),
        firstDay: document.getElementById('write-firstday').value.trim(),
        caution: document.getElementById('write-caution').value.trim(),
        body: document.getElementById('write-body').value.trim()
      }
    };
  },

  getEmojiForCategory(catId) {
    const map = {
      music: '🎸', gaming: '🎮', fitness: '💪',
      cooking: '🍳', art: '🎨', craft: '🧶'
    };
    return map[catId] || '📖';
  },

  preview() {
    const data = this.getFormData();
    if (!data.title) {
      App.showToast('제목을 입력해주세요!');
      return;
    }

    const cat = App.getCategoryInfo(data.category);
    const subName = App.getSubcategoryName(data.category, data.subcategory);

    const content = document.getElementById('preview-content');
    content.innerHTML = `
      <div style="margin-bottom:var(--space-lg)">
        ${cat ? `<span class="card-category" style="background:${cat.color}22;color:${cat.color}">${cat.icon} ${cat.name} · ${subName}</span>` : ''}
        <h2 style="margin-top:var(--space-md);font-weight:800">${data.title}</h2>
        <div class="tags-wrap" style="margin-top:var(--space-sm)">
          ${data.tags.map(t => `<span class="tag" style="font-size:0.75rem">${App.getTagName(t)}</span>`).join('')}
        </div>
      </div>

      <div class="ai-summary" style="margin-bottom:var(--space-lg)">
        <div class="ai-header"><span class="sparkle">✨</span><span>AI 요약 (발행 후 자동 생성)</span></div>
        <p class="ai-content" style="color:var(--text-muted);font-style:italic">발행 후 AI가 자동으로 3줄 요약을 생성합니다.</p>
      </div>

      <div class="guide-body">
        <h2><span class="emoji">📦</span> 준비물</h2>
        <ul>${data.sections.preparation.split('\n').map(l => `<li>${l}</li>`).join('')}</ul>

        <h2><span class="emoji">📅</span> 1일차 추천 연습</h2>
        <ul>${data.sections.firstDay.split('\n').map(l => `<li>${l}</li>`).join('')}</ul>

        <h2><span class="emoji">⚠️</span> 주의점</h2>
        <ul>${data.sections.caution.split('\n').map(l => `<li>${l}</li>`).join('')}</ul>

        <h2><span class="emoji">📝</span> 상세 가이드</h2>
        ${data.sections.body.split('\n\n').map(p => `<p>${p}</p>`).join('')}
      </div>
    `;

    document.getElementById('preview-modal').classList.add('active');
  },

  handleSubmit(e) {
    e.preventDefault();

    App.requireLogin(() => {
      const data = this.getFormData();

      // Validation
      if (!data.title || !data.category || !data.subcategory) {
        App.showToast('필수 항목을 모두 입력해주세요!');
        return;
      }

      if (!data.sections.preparation || !data.sections.firstDay || !data.sections.caution || !data.sections.body) {
        App.showToast('모든 섹션을 작성해주세요!');
        return;
      }

      // Generate placeholder AI summary
      data.aiSummary = [
        '이 가이드의 AI 요약이 곧 생성됩니다.',
        `${App.getSubcategoryName(data.category, data.subcategory)} 입문에 필요한 핵심 정보를 담고 있습니다.`,
        '자세한 내용은 본문을 확인해주세요!'
      ];

      data.author = App.currentUser.nickname;
      data.authorId = App.currentUser.nickname;
      data.thumbnail = '';

      const saved = App.saveGuide(data);
      App.showToast('가이드가 성공적으로 발행되었습니다! 🎉');

      setTimeout(() => {
        window.location.href = `guide.html?id=${saved.id}`;
      }, 1500);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => WritePage.init());
