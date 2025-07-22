# Arcanum: Local-First Gamified Learning Platform

**Arcanum** is a local-first, profile-based, highly interactive learning engine inspired by RPG and skill-tree learning platforms. It is built with HTML, CSS, and vanilla JavaScript (ES6+ modules), and runs entirely in your browser—no server or backend required.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [App Structure & Navigation](#app-structure--navigation)
- [Profiles & Progress](#profiles--progress)
- [Courses, Chapters, Lessons](#courses-chapters-lessons)
- [Exercises & Supported Types](#exercises--supported-types)
- [Admin Mode & Content Management](#admin-mode--content-management)
- [Import/Export & JSON Structure](#importexport--json-structure)
- [Themes & UI](#themes--ui)
- [Spaced Repetition System (SRS)](#spaced-repetition-system-srs)
- [Skill Tree Dashboard](#skill-tree-dashboard)
- [Achievements & Progress Tracking](#achievements--progress-tracking)
- [FAQ & Tips](#faq--tips)
- [Development & Customization](#development--customization)

---

## Features

- **Multi-user profiles** with individual XP, levels, streaks, achievements, and SRS queue.
- **Hierarchical content:** Courses > Chapters > Lessons > Exercises.
- **Dynamic UI:** All screens are rendered dynamically for a modern, app-like experience.
- **Admin Mode:** Intuitive CRUD for all content (profiles, courses, chapters, lessons, exercises, accordions) via modals with both Form and JSON editing.
- **Import/Export:** Save or load the entire app state as a single JSON file.
- **Drag-and-drop reordering** for courses, chapters, lessons, and accordion items.
- **Skill tree dashboard** for visualizing course dependencies.
- **Spaced Repetition System (SRS):** Daily review queue for long-term retention.
- **Dual themes:** Light Academia and Dark Academia, with polished CSS and animations.
- **Markdown support** for lesson content and answers.
- **Achievements, progress, and activity tracking** for gamified learning.

---

## Getting Started

1. **Clone or Download** this repository.
2. **Open `arcanum/index.html`** in your browser. No build step or server required.
3. **Start learning!** Create a profile, explore the demo course, or import your own content via JSON.

---

## App Structure & Navigation

- **Profile Selection:** Choose or create a profile. Import/export app state from here.
- **Dashboard:** View all available courses as a grid or skill tree. See your XP, streak, and achievements.
- **Course View:** See chapters in a wide, centered list with progress bars and accordions for resources/questions.
- **Lesson View:** Immersive split-screen: left for lesson content ("The Codex"), right for exercises ("The Crucible").
- **Profile Screen:** View your avatar, stats, achievements, and detailed logs.
- **Progress & Achievements:** Full-screen views for overall progress and unlocked achievements.
- **Daily Review:** SRS queue for spaced repetition practice.

---

## Profiles & Progress

- Each profile tracks:
  - Name, avatar, level, XP, streak, achievements
  - Completed lessons, chapters, courses
  - Exercise log (success/fail, timestamp)
  - SRS queue for spaced repetition
- Switch profiles at any time from the dashboard.

---

## Courses, Chapters, Lessons

- **Courses** contain chapters, each with lessons.
- **Chapters** have:
  - Title, description, icon
  - Resources (links)
  - Questions (with Markdown answers)
  - Lessons (with content and exercises)
- **Lessons** have:
  - Title, Markdown content
  - Array of exercises (see below)

---

## Exercises & Supported Types

Each lesson can have multiple exercises. Supported types:

- **MCQ (Multiple Choice):**
  - `type: "mcq"`
  - `prompt`: Question text
  - `options`: Array of choices
  - `answer`: Index of correct option

- **Fill-in-the-blank:**
  - `type: "fill"`
  - `prompt`: Question text
  - `answer`: Correct answer (string)

- **Code:**
  - `type: "code"`
  - `prompt`: Coding task
  - `starter`: Starter code
  - `solution`: Correct solution

- **Drag-and-drop:**
  - `type: "drag"`
  - `prompt`: Task description
  - `items`: Array of draggable items
  - `order`: Array of indices for correct order

- **Order:**
  - `type: "order"`
  - `prompt`: Task description
  - `items`: Array of items to order
  - `order`: Array of indices for correct order

**All exercise types support a “Show Answer” button.**

---

## Admin Mode & Content Management

- **Enable Admin Mode** via the slider in the navbar.
- **CRUD Operations:** Add, edit, or delete profiles, courses, chapters, lessons, exercises, and accordion items.
- **Modals:** All add/edit modals have:
  - **Form tab:** User-friendly fields with hints/examples.
  - **JSON tab:** Direct JSON editing.
  - **JSON Template tab:** Example structure and FAQ.
- **Bulk Add:** Import multiple items at once via JSON.
- **Drag-and-drop:** Reorder items visually at every level.

---

## Import/Export & JSON Structure

- **Export:** Download the full app state as a JSON file from the dashboard or profile screen.
- **Import:** Load a JSON file or paste JSON to restore or share your app state.
- **Data Model:** See `arcanum/genki-demo-app.json` for a complete example.
- **All content, progress, and settings are stored in your browser’s localStorage.**

---

## Themes & UI

- **Light Academia** and **Dark Academia** themes.
- **Theme switcher** in the navbar.
- **Responsive, accessible, and animated** UI.
- **Modals** are large, readable, and aesthetic.

---

## Spaced Repetition System (SRS)

- **Daily Review:** Lessons and exercises you’ve completed are added to your SRS queue.
- **SRS Queue:** Each item tracks last reviewed, next review, interval, ease, streak, and failures.
- **Review logic:** Based on the SM-2 algorithm (like Anki).
- **Access:** “Daily Review” button on the dashboard.

---

## Skill Tree Dashboard

- **Visualizes course dependencies** as a radial skill tree (SVG).
- **Click nodes** to enter courses.
- **Drag-and-drop** to reorder courses (admin mode).

---

## Achievements & Progress Tracking

- **Achievements:** 20+ unlockable badges for milestones.
- **Progress Screen:** See overall stats, course progress, and recent activity.
- **Profile Screen:** Detailed logs of lessons, exercises, streaks, and more.

---

## FAQ & Tips

- **How do I add new content?**
  - Enable Admin Mode, then use the “+” buttons or edit existing items.
  - Use the Form tab for guided entry, or the JSON tab for advanced editing.

- **How do I import/export my data?**
  - Use the “Import from JSON” and “Save & Export” buttons on the dashboard or profile screen.

- **What if I break something?**
  - You can always reset to demo data or re-import a previous JSON backup.

- **How do I use the SRS?**
  - Complete lessons/exercises; they’ll appear in your Daily Review queue automatically.

- **How do I switch themes?**
  - Click the candle icon in the navbar.

---

## Development & Customization

- **All code is in `arcanum/js/`** (modular ES6+).
- **Styling in `arcanum/css/`** (`style.css` and `themes.css`).
- **Demo data in `arcanum/genki-demo-app.json`**.
- **Markdown rendering** via `arcanum/js/lib/marked.js`.
- **No build step required.** Just open `index.html`!

---

## License

This project is for personal, educational, and non-commercial use.

---

**Enjoy your journey with Arcanum!**  
For questions, suggestions, or to contribute, open an issue or PR.
