import * as state from './state.js';

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
  const profiles = state.getProfiles();
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
        state.setSelectedProfile(id);
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
        const profile = state.getProfiles().find(p => p.id === id);
        showEditProfileModal(profile);
      };
    });
    root.querySelectorAll('.delete-profile-btn').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.getAttribute('data-id'));
        if (confirm('Delete this profile?')) {
          state.deleteProfile(id);
          renderProfileSelection();
        }
      };
    });
    const bulkBtn = root.querySelector('#add-profile-bulk-btn');
    if (bulkBtn) bulkBtn.onclick = () => showBulkAddModal('profile');
  }
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
  if (courses.length > 1) {
    renderSkillTreeDashboard();
    return;
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
        <button class="navbar-link" id="nav-profile">Profile</button>
        <button class="navbar-link" id="nav-progress">Progress</button>
        <button class="navbar-link" id="nav-achievements">Achievements</button>
        ${renderResetDemoButton()}
        ${renderAdminSlider()}
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
          ${courses.map(course => `
            <div class="course-grid-card" tabindex="0" data-course-id="${course.id}">
              <div class="course-grid-icon">${course.icon}</div>
              <div class="course-grid-title">${course.title}</div>
              <div class="course-grid-desc">${course.desc}</div>
              <div class="course-grid-progress">
                <div class="xp-bar-bg">
                  <div class="xp-bar-fill" style="width:${course.percent}%"></div>
                </div>
                <span class="xp-label">${course.progress} / ${course.total} lessons</span>
              </div>
              ${admin ? `<div class="admin-course-actions">
                <button class="admin-btn edit-course-btn" data-id="${course.id}">Edit</button>
                <button class="admin-btn delete-course-btn" data-id="${course.id}">Delete</button>
              </div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
  // Course navigation
  root.querySelectorAll('.course-grid-card').forEach(card => {
    card.onclick = () => renderCourseView(parseInt(card.getAttribute('data-course-id')));
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') renderCourseView(parseInt(card.getAttribute('data-course-id'))); };
  });
  // Nav buttons
  root.querySelector('#nav-profile').onclick = renderProfileScreen;
  root.querySelector('#nav-progress').onclick = renderProgressScreen;
  root.querySelector('#nav-achievements').onclick = () => alert('Achievements view coming soon!');
  // Admin slider
  root.querySelector('#admin-mode-toggle').onchange = (e) => {
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
              <div class="accordion-body" id="acc-body-resources" style="display:none;">
                <ul>
                  <li><a href="#">Official Python Docs</a></li>
                  <li><a href="#">Python Tutorial (W3Schools)</a></li>
                  <li><a href="#">Real Python - Beginner Guide</a></li>
                </ul>
              </div>
            </div>
            <div class="accordion-item">
              <button class="accordion-header" data-acc-id="questions">Questions</button>
              <div class="accordion-body" id="acc-body-questions" style="display:none;">
                <ul>
                  <li>What is Python used for?</li>
                  <li>How do you install Python?</li>
                  <li>What is a variable?</li>
                </ul>
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
        <span class="navbar-title">${course.icon} ${course.title} / ${chapter.title}</span>
      </div>
      <div class="navbar-right">
        ${lessonDropdown}
        ${editLessonBtn}
        <button class="navbar-link" id="back-chapter">Back to Chapter</button>
        ${renderResetDemoButton()}
        ${renderAdminSlider()}
      </div>
    </nav>
    <section class="lesson-wide-view">
      <div class="lesson-wide-head">
        <h1 class="lesson-wide-title">${lesson.title}</h1>
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
            <span class="exercise-feedback" id="exercise-feedback"></span>
          </div>
        </main>
      </div>
    </section>
  `;
  // Render markdown (demo: just replace markdown with HTML)
  const codex = root.querySelector('#lesson-codex-md');
  codex.innerHTML = lessonContent
    .replace(/^# (.*)$/m, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\`\`\`python([\s\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
    .replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
    .replace(/\n/g, '<br>');
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
      const checked = root.querySelector('input[name=\"mcq\"]:checked');
      correct = checked && Number(checked.value) === exercise.correct;
    } else if (exercise.type === 'fill') {
      const val = root.querySelector('#exercise-fill').value.trim();
      correct = val.toLowerCase() === exercise.answer.toLowerCase();
    }
    const feedback = root.querySelector('#exercise-feedback');
    if (correct) {
      feedback.textContent = '✅ Correct!';
      feedback.style.color = '#3a7a3a';
    } else {
      feedback.textContent = '❌ Try again.';
      feedback.style.color = '#a44';
    }
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
        showModal(`
          <h2>Add Lessons (JSON)</h2>
          <textarea id="bulk-lesson-json" rows="8" style="width:100%;font-family:monospace;"></textarea>
          <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
            <button class="admin-btn" id="bulk-lesson-add-btn">Add</button>
            <button class="admin-btn" id="bulk-lesson-cancel-btn">Cancel</button>
          </div>
        `);
        document.getElementById('bulk-lesson-cancel-btn').onclick = closeModal;
        document.getElementById('bulk-lesson-add-btn').onclick = () => {
          const val = document.getElementById('bulk-lesson-json').value;
          try {
            const arr = JSON.parse(val);
            if (!Array.isArray(arr)) throw new Error('Must be an array');
            chapter.lessons = chapter.lessons.concat(arr.map(l => ({ ...l, id: Date.now() + Math.floor(Math.random()*10000) })));
            state.editCourse(course.id, { chapters: course.chapters });
            closeModal();
            renderLessonView(courseId, chapterId, chapter.lessons[chapter.lessons.length-1].id, 0);
          } catch (e) {
            alert('Invalid JSON: ' + e.message);
          }
        };
      };
    }
  }
  // Admin: Edit lesson
  if (admin && root.querySelector('#edit-lesson-btn')) {
    root.querySelector('#edit-lesson-btn').onclick = () => {
      showModal(`
        <h2>Edit Lesson</h2>
        <label>Title: <input id="edit-lesson-title" value="${lesson.title}"></label><br>
        <label>Content (Markdown):<br><textarea id="edit-lesson-content" rows="8" style="width:100%;font-family:monospace;">${lesson.content || ''}</textarea></label><br>
        <label>Exercises (JSON):<br><textarea id="edit-lesson-exercises" rows="8" style="width:100%;font-family:monospace;">${JSON.stringify(lesson.exercises || exercises, null, 2)}</textarea></label>
        <div style="margin-top:1rem;display:flex;gap:1rem;justify-content:flex-end;">
          <button class="admin-btn" id="save-lesson-btn">Save</button>
          <button class="admin-btn" id="cancel-lesson-btn">Cancel</button>
        </div>
      `);
      document.getElementById('cancel-lesson-btn').onclick = closeModal;
      document.getElementById('save-lesson-btn').onclick = () => {
        lesson.title = document.getElementById('edit-lesson-title').value;
        lesson.content = document.getElementById('edit-lesson-content').value;
        try {
          lesson.exercises = JSON.parse(document.getElementById('edit-lesson-exercises').value);
        } catch (e) {
          alert('Invalid exercises JSON: ' + e.message);
          return;
        }
        state.editCourse(course.id, { chapters: course.chapters });
        closeModal();
        renderLessonView(courseId, chapterId, lesson.id, 0);
      };
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

function showModalTabbed({title, formHtml, jsonTemplate, onFormMount, onJsonMount, jsonFaq}) {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `<div class="modal-overlay"><div class="modal-content modal-lg">
    <div class="modal-tabs">
      <button class="modal-tab-btn active" data-tab="form">Form</button>
      <button class="modal-tab-btn" data-tab="json">JSON Template</button>
      ${jsonFaq ? '<button class="modal-tab-btn" data-tab="faq">FAQ</button>' : ''}
    </div>
    <div class="modal-tab-content modal-tab-form">${formHtml}</div>
    <div class="modal-tab-content modal-tab-json" style="display:none;">
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
    modalRoot.querySelector('.modal-tab-json').style.display = btn.dataset.tab === 'json' ? '' : 'none';
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
  if (onJsonMount) onJsonMount();
}

function showBulkAddModal(type) {
  const jsonTemplate = type === 'course' ?
`[
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
]`
:
`{
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
    title: `Add ${type === 'course' ? 'Courses' : 'Full App State'}`,
    formHtml: `
      <h2>Add ${type === 'course' ? 'Courses' : 'Full App State'} (JSON)</h2>
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
          if (type === 'course') state.addCourses(arr);
          else if (type === 'profile') {
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

function showEditProfileModal(profile) {
  const jsonTemplate = `{
  "name": "${profile.name}",
  "avatar": "${profile.avatar}"
}`;
  showModalTabbed({
    title: 'Edit Profile',
    formHtml: `
      <h2>Edit Profile</h2>
      <label>Name: <input id="edit-profile-name" value="${profile.name}"></label><br>
      <label>Avatar URL: <input id="edit-profile-avatar" value="${profile.avatar}"></label><br>
      <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button class="admin-btn" id="save-profile-btn">Save</button>
        <button class="admin-btn" id="delete-profile-btn">Delete</button>
        <button class="admin-btn" id="cancel-profile-btn">Cancel</button>
      </div>
    `,
    jsonTemplate,
    onFormMount: () => {
      document.getElementById('save-profile-btn').onclick = () => {
        state.editProfile(profile.id, {
          name: document.getElementById('edit-profile-name').value,
          avatar: document.getElementById('edit-profile-avatar').value
        });
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
    }
  });
}

function showEditCourseModal(course) {
  const jsonTemplate = `{
  "title": "${course.title}",
  "desc": "${course.desc}",
  "icon": "${course.icon}"
}`;
  showModalTabbed({
    title: 'Edit Course',
    formHtml: `
      <h2>Edit Course</h2>
      <label>Title: <input id="edit-course-title" value="${course.title}"></label><br>
      <label>Description: <input id="edit-course-desc" value="${course.desc}"></label><br>
      <label>Icon: <input id="edit-course-icon" value="${course.icon}"></label><br>
      <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button class="admin-btn" id="save-course-btn">Save</button>
        <button class="admin-btn" id="delete-course-btn">Delete</button>
        <button class="admin-btn" id="cancel-course-btn">Cancel</button>
      </div>
    `,
    jsonTemplate,
    onFormMount: () => {
      document.getElementById('save-course-btn').onclick = () => {
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

// Patch showModalTabbed to support FAQ tab if jsonFaq is provided
const origShowModalTabbed = showModalTabbed;
showModalTabbed = function(opts) {
  const { title, formHtml, jsonTemplate, onFormMount, onJsonMount, jsonFaq } = opts;
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `<div class="modal-overlay"><div class="modal-content modal-lg">
    <div class="modal-tabs">
      <button class="modal-tab-btn active" data-tab="form">Form</button>
      <button class="modal-tab-btn" data-tab="json">JSON Template</button>
      ${jsonFaq ? '<button class="modal-tab-btn" data-tab="faq">FAQ</button>' : ''}
    </div>
    <div class="modal-tab-content modal-tab-form">${formHtml}</div>
    <div class="modal-tab-content modal-tab-json" style="display:none;">
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
    modalRoot.querySelector('.modal-tab-json').style.display = btn.dataset.tab === 'json' ? '' : 'none';
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
  if (onJsonMount) onJsonMount();
};

// --- Add/Edit/Bulk JSON for Chapters ---
function showBulkAddChaptersModal(courseId) {
  const jsonTemplate = `[
  {
    "id": 201,
    "title": "New Chapter",
    "desc": "Chapter description...",
    "icon": "📖",
    "lessons": []
  }
]`;
  const faqHtml = `<b>Chapters FAQ</b><ul><li><b>id</b>: Unique number</li><li><b>title</b>: Chapter name</li><li><b>desc</b>: Description</li><li><b>icon</b>: Emoji/icon</li><li><b>lessons</b>: Array of lessons</li></ul>`;
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
  const jsonTemplate = `[
  {
    "id": 301,
    "title": "New Lesson",
    "content": "Lesson content...",
    "exercises": []
  }
]`;
  const faqHtml = `<b>Lessons FAQ</b><ul><li><b>id</b>: Unique number</li><li><b>title</b>: Lesson name</li><li><b>content</b>: Markdown/HTML</li><li><b>exercises</b>: Array of exercises</li></ul>`;
  showModalTabbed({
    title: 'Bulk Add Lessons (JSON)',
    formHtml: `<h2>Bulk Add Lessons (JSON)</h2><textarea id="bulk-lessons-json" rows="10"></textarea><div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;"><button class="admin-btn" id="bulk-add-lessons-btn">Add</button><button class="admin-btn" id="bulk-cancel-lessons-btn">Cancel</button></div>`,
    jsonTemplate,
    jsonFaq: faqHtml,
    onFormMount: () => {
      document.getElementById('bulk-cancel-lessons-btn').onclick = closeModal;
      document.getElementById('bulk-add-lessons-btn').onclick = () => {
        try {
          const arr = JSON.parse(document.getElementById('bulk-lessons-json').value);
          const course = state.getCourses().find(c => c.id == courseId);
          const chapter = course && course.chapters.find(ch => ch.id == chapterId);
          if (Array.isArray(arr) && chapter) {
            chapter.lessons = chapter.lessons.concat(arr);
            state.editCourse(course.id, { chapters: course.chapters });
            closeModal();
            renderCourseWideChaptersView(course, course.chapters, chapterId);
          }
        } catch (e) { alert('Invalid JSON: ' + e.message); }
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
