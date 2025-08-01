import * as state from './state.js';
import * as profileManager from './profileManager.js';
import { enableDragAndDrop } from './dragDrop.js';
import { getDueSRSItems, scheduleSRSItem, ensureSRSQueue } from './state.js';

export function initUI() {
  renderThemeSwitcher();
  renderProfileSelection();
}

function renderThemeSwitcher() {
  const switcher = document.getElementById('theme-switcher');
  switcher.innerHTML = `<span aria-hidden="true">🕯️</span>`;
  switcher.onclick = () => toggleTheme();
  switcher.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') toggleTheme(); };
}

function toggleTheme() {
  const body = document.body;
  if (body.classList.contains('theme-light')) {
    body.classList.remove('theme-light');
    body.classList.add('theme-dark');
  } else {
    body.classList.remove('theme-dark');
    body.classList.add('theme-light');
  }
}

function renderProfileSelection() {
  const root = document.getElementById('app-root');
  const profiles = profileManager.getAllProfiles();
  const admin = state.isAdminMode();
  root.innerHTML = `
    <section class="profile-select fade-in">
      <h1>Welcome to <span class="arcanum-logo">Arcanum</span></h1>
      <p>Select your profile to begin:</p>
      <div class="profile-list">
        ${profiles.map(profile => `
          <div class="profile-list-row">
            <button class="profile-card" data-id="${profile.id}">${profile.name}</button>
            ${admin ? `<span class="admin-profile-actions">
              <button class="admin-btn edit-profile-btn" data-id="${profile.id}">Edit</button>
              <button class="admin-btn delete-profile-btn" data-id="${profile.id}">Delete</button>
            </span>` : ''}
          </div>
        `).join('')}
      </div>
      <div style="margin-top:1.2rem;display:flex;gap:1rem;justify-content:center;">
        <button class="create-profile-btn" id="create-profile-btn">+ Create New Profile</button>
        ${admin ? `<button class="admin-btn" id="add-profile-bulk-btn">+ Add Profiles (JSON)</button>` : ''}
        <button class="admin-btn" id="import-json-btn">Import from JSON</button>
      </div>
      <div style="margin-top:1.2rem;display:flex;justify-content:flex-end;">
        <div>${renderAdminSlider()}</div>
      </div>
    </section>
  `;
  // Profile select
  root.querySelectorAll('.profile-card').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.getAttribute('data-id'));
      if (!isNaN(id)) {
        profileManager.setSelectedProfile(id);
        renderDashboardView();
      } else {
        console.error('Invalid profile id:', btn.getAttribute('data-id'));
      }
    };
  });
  // Create profile
  const createBtn = root.querySelector('#create-profile-btn');
  if (createBtn) createBtn.onclick = () => showCreateProfileModal();
  // Admin slider
  root.querySelector('#admin-mode-toggle').onchange = (e) => {
    state.setAdminMode(e.target.checked);
    renderProfileSelection();
  };
  // Admin actions
  if (admin) {
    root.querySelectorAll('.edit-profile-btn').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.getAttribute('data-id'));
        const profile = profileManager.getProfileById(id);
        showEditProfileModal(profile);
      };
    });
    root.querySelectorAll('.delete-profile-btn').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.getAttribute('data-id'));
        if (confirm('Delete this profile?')) {
          profileManager.deleteProfile(id);
          renderProfileSelection();
        }
      };
    });
    const bulkBtn = root.querySelector('#add-profile-bulk-btn');
    if (bulkBtn) bulkBtn.onclick = () => showBulkAddModal('profile');
  }
  // Import from JSON
  root.querySelector('#import-json-btn').onclick = showImportStateModal;
}

// Helper: Modal rendering
function showModal(html, onClose) {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `<div class="modal-overlay"><div class="modal-content">${html}</div></div>`;
  modalRoot.style.pointerEvents = 'auto';
  modalRoot.onclick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      modalRoot.innerHTML = '';
      modalRoot.style.pointerEvents = 'none';
      if (onClose) onClose();
    }
  };
}
function closeModal() {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = '';
  modalRoot.style.pointerEvents = 'none';
}

function renderAdminSlider() {
  return `<div class="admin-slider-container">
    <label class="admin-switch">
      <input type="checkbox" id="admin-mode-toggle" ${state.isAdminMode() ? 'checked' : ''}>
      <span class="admin-slider"></span>
    </label>
    <span class="admin-label">Admin</span>
    <button onclick="resetApp()" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem; margin-left: 0.5rem;">Reset</button>
  </div>`;
}

function renderResetDemoButton() {
  return `<button class="navbar-link" id="reset-demo-btn" title="Reset demo data">Reset Demo Data</button>`;
}

function renderDashboardView() {
  const root = document.getElementById('app-root');
  const profile = state.getSelectedProfile();
  const courses = state.getCourses();
  const admin = state.isAdminMode();
  ensureSRSQueue(profile);
  const dueSRS = getDueSRSItems(profile);

  // Responsive: decide which buttons to show
  const isMobile = window.innerWidth < 900;
  // Always show these
  const mainButtons = [
    `<button class="navbar-link" id="nav-profile">Profile</button>`,
    `<button class="navbar-link daily-review-btn" id="nav-daily-review">Daily Review${dueSRS.length ? ` <span class='daily-review-badge'>${dueSRS.length}</span>` : ''}</button>`,
    renderAdminSlider()
  ];
  // These go in the More dropdown on mobile
  const moreButtons = [
    `<button class="navbar-link" id="nav-progress">Progress</button>`,
    `<button class="navbar-link" id="nav-achievements">Achievements</button>`,
    renderResetDemoButton()
  ];
  // Desktop: show all, Mobile: show main + More
  let navbarRightHtml = '';
  if (!isMobile) {
    navbarRightHtml = [
      ...mainButtons.slice(0, 2),
      `<button class="navbar-link" id="nav-progress">Progress</button>`,
      `<button class="navbar-link" id="nav-achievements">Achievements</button>`,
      ...mainButtons.slice(2),
      renderResetDemoButton(),
      `<div id="theme-switcher-navbar"></div>`
    ].join('');
  } else {
    navbarRightHtml = [
      ...mainButtons,
      `<div class="navbar-more-dropdown">
        <button class="navbar-more-btn" id="navbar-more-btn" aria-haspopup="true" aria-expanded="false">⋯</button>
        <div class="navbar-more-menu" id="navbar-more-menu">
          ${moreButtons.join('')}
        </div>
      </div>`,
      `<div id="theme-switcher-navbar"></div>`
    ].join('');
  }

  root.innerHTML = `
    <nav class="main-navbar">
      <div class="navbar-left">
        <span class="navbar-logo">Arcanum</span>
      </div>
      <div class="navbar-center">
        <span class="navbar-title">Choose Your Course</span>
      </div>
      <div class="navbar-right">
        ${navbarRightHtml}
      </div>
    </nav>
    <section class="dashboard-fullscreen">
      <div class="dashboard-hero">
        <img class="profile-avatar" src="${profile.avatar}" alt="${profile.name} avatar">
        <div class="profile-info">
          <div class="profile-name">${profile.name}</div>
          <div class="profile-level">Level ${profile.level}</div>
          <div class="profile-xp-bar">
            <div class="xp-bar-bg">
              <div class="xp-bar-fill" style="width:${Math.round(100*profile.xp/profile.xpToNext)}%"></div>
            </div>
            <span class="xp-label">${profile.xp} / ${profile.xpToNext} XP</span>
          </div>
        </div>
        ${admin ? `<button class="admin-btn" id="edit-profile-btn">Edit Profile</button>` : ''}
      </div>
      <div class="courses-grid-container">
        <div class="courses-grid-header">
          <h2 class="courses-grid-title">Available Courses</h2>
          ${admin ? `<button class="admin-btn" id="add-course-btn">+ Add Course(s)</button>` : ''}
        </div>
        <div class="courses-grid">
          ${courses.map(course => {
            // Calculate total and completed lessons for this course
            const chapters = Array.isArray(course.chapters) ? course.chapters : [];
            const allLessons = chapters.flatMap(ch => Array.isArray(ch.lessons) ? ch.lessons : []);
            const totalLessons = allLessons.length;
            const completedLessons = Array.isArray(profile.completedLessons)
              ? allLessons.filter(lesson => profile.completedLessons.includes(lesson.id)).length
              : 0;
            const percent = totalLessons ? Math.round(100 * completedLessons / totalLessons) : 0;
            return `
            <div class="course-grid-card" tabindex="0" data-course-id="${course.id}">
              <div class="course-grid-icon">${course.icon}</div>
              <div class="course-grid-title">${course.title}</div>
              <div class="course-grid-desc">${course.desc}</div>
              <div class="course-grid-progress">
                <div class="xp-bar-bg">
                  <div class="xp-bar-fill" style="width:${percent}%"></div>
                </div>
                <span class="xp-label">${completedLessons} / ${totalLessons} lessons</span>
              </div>
              ${admin ? `<div class="admin-course-actions">
                <button class="admin-btn edit-course-btn" data-id="${course.id}">Edit</button>
                <button class="admin-btn delete-course-btn" data-id="${course.id}">Delete</button>
              </div>` : ''}
            </div>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;
  // Move the theme switcher into the navbar
  const themeSwitcherTarget = root.querySelector('#theme-switcher-navbar');
  const themeSwitcher = document.getElementById('theme-switcher');
  if (themeSwitcherTarget && themeSwitcher) {
    themeSwitcherTarget.appendChild(themeSwitcher);
    themeSwitcher.style.position = 'static';
    themeSwitcher.style.marginLeft = '0.7rem';
    themeSwitcher.style.marginRight = '0';
    themeSwitcher.style.top = 'unset';
    themeSwitcher.style.right = 'unset';
    themeSwitcher.style.width = '36px';
    themeSwitcher.style.height = '36px';
    themeSwitcher.style.zIndex = 'auto';
  }
  // Course navigation
  root.querySelectorAll('.course-grid-card').forEach(card => {
    card.onclick = () => renderCourseView(parseInt(card.getAttribute('data-course-id')));
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') renderCourseView(parseInt(card.getAttribute('data-course-id'))); };
  });
  // Nav buttons
  root.querySelector('#nav-profile').onclick = renderProfileScreen;
  const navProgress = root.querySelector('#nav-progress');
  if (navProgress) navProgress.onclick = renderProgressScreen;
  const navAchievements = root.querySelector('#nav-achievements');
  if (navAchievements) navAchievements.onclick = () => alert('Achievements view coming soon!');
  root.querySelector('#nav-daily-review').onclick = renderDailyReviewScreen;
  // More dropdown logic
  const moreBtn = root.querySelector('#navbar-more-btn');
  const moreMenu = root.querySelector('#navbar-more-menu');
  if (moreBtn && moreMenu) {
    moreBtn.onclick = (e) => {
      e.stopPropagation();
      const parent = moreBtn.closest('.navbar-more-dropdown');
      if (parent.classList.contains('open')) {
        parent.classList.remove('open');
        moreBtn.setAttribute('aria-expanded', 'false');
      } else {
        parent.classList.add('open');
        moreBtn.setAttribute('aria-expanded', 'true');
      }
    };
    document.addEventListener('click', () => {
      const parent = moreBtn.closest('.navbar-more-dropdown');
      if (parent) {
        parent.classList.remove('open');
        moreBtn.setAttribute('aria-expanded', 'false');
      }
    }, { once: true });
  }
  // Admin slider
  const adminToggle = root.querySelector('#admin-mode-toggle');
  if (adminToggle) adminToggle.onchange = (e) => {
    state.setAdminMode(e.target.checked);
    renderDashboardView();
  };
  // Admin actions
  if (admin) {
    const addBtn = root.querySelector('#add-course-btn');
    if (addBtn) addBtn.onclick = () => showBulkAddModal('course');
    const editProfileBtn = root.querySelector('#edit-profile-btn');
    if (editProfileBtn) editProfileBtn.onclick = () => showEditProfileModal(profile);
    root.querySelectorAll('.edit-course-btn').forEach(btn => {
      btn.onclick = (e) => {
        const id = Number(btn.getAttribute('data-id'));
        const course = state.getCourses().find(c => c.id === id);
        showEditCourseModal(course);
      };
    });
    root.querySelectorAll('.delete-course-btn').forEach(btn => {
      btn.onclick = (e) => {
        const id = Number(btn.getAttribute('data-id'));
        if (confirm('Delete this course?')) {
          state.deleteCourse(id);
          renderDashboardView();
        }
      };
    });
  }
  // Restore Reset Demo Data button event handler
  const resetBtn = root.querySelector('#reset-demo-btn');
  if (resetBtn) resetBtn.onclick = () => {
    localStorage.clear();
    location.reload();
  };
}

function renderCourseView(courseId) {
  const root = document.getElementById('app-root');
  const course = state.getCourses().find(c => c.id == courseId);
  if (!course) return renderDashboardView();
  const admin = state.isAdminMode();
  const chapters = Array.isArray(course.chapters) ? course.chapters : [];
  // For demo: select first chapter by default
  let selectedChapterId = chapters.length > 0 ? chapters[0].id : null;
  renderCourseWideChaptersView(course, chapters, selectedChapterId);
}

function renderCourseWideChaptersView(course, chapters, selectedChapterId) {
  const root = document.getElementById('app-root');
  const profile = state.getSelectedProfile();
  const admin = state.isAdminMode();
  const selectedChapter = chapters.find(ch => ch.id == selectedChapterId) || chapters[0];
  // Calculate course-wide progress
  const totalLessons = chapters.reduce((sum, ch) => sum + (Array.isArray(ch.lessons) ? ch.lessons.length : 0), 0);
  const completedLessons = 0; // TODO: Use profile progress if available
  root.innerHTML = `
    <nav class="main-navbar">
      <div class="navbar-left">
        <span class="navbar-logo">Arcanum</span>
      </div>
      <div class="navbar-center">
        <span class="navbar-title">${course.icon} ${course.title}</span>
      </div>
      <div class="navbar-right">
        <button class="navbar-link" id="back-dashboard">Dashboard</button>
        <button class="navbar-link danger" id="reset-course-progress-btn">Reset Progress</button>
        ${renderResetDemoButton()}
        ${renderAdminSlider()}
      </div>
    </nav>
    <section class="course-wide-view">
      <div class="course-wide-head">
        <span class="course-icon-large">${course.icon}</span>
        <div class="course-head-info">
          <h1 class="course-title">${course.title}</h1>
          <div class="course-desc">${course.desc}</div>
          <div class="course-progress-bar-wide">
            <div class="xp-bar-bg">
              <div class="xp-bar-fill" style="width:${totalLessons ? Math.round(100 * completedLessons / totalLessons) : 0}%"></div>
            </div>
            <span class="xp-label">${completedLessons} / ${totalLessons} lessons completed</span>
          </div>
        </div>
      </div>
      <div class="course-wide-columns">
        <div class="course-wide-main">
          ${admin ? `<button class="admin-btn" id="add-chapter-btn">+ Add Chapter</button>` : ''}
          <div class="chapters-wide-list">
            ${chapters.map((chap, idx) => {
              const lessonCount = Array.isArray(chap.lessons) ? chap.lessons.length : 0;
              const completed = 0; // TODO: Use profile progress if available
              const percent = lessonCount ? Math.round(100 * completed / lessonCount) : 0;
              return `
              <div class="chapter-wide-card${chap.id == selectedChapterId ? ' selected' : ''}" tabindex="0" data-chapter-id="${chap.id}">
                <div class="chapter-wide-row">
                  <div class="chapter-wide-index">${idx + 1}</div>
                  <div class="chapter-wide-info">
                    <div class="chapter-title">${chap.title}</div>
                    <div class="chapter-desc">${chap.desc || ''}</div>
                  </div>
                  <div class="chapter-wide-progress">
                    <div class="xp-bar-bg"><div class="xp-bar-fill" style="width:${percent}%"></div></div>
                    <span class="xp-label">${completed} / ${lessonCount} lessons</span>
                  </div>
                  ${admin ? `<div class="admin-chapter-actions">
                    <button class="admin-btn edit-chapter-btn" data-id="${chap.id}">Edit</button>
                    <button class="admin-btn delete-chapter-btn" data-id="${chap.id}">Delete</button>
                  </div>` : ''}
                </div>
              </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="course-wide-divider"></div>
        <aside class="course-wide-aside">
          <div class="course-accordions">
            <div class="accordion-item">
              <button class="accordion-header" data-acc-id="resources">Resources</button>
              ${admin ? `<button class="admin-btn edit-accordion-btn" data-type="resources">Edit</button>` : ''}
              <div class="accordion-body" id="acc-body-resources" style="display:none;">
                <ul class="accordion-list" id="resources-list">
                  ${(Array.isArray(selectedChapter.resources) ? selectedChapter.resources : []).map((r, i) => `
                    <li class="accordion-list-item" data-index="${i}">
                      ${admin ? `<span class="drag-handle">☰</span>` : ''}
                      ${r.url ? `<a href="${r.url}" target="_blank">${r.label}</a>` : r.label}
                      ${admin ? `<button class="admin-btn edit-accordion-item-btn" data-type="resources" data-index="${i}">Edit</button>` : ''}
                      ${admin ? `<button class="admin-btn delete-accordion-item-btn" data-type="resources" data-index="${i}">Delete</button>` : ''}
                    </li>
                  `).join('')}
                </ul>
                ${admin ? `<button class="admin-btn add-accordion-item-btn" data-type="resources">+ Add Accordion Item</button>` : ''}
              </div>
            </div>
            <div class="accordion-item">
              <button class="accordion-header" data-acc-id="questions">Questions</button>
              ${admin ? `<button class="admin-btn edit-accordion-btn" data-type="questions">Edit</button>` : ''}
              <div class="accordion-body" id="acc-body-questions" style="display:none;">
                <ul class="accordion-list" id="questions-list">
                  ${(Array.isArray(selectedChapter.questions) ? selectedChapter.questions : []).map((q, i, arr) => `
                    <li class="accordion-list-item" data-index="${i}">
                      ${admin ? `<span class="drag-handle">☰</span>` : ''}
                      <div class="question-block">
                        <div class="question-text">${typeof q === 'object' ? q.question : q}</div>
                        <div class="question-answer" id="question-answer-${i}">${typeof q === 'object' && q.answer ? q.answer : ''}</div>
                      </div>
                      ${admin ? `<button class="admin-btn edit-accordion-item-btn" data-type="questions" data-index="${i}">Edit</button>` : ''}
                      ${admin ? `<button class="admin-btn delete-accordion-item-btn" data-type="questions" data-index="${i}">Delete</button>` : ''}
                    </li>
                    ${i < arr.length - 1 ? '<hr class="question-divider" />' : ''}
                  `).join('')}
                </ul>
                ${admin ? `<button class="admin-btn add-accordion-item-btn" data-type="questions">+ Add Accordion Item</button>` : ''}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;
  // Chapter navigation for .chapter-wide-card
  root.querySelectorAll('.chapter-wide-card').forEach(card => {
    card.onclick = () => {
      const chapterId = card.getAttribute('data-chapter-id');
      const chapter = chapters.find(ch => ch.id == chapterId);
      if (chapter && Array.isArray(chapter.lessons) && chapter.lessons.length > 0) {
        renderLessonView(course.id, chapter.id, chapter.lessons[0].id);
      }
    };
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const chapterId = card.getAttribute('data-chapter-id');
        const chapter = chapters.find(ch => ch.id == chapterId);
        if (chapter && Array.isArray(chapter.lessons) && chapter.lessons.length > 0) {
          renderLessonView(course.id, chapter.id, chapter.lessons[0].id);
        }
      }
    };
  });
  // Drag-and-drop for chapters (admin mode)
  if (state.isAdminMode()) {
    enableDragAndDrop('.chapters-wide-list', '.chapter-wide-card', (newOrder) => {
      // newOrder is array of data-id strings
      const newChapters = newOrder.map(id => chapters.find(ch => String(ch.id) === id));
      course.chapters = newChapters;
      state.editCourse(course.id, { chapters: newChapters });
      localStorage.setItem('arcanum-app-state', JSON.stringify(getSerializableState()));
      renderCourseWideChaptersView(course, newChapters, newChapters[0]?.id);
    });
  }
  // Accordion logic (fix)
  root.querySelectorAll('.accordion-header').forEach(btn => {
    btn.onclick = () => {
      const accId = btn.getAttribute('data-acc-id');
      const body = root.querySelector(`#acc-body-${accId}`);
      if (body.style.display === 'none' || body.style.display === '') {
        body.style.display = 'block';
      } else {
        body.style.display = 'none';
      }
    };
  });
  // Back to dashboard
  root.querySelector('#back-dashboard').onclick = renderDashboardView;
  // Admin slider
  root.querySelector('#admin-mode-toggle').onchange = (e) => {
    state.setAdminMode(e.target.checked);
    renderCourseWideChaptersView(course, chapters, selectedChapterId);
  };
  // Reset demo button
  const resetBtn = root.querySelector('#reset-demo-btn');
  if (resetBtn) resetBtn.onclick = () => {
    localStorage.clear();
    location.reload();
  };
  // Reset course progress button
  const resetCourseBtn = root.querySelector('#reset-course-progress-btn');
  if (resetCourseBtn) {
    resetCourseBtn.onclick = () => {
      if (!confirm('Are you sure you want to reset your progress for this course? This cannot be undone.')) return;
      // Remove all completedLessons, exerciseLog, and SRS entries for this course
      const chapters = Array.isArray(course.chapters) ? course.chapters : [];
      const allLessonIds = chapters.flatMap(ch => Array.isArray(ch.lessons) ? ch.lessons.map(l => l.id) : []);
      // Remove lessons from completedLessons
      if (Array.isArray(profile.completedLessons)) {
        profile.completedLessons = profile.completedLessons.filter(id => !allLessonIds.includes(id));
      }
      // Remove exercises from exerciseLog
      if (Array.isArray(profile.exerciseLog)) {
        profile.exerciseLog = profile.exerciseLog.filter(e => !allLessonIds.includes(e.lessonId));
      }
      // Remove SRS entries for these lessons/exercises
      if (Array.isArray(profile.srsQueue)) {
        profile.srsQueue = profile.srsQueue.filter(e => !allLessonIds.includes(e.id));
      }
      state.editProfile(profile.id, profile);
      renderCourseWideChaptersView(course, chapters, chapters[0]?.id);
    };
  }
  // Admin actions for chapters
  if (admin) {
    // Add Chapter
    const addChapterBtn = root.querySelector('#add-chapter-btn');
    if (addChapterBtn) {
      addChapterBtn.onclick = () => {
        showModal(`
          <h2>Add Chapter</h2>
          <label>Title: <input id="add-chapter-title"></label><br>
          <label>Description: <input id="add-chapter-desc"></label><br>
          <label>Icon: <input id="add-chapter-icon" value="📖"></label><br>
          <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
            <button class="admin-btn" id="save-add-chapter-btn">Add</button>
            <button class="admin-btn" id="cancel-add-chapter-btn">✖ Cancel</button>
          </div>
        `);
        document.getElementById('cancel-add-chapter-btn').onclick = closeModal;
        document.getElementById('save-add-chapter-btn').onclick = () => {
          const title = document.getElementById('add-chapter-title').value.trim();
          const desc = document.getElementById('add-chapter-desc').value.trim();
          const icon = document.getElementById('add-chapter-icon').value.trim() || '📖';
          if (!title) return alert('Title is required');
          const newChapter = {
            id: Date.now() + Math.floor(Math.random()*10000),
            title,
            desc,
            icon,
            lessons: [],
            resources: [],
            questions: []
          };
          chapters.push(newChapter);
          state.editCourse(course.id, { chapters });
          closeModal();
          renderCourseWideChaptersView(course, chapters, newChapter.id);
        };
      };
    }
    // Add Accordion Item
    root.querySelectorAll('.add-accordion-item-btn').forEach(btn => {
      btn.onclick = () => {
        const type = btn.getAttribute('data-type');
        showAddAccordionItemModal(course, selectedChapter, type);
      };
    });
    root.querySelectorAll('.edit-chapter-btn').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.getAttribute('data-id'));
        const chapter = chapters.find(ch => ch.id === id);
        showEditChapterModal(course.id, chapter);
      };
    });
    root.querySelectorAll('.delete-chapter-btn').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.getAttribute('data-id'));
        if (confirm('Delete this chapter?')) {
          const idx = chapters.findIndex(ch => ch.id === id);
          if (idx !== -1) {
            chapters.splice(idx, 1);
            state.editCourse(course.id, { chapters });
            renderCourseWideChaptersView(course, chapters, chapters[0]?.id);
          }
        }
      };
    });
    // Edit accordions
    root.querySelectorAll('.edit-accordion-btn').forEach(btn => {
      btn.onclick = () => {
        const type = btn.getAttribute('data-type');
        showEditAccordionModal(course, selectedChapter, type);
      };
    });
    // Delete Accordion Item
    root.querySelectorAll('.delete-accordion-item-btn').forEach(btn => {
      btn.onclick = () => {
        const type = btn.getAttribute('data-type');
        const idx = Number(btn.getAttribute('data-index'));
        if (type === 'resources' && Array.isArray(selectedChapter.resources)) {
          selectedChapter.resources.splice(idx, 1);
        } else if (type === 'questions' && Array.isArray(selectedChapter.questions)) {
          selectedChapter.questions.splice(idx, 1);
        }
        state.editCourse(course.id, { chapters });
        renderCourseWideChaptersView(course, chapters, selectedChapter.id);
      };
    });
    // Drag-and-drop for resources
    enableDragAndDrop('#resources-list', '.accordion-list-item', (newOrder) => {
      if (!Array.isArray(selectedChapter.resources)) return;
      const reordered = newOrder.map(idx => selectedChapter.resources[Number(idx)]);
      selectedChapter.resources = reordered;
      state.editCourse(course.id, { chapters });
      renderCourseWideChaptersView(course, chapters, selectedChapter.id);
    });
    // Drag-and-drop for questions
    enableDragAndDrop('#questions-list', '.accordion-list-item', (newOrder) => {
      if (!Array.isArray(selectedChapter.questions)) return;
      const reordered = newOrder.map(idx => selectedChapter.questions[Number(idx)]);
      selectedChapter.questions = reordered;
      state.editCourse(course.id, { chapters });
      renderCourseWideChaptersView(course, chapters, selectedChapter.id);
    });
    // Edit Accordion Item
    root.querySelectorAll('.edit-accordion-item-btn').forEach(btn => {
      btn.onclick = () => {
        const type = btn.getAttribute('data-type');
        const idx = Number(btn.getAttribute('data-index'));
        showEditAccordionItemModal(course, selectedChapter, type, idx);
      };
    });
  }
  // Render markdown for answers
  if (Array.isArray(selectedChapter.questions)) {
    selectedChapter.questions.forEach((q, i) => {
      if (typeof q === 'object' && q.answer) {
        renderMarkdownToHtml(q.answer, `#question-answer-${i}`);
      }
    });
  }
}

function showEditAccordionModal(course, chapter, type) {
  let value = '';
  let label = '';
  let jsonTemplate = '';
  let formHtml = '';
  if (type === 'resources') {
    value = JSON.stringify(chapter.resources || [], null, 2);
    label = 'Resources (array of {label, url})';
    jsonTemplate = `[
  { "label": "Official Docs", "url": "https://example.com" },
  { "label": "Another Resource", "url": "https://example.com" }
]`;
    // Form for resources: one field per resource (for simplicity, just edit the first resource)
    const res = (chapter.resources && chapter.resources[0]) || { label: '', url: '' };
    formHtml = `
      <h2>Edit Resource (first item)</h2>
      <label>Label: <input id="form-resource-label" value="${res.label || ''}"></label><br>
      <label>URL: <input id="form-resource-url" value="${res.url || ''}"></label><br>
      <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button class="admin-btn" id="save-accordion-form-btn">Save</button>
        <button class="admin-btn" id="cancel-accordion-form-btn">Cancel</button>
      </div>
    `;
  } else if (type === 'questions') {
    value = JSON.stringify((chapter.questions || []).map(q => typeof q === 'object' ? q : { question: q, answer: '' }), null, 2);
    label = 'Questions (array of {question, answer})';
    jsonTemplate = `[
  { "question": "What is Python?", "answer": "A programming language." },
  { "question": "How do you install Python?", "answer": "Download from python.org." }
]`;
    // Form for questions: just edit the first question
    const q = (chapter.questions && chapter.questions[0]) || { question: '', answer: '' };
    formHtml = `
      <h2>Edit Question (first item)</h2>
      <label>Question: <input id="form-question-q" value="${q.question || ''}"></label><br>
      <label>Answer: <textarea id="form-question-a" rows="2" style="width:100%">${q.answer || ''}</textarea></label><br>
      <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button class="admin-btn" id="save-accordion-form-btn">Save</button>
        <button class="admin-btn" id="cancel-accordion-form-btn">Cancel</button>
      </div>
    `;
  }
  showModalTabbed({
    title: `Edit ${label}`,
    formHtml,
    jsonTemplate: jsonTemplate,
    onFormMount: () => {
      document.getElementById('cancel-accordion-form-btn').onclick = closeModal;
      document.getElementById('save-accordion-form-btn').onclick = () => {
        if (type === 'resources') {
          const label = document.getElementById('form-resource-label').value;
          const url = document.getElementById('form-resource-url').value;
          chapter.resources[0] = { label, url };
        } else if (type === 'questions') {
          const question = document.getElementById('form-question-q').value;
          const answer = document.getElementById('form-question-a').value;
          chapter.questions[0] = { question, answer };
        }
        state.editCourse(course.id, { chapters: course.chapters });
        closeModal();
        renderCourseWideChaptersView(course, course.chapters, chapter.id);
      };
    },
    onJsonMount: () => {
      // No-op for now
    }
  });
}

function showAddAccordionItemModal(course, chapter, type) {
  let label = '';
  let placeholder = '';
  let jsonTemplate = '';
  let formHtml = '';
  if (type === 'resources') {
    label = 'Resource (JSON: {"label": "Name", "url": "https://..."})';
    placeholder = '{ "label": "Resource Name", "url": "https://..." }';
    jsonTemplate = `{
  "label": "Resource Name",
  "url": "https://..."
}`;
    formHtml = `
      <h2>Add Resource</h2>
      <label>Label: <input id="form-resource-label"></label><br>
      <label>URL: <input id="form-resource-url"></label><br>
      <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button class="admin-btn" id="save-add-accordion-form-btn">Add</button>
        <button class="admin-btn" id="cancel-add-accordion-form-btn">Cancel</button>
      </div>
    `;
  } else if (type === 'questions') {
    label = 'Question (JSON: {"question": "...", "answer": "..."})';
    placeholder = '{ "question": "What is Python?", "answer": "A programming language." }';
    jsonTemplate = `{
  "question": "What is Python?",
  "answer": "A programming language."
}`;
    formHtml = `
      <h2>Add Question</h2>
      <label>Question: <input id="form-question-q"></label><br>
      <label>Answer: <textarea id="form-question-a" rows="2" style="width:100%"></textarea></label><br>
      <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button class="admin-btn" id="save-add-accordion-form-btn">Add</button>
        <button class="admin-btn" id="cancel-add-accordion-form-btn">Cancel</button>
      </div>
    `;
  }
  showModalTabbed({
    title: 'Add Accordion Item',
    formHtml,
    jsonTemplate,
    onFormMount: () => {
      document.getElementById('cancel-add-accordion-form-btn').onclick = closeModal;
      document.getElementById('save-add-accordion-form-btn').onclick = () => {
        if (type === 'resources') {
          const label = document.getElementById('form-resource-label').value;
          const url = document.getElementById('form-resource-url').value;
          if (!Array.isArray(chapter.resources)) chapter.resources = [];
          chapter.resources.push({ label, url });
        } else if (type === 'questions') {
          const question = document.getElementById('form-question-q').value;
          const answer = document.getElementById('form-question-a').value;
          if (!Array.isArray(chapter.questions)) chapter.questions = [];
          chapter.questions.push({ question, answer });
        }
        state.editCourse(course.id, { chapters: course.chapters });
        closeModal();
        renderCourseWideChaptersView(course, course.chapters, chapter.id);
      };
    },
    onJsonMount: () => {}
  });
}

function showEditAccordionItemModal(course, chapter, type, idx) {
  let label = '';
  let value = '';
  let jsonTemplate = '';
  let formHtml = '';
  if (type === 'resources') {
    label = 'Resource (JSON: {"label": "Name", "url": "https://..."})';
    value = JSON.stringify(chapter.resources[idx], null, 2);
    jsonTemplate = `{
  "label": "Resource Name",
  "url": "https://..."
}`;
    const res = chapter.resources[idx] || { label: '', url: '' };
    formHtml = `
      <h2>Edit Resource</h2>
      <label>Label: <input id="form-resource-label" value="${res.label || ''}"></label><br>
      <label>URL: <input id="form-resource-url" value="${res.url || ''}"></label><br>
      <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button class="admin-btn" id="save-edit-accordion-form-btn">Save</button>
        <button class="admin-btn" id="cancel-edit-accordion-form-btn">Cancel</button>
      </div>
    `;
  } else if (type === 'questions') {
    label = 'Question (JSON: {"question": "...", "answer": "..."})';
    value = JSON.stringify(chapter.questions[idx], null, 2);
    jsonTemplate = `{
  "question": "What is Python?",
  "answer": "A programming language."
}`;
    const q = chapter.questions[idx] || { question: '', answer: '' };
    formHtml = `
      <h2>Edit Question</h2>
      <label>Question: <input id="form-question-q" value="${q.question || ''}"></label><br>
      <label>Answer: <textarea id="form-question-a" rows="2" style="width:100%">${q.answer || ''}</textarea></label><br>
      <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button class="admin-btn" id="save-edit-accordion-form-btn">Save</button>
        <button class="admin-btn" id="cancel-edit-accordion-form-btn">Cancel</button>
      </div>
    `;
  }
  showModalTabbed({
    title: 'Edit Accordion Item',
    formHtml,
    jsonTemplate,
    onFormMount: () => {
      document.getElementById('cancel-edit-accordion-form-btn').onclick = closeModal;
      document.getElementById('save-edit-accordion-form-btn').onclick = () => {
        if (type === 'resources') {
          const label = document.getElementById('form-resource-label').value;
          const url = document.getElementById('form-resource-url').value;
          chapter.resources[idx] = { label, url };
        } else if (type === 'questions') {
          const question = document.getElementById('form-question-q').value;
          const answer = document.getElementById('form-question-a').value;
          chapter.questions[idx] = { question, answer };
        }
        state.editCourse(course.id, { chapters: course.chapters });
        closeModal();
        renderCourseWideChaptersView(course, course.chapters, chapter.id);
      };
    },
    onJsonMount: () => {}
  });
}

function renderChapterView(chapterId, courseId) {
  const course = state.getCourses().find(c => c.id == courseId);
  if (!course) return renderDashboardView();
  const chapter = (course.chapters || []).find(ch => ch.id == chapterId);
  if (!chapter) return renderCourseWideChaptersView(course, course.chapters, chapterId);
  const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
  // For demo: select first lesson by default
  let selectedLessonId = lessons.length > 0 ? lessons[0].id : null;
  if (selectedLessonId) {
    renderLessonView(course.id, chapter.id, selectedLessonId);
  } else {
    renderCourseWideChaptersView(course, course.chapters, chapterId);
  }
}

// Helper: Markdown rendering
async function renderMarkdownToHtml(md, targetSelector) {
  let html = md;
  try {
    if (!window.marked) {
      await import('../js/lib/marked.js');
    }
    if (window.marked) {
      html = window.marked.parse(md);
    }
  } catch (e) {
    // fallback: plain text
    html = md.replace(/\n/g, '<br>');
  }
  const el = document.querySelector(targetSelector);
  if (el) el.innerHTML = html;
}

// Patch lesson view to use Markdown rendering in Codex
const origRenderLessonView = renderLessonView;
renderLessonView = function(courseId, chapterId, lessonId, exerciseIdx = 0) {
  origRenderLessonView(courseId, chapterId, lessonId, exerciseIdx);
  // After rendering, convert lesson content to HTML
  const course = state.getCourses().find(c => c.id == courseId);
  const chapter = course && course.chapters.find(ch => ch.id == chapterId);
  const lessons = chapter && Array.isArray(chapter.lessons) ? chapter.lessons : [];
  const lesson = lessons.find(l => l.id == lessonId) || lessons[0];
  if (lesson && lesson.content) {
    renderMarkdownToHtml(lesson.content, '#lesson-codex-md');
  }
  // Add Reset Chapter Progress button
  const root = document.getElementById('app-root');
  const profile = state.getSelectedProfile();
  const courseForReset = state.getCourses().find(c => c.id == courseId);
  const chapterForReset = courseForReset && courseForReset.chapters.find(ch => ch.id == chapterId);
  if (root && chapterForReset) {
    let navRight = root.querySelector('.main-navbar .navbar-right');
    if (navRight && !navRight.querySelector('#reset-chapter-progress-btn')) {
      const btn = document.createElement('button');
      btn.className = 'navbar-link danger';
      btn.id = 'reset-chapter-progress-btn';
      btn.textContent = 'Reset Chapter Progress';
      btn.onclick = () => {
        if (!confirm('Are you sure you want to reset your progress for this chapter? This cannot be undone.')) return;
        const lessons = Array.isArray(chapterForReset.lessons) ? chapterForReset.lessons : [];
        const lessonIds = lessons.map(l => l.id);
        // Remove lessons from completedLessons
        if (Array.isArray(profile.completedLessons)) {
          profile.completedLessons = profile.completedLessons.filter(id => !lessonIds.includes(id));
        }
        // Remove exercises from exerciseLog
        if (Array.isArray(profile.exerciseLog)) {
          profile.exerciseLog = profile.exerciseLog.filter(e => !lessonIds.includes(e.lessonId));
        }
        // Remove SRS entries for these lessons/exercises
        if (Array.isArray(profile.srsQueue)) {
          profile.srsQueue = profile.srsQueue.filter(e => !lessonIds.includes(e.id));
        }
        state.editProfile(profile.id, profile);
        renderLessonView(courseId, chapterId, lessons[0]?.id, 0);
      };
      navRight.insertBefore(btn, navRight.firstChild);
    }
  }
};

function renderLessonView(courseId, chapterId, lessonId, exerciseIdx = 0) {
  const root = document.getElementById('app-root');
  const course = state.getCourses().find(c => c.id == courseId);
  if (!course) return renderDashboardView();
  const chapter = (course.chapters || []).find(ch => ch.id == chapterId);
  if (!chapter) return renderCourseWideChaptersView(course, course.chapters, chapterId);
  const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
  const lesson = lessons.find(l => l.id == lessonId) || lessons[0];
  const admin = state.isAdminMode();
  // Demo lesson markdown content
  const lessonContent = lesson.content || `# ${lesson.title}\n\nWelcome to the lesson on **For Loops** in Python!\n\n- For loops let you repeat actions.\n- Syntax: \`for x in y:\`\n- Example:\n\n\`\`\`python\nfor i in range(5):\n    print(i)\n\`\`\`\n\nTry the exercises on the right!`;
  // Demo exercises for the lesson
  const exercises = lesson.exercises || [
    {
      type: 'code',
      prompt: 'Write a for loop that prints numbers 1 to 5.',
      starter: 'for i in range(___):\n    print(i)',
      answer: '1,2,3,4,5',
    },
    {
      type: 'mcq',
      prompt: 'What does the following code print?\n\nfor i in range(3):\n    print(i)',
      options: ['0 1 2', '1 2 3', '0 1 2 3', 'Error'],
      correct: 0,
    },
    {
      type: 'fill',
      prompt: 'Fill in the blank: for ___ in range(5):',
      answer: 'i',
    }
  ];
  const exercise = exercises[exerciseIdx] || exercises[0];
  // Dropdown for all lessons
  const lessonDropdown = `
    <div class="lesson-dropdown-container">
      <button class="navbar-link" id="show-lessons-btn">Show all lessons ▼</button>
      <div class="lesson-dropdown" id="lesson-dropdown" style="display:none;">
        ${lessons.map((l, idx) => `<div class="lesson-dropdown-item" data-lesson-id="${l.id}">${idx + 1}. ${l.title}</div>`).join('')}
        ${admin ? `<div class="lesson-dropdown-sep"></div><button class="admin-btn" id="add-lessons-btn">+ Add Lessons (JSON)</button>` : ''}
      </div>
    </div>
  `;
  // Admin edit lesson button
  const editLessonBtn = admin ? `<button class="admin-btn" id="edit-lesson-btn">Edit Lesson</button>` : '';
  root.innerHTML = `
    <nav class="main-navbar">
      <div class="navbar-left">
        <span class="navbar-logo">Arcanum</span>
      </div>
      <div class="navbar-center">
        <span class="navbar-title">Lesson</span>
      </div>
      <div class="navbar-right">
        ${lessonDropdown}
        ${editLessonBtn}
        <button class="navbar-link" id="back-chapter">Back to Chapter</button>
        ${renderResetDemoButton()}
        ${renderAdminSlider()}
        <div id="theme-switcher-navbar"></div>
      </div>
    </nav>
    <section class="lesson-wide-view">
      <div class="lesson-wide-head">
        <h1 class="lesson-wide-title">${lesson.title}</h1>
        <div class="lesson-wide-course-title">${course.icon} ${course.title}</div>
      </div>
      <div class="lesson-wide-columns">
        <aside class="lesson-codex">
          <div class="lesson-codex-content" id="lesson-codex-md"></div>
        </aside>
        <div class="lesson-wide-divider"></div>
        <main class="lesson-crucible">
          <div class="exercise-nav">
            <button class="exercise-nav-btn" id="prev-ex" ${exerciseIdx === 0 ? 'disabled' : ''}>&lt; Prev</button>
            <span class="exercise-nav-label">Exercise ${exerciseIdx + 1} of ${exercises.length}</span>
            <button class="exercise-nav-btn" id="next-ex" ${exerciseIdx === exercises.length - 1 ? 'disabled' : ''}>Next &gt;</button>
          </div>
          <div class="exercise-area">
            ${exercise.type === 'code' ? `
              <div class="exercise-prompt">${exercise.prompt}</div>
              <textarea class="exercise-code" id="exercise-code" rows="6">${exercise.starter}</textarea>
            ` : ''}
            ${exercise.type === 'mcq' ? `
              <div class="exercise-prompt">${exercise.prompt.replace(/\n/g, '<br>')}</div>
              <div class="exercise-mcq-options">
                ${exercise.options.map((opt, i) => `
                  <label><input type="radio" name="mcq" value="${i}"> ${opt}</label>
                `).join('<br>')}
              </div>
            ` : ''}
            ${exercise.type === 'fill' ? `
              <div class="exercise-prompt">${exercise.prompt}</div>
              <input class="exercise-fill" id="exercise-fill" type="text" autocomplete="off">
            ` : ''}
          </div>
          <div class="exercise-actions">
            <button class="check-answer-btn" id="check-answer-btn">Check Answer</button>
            <button class="show-answer-btn" id="show-answer-btn">Show Answer</button>
            <span class="exercise-feedback" id="exercise-feedback"></span>
          </div>
        </main>
      </div>
    </section>
  `;
  // Move the theme switcher into the navbar
  const themeSwitcherTarget2 = root.querySelector('#theme-switcher-navbar');
  const themeSwitcher2 = document.getElementById('theme-switcher');
  if (themeSwitcherTarget2 && themeSwitcher2) {
    themeSwitcherTarget2.appendChild(themeSwitcher2);
    themeSwitcher2.style.position = 'static';
    themeSwitcher2.style.marginLeft = '0.7rem';
    themeSwitcher2.style.marginRight = '0';
    themeSwitcher2.style.top = 'unset';
    themeSwitcher2.style.right = 'unset';
    themeSwitcher2.style.width = '36px';
    themeSwitcher2.style.height = '36px';
    themeSwitcher2.style.zIndex = 'auto';
  }
  // Restore Reset Demo Data button event handler
  const resetBtn2 = root.querySelector('#reset-demo-btn');
  if (resetBtn2) resetBtn2.onclick = () => {
    localStorage.clear();
    location.reload();
  };
  // Back button (fix)
  if (root.querySelector('#back-chapter')) {
    root.querySelector('#back-chapter').onclick = () => {
      if (course) {
        renderCourseWideChaptersView(course, course.chapters, chapterId);
      } else {
        renderDashboardView();
      }
    };
  }
  // Exercise navigation
  root.querySelector('#prev-ex').onclick = () => renderLessonView(courseId, chapterId, lessonId, exerciseIdx - 1);
  root.querySelector('#next-ex').onclick = () => renderLessonView(courseId, chapterId, lessonId, exerciseIdx + 1);
  // Check answer logic (demo)
  root.querySelector('#check-answer-btn').onclick = () => {
    let correct = false;
    if (exercise.type === 'code') {
      const val = root.querySelector('#exercise-code').value;
      correct = val.includes('range') && val.includes('print');
    } else if (exercise.type === 'mcq') {
      const checked = root.querySelector('input[name="mcq"]:checked');
      correct = checked && Number(checked.value) === exercise.correct;
    } else if (exercise.type === 'fill') {
      const val = root.querySelector('#exercise-fill').value.trim();
      correct = val.toLowerCase() === exercise.answer.toLowerCase();
    }
    const feedback = root.querySelector('#exercise-feedback');
    if (correct) {
      feedback.textContent = '✅ Correct!';
      feedback.style.color = '#3a7a3a';
      // Mark exercise as completed in profile.exerciseLog (if not already)
      const profile = state.getSelectedProfile();
      if (!profile.exerciseLog) profile.exerciseLog = [];
      const logExists = profile.exerciseLog.some(e => e.lessonId === lesson.id && e.type === exercise.type);
      if (!logExists) {
        profile.exerciseLog.push({ lessonId: lesson.id, type: exercise.type, status: 'success', timestamp: Date.now() });
        state.editProfile(profile.id, profile);
      }
      // Auto-add exercise to SRS
      scheduleSRSItem(profile, lesson.id, 'exercise', 'success');
      state.editProfile(profile.id, profile);
      // If last exercise, mark lesson as completed and add to SRS
      if (exerciseIdx === exercises.length - 1) {
        if (!profile.completedLessons) profile.completedLessons = [];
        if (!profile.completedLessons.includes(lesson.id)) {
          profile.completedLessons.push(lesson.id);
          state.editProfile(profile.id, profile);
          // Auto-add lesson to SRS
          scheduleSRSItem(profile, lesson.id, 'lesson', 'success');
          state.editProfile(profile.id, profile);
        }
      }
    } else {
      feedback.textContent = '❌ Try again.';
      feedback.style.color = '#a44';
    }
  };
  // Show answer logic
  root.querySelector('#show-answer-btn').onclick = () => {
    let answer = '';
    if (exercise.type === 'code') {
      answer = exercise.answer ? `Expected output: ${exercise.answer}` : 'No answer available.';
    } else if (exercise.type === 'mcq') {
      answer = exercise.options && typeof exercise.correct === 'number' ? `Correct: ${exercise.options[exercise.correct]}` : 'No answer available.';
    } else if (exercise.type === 'fill') {
      answer = exercise.answer ? `Answer: ${exercise.answer}` : 'No answer available.';
    } else if (exercise.type === 'drag' || exercise.type === 'order') {
      answer = exercise.items && exercise.order ? `Order: ${exercise.order.map(i => exercise.items[i]).join(', ')}` : 'No answer available.';
    }
    const feedback = root.querySelector('#exercise-feedback');
    feedback.textContent = answer;
    feedback.style.color = '#bfa46f';
  };
  // Lesson dropdown logic
  const showLessonsBtn = root.querySelector('#show-lessons-btn');
  const lessonDropdownEl = root.querySelector('#lesson-dropdown');
  if (showLessonsBtn && lessonDropdownEl) {
    showLessonsBtn.onclick = () => {
      lessonDropdownEl.style.display = lessonDropdownEl.style.display === 'block' ? 'none' : 'block';
    };
    root.querySelectorAll('.lesson-dropdown-item').forEach(item => {
      item.onclick = () => {
        const lid = item.getAttribute('data-lesson-id');
        renderLessonView(courseId, chapterId, lid, 0);
        lessonDropdownEl.style.display = 'none';
      };
    });
    // Admin: Add lessons
    if (admin && root.querySelector('#add-lessons-btn')) {
      root.querySelector('#add-lessons-btn').onclick = () => {
        showBulkAddLessonsModal(courseId, chapterId);
      };
    }
  }
  // Admin: Edit lesson
  if (admin && root.querySelector('#edit-lesson-btn')) {
    root.querySelector('#edit-lesson-btn').onclick = () => {
      showEditLessonModal(courseId, chapterId, lessonId);
    };
  }
  // Fix: Reset Demo Data button handler
  const resetBtn = root.querySelector('#reset-demo-btn');
  if (resetBtn) resetBtn.onclick = () => {
    localStorage.clear();
    location.reload();
  };
  // Fix: Admin slider event handler for lesson view
  const adminToggle = root.querySelector('#admin-mode-toggle');
  if (adminToggle) {
    adminToggle.onchange = (e) => {
      state.setAdminMode(e.target.checked);
      renderLessonView(courseId, chapterId, lessonId, exerciseIdx);
    };
  }
  // After rendering lessonDropdown in renderLessonView:
  if (admin) {
    enableDragAndDrop('.lesson-dropdown-list', '.lesson-dropdown-item', (newOrder) => {
      const newLessons = newOrder.map(id => lessons.find(l => String(l.id) === id));
      chapter.lessons = newLessons;
      state.editCourse(course.id, { chapters: course.chapters });
      localStorage.setItem('arcanum-app-state', JSON.stringify(getSerializableState()));
      renderLessonView(course.id, chapter.id, newLessons[0]?.id);
    });
  }
}

function renderChapterSplitView(course, chapter, lessons, selectedLessonId) {
  const root = document.getElementById('app-root');
  const selectedLesson = lessons.find(l => l.id == selectedLessonId) || lessons[0];
  // Demo exercises for each lesson
  const exercises = [
    { id: 1, title: 'Exercise 1', content: 'Write a for loop that prints numbers 1 to 5.' },
    { id: 2, title: 'Exercise 2', content: 'Sum all numbers in a list using a for loop.' },
    { id: 3, title: 'Exercise 3', content: 'Use a for loop to iterate over a string.' }
  ];
  root.innerHTML = `
    <nav class="main-navbar">
      <div class="navbar-left">
        <span class="navbar-logo">Arcanum</span>
      </div>
      <div class="navbar-center">
        <span class="navbar-title">${course.icon} ${course.title} / ${chapter.title}</span>
      </div>
      <div class="navbar-right">
        <button class="navbar-link" id="back-course">Back to Course</button>
        ${renderResetDemoButton()}
        ${renderAdminSlider()}
      </div>
    </nav>
    <section class="chapter-split-view">
      <aside class="chapter-lessons-pane">
        <div class="chapter-progress-bar">
          <div class="xp-bar-bg">
            <div class="xp-bar-fill" style="width:40%"></div>
          </div>
          <span class="xp-label">2 / ${lessons.length} lessons completed</span>
        </div>
        <div class="lessons-list">
          ${lessons.map(lesson => `
            <div class="lesson-list-item${lesson.id == selectedLesson.id ? ' selected' : ''}" data-lesson-id="${lesson.id}">
              <div class="lesson-title">${lesson.title}</div>
              <div class="lesson-progress-bar">
                <div class="xp-bar-bg"><div class="xp-bar-fill" style="width:60%"></div></div>
              </div>
            </div>
          `).join('')}
        </div>
      </aside>
      <main class="lesson-content-pane">
        <div class="lesson-content">
          <h2>${selectedLesson.title}</h2>
          <div>${selectedLesson.content}</div>
        </div>
        <div class="lesson-exercises">
          <h3>Exercises</h3>
          <div class="exercises-accordion">
            ${exercises.map(ex => `
              <div class="exercise-accordion-item">
                <button class="exercise-accordion-header" data-ex-id="${ex.id}">${ex.title}</button>
                <div class="exercise-accordion-body" id="exercise-body-${ex.id}" style="display:none;">${ex.content}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </main>
    </section>
  `;
  // Back button
  root.querySelector('#back-course').onclick = () => renderCourseView(course.id);
  // Lesson selection
  root.querySelectorAll('.lesson-list-item').forEach(item => {
    item.onclick = () => {
      const lessonId = item.getAttribute('data-lesson-id');
      renderChapterSplitView(course, chapter, lessons, lessonId);
    };
  });
  // Accordion logic
  root.querySelectorAll('.exercise-accordion-header').forEach(btn => {
    btn.onclick = () => {
      const exId = btn.getAttribute('data-ex-id');
      const body = root.querySelector(`#exercise-body-${exId}`);
      if (body.style.display === 'none') {
        body.style.display = 'block';
      } else {
        body.style.display = 'none';
      }
    };
  });
  // Reset demo button
  const resetBtn = root.querySelector('#reset-demo-btn');
  if (resetBtn) resetBtn.onclick = () => {
    localStorage.clear();
    location.reload();
  };
}

function showCreateProfileModal() {
  const defaultAvatar = 'https://ui-avatars.com/api/?name=New+User&background=6a5d3b&color=fff&rounded=true';
  showModalTabbed({
    title: 'Create New Profile',
    formHtml: `
      <h2>Create New Profile</h2>
      <label>Name: <input id="create-profile-name" placeholder="Your name"></label><br>
      <label>Avatar URL: <input id="create-profile-avatar" value="${defaultAvatar}"></label><br>
      <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button class="admin-btn" id="create-profile-btn-modal">Create</button>
        <button class="admin-btn" id="cancel-create-profile-btn">Cancel</button>
      </div>
    `,
    jsonTemplate: `{
  "name": "New User",
  "avatar": "${defaultAvatar}"
}`,
    onFormMount: () => {
      document.getElementById('cancel-create-profile-btn').onclick = closeModal;
      document.getElementById('create-profile-btn-modal').onclick = () => {
        const name = document.getElementById('create-profile-name').value.trim();
        const avatar = document.getElementById('create-profile-avatar').value.trim() || defaultAvatar;
        if (!name) {
          alert('Please enter a name.');
          return;
        }
        const newProfile = {
          id: Date.now() + Math.floor(Math.random()*10000),
          name,
          avatar,
          level: 1,
          xp: 0,
          xpToNext: 100,
          streak: 0,
          achievements: [],
          completedLessons: [],
          completedChapters: [],
          completedCourses: [],
          exerciseLog: [],
          settings: { theme: 'light' }
        };
        state.addProfiles([newProfile]);
        state.setSelectedProfile(newProfile.id);
        closeModal();
        renderDashboardView();
      };
    }
  });
}

function showModalTabbed({title, formHtml, jsonEditHtml, jsonTemplate, onFormMount, onJsonMount, jsonFaq}) {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `<div class="modal-overlay"><div class="modal-content modal-lg">
    <div class="modal-tabs">
      <button class="modal-tab-btn" data-tab="form">Form</button>
      ${jsonEditHtml ? '<button class="modal-tab-btn" data-tab="json">JSON</button>' : ''}
      <button class="modal-tab-btn active" data-tab="template">JSON Template</button>
      ${jsonFaq ? '<button class="modal-tab-btn" data-tab="faq">FAQ</button>' : ''}
    </div>
    <div class="modal-tab-content modal-tab-form" style="display:none;">${formHtml}</div>
    ${jsonEditHtml ? `<div class="modal-tab-content modal-tab-json" style="display:none;">${jsonEditHtml}</div>` : ''}
    <div class="modal-tab-content modal-tab-template">
      <pre class="modal-json-template"><code>${jsonTemplate}</code></pre>
      <button class="admin-btn" id="copy-json-template-btn">Copy JSON</button>
    </div>
    ${jsonFaq ? `<div class="modal-tab-content modal-tab-faq" style="display:none;">${jsonFaq}</div>` : ''}
  </div></div>`;
  modalRoot.style.pointerEvents = 'auto';
  // Tab switching
  const tabBtns = modalRoot.querySelectorAll('.modal-tab-btn');
  tabBtns.forEach(btn => btn.onclick = () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    modalRoot.querySelector('.modal-tab-form').style.display = btn.dataset.tab === 'form' ? '' : 'none';
    if (jsonEditHtml) modalRoot.querySelector('.modal-tab-json').style.display = btn.dataset.tab === 'json' ? '' : 'none';
    modalRoot.querySelector('.modal-tab-template').style.display = btn.dataset.tab === 'template' ? '' : 'none';
    if (jsonFaq) modalRoot.querySelector('.modal-tab-faq').style.display = btn.dataset.tab === 'faq' ? '' : 'none';
  });
  // Copy JSON
  modalRoot.querySelector('#copy-json-template-btn').onclick = () => {
    const code = modalRoot.querySelector('.modal-json-template code').innerText;
    navigator.clipboard.writeText(code);
    modalRoot.querySelector('#copy-json-template-btn').textContent = 'Copied!';
    setTimeout(()=>{modalRoot.querySelector('#copy-json-template-btn').textContent = 'Copy JSON';}, 1200);
  };
  // Overlay click to close
  modalRoot.onclick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      modalRoot.innerHTML = '';
      modalRoot.style.pointerEvents = 'none';
    }
  };
  if (onFormMount) onFormMount();
  if (onJsonMount && jsonEditHtml) onJsonMount();
}

function showBulkAddModal(type) {
  if (type === 'course') {
    showAddCourseModal();
    return;
  }

  const jsonTemplate = `{
  "profiles": [
    {
      "id": 1,
      "name": "Demo User",
      "avatar": "https://...",
      "level": 4,
      "xp": 1280,
      "xpToNext": 1500,
      "streak": 4,
      "achievements": [1,2,3],
      "completedLessons": [1001,1002,1003],
      "completedChapters": [101,102,103],
      "completedCourses": [1],
      "exerciseLog": [
        { "lessonId": 1001, "type": "code", "status": "success", "timestamp": 1710000000000 },
        { "lessonId": 1001, "type": "mcq", "status": "success", "timestamp": 1710000000001 },
        { "lessonId": 1001, "type": "fill", "status": "fail", "timestamp": 1710000000002 },
        { "lessonId": 1001, "type": "drag", "status": "success", "timestamp": 1710000000003 },
        { "lessonId": 1001, "type": "order", "status": "success", "timestamp": 1710000000004 }
      ],
      "settings": { "theme": "light" }
    }
  ],
  "courses": [
    {
      "id": 1,
      "title": "Learn to Code in Python",
      "desc": "Start your journey with Python.",
      "icon": "🐍",
      "chapters": [
        {
          "id": 101,
          "title": "Introduction to Python",
          "desc": "...",
          "icon": "📖",
          "resources": [
            { "label": "Official Python Docs", "url": "https://docs.python.org/3/" },
            { "label": "Python Tutorial (W3Schools)", "url": "https://www.w3schools.com/python/" }
          ],
          "questions": [
            "What is Python used for?",
            "How do you install Python?",
            "What is a variable?"
          ],
          "lessons": [
            {
              "id": 1001,
              "title": "What is Python?",
              "content": "Markdown or HTML content...",
              "exercises": [
                { "type": "code", "prompt": "Write a Hello World program.", "starter": "print('')", "solution": "print('Hello, World!')" },
                { "type": "mcq", "prompt": "What is Python?", "options": ["A snake", "A programming language", "A car"], "answer": 1 },
                { "type": "fill", "prompt": "Python is a ____ language.", "answer": "programming" },
                { "type": "drag", "prompt": "Order the steps to print in Python.", "items": ["Type print", "Open parenthesis", "Add string", "Close parenthesis"], "order": [0,1,2,3] },
                { "type": "order", "prompt": "Arrange the numbers in ascending order.", "items": [3,1,2], "order": [1,2,0] }
              ]
            }
          ]
        },
        {
          "id": 102,
          "title": "Variables and Data Types",
          "desc": "...",
          "icon": "🔢",
          "lessons": [
            {
              "id": 1002,
              "title": "Variables",
              "content": "Markdown or HTML content...",
              "exercises": [
                { "type": "code", "prompt": "Assign 5 to variable x.", "starter": "x = ", "solution": "x = 5" }
              ]
            }
          ]
        },
        {
          "id": 103,
          "title": "Control Flow",
          "desc": "...",
          "icon": "🔁",
          "lessons": [
            {
              "id": 1003,
              "title": "If Statements",
              "content": "Markdown or HTML content...",
              "exercises": [
                { "type": "mcq", "prompt": "Which keyword starts a conditional?", "options": ["if", "for", "while"], "answer": 0 }
              ]
            }
          ]
        }
      ]
    }
  ],
  "selectedProfileId": 1,
  "adminMode": false,
  "appSettings": { "theme": "light" }
}`;

  const faqHtml = `
    <h2>FAQ: JSON Structure & Field Options</h2>
    <h3>Profiles</h3>
    <ul>
      <li><b>id</b> (number, required): Unique user ID</li>
      <li><b>name</b> (string, required): User's display name</li>
      <li><b>avatar</b> (string, optional): Avatar image URL</li>
      <li><b>level</b>, <b>xp</b>, <b>xpToNext</b>, <b>streak</b> (numbers): Gamification stats</li>
      <li><b>achievements</b> (array of numbers): Earned achievement IDs</li>
      <li><b>completedLessons</b>, <b>completedChapters</b>, <b>completedCourses</b> (arrays of IDs): Progress tracking</li>
      <li><b>exerciseLog</b> (array): Each log: { lessonId, type, status, timestamp }</li>
      <li><b>settings</b> (object, optional): User preferences (e.g., theme)</li>
    </ul>
    <h3>Courses</h3>
    <ul>
      <li><b>id</b> (number, required): Unique course ID</li>
      <li><b>title</b> (string, required): Course name</li>
      <li><b>desc</b> (string): Description</li>
      <li><b>icon</b> (string): Emoji/icon</li>
      <li><b>chapters</b> (array): List of chapters</li>
    </ul>
    <h3>Chapters</h3>
    <ul>
      <li><b>id</b> (number, required): Unique chapter ID</li>
      <li><b>title</b> (string, required): Chapter name</li>
      <li><b>desc</b> (string): Description</li>
      <li><b>icon</b> (string): Emoji/icon</li>
      <li><b>lessons</b> (array): List of lessons</li>
    </ul>
    <h3>Lessons</h3>
    <ul>
      <li><b>id</b> (number, required): Unique lesson ID</li>
      <li><b>title</b> (string, required): Lesson name</li>
      <li><b>content</b> (string): Markdown/HTML content</li>
      <li><b>exercises</b> (array): List of exercises</li>
    </ul>
    <h3>Exercises</h3>
    <table class="faq-field-table">
      <tr><th>Type</th><th>Required Fields</th><th>Description</th></tr>
      <tr><td>code</td><td>prompt, solution<br>starter (optional)</td><td>Code exercise. <br>"solution" is the correct code.<br>"starter" is the initial code shown.</td></tr>
      <tr><td>mcq</td><td>prompt, options, answer</td><td>Multiple choice. <br>"options" is an array of strings.<br>"answer" is the index of the correct option.</td></tr>
      <tr><td>fill</td><td>prompt, answer</td><td>Fill-in-the-blank. <br>"answer" is the correct string.</td></tr>
      <tr><td>drag</td><td>prompt, items, order</td><td>Drag-and-drop ordering. <br>"items" is an array.<br>"order" is the correct order as array of indices.</td></tr>
      <tr><td>order</td><td>prompt, items, order</td><td>Order challenge. <br>"items" is an array.<br>"order" is the correct order as array of indices.</td></tr>
    </table>
    <div class="modal-faq-examples">
      <b>Examples:</b>
      <pre><code>{
  "type": "code",
  "prompt": "Write a Hello World program.",
  "starter": "print('')",
  "solution": "print('Hello, World!')"
}
{
  "type": "mcq",
  "prompt": "What is Python?",
  "options": ["A snake", "A programming language", "A car"],
  "answer": 1
}
{
  "type": "fill",
  "prompt": "Python is a ____ language.",
  "answer": "programming"
}
{
  "type": "drag",
  "prompt": "Order the steps to print in Python.",
  "items": ["Type print", "Open parenthesis", "Add string", "Close parenthesis"],
  "order": [0,1,2,3]
}
{
  "type": "order",
  "prompt": "Arrange the numbers in ascending order.",
  "items": [3,1,2],
  "order": [1,2,0]
}</code></pre>
    </div>
    <h3>Other Fields</h3>
    <ul>
      <li><b>selectedProfileId</b>: (number) The currently selected profile's ID</li>
      <li><b>adminMode</b>: (boolean) Whether admin mode is enabled</li>
      <li><b>appSettings</b>: (object) App-wide settings (e.g., theme)</li>
    </ul>
    <div style="margin-top:1.2rem;font-size:0.98rem;">
      <b>Tips:</b><br>
      • All IDs must be unique within their type.<br>
      • You can add extra fields for your own extensions.<br>
      • Use the JSON Template tab for a copyable example.
    </div>
  `;

  showModalTabbed({
    title: `Add Full App State`,
    formHtml: `
      <h2>Add Full App State (JSON)</h2>
      <textarea id="bulk-json" rows="16" style="width:100%;font-family:monospace;"></textarea>
      <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button class="admin-btn" id="bulk-add-btn">Add</button>
        <button class="admin-btn" id="bulk-cancel-btn">Cancel</button>
      </div>
    `,
    jsonTemplate,
    onFormMount: () => {
      document.getElementById('bulk-cancel-btn').onclick = closeModal;
      document.getElementById('bulk-add-btn').onclick = () => {
        const val = document.getElementById('bulk-json').value;
        try {
          const arr = JSON.parse(val);
          if (type === 'profile') {
            // If full app state, replace state
            localStorage.setItem('arcanum-app-state', JSON.stringify(arr));
            location.reload();
          }
          closeModal();
          renderDashboardView();
        } catch (e) {
          alert('Invalid JSON: ' + e.message);
        }
      };
    },
    jsonFaq: faqHtml
  });
}

function showAddCourseModal() {
  let courseData = {
    title: '',
    desc: '',
    icon: '📚',
    summary: '',
    tags: [],
    goals: [],
    chapters: []
  };

  const jsonTemplate = JSON.stringify([
    {
      "id": 1,
      "title": "Learn to Code in Python",
      "desc": "Start your journey with Python.",
      "icon": "🐍",
      "summary": "By the end of this course, you will be able to write Python programs and understand basic programming concepts.",
      "tags": ["python", "programming", "beginner"],
      "goals": [
        "Understand Python syntax and basic concepts",
        "Write simple Python programs",
        "Use variables and data types"
      ],
      "chapters": [
        {
          "id": 101,
          "title": "Introduction to Python",
          "desc": "Learn the basics of Python programming.",
          "icon": "📖",
          "summary": "You will learn what Python is and write your first program.",
          "goals": [
            "Understand what Python is",
            "Install Python on your computer",
            "Write a Hello World program"
          ],
          "resources": [
            { "label": "Official Python Docs", "url": "https://docs.python.org/3/" },
            { "label": "Python Tutorial", "url": "https://www.w3schools.com/python/" }
          ],
          "questions": [
            {"question": "What is Python used for?", "answer": "Python is a versatile programming language used for web development, data science, automation, and more."},
            {"question": "How do you install Python?", "answer": "Download from python.org and run the installer, or use a package manager like pip."}
          ],
          "lessons": [
            {
              "id": 1001,
              "title": "What is Python?",
              "content": "# What is Python?\n\nPython is a high-level programming language known for its simplicity and readability.\n\n## Key Features\n- Easy to learn\n- Versatile applications\n- Large community\n- Extensive libraries\n\n## Example\n```python\nprint('Hello, World!')\n```",
              "exercises": [
                {
                  "type": "mcq",
                  "prompt": "What is Python?",
                  "options": ["A snake", "A programming language", "A car", "A book"],
                  "answer": 1
                },
                {
                  "type": "fill",
                  "prompt": "Python is a __________ programming language.",
                  "answer": "high-level"
                },
                {
                  "type": "code",
                  "prompt": "Write a Python program that prints 'Hello, World!'",
                  "starter": "print('')",
                  "solution": "print('Hello, World!')"
                }
              ]
            }
          ]
        }
      ]
    }
  ], null, 2);

  const renderChapterForm = (chapterIndex) => {
    const chapter = courseData.chapters[chapterIndex] || {
      title: '',
      desc: '',
      icon: '📖',
      summary: '',
      goals: [],
      resources: [],
      questions: [],
      lessons: []
    };

    const renderLessonForm = (lessonIndex) => {
      const lesson = chapter.lessons[lessonIndex] || {
        title: '',
        content: '',
        exercises: []
      };

      const renderExerciseForm = (exerciseIndex) => {
        const exercise = lesson.exercises[exerciseIndex] || {
          type: 'mcq',
          prompt: '',
          options: ['', ''],
          answer: 0
        };

        return `
          <div class="exercise-form" style="border: 1px solid #ddd; padding: 1rem; margin: 0.5rem 0; border-radius: 4px;">
            <h4>Exercise ${exerciseIndex + 1}</h4>
            <div style="margin-bottom: 0.5rem;">
              <label>Type:</label>
              <select id="exercise-type-${chapterIndex}-${lessonIndex}-${exerciseIndex}" onchange="updateExerciseType(${chapterIndex}, ${lessonIndex}, ${exerciseIndex}, this.value)">
                <option value="mcq" ${exercise.type === 'mcq' ? 'selected' : ''}>Multiple Choice</option>
                <option value="fill" ${exercise.type === 'fill' ? 'selected' : ''}>Fill-in-the-blank</option>
                <option value="code" ${exercise.type === 'code' ? 'selected' : ''}>Code</option>
              </select>
            </div>
            <div style="margin-bottom: 0.5rem;">
              <label>Prompt:</label>
              <textarea id="exercise-prompt-${chapterIndex}-${lessonIndex}-${exerciseIndex}" rows="2" style="width: 100%;" placeholder="Enter the exercise prompt...">${exercise.prompt}</textarea>
            </div>
            ${exercise.type === 'mcq' ? `
              <div style="margin-bottom: 0.5rem;">
                <label>Options:</label>
                ${exercise.options.map((option, optIndex) => `
                  <div style="margin: 0.25rem 0;">
                    <input type="text" id="exercise-option-${chapterIndex}-${lessonIndex}-${exerciseIndex}-${optIndex}" value="${option}" placeholder="Option ${optIndex + 1}" style="width: 80%;">
                    <input type="radio" name="correct-${chapterIndex}-${lessonIndex}-${exerciseIndex}" value="${optIndex}" ${exercise.answer === optIndex ? 'checked' : ''} style="margin-left: 0.5rem;">
                    <label>Correct</label>
                  </div>
                `).join('')}
                <button type="button" onclick="addExerciseOption(${chapterIndex}, ${lessonIndex}, ${exerciseIndex})" style="margin-top: 0.5rem;">+ Add Option</button>
              </div>
            ` : exercise.type === 'fill' ? `
              <div style="margin-bottom: 0.5rem;">
                <label>Answer:</label>
                <input type="text" id="exercise-answer-${chapterIndex}-${lessonIndex}-${exerciseIndex}" value="${exercise.answer || ''}" style="width: 100%;" placeholder="Correct answer">
              </div>
            ` : exercise.type === 'code' ? `
              <div style="margin-bottom: 0.5rem;">
                <label>Starter Code:</label>
                <textarea id="exercise-starter-${chapterIndex}-${lessonIndex}-${exerciseIndex}" rows="3" style="width: 100%; font-family: monospace;" placeholder="Starter code (optional)">${exercise.starter || ''}</textarea>
              </div>
              <div style="margin-bottom: 0.5rem;">
                <label>Solution:</label>
                <textarea id="exercise-solution-${chapterIndex}-${lessonIndex}-${exerciseIndex}" rows="3" style="width: 100%; font-family: monospace;" placeholder="Correct solution">${exercise.solution || ''}</textarea>
              </div>
            ` : ''}
            <div style="margin-top: 1rem;">
              <button type="button" onclick="removeExercise(${chapterIndex}, ${lessonIndex}, ${exerciseIndex})" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 3px;">Remove Exercise</button>
            </div>
          </div>
        `;
      };

      return `
        <div class="lesson-form" style="border: 1px solid #ccc; padding: 1rem; margin: 0.5rem 0; border-radius: 4px;">
          <h3>Lesson ${lessonIndex + 1}</h3>
          <div style="margin-bottom: 0.5rem;">
            <label>Title:</label>
            <input type="text" id="lesson-title-${chapterIndex}-${lessonIndex}" value="${lesson.title}" style="width: 100%;" placeholder="Lesson title">
          </div>
          <div style="margin-bottom: 0.5rem;">
            <label>Content (Markdown):</label>
            <textarea id="lesson-content-${chapterIndex}-${lessonIndex}" rows="6" style="width: 100%; font-family: monospace;" placeholder="Lesson content in Markdown format...">${lesson.content}</textarea>
          </div>
          <div style="margin-bottom: 1rem;">
            <h4>Exercises</h4>
            <div id="exercises-container-${chapterIndex}-${lessonIndex}">
              ${lesson.exercises.map((_, exIndex) => renderExerciseForm(exIndex)).join('')}
            </div>
            <button type="button" onclick="addExercise(${chapterIndex}, ${lessonIndex})" style="margin-top: 0.5rem;">+ Add Exercise</button>
          </div>
          <div style="margin-top: 1rem;">
            <button type="button" onclick="removeLesson(${chapterIndex}, ${lessonIndex})" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 3px;">Remove Lesson</button>
          </div>
        </div>
      `;
    };

    return `
      <div class="chapter-form" style="border: 1px solid #bbb; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
        <h2>Chapter ${chapterIndex + 1}</h2>
        <div style="margin-bottom: 0.5rem;">
          <label>Title:</label>
          <input type="text" id="chapter-title-${chapterIndex}" value="${chapter.title}" style="width: 100%;" placeholder="Chapter title">
        </div>
        <div style="margin-bottom: 0.5rem;">
          <label>Description:</label>
          <textarea id="chapter-desc-${chapterIndex}" rows="2" style="width: 100%;" placeholder="Chapter description">${chapter.desc}</textarea>
        </div>
        <div style="margin-bottom: 0.5rem;">
          <label>Icon:</label>
          <input type="text" id="chapter-icon-${chapterIndex}" value="${chapter.icon}" style="width: 100px;" placeholder="📖">
        </div>
        <div style="margin-bottom: 0.5rem;">
          <label>Summary:</label>
          <textarea id="chapter-summary-${chapterIndex}" rows="2" style="width: 100%;" placeholder="What students will learn in this chapter">${chapter.summary}</textarea>
        </div>
        <div style="margin-bottom: 0.5rem;">
          <label>Goals (one per line):</label>
          <textarea id="chapter-goals-${chapterIndex}" rows="3" style="width: 100%;" placeholder="Learning goal 1&#10;Learning goal 2&#10;Learning goal 3">${chapter.goals.join('\n')}</textarea>
        </div>
        <div style="margin-bottom: 0.5rem;">
          <label>Resources (JSON format):</label>
          <textarea id="chapter-resources-${chapterIndex}" rows="3" style="width: 100%; font-family: monospace;" placeholder='[{"label": "Resource Name", "url": "https://example.com"}]'>${JSON.stringify(chapter.resources, null, 2)}</textarea>
        </div>
        <div style="margin-bottom: 0.5rem;">
          <label>Questions (JSON format):</label>
          <textarea id="chapter-questions-${chapterIndex}" rows="3" style="width: 100%; font-family: monospace;" placeholder='[{"question": "Question text?", "answer": "Answer text"}]'>${JSON.stringify(chapter.questions, null, 2)}</textarea>
        </div>
        <div style="margin-bottom: 1rem;">
          <h3>Lessons</h3>
          <div id="lessons-container-${chapterIndex}">
            ${chapter.lessons.map((_, lessonIndex) => renderLessonForm(lessonIndex)).join('')}
          </div>
          <button type="button" onclick="addLesson(${chapterIndex})" style="margin-top: 0.5rem;">+ Add Lesson</button>
        </div>
        <div style="margin-top: 1rem;">
          <button type="button" onclick="removeChapter(${chapterIndex})" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 3px;">Remove Chapter</button>
        </div>
      </div>
    `;
  };

  const formHtml = `
    <div style="max-height: 70vh; overflow-y: auto;">
      <h2>Course Information</h2>
      <div style="margin-bottom: 0.5rem;">
        <label>Title:</label>
        <input type="text" id="course-title" value="${courseData.title}" style="width: 100%;" placeholder="Course title">
      </div>
      <div style="margin-bottom: 0.5rem;">
        <label>Description:</label>
        <textarea id="course-desc" rows="3" style="width: 100%;" placeholder="Course description">${courseData.desc}</textarea>
      </div>
      <div style="margin-bottom: 0.5rem;">
        <label>Icon:</label>
        <input type="text" id="course-icon" value="${courseData.icon}" style="width: 100px;" placeholder="📚">
      </div>
      <div style="margin-bottom: 0.5rem;">
        <label>Summary:</label>
        <textarea id="course-summary" rows="2" style="width: 100%;" placeholder="What students will learn by the end of this course">${courseData.summary}</textarea>
      </div>
      <div style="margin-bottom: 0.5rem;">
        <label>Tags (comma-separated):</label>
        <input type="text" id="course-tags" value="${courseData.tags.join(', ')}" style="width: 100%;" placeholder="tag1, tag2, tag3">
      </div>
      <div style="margin-bottom: 0.5rem;">
        <label>Goals (one per line):</label>
        <textarea id="course-goals" rows="3" style="width: 100%;" placeholder="Learning goal 1&#10;Learning goal 2&#10;Learning goal 3">${courseData.goals.join('\n')}</textarea>
      </div>
      
      <h2>Chapters</h2>
      <div id="chapters-container">
        ${courseData.chapters.map((_, chapterIndex) => renderChapterForm(chapterIndex)).join('')}
      </div>
      <button type="button" onclick="addChapter()" style="margin-top: 1rem;">+ Add Chapter</button>
    </div>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-course-form-btn">Save Course</button>
      <button class="admin-btn" id="cancel-course-btn">Cancel</button>
    </div>
  `;

  const jsonEditHtml = `
    <h2>JSON Editor</h2>
    <div style="margin-bottom: 1rem;">
      <label>Upload JSON file:</label>
      <input type="file" id="json-file-upload" accept=".json" style="margin-left: 0.5rem;">
    </div>
    <textarea id="course-json" rows="20" style="width:100%;font-family:monospace;" placeholder="Paste your course JSON here..."></textarea>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-course-json-btn">Save Course</button>
      <button class="admin-btn" id="cancel-course-json-btn">Cancel</button>
    </div>
  `;

  showModalTabbed({
    title: 'Add Course',
    formHtml,
    jsonEditHtml,
    jsonTemplate,
    onFormMount: () => {
      // Add global functions for dynamic form manipulation
      window.addChapter = () => {
        courseData.chapters.push({
          title: '',
          desc: '',
          icon: '📖',
          summary: '',
          goals: [],
          resources: [],
          questions: [],
          lessons: []
        });
        document.getElementById('chapters-container').innerHTML = courseData.chapters.map((_, i) => renderChapterForm(i)).join('');
      };

      window.removeChapter = (chapterIndex) => {
        courseData.chapters.splice(chapterIndex, 1);
        document.getElementById('chapters-container').innerHTML = courseData.chapters.map((_, i) => renderChapterForm(i)).join('');
      };

      window.addLesson = (chapterIndex) => {
        if (!courseData.chapters[chapterIndex]) courseData.chapters[chapterIndex] = { lessons: [] };
        courseData.chapters[chapterIndex].lessons.push({
          title: '',
          content: '',
          exercises: []
        });
        document.getElementById(`lessons-container-${chapterIndex}`).innerHTML = courseData.chapters[chapterIndex].lessons.map((_, i) => renderLessonForm(i)).join('');
      };

      window.removeLesson = (chapterIndex, lessonIndex) => {
        courseData.chapters[chapterIndex].lessons.splice(lessonIndex, 1);
        document.getElementById(`lessons-container-${chapterIndex}`).innerHTML = courseData.chapters[chapterIndex].lessons.map((_, i) => renderLessonForm(i)).join('');
      };

      window.addExercise = (chapterIndex, lessonIndex) => {
        if (!courseData.chapters[chapterIndex]) courseData.chapters[chapterIndex] = { lessons: [] };
        if (!courseData.chapters[chapterIndex].lessons[lessonIndex]) courseData.chapters[chapterIndex].lessons[lessonIndex] = { exercises: [] };
        courseData.chapters[chapterIndex].lessons[lessonIndex].exercises.push({
          type: 'mcq',
          prompt: '',
          options: ['', ''],
          answer: 0
        });
        document.getElementById(`exercises-container-${chapterIndex}-${lessonIndex}`).innerHTML = courseData.chapters[chapterIndex].lessons[lessonIndex].exercises.map((_, i) => renderExerciseForm(i)).join('');
      };

      window.removeExercise = (chapterIndex, lessonIndex, exerciseIndex) => {
        courseData.chapters[chapterIndex].lessons[lessonIndex].exercises.splice(exerciseIndex, 1);
        document.getElementById(`exercises-container-${chapterIndex}-${lessonIndex}`).innerHTML = courseData.chapters[chapterIndex].lessons[lessonIndex].exercises.map((_, i) => renderExerciseForm(i)).join('');
      };

      window.updateExerciseType = (chapterIndex, lessonIndex, exerciseIndex, type) => {
        const exercise = courseData.chapters[chapterIndex].lessons[lessonIndex].exercises[exerciseIndex];
        exercise.type = type;
        if (type === 'mcq' && !exercise.options) exercise.options = ['', ''];
        if (type === 'mcq' && exercise.answer >= exercise.options.length) exercise.answer = 0;
        document.getElementById(`exercises-container-${chapterIndex}-${lessonIndex}`).innerHTML = courseData.chapters[chapterIndex].lessons[lessonIndex].exercises.map((_, i) => renderExerciseForm(i)).join('');
      };

      window.addExerciseOption = (chapterIndex, lessonIndex, exerciseIndex) => {
        courseData.chapters[chapterIndex].lessons[lessonIndex].exercises[exerciseIndex].options.push('');
        document.getElementById(`exercises-container-${chapterIndex}-${lessonIndex}`).innerHTML = courseData.chapters[chapterIndex].lessons[lessonIndex].exercises.map((_, i) => renderExerciseForm(i)).join('');
      };

      // Add save button handlers
      const saveBtn = document.getElementById('save-course-form-btn');
      if (saveBtn) {
        saveBtn.onclick = () => {
          console.log('Save button clicked!');
          // Collect form data
          courseData.title = document.getElementById('course-title').value;
          courseData.desc = document.getElementById('course-desc').value;
          courseData.icon = document.getElementById('course-icon').value;
          courseData.summary = document.getElementById('course-summary').value;
          courseData.tags = document.getElementById('course-tags').value.split(',').map(t => t.trim()).filter(t => t);
          courseData.goals = document.getElementById('course-goals').value.split('\n').map(g => g.trim()).filter(g => g);

        // Collect chapters data
        courseData.chapters = courseData.chapters.map((chapter, chapterIndex) => {
          const newChapter = {
            id: Date.now() + chapterIndex * 1000,
            title: document.getElementById(`chapter-title-${chapterIndex}`).value,
            desc: document.getElementById(`chapter-desc-${chapterIndex}`).value,
            icon: document.getElementById(`chapter-icon-${chapterIndex}`).value,
            summary: document.getElementById(`chapter-summary-${chapterIndex}`).value,
            goals: document.getElementById(`chapter-goals-${chapterIndex}`).value.split('\n').map(g => g.trim()).filter(g => g),
            resources: [],
            questions: [],
            lessons: []
          };

          try {
            newChapter.resources = JSON.parse(document.getElementById(`chapter-resources-${chapterIndex}`).value);
          } catch (e) {
            newChapter.resources = [];
          }

          try {
            newChapter.questions = JSON.parse(document.getElementById(`chapter-questions-${chapterIndex}`).value);
          } catch (e) {
            newChapter.questions = [];
          }

          // Collect lessons data
          newChapter.lessons = chapter.lessons.map((lesson, lessonIndex) => {
            const newLesson = {
              id: Date.now() + chapterIndex * 1000 + lessonIndex * 100,
              title: document.getElementById(`lesson-title-${chapterIndex}-${lessonIndex}`).value,
              content: document.getElementById(`lesson-content-${chapterIndex}-${lessonIndex}`).value,
              exercises: []
            };

            // Collect exercises data
            newLesson.exercises = lesson.exercises.map((exercise, exerciseIndex) => {
              const newExercise = {
                type: document.getElementById(`exercise-type-${chapterIndex}-${lessonIndex}-${exerciseIndex}`).value,
                prompt: document.getElementById(`exercise-prompt-${chapterIndex}-${lessonIndex}-${exerciseIndex}`).value
              };

              if (newExercise.type === 'mcq') {
                newExercise.options = [];
                newExercise.answer = 0;
                for (let i = 0; i < 10; i++) {
                  const optionEl = document.getElementById(`exercise-option-${chapterIndex}-${lessonIndex}-${exerciseIndex}-${i}`);
                  if (optionEl) {
                    newExercise.options.push(optionEl.value);
                    if (optionEl.nextElementSibling.checked) {
                      newExercise.answer = i;
                    }
                  }
                }
                newExercise.options = newExercise.options.filter(opt => opt.trim());
              } else if (newExercise.type === 'fill') {
                newExercise.answer = document.getElementById(`exercise-answer-${chapterIndex}-${lessonIndex}-${exerciseIndex}`).value;
              } else if (newExercise.type === 'code') {
                newExercise.starter = document.getElementById(`exercise-starter-${chapterIndex}-${lessonIndex}-${exerciseIndex}`).value;
                newExercise.solution = document.getElementById(`exercise-solution-${chapterIndex}-${lessonIndex}-${exerciseIndex}`).value;
              }

              return newExercise;
            });

            return newLesson;
          });

          return newChapter;
        });

        // Add the course
        const courseToAdd = {
          id: Date.now(),
          ...courseData
        };

        state.addCourses([courseToAdd]);
        closeModal();
        renderDashboardView();
      };
      } else {
        console.error('Save button not found!');
      }

      const deleteBtn = document.getElementById('delete-course-btn');
      if (deleteBtn) {
        deleteBtn.onclick = () => {
          closeModal();
        };
      }

      const cancelBtn = document.getElementById('cancel-course-btn');
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          closeModal();
        };
      }
    },
    onJsonMount: () => {
      // Handle JSON file upload
      document.getElementById('json-file-upload').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const jsonData = JSON.parse(e.target.result);
              document.getElementById('course-json').value = JSON.stringify(jsonData, null, 2);
            } catch (error) {
              alert('Invalid JSON file: ' + error.message);
            }
          };
          reader.readAsText(file);
        }
      };

      // Handle JSON save
      document.getElementById('save-course-json-btn').onclick = () => {
        const jsonValue = document.getElementById('course-json').value;
        try {
          const courses = JSON.parse(jsonValue);
          if (Array.isArray(courses)) {
            state.addCourses(courses);
          } else {
            state.addCourses([courses]);
          }
          closeModal();
          renderDashboardView();
        } catch (e) {
          alert('Invalid JSON: ' + e.message);
        }
      };

      document.getElementById('cancel-course-json-btn').onclick = () => {
        closeModal();
      };
    }
  });
}

function showEditProfileModal(profile) {
  const jsonTemplate = `{
  "name": "${profile.name}",
  "avatar": "${profile.avatar}"
}`;
  let formData = { name: profile.name, avatar: profile.avatar };
  let jsonData = JSON.stringify(formData, null, 2);
  const formHtml = `
    <h2>Edit Profile</h2>
    <label>Name: <input id="edit-profile-name" value="${formData.name}"></label><br>
    <label>Avatar URL: <input id="edit-profile-avatar" value="${formData.avatar}"></label><br>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-profile-form-btn">Save</button>
      <button class="admin-btn" id="delete-profile-btn">Delete</button>
      <button class="admin-btn" id="cancel-profile-btn">Cancel</button>
    </div>
  `;
  const jsonEditHtml = `
    <h2>Edit Profile (JSON)</h2>
    <textarea id="edit-profile-json" rows="8" style="width:100%;font-family:monospace;">${jsonData}</textarea>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-profile-json-btn">Save</button>
      <button class="admin-btn" id="cancel-profile-json-btn">Cancel</button>
    </div>
  `;
  showModalTabbed({
    title: 'Edit Profile',
    formHtml,
    jsonEditHtml,
    jsonTemplate,
    onFormMount: () => {
      document.getElementById('save-profile-form-btn').onclick = () => {
        const name = document.getElementById('edit-profile-name').value;
        const avatar = document.getElementById('edit-profile-avatar').value;
        state.editProfile(profile.id, { name, avatar });
        closeModal();
        renderDashboardView();
      };
      document.getElementById('delete-profile-btn').onclick = () => {
        if (confirm('Delete this profile?')) {
          state.deleteProfile(profile.id);
          closeModal();
          renderProfileSelection();
        }
      };
      document.getElementById('cancel-profile-btn').onclick = closeModal;
    },
    onJsonMount: () => {
      document.getElementById('save-profile-json-btn').onclick = () => {
        try {
          const data = JSON.parse(document.getElementById('edit-profile-json').value);
          state.editProfile(profile.id, data);
          closeModal();
          renderDashboardView();
        } catch (e) {
          alert('Invalid JSON: ' + e.message);
        }
      };
      document.getElementById('cancel-profile-json-btn').onclick = closeModal;
    }
  });
}

function showEditCourseModal(course) {
  const jsonTemplate = `{
  "title": "${course.title}",
  "desc": "${course.desc}",
  "icon": "${course.icon}"
}`;
  const formHtml = `
    <h2>Edit Course</h2>
    <label>Title: <input id="edit-course-title" value="${course.title}"></label><br>
    <label>Description: <input id="edit-course-desc" value="${course.desc}"></label><br>
    <label>Icon: <input id="edit-course-icon" value="${course.icon}"></label><br>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-course-form-btn">Save</button>
      <button class="admin-btn" id="delete-course-btn">Delete</button>
      <button class="admin-btn" id="cancel-course-btn">Cancel</button>
    </div>
  `;
  const jsonEditHtml = `
    <h2>Edit Course (JSON)</h2>
    <textarea id="edit-course-json" rows="8" style="width:100%;font-family:monospace;">${JSON.stringify({ title: course.title, desc: course.desc, icon: course.icon }, null, 2)}</textarea>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-course-json-btn">Save</button>
      <button class="admin-btn" id="cancel-course-json-btn">Cancel</button>
    </div>
  `;
  showModalTabbed({
    title: 'Edit Course',
    formHtml,
    jsonEditHtml,
    jsonTemplate,
    onFormMount: () => {
      document.getElementById('save-course-form-btn').onclick = () => {
        state.editCourse(course.id, {
          title: document.getElementById('edit-course-title').value,
          desc: document.getElementById('edit-course-desc').value,
          icon: document.getElementById('edit-course-icon').value
        });
        closeModal();
        renderDashboardView();
      };
      document.getElementById('delete-course-btn').onclick = () => {
        if (confirm('Delete this course?')) {
          state.deleteCourse(course.id);
          closeModal();
          renderDashboardView();
        }
      };
      document.getElementById('cancel-course-btn').onclick = closeModal;
    },
    onJsonMount: () => {
      document.getElementById('save-course-json-btn').onclick = () => {
        try {
          const data = JSON.parse(document.getElementById('edit-course-json').value);
          state.editCourse(course.id, data);
          closeModal();
          renderDashboardView();
        } catch (e) {
          alert('Invalid JSON: ' + e.message);
        }
      };
      document.getElementById('cancel-course-json-btn').onclick = closeModal;
    }
  });
}

function showEditChapterModal(courseId, chapter) {
  const jsonTemplate = `{
  "title": "${chapter.title}",
  "desc": "${chapter.desc}",
  "icon": "${chapter.icon}"
}`;
  const formHtml = `
    <h2>Edit Chapter</h2>
    <label>Title: <input id="edit-chapter-title" value="${chapter.title}"></label><br>
    <label>Description: <input id="edit-chapter-desc" value="${chapter.desc}"></label><br>
    <label>Icon: <input id="edit-chapter-icon" value="${chapter.icon}"></label><br>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-chapter-form-btn">Save</button>
      <button class="admin-btn" id="delete-chapter-btn">Delete</button>
      <button class="admin-btn" id="cancel-chapter-btn">Cancel</button>
    </div>
  `;
  const jsonEditHtml = `
    <h2>Edit Chapter (JSON)</h2>
    <textarea id="edit-chapter-json" rows="8" style="width:100%;font-family:monospace;">${JSON.stringify(chapter, null, 2)}</textarea>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-chapter-json-btn">Save</button>
      <button class="admin-btn" id="cancel-chapter-json-btn">Cancel</button>
    </div>
  `;
  showModalTabbed({
    title: 'Edit Chapter',
    formHtml,
    jsonEditHtml,
    jsonTemplate,
    onFormMount: () => {
      document.getElementById('save-chapter-form-btn').onclick = () => {
        chapter.title = document.getElementById('edit-chapter-title').value;
        chapter.desc = document.getElementById('edit-chapter-desc').value;
        chapter.icon = document.getElementById('edit-chapter-icon').value;
        state.editCourse(courseId, { chapters: state.getCourses().find(c => c.id == courseId).chapters });
        closeModal();
        renderCourseWideChaptersView(state.getCourses().find(c => c.id == courseId), state.getCourses().find(c => c.id == courseId).chapters, chapter.id);
      };
      document.getElementById('delete-chapter-btn').onclick = () => {
        const course = state.getCourses().find(c => c.id == courseId);
        if (confirm('Delete this chapter?')) {
          const idx = course.chapters.findIndex(ch => ch.id === chapter.id);
          if (idx !== -1) {
            course.chapters.splice(idx, 1);
            state.editCourse(courseId, { chapters: course.chapters });
            closeModal();
            renderCourseWideChaptersView(course, course.chapters, course.chapters[0]?.id);
          }
        }
      };
      document.getElementById('cancel-chapter-btn').onclick = closeModal;
    },
    onJsonMount: () => {
      document.getElementById('save-chapter-json-btn').onclick = () => {
        try {
          const data = JSON.parse(document.getElementById('edit-chapter-json').value);
          Object.assign(chapter, data);
          state.editCourse(courseId, { chapters: state.getCourses().find(c => c.id == courseId).chapters });
          closeModal();
          renderCourseWideChaptersView(state.getCourses().find(c => c.id == courseId), state.getCourses().find(c => c.id == courseId).chapters, chapter.id);
        } catch (e) {
          alert('Invalid JSON: ' + e.message);
        }
      };
      document.getElementById('cancel-chapter-json-btn').onclick = closeModal;
    }
  });
}

function showEditLessonModal(courseId, chapterId, lessonId) {
  const course = state.getCourses().find(c => c.id == courseId);
  if (!course) return renderDashboardView();
  const chapter = course.chapters.find(ch => ch.id == chapterId);
  if (!chapter) return renderCourseWideChaptersView(course, course.chapters, chapterId);
  const lesson = chapter.lessons.find(l => l.id == lessonId);
  if (!lesson) return renderCourseWideChaptersView(course, course.chapters, chapterId);
  const jsonTemplate = `{
  "id": 1001,
  "title": "Sample Lesson",
  "content": "# Lesson Content\nMarkdown supported.",
  "exercises": [
    {
      "type": "mcq",
      "prompt": "What is 2+2?",
      "options": ["3", "4", "5"],
      "answer": 1
    },
    {
      "type": "fill",
      "prompt": "Fill in the blank: The sky is ___.",
      "answer": "blue"
    },
    {
      "type": "code",
      "prompt": "Write a Hello World program.",
      "starter": "print('')",
      "solution": "print('Hello, World!')"
    },
    {
      "type": "drag",
      "prompt": "Order the steps to print in Python.",
      "items": ["Type print", "Open parenthesis", "Add string", "Close parenthesis"],
      "order": [0,1,2,3]
    },
    {
      "type": "order",
      "prompt": "Arrange the numbers in ascending order.",
      "items": [3,1,2],
      "order": [1,2,0]
    }
  ]
}

// Fields:
// id: number (unique lesson ID)
// title: string (lesson name)
// content: string (Markdown/HTML)
// exercises: array of exercises
//
// Exercise types:
// - mcq: { type, prompt, options, answer (index) }
// - fill: { type, prompt, answer }
// - code: { type, prompt, starter, solution }
// - drag/order: { type, prompt, items, order (array of indices) }
`;
  // --- Dynamic Exercise Form Builder ---
  function renderExerciseForm(ex, idx) {
    const type = ex.type || 'mcq';
    return `
      <div class="exercise-form-card" data-ex-idx="${idx}" style="border:1px solid #bfa46f;padding:1rem;margin-bottom:1.2rem;background:var(--background-secondary);border-radius:8px;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <label>Type:
            <select class="exercise-type" data-idx="${idx}" title="Choose the exercise type">
              <option value="mcq" ${type==='mcq'?'selected':''}>MCQ</option>
              <option value="fill" ${type==='fill'?'selected':''}>Fill</option>
              <option value="code" ${type==='code'?'selected':''}>Code</option>
              <option value="drag" ${type==='drag'?'selected':''}>Drag</option>
              <option value="order" ${type==='order'?'selected':''}>Order</option>
            </select>
          </label>
          <button class="admin-btn remove-ex-btn" data-idx="${idx}" style="margin-left:auto;">Remove</button>
        </div>
        <label>Prompt:<br><textarea class="exercise-prompt" data-idx="${idx}" rows="2" style="width:100%;font-family:monospace;" placeholder="e.g. What is 2+2?">${ex.prompt||''}</textarea></label><br>
        ${type==='mcq' ? `
          <label>Options (comma separated):<br><input class="exercise-options" data-idx="${idx}" value="${(ex.options||[]).join(', ')}" style="width:100%" placeholder="e.g. Red, Blue, Green"></label><br>
          <label>Answer (index): <input class="exercise-answer" data-idx="${idx}" type="number" min="0" value="${typeof ex.answer==='number'?ex.answer:''}" placeholder="e.g. 1"></label><br>
        ` : ''}
        ${type==='fill' ? `
          <label>Answer: <input class="exercise-answer" data-idx="${idx}" value="${ex.answer||''}" style="width:100%" placeholder="e.g. すみません"></label><br>
        ` : ''}
        ${type==='code' ? `
          <label>Starter Code:<br><textarea class="exercise-starter" data-idx="${idx}" rows="2" style="width:100%;font-family:monospace;" placeholder="e.g. print('')">${ex.starter||''}</textarea></label><br>
          <label>Solution:<br><textarea class="exercise-solution" data-idx="${idx}" rows="2" style="width:100%;font-family:monospace;" placeholder="e.g. print('Hello, World!')">${ex.solution||''}</textarea></label><br>
        ` : ''}
        ${(type==='drag'||type==='order') ? `
          <label>Items (comma separated):<br><input class="exercise-items" data-idx="${idx}" value="${(ex.items||[]).join(', ')}" style="width:100%" placeholder="e.g. Step 1, Step 2, Step 3"></label><br>
          <label>Order (comma separated indices):<br><input class="exercise-order" data-idx="${idx}" value="${(ex.order||[]).join(', ')}" style="width:100%" placeholder="e.g. 2, 0, 1"></label><br>
        ` : ''}
      </div>
    `;
  }
  // --- END Dynamic Exercise Form Builder ---

  const exercisesArr = Array.isArray(lesson.exercises) ? lesson.exercises.map(e => ({...e})) : [];
  let exercisesHtml = `<div id="exercises-list">${exercisesArr.map(renderExerciseForm).join('')}</div>
    <button class="admin-btn" id="add-exercise-btn" style="margin-bottom:1.2rem;">+ Add Exercise</button>`;

  const formHtml = `
    <h2>Edit Lesson</h2>
    <label>Title: <input id="edit-lesson-title" value="${lesson.title}"></label><br>
    <label>Content (Markdown):<br><textarea id="edit-lesson-content" rows="8" style="width:100%;font-family:monospace;">${lesson.content || ''}</textarea></label><br>
    <div style="margin:1.2rem 0 0.5rem 0;font-weight:bold;">Exercises:</div>
    <div id="lesson-exercise-forms">${exercisesHtml}</div>
    <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-lesson-btn">Save</button>
      <button class="admin-btn" id="cancel-lesson-btn">Cancel</button>
    </div>
  `;
  const jsonEditHtml = `
    <h2>Edit Lesson (JSON)</h2>
    <textarea id="edit-lesson-json" rows="12" style="width:100%;font-family:monospace;">${JSON.stringify(lesson, null, 2)}</textarea>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-lesson-json-btn">Save</button>
      <button class="admin-btn" id="cancel-lesson-json-btn">Cancel</button>
    </div>
  `;
  showModalTabbed({
    title: 'Edit Lesson',
    formHtml,
    jsonEditHtml,
    jsonTemplate,
    onFormMount: () => {
      // --- Dynamic Exercise Form Logic ---
      let exercises = Array.isArray(lesson.exercises) ? lesson.exercises.map(e => ({...e})) : [];
      const renderAllExercises = () => {
        document.getElementById('lesson-exercise-forms').innerHTML = `<div id="exercises-list">${exercises.map(renderExerciseForm).join('')}</div>
          <button class="admin-btn" id="add-exercise-btn" style="margin-bottom:1.2rem;">+ Add Exercise</button>`;
        attachExerciseHandlers();
      };
      function attachExerciseHandlers() {
        // Remove
        document.querySelectorAll('.remove-ex-btn').forEach(btn => {
          btn.onclick = () => {
            const idx = Number(btn.getAttribute('data-idx'));
            exercises.splice(idx, 1);
            renderAllExercises();
          };
        });
        // Type change
        document.querySelectorAll('.exercise-type').forEach(sel => {
          sel.onchange = (e) => {
            const idx = Number(sel.getAttribute('data-idx'));
            exercises[idx].type = sel.value;
            // Reset fields for new type
            if (sel.value === 'mcq') { exercises[idx].options = ['','']; exercises[idx].answer = 0; }
            if (sel.value === 'fill') { exercises[idx].answer = ''; }
            if (sel.value === 'code') { exercises[idx].starter = ''; exercises[idx].solution = ''; }
            if (sel.value === 'drag' || sel.value === 'order') { exercises[idx].items = ['','']; exercises[idx].order = [0,1]; }
            renderAllExercises();
          };
        });
      }
      // Add Exercise
      document.getElementById('add-exercise-btn').onclick = () => {
        exercises.push({ type: 'mcq', prompt: '', options: ['',''], answer: 0 });
        renderAllExercises();
      };
      attachExerciseHandlers();
      // Save
      document.getElementById('save-lesson-btn').onclick = () => {
        lesson.title = document.getElementById('edit-lesson-title').value;
        lesson.content = document.getElementById('edit-lesson-content').value;
        // Gather exercises
        const newExercises = [];
        document.querySelectorAll('.exercise-form-card').forEach((card, idx) => {
          const type = card.querySelector('.exercise-type').value;
          const prompt = card.querySelector('.exercise-prompt').value;
          let ex = { type, prompt };
          if (type === 'mcq') {
            ex.options = card.querySelector('.exercise-options').value.split(',').map(s=>s.trim());
            ex.answer = Number(card.querySelector('.exercise-answer').value);
          } else if (type === 'fill') {
            ex.answer = card.querySelector('.exercise-answer').value;
          } else if (type === 'code') {
            ex.starter = card.querySelector('.exercise-starter').value;
            ex.solution = card.querySelector('.exercise-solution').value;
          } else if (type === 'drag' || type === 'order') {
            ex.items = card.querySelector('.exercise-items').value.split(',').map(s=>s.trim());
            ex.order = card.querySelector('.exercise-order').value.split(',').map(s=>Number(s.trim()));
          }
          newExercises.push(ex);
        });
        lesson.exercises = newExercises;
        state.editCourse(course.id, { chapters: course.chapters });
        closeModal();
        renderLessonView(courseId, chapterId, lesson.id, 0);
      };
      document.getElementById('cancel-lesson-btn').onclick = closeModal;
      // --- END Dynamic Exercise Form Logic ---
    },
    onJsonMount: () => {
      document.getElementById('save-lesson-json-btn').onclick = () => {
        try {
          const data = JSON.parse(document.getElementById('edit-lesson-json').value);
          Object.assign(lesson, data);
          state.editCourse(course.id, { chapters: course.chapters });
          closeModal();
          renderLessonView(courseId, chapterId, lesson.id, 0);
        } catch (e) {
          alert('Invalid JSON: ' + e.message);
        }
      };
      document.getElementById('cancel-lesson-json-btn').onclick = closeModal;
    }
  });
}

function showEditExerciseModal(courseId, chapterId, lessonId, exerciseId) {
  const course = state.getCourses().find(c => c.id == courseId);
  if (!course) return renderDashboardView();
  const chapter = course.chapters.find(ch => ch.id == chapterId);
  if (!chapter) return renderCourseWideChaptersView(course, course.chapters, chapterId);
  const lesson = chapter.lessons.find(l => l.id == lessonId);
  if (!lesson) return renderCourseWideChaptersView(course, course.chapters, chapterId);
  const exercise = lesson.exercises.find(e => e.id == exerciseId);
  if (!exercise) return renderCourseWideChaptersView(course, course.chapters, chapterId);
  const jsonTemplate = `{
  "type": "${exercise.type}",
  "prompt": "${exercise.prompt}",
  "starter": "${exercise.starter}",
  "solution": "${exercise.solution}",
  "options": ${JSON.stringify(exercise.options || [])}
}`;
  const formHtml = `
    <h2>Edit Exercise</h2>
    <label>Type: <input id="edit-exercise-type" value="${exercise.type}"></label><br>
    <label>Prompt: <textarea id="edit-exercise-prompt" rows="4" style="width:100%;font-family:monospace;">${exercise.prompt}</textarea></label><br>
    <label>Starter Code: <textarea id="edit-exercise-starter" rows="4" style="width:100%;font-family:monospace;">${exercise.starter}</textarea></label><br>
    <label>Solution: <textarea id="edit-exercise-solution" rows="4" style="width:100%;font-family:monospace;">${exercise.solution}</textarea></label><br>
    <label>Options (JSON):<br><textarea id="edit-exercise-options" rows="4" style="width:100%;font-family:monospace;">${JSON.stringify(exercise.options || [])}</textarea></label>
    <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-exercise-btn">Save</button>
      <button class="admin-btn" id="cancel-exercise-btn">Cancel</button>
    </div>
  `;
  const jsonEditHtml = `
    <h2>Edit Exercise (JSON)</h2>
    <textarea id="edit-exercise-json" rows="8" style="width:100%;font-family:monospace;">${JSON.stringify(exercise, null, 2)}</textarea>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="save-exercise-json-btn">Save</button>
      <button class="admin-btn" id="cancel-exercise-json-btn">Cancel</button>
    </div>
  `;
  showModalTabbed({
    title: 'Edit Exercise',
    formHtml,
    jsonEditHtml,
    jsonTemplate,
    onFormMount: () => {
      document.getElementById('save-exercise-btn').onclick = () => {
        exercise.type = document.getElementById('edit-exercise-type').value;
        exercise.prompt = document.getElementById('edit-exercise-prompt').value;
        exercise.starter = document.getElementById('edit-exercise-starter').value;
        exercise.solution = document.getElementById('edit-exercise-solution').value;
        try {
          exercise.options = JSON.parse(document.getElementById('edit-exercise-options').value);
        } catch (e) {
          alert('Invalid options JSON: ' + e.message);
          return;
        }
        state.editCourse(course.id, { chapters: course.chapters });
        closeModal();
        renderLessonView(courseId, chapterId, lessonId, 0);
      };
      document.getElementById('cancel-exercise-btn').onclick = closeModal;
    },
    onJsonMount: () => {
      document.getElementById('save-exercise-json-btn').onclick = () => {
        try {
          const data = JSON.parse(document.getElementById('edit-exercise-json').value);
          Object.assign(exercise, data);
          state.editCourse(course.id, { chapters: course.chapters });
          closeModal();
          renderLessonView(courseId, chapterId, lessonId, 0);
        } catch (e) {
          alert('Invalid JSON: ' + e.message);
        }
      };
      document.getElementById('cancel-exercise-json-btn').onclick = closeModal;
    }
  });
}

function renderProfileScreen() {
  const root = document.getElementById('app-root');
  const profile = state.getSelectedProfile();
  const admin = state.isAdminMode();
  const courses = state.getCourses();
  // Demo logs/metrics (replace with real tracking if available)
  const now = new Date();
  const demoLessonLog = [
    { course: 'Learn to Code in Python', chapter: 'Introduction to Python', lesson: 'What is Python?', date: new Date(now - 86400000 * 2), status: 'completed' },
    { course: 'Learn to Code in Python', chapter: 'Variables and Data Types', lesson: 'Variables', date: new Date(now - 86400000 * 1), status: 'completed' },
    { course: 'Learn Linux', chapter: '', lesson: 'Intro to Linux', date: new Date(now - 86400000 * 3), status: 'completed' }
  ];
  const demoExerciseLog = [
    { lesson: 'What is Python?', type: 'code', status: 'success', date: new Date(now - 3600000 * 5) },
    { lesson: 'Variables', type: 'mcq', status: 'fail', date: new Date(now - 3600000 * 2) },
    { lesson: 'Variables', type: 'mcq', status: 'success', date: new Date(now - 3600000 * 1.5) }
  ];
  const totalXP = profile.xp;
  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.percent === 100).length;
  const totalFails = demoExerciseLog.filter(e => e.status === 'fail').length;
  const totalHints = 2; // demo
  const timeSpent = '5h 42m'; // demo
  root.innerHTML = `
    <nav class="main-navbar">
      <div class="navbar-left">
        <span class="navbar-logo">Arcanum</span>
      </div>
      <div class="navbar-center">
        <span class="navbar-title">Profile: ${profile.name}</span>
      </div>
      <div class="navbar-right">
        <button class="navbar-link" id="back-dashboard">Back to Dashboard</button>
        <button class="navbar-link danger" id="reset-all-progress-btn">Reset All Progress</button>
        ${renderAdminSlider()}
      </div>
    </nav>
    <section class="profile-screen-view profile-screen-full">
      <div class="profile-screen-card">
        <img class="profile-avatar-lg" src="${profile.avatar}" alt="${profile.name} avatar">
        <div class="profile-info-lg">
          <div class="profile-name-lg">${profile.name}</div>
          <div class="profile-level-lg">Level ${profile.level}</div>
          <div class="profile-xp-bar-lg">
            <div class="xp-bar-bg">
              <div class="xp-bar-fill" style="width:${Math.round(100*profile.xp/profile.xpToNext)}%"></div>
            </div>
            <span class="xp-label">${profile.xp} / ${profile.xpToNext} XP</span>
          </div>
          <div class="profile-streak-lg">🔥 Streak: <b>${profile.streak}</b> days</div>
          <div class="profile-achievements-lg">
            <span class="achievements-label">Achievements:</span>
            <div class="achievements-gallery">
              ${Array.from({length: profile.achievements || 0}).map((_,i) => `<span class="badge-icon" title="Achievement ${i+1}">🏅</span>`).join('')}
            </div>
          </div>
          ${admin ? `<button class="admin-btn" id="edit-profile-lg-btn">Edit Profile</button>` : ''}
        </div>
      </div>
      <div class="profile-metrics-row">
        <div class="profile-metric-block">
          <div class="metric-label">Total XP</div>
          <div class="metric-value">${totalXP}</div>
        </div>
        <div class="profile-metric-block">
          <div class="metric-label">Courses Completed</div>
          <div class="metric-value">${completedCourses} / ${totalCourses}</div>
        </div>
        <div class="profile-metric-block">
          <div class="metric-label">Longest Streak</div>
          <div class="metric-value">${profile.streak} days</div>
        </div>
        <div class="profile-metric-block">
          <div class="metric-label">Fails</div>
          <div class="metric-value">${totalFails}</div>
        </div>
        <div class="profile-metric-block">
          <div class="metric-label">Hints Used</div>
          <div class="metric-value">${totalHints}</div>
        </div>
        <div class="profile-metric-block">
          <div class="metric-label">Time Spent</div>
          <div class="metric-value">${timeSpent}</div>
        </div>
      </div>
      <div class="profile-logs-row">
        <div class="profile-log-block">
          <div class="log-title">Course Progress</div>
          <div class="log-list">
            ${courses.map(c => `
              <div class="log-course-row">
                <span class="log-course-icon">${c.icon}</span>
                <span class="log-course-title">${c.title}</span>
                <span class="log-course-progress-bar">
                  <span class="log-course-bar-bg"><span class="log-course-bar-fill" style="width:${c.percent || 0}%"></span></span>
                  <span class="log-course-percent">${c.percent || 0}%</span>
                </span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="profile-log-block">
          <div class="log-title">Recent Lessons</div>
          <div class="log-list">
            ${demoLessonLog.map(l => `
              <div class="log-lesson-row">
                <span class="log-lesson-title">${l.lesson}</span>
                <span class="log-lesson-meta">in ${l.course}${l.chapter ? ' / ' + l.chapter : ''}</span>
                <span class="log-lesson-date">${l.date.toLocaleDateString()}</span>
                <span class="log-lesson-status log-status-${l.status}">${l.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="profile-log-block">
          <div class="log-title">Recent Exercises</div>
          <div class="log-list">
            ${demoExerciseLog.map(e => `
              <div class="log-ex-row">
                <span class="log-ex-lesson">${e.lesson}</span>
                <span class="log-ex-type">${e.type}</span>
                <span class="log-ex-date">${e.date.toLocaleTimeString()}</span>
                <span class="log-ex-status log-status-${e.status}">${e.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
  root.querySelector('#back-dashboard').onclick = renderDashboardView;
  if (admin && root.querySelector('#edit-profile-lg-btn')) {
    root.querySelector('#edit-profile-lg-btn').onclick = () => showEditProfileModal(profile);
  }
  // Admin slider
  root.querySelector('#admin-mode-toggle').onchange = (e) => {
    state.setAdminMode(e.target.checked);
    renderProfileScreen();
  };
  // Reset all progress button
  const resetAllBtn = root.querySelector('#reset-all-progress-btn');
  if (resetAllBtn) {
    resetAllBtn.onclick = () => {
      if (!confirm('Are you sure you want to reset ALL your progress? This cannot be undone.')) return;
      // Remove all completedLessons, exerciseLog, and SRS entries for this profile
      profile.completedLessons = [];
      profile.exerciseLog = [];
      profile.srsQueue = [];
      state.editProfile(profile.id, profile);
      renderProfileScreen();
    };
  }
}

function renderProgressScreen() {
  const root = document.getElementById('app-root');
  const profile = state.getSelectedProfile();
  const courses = state.getCourses();
  // Demo metrics
  const lessonsCompleted = 12;
  const exercisesCompleted = 18;
  const fails = 3;
  const timeSpent = '5h 42m';
  const completedCourses = courses.filter(c => c.percent === 100).length;
  // Demo activity timeline (last 7 days)
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date();
  const activity = Array.from({length: 7}).map((_,i) => ({
    day: days[(today.getDay() - 6 + i + 7) % 7],
    lessons: Math.floor(Math.random()*2),
    exercises: Math.floor(Math.random()*3)
  }));
  root.innerHTML = `
    <nav class="main-navbar">
      <div class="navbar-left">
        <span class="navbar-logo">Arcanum</span>
      </div>
      <div class="navbar-center">
        <span class="navbar-title">Progress Overview</span>
      </div>
      <div class="navbar-right">
        <button class="navbar-link" id="back-profile">Back to Profile</button>
        ${renderAdminSlider()}
      </div>
    </nav>
    <section class="progress-screen-view">
      <div class="progress-summary-row">
        <div class="progress-summary-block">
          <div class="progress-summary-label">Level</div>
          <div class="progress-summary-value">${profile.level}</div>
        </div>
        <div class="progress-summary-block">
          <div class="progress-summary-label">XP</div>
          <div class="progress-summary-value">${profile.xp}</div>
        </div>
        <div class="progress-summary-block">
          <div class="progress-summary-label">Streak</div>
          <div class="progress-summary-value">${profile.streak} days</div>
        </div>
        <div class="progress-summary-block">
          <div class="progress-summary-label">Courses Completed</div>
          <div class="progress-summary-value">${completedCourses} / ${courses.length}</div>
        </div>
        <div class="progress-summary-block">
          <div class="progress-summary-label">Lessons Completed</div>
          <div class="progress-summary-value">${lessonsCompleted}</div>
        </div>
        <div class="progress-summary-block">
          <div class="progress-summary-label">Exercises Completed</div>
          <div class="progress-summary-value">${exercisesCompleted}</div>
        </div>
        <div class="progress-summary-block">
          <div class="progress-summary-label">Fails</div>
          <div class="progress-summary-value">${fails}</div>
        </div>
        <div class="progress-summary-block">
          <div class="progress-summary-label">Time Spent</div>
          <div class="progress-summary-value">${timeSpent}</div>
        </div>
      </div>
      <div class="progress-courses-section">
        <div class="progress-courses-title">Your Courses</div>
        <div class="progress-courses-grid">
          ${courses.map(c => `
            <div class="progress-course-card" data-course-id="${c.id}">
              <div class="progress-course-icon">${c.icon}</div>
              <div class="progress-course-title">${c.title}</div>
              <div class="progress-course-bar-bg"><div class="progress-course-bar-fill" style="width:${c.percent || 0}%"></div></div>
              <div class="progress-course-percent">${c.percent || 0}%</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="progress-activity-section">
        <div class="progress-activity-title">Recent Activity</div>
        <div class="progress-activity-timeline">
          ${activity.map(a => `
            <div class="progress-activity-day">
              <div class="activity-day-label">${a.day}</div>
              <div class="activity-bar-group">
                <div class="activity-bar lessons" style="height:${a.lessons*22+8}px" title="${a.lessons} lessons"></div>
                <div class="activity-bar exercises" style="height:${a.exercises*22+8}px" title="${a.exercises} exercises"></div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="progress-activity-legend">
          <span class="legend-box lessons"></span> Lessons
          <span class="legend-box exercises"></span> Exercises
        </div>
      </div>
    </section>
  `;
  // Navigation
  root.querySelector('#back-profile').onclick = renderProfileScreen;
  // Course card click (optional: go to course view)
  root.querySelectorAll('.progress-course-card').forEach(card => {
    card.onclick = () => {
      const courseId = Number(card.getAttribute('data-course-id'));
      renderCourseWideChaptersView(state.getCourses().find(c => c.id === courseId), state.getCourses().find(c => c.id === courseId).chapters, null);
    };
  });
  // Admin slider
  root.querySelector('#admin-mode-toggle').onchange = (e) => {
    state.setAdminMode(e.target.checked);
    renderProgressScreen();
  };
}

function renderAchievementsScreen() {
  const root = document.getElementById('app-root');
  // Demo achievements data
  const achievements = [
    { icon: '🎓', name: 'First Steps', desc: 'Complete your first lesson', unlocked: true },
    { icon: '🔥', name: 'Streak Starter', desc: 'Maintain a 3-day streak', unlocked: true },
    { icon: '💡', name: 'Bright Idea', desc: 'Use a hint for the first time', unlocked: true },
    { icon: '🏆', name: 'Course Conqueror', desc: 'Complete a course', unlocked: true },
    { icon: '⏰', name: 'Early Bird', desc: 'Study before 8am', unlocked: false },
    { icon: '🌙', name: 'Night Owl', desc: 'Study after midnight', unlocked: false },
    { icon: '📝', name: 'Quiz Whiz', desc: 'Score 100% on a quiz', unlocked: false },
    { icon: '🧠', name: 'Brainiac', desc: 'Complete 10 lessons', unlocked: false },
    { icon: '📚', name: 'Bookworm', desc: 'Read all lesson content in a chapter', unlocked: false },
    { icon: '⚡', name: 'Speedrunner', desc: 'Finish a lesson in under 2 minutes', unlocked: false },
    { icon: '🔒', name: 'Lockpicker', desc: 'Unlock a locked lesson', unlocked: false },
    { icon: '🥇', name: 'Gold Medalist', desc: 'Earn 1000 XP', unlocked: false },
    { icon: '🥈', name: 'Silver Medalist', desc: 'Earn 500 XP', unlocked: false },
    { icon: '🥉', name: 'Bronze Medalist', desc: 'Earn 100 XP', unlocked: false },
    { icon: '🧩', name: 'Puzzle Master', desc: 'Solve a coding puzzle', unlocked: false },
    { icon: '🔁', name: 'Persistent', desc: 'Retry an exercise 5 times', unlocked: false },
    { icon: '👥', name: 'Social Learner', desc: 'Switch profiles', unlocked: false },
    { icon: '🌟', name: 'Star Student', desc: 'Complete all lessons in a course', unlocked: false },
    { icon: '🗝️', name: 'Key to Knowledge', desc: 'Unlock all achievements', unlocked: false },
    { icon: '📅', name: 'Calendar Keeper', desc: 'Study every day for a week', unlocked: false },
  ];
  root.innerHTML = `
    <nav class="main-navbar">
      <div class="navbar-left">
        <span class="navbar-logo">Arcanum</span>
      </div>
      <div class="navbar-center">
        <span class="navbar-title">Achievements</span>
      </div>
      <div class="navbar-right">
        <button class="navbar-link" id="back-dashboard">Back to Dashboard</button>
        ${renderAdminSlider()}
      </div>
    </nav>
    <section class="achievements-screen-view">
      <div class="achievements-gallery-lg">
        ${achievements.map(a => `
          <div class="achievement-card${a.unlocked ? ' unlocked' : ' locked'}">
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-name">${a.name}</div>
            <div class="achievement-desc">${a.desc}</div>
            <div class="achievement-status">${a.unlocked ? 'Unlocked' : 'Locked'}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
  root.querySelector('#back-dashboard').onclick = renderDashboardView;
  // Admin slider
  root.querySelector('#admin-mode-toggle').onchange = (e) => {
    state.setAdminMode(e.target.checked);
    renderAchievementsScreen();
  };
}

// Wire up Achievements button in dashboard nav
const origRenderDashboardView = renderDashboardView;
renderDashboardView = function() {
  origRenderDashboardView.apply(this, arguments);
  const root = document.getElementById('app-root');
  const navAchievements = root.querySelector('#nav-achievements');
  if (navAchievements) navAchievements.onclick = renderAchievementsScreen;
};

// Add button to profile screen to navigate to progress screen
const origRenderProfileScreen = renderProfileScreen;
renderProfileScreen = function() {
  origRenderProfileScreen();
  const root = document.getElementById('app-root');
  const nav = root.querySelector('.main-navbar .navbar-right');
  if (nav && !nav.querySelector('#view-progress-btn')) {
    const btn = document.createElement('button');
    btn.className = 'navbar-link';
    btn.id = 'view-progress-btn';
    btn.textContent = 'View Progress';
    btn.onclick = renderProgressScreen;
    nav.insertBefore(btn, nav.firstChild);
  }
};

// In renderProfileScreen, add export button to navbar
const origRenderProfileScreen2 = renderProfileScreen;
renderProfileScreen = function() {
  origRenderProfileScreen2();
  const root = document.getElementById('app-root');
  const nav = root.querySelector('.main-navbar .navbar-right');
  if (nav && !nav.querySelector('#export-user-btn')) {
    const btn = document.createElement('button');
    btn.className = 'navbar-link';
    btn.id = 'export-user-btn';
    btn.textContent = 'Export User Data';
    btn.onclick = () => {
      if (confirm('Export current user, their progress, and all courses as a JSON file?')) {
        const profile = state.getSelectedProfile();
        const exportData = {
          profile,
          courses: state.getCourses(),
          // Optionally add more: progress, settings, etc.
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arcanum-profile-${profile.name.replace(/\s+/g,'_').toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{document.body.removeChild(a); URL.revokeObjectURL(url);}, 100);
      }
    };
    nav.insertBefore(btn, nav.firstChild);
  }
};

// Add global Import/Export buttons to dashboard and profile navbars
function addGlobalImportExportButtons(nav) {
  if (!nav.querySelector('#global-export-btn')) {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'navbar-link';
    exportBtn.id = 'global-export-btn';
    exportBtn.textContent = 'Save & Export';
    exportBtn.onclick = () => {
      const stateRaw = localStorage.getItem('arcanum-app-state');
      const blob = new Blob([stateRaw], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'arcanum-data.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{document.body.removeChild(a); URL.revokeObjectURL(url);}, 100);
    };
    nav.insertBefore(exportBtn, nav.firstChild);
  }
  if (!nav.querySelector('#global-import-btn')) {
    const importBtn = document.createElement('button');
    importBtn.className = 'navbar-link';
    importBtn.id = 'global-import-btn';
    importBtn.textContent = 'Import from JSON';
    importBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            // Basic validation: must have profiles and courses
            if (!data.profiles || !data.courses) throw new Error('Missing profiles or courses');
            localStorage.setItem('arcanum-app-state', JSON.stringify(data));
            location.reload();
          } catch (err) {
            alert('Invalid JSON: ' + err.message);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    };
    nav.insertBefore(importBtn, nav.firstChild);
  }
}

// Patch dashboard and profile navs to include global import/export
const origRenderDashboardView2 = renderDashboardView;
renderDashboardView = function() {
  origRenderDashboardView2.apply(this, arguments);
  const root = document.getElementById('app-root');
  const nav = root.querySelector('.main-navbar .navbar-right');
  if (nav) addGlobalImportExportButtons(nav);
};
const origRenderProfileScreen3 = renderProfileScreen;
renderProfileScreen = function() {
  origRenderProfileScreen3();
  const root = document.getElementById('app-root');
  const nav = root.querySelector('.main-navbar .navbar-right');
  if (nav) addGlobalImportExportButtons(nav);
};

// --- Add/Edit/Bulk JSON for Chapters ---
function showBulkAddChaptersModal(courseId) {
  const jsonTemplate = `[
  {
    "id": 201,
    "title": "New Chapter",
    "desc": "Chapter description...",
    "icon": "📖",
    "resources": [
      { "label": "Official Python Docs", "url": "https://docs.python.org/3/" },
      { "label": "Python Tutorial (W3Schools)", "url": "https://www.w3schools.com/python/" }
    ],
    "questions": [
      "What is Python used for?",
      "How do you install Python?",
      "What is a variable?"
    ],
    "lessons": [
      {
        "id": 1001,
        "title": "What is Python?",
        "content": "Markdown or HTML content...",
        "exercises": [
          { "type": "code", "prompt": "Write a Hello World program.", "starter": "print('')", "solution": "print('Hello, World!')" },
          { "type": "mcq", "prompt": "What is Python?", "options": ["A snake", "A programming language", "A car"], "answer": 1 },
          { "type": "fill", "prompt": "Python is a ____ language.", "answer": "programming" },
          { "type": "drag", "prompt": "Order the steps to print in Python.", "items": ["Type print", "Open parenthesis", "Add string", "Close parenthesis"], "order": [0,1,2,3] },
          { "type": "order", "prompt": "Arrange the numbers in ascending order.", "items": [3,1,2], "order": [1,2,0] }
        ]
      }
    ]
  }
]`;
  const faqHtml = `<b>Chapters FAQ</b><ul><li><b>id</b>: Unique number</li><li><b>title</b>: Chapter name</li><li><b>desc</b>: Description</li><li><b>icon</b>: Emoji/icon</li><li><b>resources</b>: Array of resources</li><li><b>questions</b>: Array of questions</li><li><b>lessons</b>: Array of lessons</li></ul>`;
  showModalTabbed({
    title: 'Bulk Add Chapters (JSON)',
    formHtml: `<h2>Bulk Add Chapters (JSON)</h2><textarea id="bulk-chapters-json" rows="10"></textarea><div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;"><button class="admin-btn" id="bulk-add-chapters-btn">Add</button><button class="admin-btn" id="bulk-cancel-chapters-btn">Cancel</button></div>`,
    jsonTemplate,
    jsonFaq: faqHtml,
    onFormMount: () => {
      document.getElementById('bulk-cancel-chapters-btn').onclick = closeModal;
      document.getElementById('bulk-add-chapters-btn').onclick = () => {
        try {
          const arr = JSON.parse(document.getElementById('bulk-chapters-json').value);
          const course = state.getCourses().find(c => c.id == courseId);
          if (Array.isArray(arr) && course) {
            course.chapters = course.chapters.concat(arr);
            state.editCourse(course.id, { chapters: course.chapters });
            closeModal();
            renderCourseWideChaptersView(course, course.chapters, null);
          }
        } catch (e) { alert('Invalid JSON: ' + e.message); }
      };
    }
  });
}

// --- Add/Edit/Bulk JSON for Lessons ---
function showBulkAddLessonsModal(courseId, chapterId) {
  const templateData = [
    {
      id: 301,
      title: "Introduction to Variables",
      content: "# Introduction to Variables\n\nVariables are containers for storing data values.\n\n## What are Variables?\n\nA variable is a named storage location that can hold different types of data.\n\n### Example:\n\n```python\nname = \"John\"\nage = 25\nheight = 1.75\n```\n\nIn this example:\n- `name` stores a string\n- `age` stores an integer\n- `height` stores a float\n\n## Key Points:\n\n1. **Naming**: Use descriptive names\n2. **Assignment**: Use = to assign values\n3. **Types**: Python automatically determines data types\n4. **Reassignment**: Variables can be changed later\n\n```python\n# You can change the value later\nname = \"Jane\"\nage = 26\n```",
      exercises: [
        {
          type: "mcq",
          prompt: "What is a variable?",
          options: [
            "A container for storing data values",
            "A type of function",
            "A programming language",
            "A computer program"
          ],
          answer: 0
        },
        {
          type: "fill",
          prompt: "Complete the code to create a variable named 'score' with the value 95:",
          answer: "score = 95"
        },
        {
          type: "code",
          prompt: "Create a variable named 'greeting' and assign it the value 'Hello, World!'. Then print it.",
          starter: "# Your code here",
          solution: "greeting = 'Hello, World!'\nprint(greeting)"
        }
      ]
    },
    {
      id: 302,
      title: "Data Types",
      content: "# Data Types in Programming\n\nDifferent types of data can be stored in variables.\n\n## Common Data Types:\n\n### 1. Strings\nText data enclosed in quotes\n```python\nmessage = \"Hello, World!\"\nname = 'Alice'\n```\n\n### 2. Integers\nWhole numbers\n```python\nage = 25\ncount = 100\n```\n\n### 3. Floats\nDecimal numbers\n```python\nprice = 19.99\npi = 3.14159\n```\n\n### 4. Booleans\nTrue or False values\n```python\nis_active = True\nis_complete = False\n```",
      exercises: [
        {
          type: "mcq",
          prompt: "Which data type is used for text?",
          options: ["Integer", "String", "Float", "Boolean"],
          answer: 1
        },
        {
          type: "fill",
          prompt: "Create a variable 'temperature' with the value 98.6 (this should be a float):",
          answer: "temperature = 98.6"
        }
      ]
    }
  ];
  
  const jsonTemplate = JSON.stringify(templateData, null, 2);

  const faqHtml = `<b>Lessons FAQ</b>
<ul>
<li><b>id</b>: Unique number (301, 302, etc.)</li>
<li><b>title</b>: Lesson name (e.g., "Introduction to Variables")</li>
<li><b>content</b>: Markdown content with # for headers, \`\`\` for code blocks</li>
<li><b>exercises</b>: Array of exercise objects</li>
</ul>
<b>Exercise Types:</b>
<ul>
<li><b>mcq</b>: Multiple choice with options[] and answer (0-based index)</li>
<li><b>fill</b>: Fill in the blank with answer</li>
<li><b>code</b>: Programming exercise with prompt, starter, and solution</li>
<li><b>drag</b>: Drag and drop with items[] and order[]</li>
<li><b>order</b>: Reorder items with items[] and order[]</li>
</ul>`;

  // Generate form HTML for adding lessons
  const generateLessonForm = () => {
    let lessonIndex = 0;
    const lessons = [];
    
    const renderLessonForm = (index) => {
      return `
        <div class="lesson-form-section" data-lesson-index="${index}">
          <h3>Lesson ${index + 1}</h3>
          <div class="form-group">
            <label>Lesson ID:</label>
            <input type="number" class="lesson-id-input" placeholder="301" value="${301 + index}">
          </div>
          <div class="form-group">
            <label>Title:</label>
            <input type="text" class="lesson-title-input" placeholder="Introduction to Variables">
          </div>
          <div class="form-group">
            <label>Content (Markdown):</label>
                         <textarea class="lesson-content-input" rows="8" placeholder="Enter your lesson content in Markdown format..."></textarea>
          </div>
          <div class="exercises-section">
            <h4>Exercises</h4>
            <div class="exercises-list" data-lesson-index="${index}">
              <!-- Exercises will be added here -->
            </div>
            <button type="button" class="admin-btn add-exercise-btn" data-lesson-index="${index}">+ Add Exercise</button>
          </div>
          <button type="button" class="admin-btn remove-lesson-btn" data-lesson-index="${index}">Remove Lesson</button>
        </div>
      `;
    };

    const renderExerciseForm = (lessonIndex, exerciseIndex) => {
      return `
        <div class="exercise-form" data-lesson-index="${lessonIndex}" data-exercise-index="${exerciseIndex}">
          <h5>Exercise ${exerciseIndex + 1}</h5>
          <div class="form-group">
            <label>Type:</label>
            <select class="exercise-type-select">
              <option value="mcq">Multiple Choice</option>
              <option value="fill">Fill in the Blank</option>
              <option value="code">Code Exercise</option>
              <option value="drag">Drag & Drop</option>
              <option value="order">Ordering</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prompt:</label>
            <textarea class="exercise-prompt-input" rows="3" placeholder="What is a variable?"></textarea>
          </div>
          <div class="exercise-type-fields">
            <!-- Type-specific fields will be shown here -->
          </div>
          <button type="button" class="admin-btn remove-exercise-btn" data-lesson-index="${lessonIndex}" data-exercise-index="${exerciseIndex}">Remove Exercise</button>
        </div>
      `;
    };

    return `
      <div class="lessons-form-container">
        <h2>Add Lessons</h2>
        <div class="lessons-list" id="lessons-form-list">
          ${renderLessonForm(0)}
        </div>
        <button type="button" class="admin-btn add-lesson-btn">+ Add Lesson</button>
        <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
          <button class="admin-btn" id="bulk-add-lessons-btn">Add Lessons</button>
          <button class="admin-btn" id="bulk-cancel-lessons-btn">Cancel</button>
        </div>
      </div>
    `;
  };

  showModalTabbed({
    title: 'Add Lessons',
    formHtml: generateLessonForm(),
    jsonEditHtml: `<textarea class="modal-json-input" rows="20" placeholder="Paste your JSON here..."></textarea>`,
    jsonTemplate,
    jsonFaq: faqHtml,
    onFormMount: () => {
      let lessonCount = 1;
      let exerciseCounts = [0];

      // Add lesson button
      document.querySelector('.add-lesson-btn').onclick = () => {
        const lessonsList = document.getElementById('lessons-form-list');
        const newLessonHtml = `
          <div class="lesson-form-section" data-lesson-index="${lessonCount}">
            <h3>Lesson ${lessonCount + 1}</h3>
            <div class="form-group">
              <label>Lesson ID:</label>
              <input type="number" class="lesson-id-input" placeholder="301" value="${301 + lessonCount}">
            </div>
            <div class="form-group">
              <label>Title:</label>
              <input type="text" class="lesson-title-input" placeholder="Introduction to Variables">
            </div>
            <div class="form-group">
              <label>Content (Markdown):</label>
              <textarea class="lesson-content-input" rows="8" placeholder="Enter your lesson content in Markdown format..."></textarea>
            </div>
            <div class="exercises-section">
              <h4>Exercises</h4>
              <div class="exercises-list" data-lesson-index="${lessonCount}">
                <!-- Exercises will be added here -->
              </div>
              <button type="button" class="admin-btn add-exercise-btn" data-lesson-index="${lessonCount}">+ Add Exercise</button>
            </div>
            <button type="button" class="admin-btn remove-lesson-btn" data-lesson-index="${lessonCount}">Remove Lesson</button>
          </div>
        `;
        lessonsList.insertAdjacentHTML('beforeend', newLessonHtml);
        exerciseCounts[lessonCount] = 0;
        lessonCount++;
        
        // Reattach event listeners
        attachFormEventListeners();
      };

      // Add exercise button
      const addExerciseToLesson = (lessonIndex) => {
        const exercisesList = document.querySelector(`.exercises-list[data-lesson-index="${lessonIndex}"]`);
        const exerciseIndex = exerciseCounts[lessonIndex] || 0;
        const newExerciseHtml = `
          <div class="exercise-form" data-lesson-index="${lessonIndex}" data-exercise-index="${exerciseIndex}">
            <h5>Exercise ${exerciseIndex + 1}</h5>
            <div class="form-group">
              <label>Type:</label>
              <select class="exercise-type-select">
                <option value="mcq">Multiple Choice</option>
                <option value="fill">Fill in the Blank</option>
                <option value="code">Code Exercise</option>
                <option value="drag">Drag & Drop</option>
                <option value="order">Ordering</option>
              </select>
            </div>
            <div class="form-group">
              <label>Prompt:</label>
              <textarea class="exercise-prompt-input" rows="3" placeholder="What is a variable?"></textarea>
            </div>
            <div class="exercise-type-fields">
              <!-- Type-specific fields will be shown here -->
            </div>
            <button type="button" class="admin-btn remove-exercise-btn" data-lesson-index="${lessonIndex}" data-exercise-index="${exerciseIndex}">Remove Exercise</button>
          </div>
        `;
        exercisesList.insertAdjacentHTML('beforeend', newExerciseHtml);
        exerciseCounts[lessonIndex] = (exerciseCounts[lessonIndex] || 0) + 1;
        
        // Show type-specific fields
        const exerciseForm = exercisesList.lastElementChild;
        const typeSelect = exerciseForm.querySelector('.exercise-type-select');
        showExerciseTypeFields(typeSelect);
        
        // Attach type change listener
        typeSelect.onchange = () => showExerciseTypeFields(typeSelect);
      };

      // Show exercise type-specific fields
      const showExerciseTypeFields = (typeSelect) => {
        const exerciseForm = typeSelect.closest('.exercise-form');
        const fieldsContainer = exerciseForm.querySelector('.exercise-type-fields');
        const type = typeSelect.value;
        
        let fieldsHtml = '';
        
        switch(type) {
          case 'mcq':
            fieldsHtml = `
              <div class="form-group">
                <label>Options (one per line):</label>
                                 <textarea class="exercise-options-input" rows="4" placeholder="Option 1\nOption 2\nOption 3\nOption 4"></textarea>
              </div>
              <div class="form-group">
                <label>Correct Answer (0-based index):</label>
                <input type="number" class="exercise-answer-input" min="0" placeholder="0">
              </div>
            `;
            break;
          case 'fill':
            fieldsHtml = `
              <div class="form-group">
                <label>Correct Answer:</label>
                <input type="text" class="exercise-answer-input" placeholder="correct answer">
              </div>
            `;
            break;
          case 'code':
            fieldsHtml = `
              <div class="form-group">
                <label>Starter Code:</label>
                <textarea class="exercise-starter-input" rows="4" placeholder="# Your code here"></textarea>
              </div>
              <div class="form-group">
                <label>Solution:</label>
                <textarea class="exercise-solution-input" rows="4" placeholder="print('Hello, World!')"></textarea>
              </div>
            `;
            break;
          case 'drag':
          case 'order':
            fieldsHtml = `
              <div class="form-group">
                <label>Items (one per line):</label>
                                 <textarea class="exercise-items-input" rows="4" placeholder="Item 1\nItem 2\nItem 3\nItem 4"></textarea>
              </div>
              <div class="form-group">
                <label>Correct Order (comma-separated indices):</label>
                <input type="text" class="exercise-order-input" placeholder="0,1,2,3">
              </div>
            `;
            break;
        }
        
        fieldsContainer.innerHTML = fieldsHtml;
      };

      // Attach event listeners
      const attachFormEventListeners = () => {
        // Add exercise buttons
        document.querySelectorAll('.add-exercise-btn').forEach(btn => {
          btn.onclick = () => addExerciseToLesson(parseInt(btn.dataset.lessonIndex));
        });

        // Remove lesson buttons
        document.querySelectorAll('.remove-lesson-btn').forEach(btn => {
          btn.onclick = () => {
            const lessonSection = btn.closest('.lesson-form-section');
            lessonSection.remove();
          };
        });

        // Remove exercise buttons
        document.querySelectorAll('.remove-exercise-btn').forEach(btn => {
          btn.onclick = () => {
            const exerciseForm = btn.closest('.exercise-form');
            exerciseForm.remove();
          };
        });

        // Exercise type change listeners
        document.querySelectorAll('.exercise-type-select').forEach(select => {
          select.onchange = () => showExerciseTypeFields(select);
        });
      };

      // Initial setup
      attachFormEventListeners();
      
      // Show type-specific fields for initial exercise
      const initialTypeSelect = document.querySelector('.exercise-type-select');
      if (initialTypeSelect) {
        showExerciseTypeFields(initialTypeSelect);
        initialTypeSelect.onchange = () => showExerciseTypeFields(initialTypeSelect);
      }

      // Add exercise to first lesson
      const firstAddExerciseBtn = document.querySelector('.add-exercise-btn');
      if (firstAddExerciseBtn) {
        firstAddExerciseBtn.onclick = () => addExerciseToLesson(0);
      }

      // Form submission
      document.getElementById('bulk-cancel-lessons-btn').onclick = closeModal;
      document.getElementById('bulk-add-lessons-btn').onclick = () => {
        try {
          const lessons = [];
          
          document.querySelectorAll('.lesson-form-section').forEach((lessonSection, lessonIndex) => {
            const lessonId = parseInt(lessonSection.querySelector('.lesson-id-input').value) || (301 + lessonIndex);
            const title = lessonSection.querySelector('.lesson-title-input').value.trim();
            const content = lessonSection.querySelector('.lesson-content-input').value.trim();
            
            if (!title || !content) {
              throw new Error(`Lesson ${lessonIndex + 1} is missing title or content`);
            }
            
            const exercises = [];
            lessonSection.querySelectorAll('.exercise-form').forEach((exerciseForm, exerciseIndex) => {
              const type = exerciseForm.querySelector('.exercise-type-select').value;
              const prompt = exerciseForm.querySelector('.exercise-prompt-input').value.trim();
              
              if (!prompt) {
                throw new Error(`Exercise ${exerciseIndex + 1} in Lesson ${lessonIndex + 1} is missing prompt`);
              }
              
              const exercise = { type, prompt };
              
              switch(type) {
                case 'mcq':
                  const optionsText = exerciseForm.querySelector('.exercise-options-input').value.trim();
                  const answer = parseInt(exerciseForm.querySelector('.exercise-answer-input').value);
                  if (!optionsText || isNaN(answer)) {
                    throw new Error(`MCQ exercise ${exerciseIndex + 1} in Lesson ${lessonIndex + 1} is missing options or answer`);
                  }
                  exercise.options = optionsText.split('\n').filter(opt => opt.trim());
                  exercise.answer = answer;
                  break;
                case 'fill':
                  const fillAnswer = exerciseForm.querySelector('.exercise-answer-input').value.trim();
                  if (!fillAnswer) {
                    throw new Error(`Fill exercise ${exerciseIndex + 1} in Lesson ${lessonIndex + 1} is missing answer`);
                  }
                  exercise.answer = fillAnswer;
                  break;
                case 'code':
                  const starter = exerciseForm.querySelector('.exercise-starter-input').value.trim();
                  const solution = exerciseForm.querySelector('.exercise-solution-input').value.trim();
                  if (!solution) {
                    throw new Error(`Code exercise ${exerciseIndex + 1} in Lesson ${lessonIndex + 1} is missing solution`);
                  }
                  exercise.starter = starter;
                  exercise.solution = solution;
                  break;
                case 'drag':
                case 'order':
                  const itemsText = exerciseForm.querySelector('.exercise-items-input').value.trim();
                  const orderText = exerciseForm.querySelector('.exercise-order-input').value.trim();
                  if (!itemsText || !orderText) {
                    throw new Error(`${type} exercise ${exerciseIndex + 1} in Lesson ${lessonIndex + 1} is missing items or order`);
                  }
                  exercise.items = itemsText.split('\n').filter(item => item.trim());
                  exercise.order = orderText.split(',').map(i => parseInt(i.trim()));
                  break;
              }
              
              exercises.push(exercise);
            });
            
            lessons.push({
              id: lessonId,
              title,
              content,
              exercises
            });
          });
          
          if (lessons.length === 0) {
            throw new Error('No lessons to add');
          }
          
          const course = state.getCourses().find(c => c.id == courseId);
          const chapter = course && course.chapters.find(ch => ch.id == chapterId);
          if (chapter) {
            chapter.lessons = chapter.lessons.concat(lessons);
            state.editCourse(course.id, { chapters: course.chapters });
            closeModal();
            renderCourseWideChaptersView(course, course.chapters, chapterId);
          }
        } catch (e) { 
          alert('Error: ' + e.message); 
        }
      };
    }
  });
}

// --- Add/Edit/Bulk JSON for Exercises ---
function showBulkAddExercisesModal(courseId, chapterId, lessonId) {
  const jsonTemplate = `[
  {
    "type": "code",
    "prompt": "Write a Hello World program.",
    "starter": "print('')",
    "solution": "print('Hello, World!')"
  }
]`;
  const faqHtml = `<b>Exercises FAQ</b><ul><li><b>type</b>: code, mcq, fill, drag, order</li><li><b>prompt</b>: Question/instruction</li><li><b>solution</b>: For code</li><li><b>options</b>: For mcq</li><li><b>answer</b>: For mcq/fill</li><li><b>items</b>, <b>order</b>: For drag/order</li></ul>`;
  showModalTabbed({
    title: 'Bulk Add Exercises (JSON)',
    formHtml: `<h2>Bulk Add Exercises (JSON)</h2><textarea id="bulk-exercises-json" rows="10"></textarea><div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;"><button class="admin-btn" id="bulk-add-exercises-btn">Add</button><button class="admin-btn" id="bulk-cancel-exercises-btn">Cancel</button></div>`,
    jsonTemplate,
    jsonFaq: faqHtml,
    onFormMount: () => {
      document.getElementById('bulk-cancel-exercises-btn').onclick = closeModal;
      document.getElementById('bulk-add-exercises-btn').onclick = () => {
        try {
          const arr = JSON.parse(document.getElementById('bulk-exercises-json').value);
          const course = state.getCourses().find(c => c.id == courseId);
          const chapter = course && course.chapters.find(ch => ch.id == chapterId);
          const lesson = chapter && chapter.lessons.find(l => l.id == lessonId);
          if (Array.isArray(arr) && lesson) {
            lesson.exercises = lesson.exercises.concat(arr);
            state.editCourse(course.id, { chapters: course.chapters });
            closeModal();
            renderCourseWideChaptersView(course, course.chapters, chapterId);
          }
        } catch (e) { alert('Invalid JSON: ' + e.message); }
      };
    }
  });
}

// Ensure default profile and course if none exist
(function ensureDefaultState() {
  const profiles = state.getProfiles();
  const courses = state.getCourses();
  if (!profiles || profiles.length === 0) {
    state.addProfiles([{ id: Date.now(), name: 'Demo User', avatar: 'https://ui-avatars.com/api/?name=Demo+User', level: 1, xp: 0, xpToNext: 100, streak: 0, achievements: [], completedLessons: [], completedChapters: [], completedCourses: [], exerciseLog: [], settings: { theme: 'light' } }]);
  }
  if (!courses || courses.length === 0) {
    state.addCourses([{ id: Date.now(), title: 'Demo Course', desc: 'A sample course.', icon: '📘', chapters: [] }]);
  }
})();

// Patch dashboard to support drag-and-drop reordering of courses (admin mode only)
const origRenderDashboardViewDnd = renderDashboardView;
renderDashboardView = function() {
  origRenderDashboardViewDnd.apply(this, arguments);
  const root = document.getElementById('app-root');
  const admin = state.isAdminMode();
  if (!admin) return;
  const grid = root.querySelector('.courses-grid');
  if (!grid) return;
  let dragSrcIdx = null;
  grid.querySelectorAll('.course-grid-card').forEach((card, idx) => {
    card.setAttribute('draggable', 'true');
    card.ondragstart = (e) => {
      dragSrcIdx = idx;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    };
    card.ondragend = () => {
      card.classList.remove('dragging');
      dragSrcIdx = null;
      grid.querySelectorAll('.course-grid-card').forEach(c => c.classList.remove('drag-over'));
    };
    card.ondragover = (e) => {
      e.preventDefault();
      if (dragSrcIdx !== null && dragSrcIdx !== idx) {
        card.classList.add('drag-over');
      }
    };
    card.ondragleave = () => {
      card.classList.remove('drag-over');
    };
    card.ondrop = (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (dragSrcIdx !== null && dragSrcIdx !== idx) {
        // Reorder courses in state
        const courses = state.getCourses();
        const moved = courses.splice(dragSrcIdx, 1)[0];
        courses.splice(idx, 0, moved);
        state.editCourse(moved.id, moved); // persist
        localStorage.setItem('arcanum-app-state', JSON.stringify(getSerializableState()));
        renderDashboardView();
      }
    };
  });
};

function renderSkillTreeDashboard() {
  const root = document.getElementById('app-root');
  const profile = state.getSelectedProfile();
  const courses = state.getCourses();
  const admin = state.isAdminMode();
  // If only one course, fallback to grid
  if (courses.length <= 1) return renderDashboardView();
  // Radial layout
  const RADIUS = 260;
  const centerX = 400, centerY = 340;
  const nodeR = 44;
  const angleStep = (2 * Math.PI) / courses.length;
  // Map course id to index for dependency lines
  const idToIdx = Object.fromEntries(courses.map((c, i) => [c.id, i]));
  // Calculate node positions
  const nodes = courses.map((c, i) => {
    const angle = i * angleStep - Math.PI/2;
    return {
      ...c,
      x: centerX + RADIUS * Math.cos(angle),
      y: centerY + RADIUS * Math.sin(angle),
      idx: i
    };
  });
  // SVG edges for dependencies
  let edges = '';
  courses.forEach((c, i) => {
    if (Array.isArray(c.prerequisites)) {
      c.prerequisites.forEach(prereqId => {
        const from = nodes[idToIdx[prereqId]];
        const to = nodes[i];
        if (from && to) {
          edges += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#bfa46f" stroke-width="3" marker-end="url(#arrow)" />`;
        }
      });
    }
  });
  // SVG nodes
  const nodeSvgs = nodes.map((c, i) => {
    const percent = c.percent || 0;
    return `
      <g class="skill-node" data-course-id="${c.id}" style="cursor:pointer;">
        <circle cx="${c.x}" cy="${c.y}" r="${nodeR}" fill="#fff" stroke="#bfa46f" stroke-width="3"/>
        <circle cx="${c.x}" cy="${c.y}" r="${nodeR-7}" fill="#f7f3e8" stroke="#e0d3b0" stroke-width="2"/>
        <text x="${c.x}" y="${c.y-8}" text-anchor="middle" font-size="1.7em">${c.icon || '📘'}</text>
        <text x="${c.x}" y="${c.y+24}" text-anchor="middle" font-size="0.95em" fill="#6a5d3b">${c.title}</text>
        <circle cx="${c.x}" cy="${c.y}" r="${nodeR-2}" fill="none" stroke="#bfa46f" stroke-width="5" stroke-dasharray="${2*Math.PI*(nodeR-2)}" stroke-dashoffset="${2*Math.PI*(nodeR-2)*(1-percent/100)}"/>
      </g>
    `;
  }).join('');
  root.innerHTML = `
    <nav class="main-navbar">
      <div class="navbar-left"><span class="navbar-logo">Arcanum</span></div>
      <div class="navbar-center"><span class="navbar-title">Skill Tree</span></div>
      <div class="navbar-right">
        <button class="navbar-link" id="nav-profile">Profile</button>
        <button class="navbar-link" id="nav-progress">Progress</button>
        <button class="navbar-link" id="nav-achievements">Achievements</button>
        ${renderResetDemoButton()}
        ${renderAdminSlider()}
      </div>
    </nav>
    <section class="dashboard-skilltree">
      <svg width="100%" height="700" viewBox="0 0 800 700" style="background:var(--background);">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 z" fill="#bfa46f" />
          </marker>
        </defs>
        ${edges}
        ${nodeSvgs}
      </svg>
    </section>
  `;
  // Node click
  root.querySelectorAll('.skill-node').forEach(node => {
    node.onclick = () => {
      const courseId = Number(node.getAttribute('data-course-id'));
      const course = state.getCourses().find(c => Number(c.id) === courseId);
      if (course) {
        renderCourseWideChaptersView(course, Array.isArray(course.chapters) ? course.chapters : [], null);
      } else {
        alert('Course not found.');
      }
    };
  });
  // Drag-and-drop for courses (admin mode)
  if (admin) {
    let dragSrcIdx = null;
    const svgNodes = Array.from(root.querySelectorAll('.skill-node'));
    svgNodes.forEach((node, idx) => {
      node.setAttribute('draggable', 'true');
      node.ondragstart = (e) => {
        dragSrcIdx = idx;
        node.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      };
      node.ondragend = () => {
        node.classList.remove('dragging');
        dragSrcIdx = null;
        svgNodes.forEach(n => n.classList.remove('drag-over'));
      };
      node.ondragover = (e) => {
        e.preventDefault();
        if (dragSrcIdx !== null && dragSrcIdx !== idx) {
          node.classList.add('drag-over');
        }
      };
      node.ondragleave = () => {
        node.classList.remove('drag-over');
      };
      node.ondrop = (e) => {
        e.preventDefault();
        node.classList.remove('drag-over');
        if (dragSrcIdx !== null && dragSrcIdx !== idx) {
          const courses = state.getCourses();
          const moved = courses.splice(dragSrcIdx, 1)[0];
          courses.splice(idx, 0, moved);
          state.editCourse(moved.id, moved);
          localStorage.setItem('arcanum-app-state', JSON.stringify(getSerializableState()));
          renderSkillTreeDashboard();
        }
      };
    });
  }
  // Nav buttons
  root.querySelector('#nav-profile').onclick = renderProfileScreen;
  root.querySelector('#nav-progress').onclick = renderProgressScreen;
  root.querySelector('#nav-achievements').onclick = renderAchievementsScreen;
  root.querySelector('#admin-mode-toggle').onchange = (e) => {
    state.setAdminMode(e.target.checked);
    renderSkillTreeDashboard();
  };
  const resetBtn = root.querySelector('#reset-demo-btn');
  if (resetBtn) resetBtn.onclick = () => { localStorage.clear(); location.reload(); };
}

// Helper: Get a plain serializable state snapshot
function getSerializableState() {
  return {
    profiles: state.getProfiles(),
    courses: state.getCourses(),
    selectedProfileId: state.getSelectedProfile() ? state.getSelectedProfile().id : 1,
    adminMode: state.isAdminMode(),
    appSettings: state.appSettings || {}
  };
}

function renderDailyReviewScreen() {
  const root = document.getElementById('app-root');
  const profile = state.getSelectedProfile();
  ensureSRSQueue(profile);
  const dueSRS = getDueSRSItems(profile);
  const courses = state.getCourses();
  root.innerHTML = `
    <nav class="main-navbar">
      <div class="navbar-left">
        <span class="navbar-logo">Arcanum</span>
      </div>
      <div class="navbar-center">
        <span class="navbar-title">Daily Review</span>
      </div>
      <div class="navbar-right">
        <button class="navbar-link" id="back-dashboard">← Back to Dashboard</button>
        ${renderAdminSlider()}
        <div id="theme-switcher-navbar"></div>
      </div>
    </nav>
    <section class="daily-review-view academia-bg">
      <div class="daily-review-hero">
        <h1 class="daily-review-title">🕯️ Daily Review</h1>
        <div class="daily-review-desc">
          <p>Welcome to your <b>Daily Review</b>! Here you'll reinforce what you've learned using the <b>Spaced Repetition System (SRS)</b>.<br>
          <span class="daily-review-instructions">Review each item below. Click <b>Review</b> to recall the lesson or exercise. Mark as <b>Remembered</b> or <b>Forgot</b> to track your progress and optimize your learning.</span></p>
        </div>
        <div class="daily-review-summary">
          <span class="daily-review-count">${dueSRS.length} item${dueSRS.length === 1 ? '' : 's'} due</span>
          <span class="daily-review-streak">🔥 Streak: ${profile.streak || 0} days</span>
        </div>
      </div>
      <div class="daily-review-list academia-card">
        ${dueSRS.length === 0 ? '<div class="no-due-items">All caught up! 🎉<br><span class="daily-review-tip">Come back tomorrow for more review.</span></div>' : dueSRS.map(item => {
          let label = '';
          let icon = '';
          if (item.type === 'lesson') {
            let lesson = null;
            for (const course of courses) {
              for (const chapter of (course.chapters || [])) {
                lesson = (chapter.lessons || []).find(l => l.id === item.id);
                if (lesson) break;
              }
              if (lesson) break;
            }
            label = lesson ? `<b>${lesson.title}</b> <span class="daily-review-type">Lesson</span>` : `Lesson #${item.id}`;
            icon = '📖';
          } else if (item.type === 'exercise') {
            label = `Exercise #${item.id}`;
            icon = '📝';
          }
          return `<div class="daily-review-item academia-card" data-id="${item.id}" data-type="${item.type}">
            <span class="daily-review-icon">${icon}</span>
            <span class="daily-review-label">${label}</span>
            <button class="review-btn" data-id="${item.id}" data-type="${item.type}">Review</button>
          </div>`;
        }).join('')}
      </div>
      <div class="daily-review-faq academia-faq">
        <h3>What is SRS?</h3>
        <p>The <b>Spaced Repetition System</b> helps you review information at optimal intervals to maximize retention. Items you remember are shown less often; items you forget are shown more frequently.</p>
        <h3>How do I use this screen?</h3>
        <ul>
          <li>Click <b>Review</b> to see the lesson or exercise.</li>
          <li>Mark as <b>Remembered</b> or <b>Forgot</b> in the popup.</li>
          <li>Keep your streak going by reviewing every day!</li>
        </ul>
      </div>
    </section>
  `;
  // Move the theme switcher into the navbar
  const themeSwitcherTarget = root.querySelector('#theme-switcher-navbar');
  const themeSwitcher = document.getElementById('theme-switcher');
  if (themeSwitcherTarget && themeSwitcher) {
    themeSwitcherTarget.appendChild(themeSwitcher);
    themeSwitcher.style.position = 'static';
    themeSwitcher.style.marginLeft = '0.7rem';
    themeSwitcher.style.marginRight = '0';
    themeSwitcher.style.top = 'unset';
    themeSwitcher.style.right = 'unset';
    themeSwitcher.style.width = '36px';
    themeSwitcher.style.height = '36px';
    themeSwitcher.style.zIndex = 'auto';
  }
  root.querySelector('#back-dashboard').onclick = renderDashboardView;
  // Wire up review buttons
  root.querySelectorAll('.review-btn').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.getAttribute('data-id'));
      const type = btn.getAttribute('data-type');
      showReviewModal(id, type);
    };
  });
}

function showReviewModal(id, type) {
  const profile = state.getSelectedProfile();
  const courses = state.getCourses();
  let lesson = null;
  let exercise = null;
  if (type === 'lesson') {
    for (const course of courses) {
      for (const chapter of (course.chapters || [])) {
        lesson = (chapter.lessons || []).find(l => l.id === id);
        if (lesson) break;
      }
      if (lesson) break;
    }
  }
  // For now, only support lesson review (show summary, ask if remembered)
  showModal(`
    <div class="review-modal">
      <h2>Review: ${type === 'lesson' && lesson ? lesson.title : type + ' #' + id}</h2>
      <div class="review-content">
        ${type === 'lesson' && lesson ? `<div>${lesson.content.slice(0, 300)}...</div>` : ''}
      </div>
      <div class="review-actions">
        <button class="review-success-btn">Remembered</button>
        <button class="review-fail-btn">Forgot</button>
      </div>
    </div>
  `, () => renderDailyReviewScreen());
  document.querySelector('.review-success-btn').onclick = () => {
    scheduleSRSItem(profile, id, type, 'success');
    state.editProfile(profile.id, profile); // persist
    closeModal();
    renderDailyReviewScreen();
  };
  document.querySelector('.review-fail-btn').onclick = () => {
    scheduleSRSItem(profile, id, type, 'fail');
    state.editProfile(profile.id, profile); // persist
    closeModal();
    renderDailyReviewScreen();
  };
}

function showImportStateModal() {
  showModal(`
    <h2>Import App State</h2>
    <p>Paste your JSON below or upload a .json file:</p>
    <textarea id="import-state-json" rows="12" style="width:100%;font-family:monospace;"></textarea>
    <input type="file" id="import-state-file" accept="application/json" style="margin-top:1rem;">
    <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
      <button class="admin-btn" id="import-state-btn">Import</button>
      <button class="admin-btn" id="cancel-import-state-btn">Cancel</button>
    </div>
  `);
  document.getElementById('cancel-import-state-btn').onclick = closeModal;
  document.getElementById('import-state-btn').onclick = () => {
    try {
      const raw = document.getElementById('import-state-json').value;
      if (!raw.trim()) return alert('Paste JSON or upload a file.');
      const data = JSON.parse(raw);
      localStorage.setItem('arcanum-app-state', JSON.stringify(data));
      closeModal();
      location.reload();
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  };
  document.getElementById('import-state-file').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      document.getElementById('import-state-json').value = evt.target.result;
    };
    reader.readAsText(file);
  };
}

// Onboarding modal logic
function showOnboardingModal() {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `<div class="modal-overlay"><div class="modal-content modal-lg">
    <h2>Welcome to Arcanum!</h2>
    <ol style="font-size:1.1em;line-height:1.7;">
      <li><b>Profile Creation:</b> Start by creating a profile. Each user has their own progress, XP, streak, and achievements.</li>
      <li><b>Course Navigation:</b> Select a course from the dashboard or skill tree. Courses are organized into chapters and lessons.</li>
      <li><b>Admin Mode:</b> Enable Admin Mode (slider in the navbar) to add, edit, or delete courses, chapters, lessons, and more. All modals support both Form and JSON editing.</li>
      <li><b>Import/Export:</b> Use the Import/Export buttons to save or load your entire app state as a JSON file. Great for backups or sharing!</li>
      <li><b>Spaced Repetition (SRS):</b> Complete lessons and exercises to add them to your Daily Review queue for long-term retention.</li>
    </ol>
    <div style="margin-top:2rem;display:flex;justify-content:flex-end;">
      <button class="admin-btn" id="onboarding-gotit-btn">Got it!</button>
    </div>
  </div></div>`;
  modalRoot.style.pointerEvents = 'auto';
  document.getElementById('onboarding-gotit-btn').onclick = () => {
    localStorage.setItem('arcanum-onboarding-dismissed', '1');
    modalRoot.innerHTML = '';
    modalRoot.style.pointerEvents = 'none';
  };
}
// Show onboarding modal on first load
(function checkOnboarding() {
  if (!localStorage.getItem('arcanum-onboarding-dismissed')) {
    window.addEventListener('DOMContentLoaded', showOnboardingModal);
  }
})();

// Global reset function
window.resetApp = function() {
  if (confirm('This will clear all your data and reset the app to its initial state. Are you sure?')) {
    localStorage.clear();
    location.reload();
  }
};
