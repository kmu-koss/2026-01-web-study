/* ============================================
   Hobby-in — My Page Logic
   ============================================ */

const MyPage = {
  currentTab: 'myguides',

  init() {
    if (!App.currentUser) {
      document.getElementById('mypage-login-prompt').style.display = 'block';
      document.getElementById('mypage-content').style.display = 'none';
      return;
    }

    document.getElementById('mypage-login-prompt').style.display = 'none';
    document.getElementById('mypage-content').style.display = 'block';

    this.renderProfile();
    this.renderStats();
    this.switchTab('myguides');
  },

  renderProfile() {
    const user = App.currentUser;
    document.getElementById('mypage-avatar').textContent = user.nickname[0];
    document.getElementById('mypage-nickname').textContent = user.nickname;
    document.getElementById('mypage-joindate').textContent = `가입일: ${user.joinDate || '오늘'}`;

    const badge = document.getElementById('mypage-badge');
    if (user.role === 'expert') {
      badge.className = 'badge badge-expert';
      badge.textContent = '🔥 고인물';
    } else {
      badge.className = 'badge badge-newbie';
      badge.textContent = '🌱 뉴비';
    }
  },

  renderStats() {
    const allGuides = App.getAllGuides();
    const myGuides = allGuides.filter(g => g.authorId === App.currentUser.nickname || g.author === App.currentUser.nickname);
    const scraps = App.getScraps();
    const likes = App.getLikes();

    const totalLikes = myGuides.reduce((sum, g) => sum + g.likes, 0);

    document.getElementById('stat-guides').textContent = myGuides.length;
    document.getElementById('stat-likes').textContent = totalLikes;
    document.getElementById('stat-scraps').textContent = scraps.length;
    document.getElementById('stat-given-likes').textContent = likes.length;
  },

  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Get guides for this tab
    let guides = [];
    const allGuides = App.getAllGuides();

    if (tab === 'myguides') {
      guides = allGuides.filter(g =>
        g.authorId === App.currentUser.nickname || g.author === App.currentUser.nickname
      );
    } else if (tab === 'scrapped') {
      const scraps = App.getScraps();
      guides = allGuides.filter(g => scraps.includes(g.id));
    } else if (tab === 'liked') {
      const likes = App.getLikes();
      guides = allGuides.filter(g => likes.includes(g.id));
    }

    this.renderGuides(guides, tab);
  },

  renderGuides(guides, tab) {
    const grid = document.getElementById('mypage-grid');
    const emptyState = document.getElementById('mypage-empty');
    const emptyIcon = document.getElementById('empty-icon');
    const emptyText = document.getElementById('empty-text');
    const emptyAction = document.getElementById('empty-action');

    if (guides.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';

      if (tab === 'myguides') {
        emptyIcon.textContent = '✍️';
        emptyText.textContent = '아직 작성한 가이드가 없습니다.';
        emptyAction.textContent = '첫 가이드 작성하기';
        emptyAction.href = 'write.html';
      } else if (tab === 'scrapped') {
        emptyIcon.textContent = '📌';
        emptyText.textContent = '스크랩한 가이드가 없습니다.';
        emptyAction.textContent = '가이드 둘러보기';
        emptyAction.href = 'category.html';
      } else if (tab === 'liked') {
        emptyIcon.textContent = '❤️';
        emptyText.textContent = '좋아요한 가이드가 없습니다.';
        emptyAction.textContent = '가이드 둘러보기';
        emptyAction.href = 'category.html';
      }
    } else {
      emptyState.style.display = 'none';

      let html = '';
      guides.forEach((g, i) => {
        let cardHtml = App.createGuideCard(g, i);

        // If it's my guide, add delete button
        if (tab === 'myguides' && (g.authorId === App.currentUser.nickname)) {
          cardHtml = cardHtml.replace(
            '</article>',
            `<button class="btn btn-ghost" style="color:var(--accent-red);font-size:0.8rem;margin-top:var(--space-sm);width:100%;text-align:center" onclick="event.stopPropagation();MyPage.deleteGuide(${g.id})" id="delete-guide-${g.id}">🗑️ 삭제</button></article>`
          );
        }

        html += cardHtml;
      });

      grid.innerHTML = html;
    }
  },

  deleteGuide(id) {
    if (confirm('이 가이드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      App.deleteGuide(id);
      App.showToast('가이드가 삭제되었습니다.');
      this.renderStats();
      this.switchTab(this.currentTab);
    }
  },

  toggleRole() {
    const user = App.currentUser;
    user.role = user.role === 'expert' ? 'newbie' : 'expert';
    App.saveUser(user);
    this.renderProfile();
    App.showToast(`역할이 "${user.role === 'expert' ? '고인물' : '뉴비'}"로 변경되었습니다!`);
  }
};

document.addEventListener('DOMContentLoaded', () => MyPage.init());
