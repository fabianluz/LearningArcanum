# Arcanum: Local-First Gamified Learning Platform

**Arcanum** is a comprehensive, local-first, profile-based learning engine inspired by RPG and skill-tree learning platforms. Built with HTML, CSS, and vanilla JavaScript (ES6+ modules), it runs entirely in your browser—no server or backend required.

---

## 🌟 Features Overview

### Core Learning Features
- **Multi-user profiles** with individual XP, levels, streaks, achievements, and SRS queue
- **Hierarchical content structure:** Courses → Chapters → Lessons → Exercises
- **Spaced Repetition System (SRS)** for optimal learning retention
- **Daily Review system** with due items tracking
- **Progress tracking** with detailed analytics and logs
- **Achievement system** with unlockable badges
- **Skill tree dashboard** for visualizing course dependencies

### Content Management
- **Admin Mode** with full CRUD operations for all content
- **Form-based editing** with intuitive interfaces
- **JSON editing** for advanced users
- **Bulk import/export** functionality
- **Drag-and-drop reordering** for courses, chapters, lessons, and accordion items
- **Real-time content updates** without page refresh

### Exercise Types
- **Multiple Choice Questions (MCQ)** with customizable options
- **Fill-in-the-blank** exercises with text validation
- **Code exercises** with starter code and solution validation
- **Drag-and-drop** exercises (framework ready)
- **Ordering exercises** (framework ready)

### User Interface
- **Dual themes:** Light Academia and Dark Academia
- **Responsive design** that works on desktop and mobile
- **Split-screen lesson view** with content and exercises side-by-side
- **Markdown support** for rich lesson content
- **Accessibility features** with ARIA labels and keyboard navigation
- **Smooth animations** and transitions

### Data Management
- **Local storage** for persistent data
- **Import/Export** entire app state as JSON
- **Profile switching** with individual progress tracking
- **Exercise logging** with success/failure tracking
- **SRS scheduling** with intelligent intervals

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### Installation & Setup

#### Option 1: Direct File Opening (Simplest)
1. **Download or clone** this repository
2. **Navigate** to the `arcanum` folder
3. **Double-click** `index.html` to open in your default browser

#### Option 2: Local Server (Recommended for Development)

**macOS:**
```bash
# Using Python 3 (pre-installed on macOS)
cd /path/to/arcanum
python3 -m http.server 8000
# Open http://localhost:8000 in your browser

# Using Node.js (if installed)
cd /path/to/arcanum
npx http-server
# Open http://localhost:8080 in your browser
```

**Linux:**
```bash
# Using Python 3
cd /path/to/arcanum
python3 -m http.server 8000
# Open http://localhost:8000 in your browser

# Using Node.js (if installed)
cd /path/to/arcanum
npx http-server
# Open http://localhost:8080 in your browser

# Using PHP (if installed)
cd /path/to/arcanum
php -S localhost:8000
# Open http://localhost:8000 in your browser
```

**Windows:**
```cmd
# Using Python 3 (if installed)
cd C:\path\to\arcanum
python -m http.server 8000
# Open http://localhost:8000 in your browser

# Using Node.js (if installed)
cd C:\path\to\arcanum
npx http-server
# Open http://localhost:8080 in your browser

# Using PowerShell (Windows 10+)
cd C:\path\to\arcanum
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

### Step-by-Step Setup Instructions

#### macOS Setup
1. **Download the repository:**
   - Visit the repository page
   - Click the green "Code" button
   - Select "Download ZIP"
   - Extract the ZIP file to your desired location

2. **Open Terminal:**
   - Press `Cmd + Space` to open Spotlight
   - Type "Terminal" and press Enter

3. **Navigate to the project:**
   ```bash
   cd ~/Downloads/arcanum-main/arcanum
   # or wherever you extracted the files
   ```

4. **Start the server:**
   ```bash
   python3 -m http.server 8000
   ```

5. **Open your browser:**
   - Press `Cmd + T` to open a new tab
   - Navigate to `http://localhost:8000`
   - The app should load immediately

#### Linux Setup
1. **Download the repository:**
   ```bash
   git clone https://github.com/your-repo/arcanum.git
   cd arcanum
   ```

2. **Start the server:**
   ```bash
   python3 -m http.server 8000
   ```

3. **Open your browser:**
   - Press `Ctrl + T` to open a new tab
   - Navigate to `http://localhost:8000`
   - The app should load immediately

#### Windows Setup
1. **Download the repository:**
   - Visit the repository page
   - Click the green "Code" button
   - Select "Download ZIP"
   - Extract the ZIP file to your desired location

2. **Open Command Prompt:**
   - Press `Win + R`
   - Type `cmd` and press Enter

3. **Navigate to the project:**
   ```cmd
   cd C:\path\to\arcanum
   ```

4. **Start the server:**
   ```cmd
   python -m http.server 8000
   ```

5. **Open your browser:**
   - Press `Ctrl + T` to open a new tab
   - Navigate to `http://localhost:8000`
   - The app should load immediately

---

## 📱 App Structure & Navigation

### Main Views

#### 1. **Profile Selection Screen**
- **Purpose:** Choose or create a user profile
- **Features:**
  - Profile cards with avatars and stats
  - Create new profile button
  - Import/Export functionality
  - Admin mode toggle
  - Bulk profile import (admin mode)

#### 2. **Dashboard View**
- **Purpose:** Overview of all available courses
- **Features:**
  - Course grid layout
  - Skill tree visualization
  - Profile stats (XP, level, streak)
  - Navigation to other screens
  - Admin controls

#### 3. **Course View**
- **Purpose:** Display chapters within a course
- **Features:**
  - Wide chapter list with progress bars
  - Accordion sections for resources and questions
  - Chapter completion tracking
  - Admin editing capabilities

#### 4. **Lesson View**
- **Purpose:** Immersive learning experience
- **Features:**
  - Split-screen layout: "The Codex" (content) and "The Crucible" (exercises)
  - Markdown-rendered lesson content
  - Multiple exercise types
  - Progress tracking
  - Navigation between lessons

#### 5. **Profile Screen**
- **Purpose:** Detailed user profile and statistics
- **Features:**
  - Avatar and basic info
  - XP and level progression
  - Achievement badges
  - Exercise history log
  - Settings and preferences

#### 6. **Progress Screen**
- **Purpose:** Comprehensive progress analytics
- **Features:**
  - Course completion percentages
  - Chapter and lesson progress
  - Exercise success rates
  - Time-based activity charts
  - Export functionality

#### 7. **Achievements Screen**
- **Purpose:** Gamification and motivation
- **Features:**
  - Unlocked achievement badges
  - Achievement descriptions
  - Progress towards next achievements
  - Achievement categories

#### 8. **Daily Review Screen**
- **Purpose:** Spaced repetition practice
- **Features:**
  - Due items from SRS queue
  - Review interface for lessons and exercises
  - Success/failure tracking
  - Streak maintenance
  - SRS algorithm explanation

### Navigation Structure
```
Profile Selection
├── Dashboard
│   ├── Course Grid View
│   ├── Skill Tree View
│   ├── Profile Screen
│   ├── Progress Screen
│   ├── Achievements Screen
│   └── Daily Review Screen
├── Course View
│   ├── Chapter List
│   └── Chapter View
│       └── Lesson View
│           └── Exercise Interface
└── Admin Mode
    ├── Profile Management
    ├── Course Management
    ├── Chapter Management
    ├── Lesson Management
    └── Exercise Management
```

---

## 👤 Profiles & Progress System

### Profile Features
- **Individual tracking** for each user
- **XP system** with level progression
- **Daily streaks** for consistent learning
- **Achievement badges** for motivation
- **SRS queue** for spaced repetition
- **Exercise logs** with timestamps
- **Settings** including theme preferences

### Progress Tracking
- **Course completion** percentages
- **Chapter progress** with visual indicators
- **Lesson completion** tracking
- **Exercise success rates** and history
- **Time-based analytics** and charts
- **Export capabilities** for data backup

### SRS (Spaced Repetition System)
- **Intelligent scheduling** based on performance
- **Daily review queue** with due items
- **Success/failure tracking** to adjust intervals
- **Streak maintenance** for motivation
- **Optimal retention** through spaced intervals

---

## 📚 Content Management

### Course Structure
```
Course
├── Basic Info (title, description, icon, tags)
├── Goals and Summary
├── Chapters
│   ├── Basic Info (title, description, icon)
│   ├── Goals and Summary
│   ├── Resources (external links)
│   ├── Questions (with markdown answers)
│   └── Lessons
│       ├── Basic Info (title, content)
│       └── Exercises
│           ├── MCQ (multiple choice)
│           ├── Fill-in-the-blank
│           ├── Code exercises
│           ├── Drag-and-drop
│           └── Ordering exercises
└── Prerequisites (for skill tree)
```

### Admin Mode Features
- **Toggle admin mode** from any screen
- **Form-based editing** for easy content creation
- **JSON editing** for advanced users
- **Bulk operations** for efficient management
- **Drag-and-drop reordering** of content
- **Real-time preview** of changes
- **Import/Export** of entire content structure

### Content Types

#### Courses
- Title, description, icon, tags
- Goals and learning objectives
- Prerequisites for skill tree
- Chapter organization

#### Chapters
- Title, description, icon
- Learning goals and summary
- External resources (links)
- Review questions with answers
- Lesson organization

#### Lessons
- Title and markdown content
- Multiple exercise types
- Progress tracking
- SRS integration

#### Exercises
- **MCQ:** Multiple choice with custom options
- **Fill:** Text-based answers with validation
- **Code:** Programming exercises with starter code
- **Drag:** Drag-and-drop interactions (framework ready)
- **Order:** Sequence ordering exercises (framework ready)

---

## 🎨 User Interface & Themes

### Design Philosophy
- **Academia-inspired** aesthetic
- **Light and Dark themes** for user preference
- **Responsive design** for all screen sizes
- **Accessibility-first** approach
- **Smooth animations** and transitions

### Theme System
- **Light Academia:** Warm, paper-like colors
- **Dark Academia:** Rich, scholarly dark theme
- **CSS custom properties** for easy customization
- **Theme persistence** across sessions

### UI Components
- **Navigation bars** with consistent layout
- **Modal dialogs** for focused interactions
- **Cards and panels** for content organization
- **Progress indicators** and visual feedback
- **Form controls** with validation
- **Button states** and hover effects

---

## 🔧 Technical Architecture

### File Structure
```
arcanum/
├── index.html              # Main entry point
├── css/
│   ├── style.css           # Main stylesheet
│   └── themes.css          # Theme definitions
├── js/
│   ├── main.js             # App initialization
│   ├── state.js            # State management
│   ├── ui.js               # UI rendering
│   ├── profileManager.js   # Profile operations
│   ├── dragDrop.js         # Drag-and-drop functionality
│   └── lib/
│       └── marked.js       # Markdown parser
├── images/                 # Static assets
├── lib/                    # External libraries
├── genki-demo-app.json     # Demo content
└── README.md               # This file
```

### Technology Stack
- **HTML5** for structure
- **CSS3** with custom properties for theming
- **Vanilla JavaScript (ES6+)** with modules
- **Local Storage** for data persistence
- **Markdown** for content formatting
- **SVG** for skill tree visualization

### Key Features
- **Module-based architecture** for maintainability
- **Event-driven UI** with clean separation
- **State management** with localStorage persistence
- **Responsive design** with CSS Grid and Flexbox
- **Accessibility** with ARIA labels and keyboard navigation

---

## 📊 Data Management

### Local Storage
- **App state** persistence across sessions
- **Profile data** with individual progress
- **Course content** and user progress
- **Settings** and preferences
- **SRS queue** and scheduling data

### Import/Export
- **Complete app state** export as JSON
- **Profile-specific** data export
- **Content-only** export for sharing
- **Bulk import** for content management
- **Data validation** and error handling

### Data Structure
```json
{
  "profiles": [...],
  "courses": [...],
  "achievements": [...],
  "selectedProfileId": 1,
  "adminMode": false,
  "appSettings": {...}
}
```

---

## 🎯 Exercise System

### Exercise Types

#### Multiple Choice Questions (MCQ)
```json
{
  "type": "mcq",
  "prompt": "What is Python?",
  "options": ["A snake", "A programming language", "A car"],
  "answer": 1
}
```

#### Fill-in-the-blank
```json
{
  "type": "fill",
  "prompt": "Python is a ____ language.",
  "answer": "programming"
}
```

#### Code Exercises
```json
{
  "type": "code",
  "prompt": "Write a Hello World program.",
  "starter": "print('')",
  "solution": "print('Hello, World!')"
}
```

### Exercise Features
- **Real-time validation** and feedback
- **Success/failure tracking** for SRS
- **Progress persistence** across sessions
- **Multiple attempts** with learning analytics
- **Markdown support** in prompts and feedback

---

## 🔐 Admin Mode

### Access
- **Toggle switch** available on all screens
- **Persistent setting** across sessions
- **No authentication** required (local-first design)

### Capabilities
- **Create, edit, delete** all content types
- **Bulk operations** for efficient management
- **Drag-and-drop reordering** of content
- **JSON import/export** for advanced users
- **Real-time preview** of changes
- **Form and JSON editing** modes

### Content Management
- **Profiles:** Create and manage user profiles
- **Courses:** Full course lifecycle management
- **Chapters:** Organize course content
- **Lessons:** Create learning materials
- **Exercises:** Build interactive assessments

---

## 🎮 Gamification Features

### Achievement System
- **Unlockable badges** for milestones
- **Progress tracking** towards achievements
- **Motivational rewards** for consistent learning
- **Achievement categories** and descriptions

### Progress Tracking
- **XP system** with level progression
- **Daily streaks** for habit formation
- **Completion percentages** for courses
- **Exercise success rates** and analytics
- **Time-based activity** tracking

### SRS Integration
- **Spaced repetition** for optimal retention
- **Daily review queue** with due items
- **Success/failure tracking** to adjust intervals
- **Streak maintenance** for motivation

---

## 🛠️ Development & Customization

### Adding New Exercise Types
1. **Define the exercise structure** in JSON
2. **Add rendering logic** in `ui.js`
3. **Implement validation** and feedback
4. **Update admin forms** for creation/editing
5. **Add to exercise type selector**

### Customizing Themes
1. **Edit `css/themes.css`** for color schemes
2. **Modify CSS custom properties** for consistency
3. **Add new theme classes** as needed
4. **Update theme switcher** logic

### Extending Content Types
1. **Update state management** in `state.js`
2. **Add rendering functions** in `ui.js`
3. **Create admin forms** for management
4. **Update import/export** functionality

### Performance Optimization
- **Code splitting** for large files
- **CSS minification** for production
- **Image optimization** for faster loading
- **Lazy loading** for large content sets

---

## 🤖 Prompts

Use these JSON templates with LLMs like Gemini, ChatGPT, or Claude to convert your notes, textbooks, or learning materials into Arcanum-compatible content. Simply copy the template and ask the LLM to fill it with your content.

### Course Template

**Prompt:** "Convert my [subject] notes into an Arcanum course using this template. Include multiple chapters with lessons and exercises."

```json
{
  "id": 1,
  "title": "Your Course Title",
  "desc": "A comprehensive description of what this course covers and who it's for.",
  "icon": "📚",
  "summary": "By the end of this course, you will be able to [list key learning outcomes].",
  "tags": ["subject", "level", "category"],
  "image": "course-icon.png",
  "goals": [
    "First learning objective",
    "Second learning objective",
    "Third learning objective"
  ],
  "chapters": [
    {
      "id": 101,
      "title": "Chapter 1: Introduction",
      "desc": "Brief description of what this chapter covers.",
      "summary": "What students will learn in this chapter.",
      "goals": [
        "Specific goal for this chapter",
        "Another specific goal"
      ],
      "resources": [
        {"label": "External Resource Name", "url": "https://example.com"},
        {"label": "Another Resource", "url": "https://example2.com"}
      ],
      "questions": [
        {"question": "Review question about the chapter?", "answer": "Detailed answer with explanation."},
        {"question": "Another review question?", "answer": "Another detailed answer."}
      ],
      "lessons": [
        {
          "id": 1001,
          "title": "Lesson 1: Basic Concepts",
          "content": "# Lesson Title\n\n## Introduction\nYour lesson content in Markdown format.\n\n## Key Points\n- Point 1\n- Point 2\n- Point 3\n\n## Examples\nHere are some examples:\n\n```code\nexample code here\n```\n\n## Summary\nBrief summary of what was covered.",
          "exercises": [
            {
              "type": "mcq",
              "prompt": "What is the main concept covered in this lesson?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": 1
            },
            {
              "type": "fill",
              "prompt": "Complete the sentence: The main idea is __________.",
              "answer": "your answer here"
            },
            {
              "type": "code",
              "prompt": "Write a simple program that demonstrates the concept.",
              "starter": "// Your starter code here\n",
              "solution": "// Complete solution here"
            }
          ]
        }
      ]
    }
  ]
}
```

### Chapter Template

**Prompt:** "Convert my [topic] notes into an Arcanum chapter with lessons and exercises."

```json
{
  "id": 102,
  "title": "Chapter Title",
  "desc": "Description of what this chapter covers and its importance.",
  "summary": "What students will learn and be able to do after this chapter.",
  "goals": [
    "Specific learning goal 1",
    "Specific learning goal 2",
    "Specific learning goal 3"
  ],
  "resources": [
    {"label": "Helpful Website", "url": "https://example.com/helpful-resource"},
    {"label": "Video Tutorial", "url": "https://youtube.com/watch?v=example"},
    {"label": "Practice Exercises", "url": "https://example.com/practice"}
  ],
  "questions": [
    {"question": "What is the key concept introduced in this chapter?", "answer": "Detailed explanation of the key concept with examples."},
    {"question": "How does this chapter relate to previous material?", "answer": "Explanation of connections and building upon previous knowledge."},
    {"question": "What are the main takeaways from this chapter?", "answer": "List and explanation of the most important points to remember."}
  ],
  "lessons": [
    {
      "id": 1002,
      "title": "Lesson Title",
      "content": "# Lesson Content\n\n## Overview\nBrief introduction to the lesson.\n\n## Main Concepts\nDetailed explanation of the main concepts.\n\n### Sub-concept 1\nExplanation with examples.\n\n### Sub-concept 2\nMore detailed explanation.\n\n## Examples\n\n### Example 1\n```\ncode example here\n```\n\n### Example 2\nStep-by-step walkthrough.\n\n## Practice\nGuidance for practice exercises.\n\n## Summary\nKey points to remember.",
      "exercises": [
        {
          "type": "mcq",
          "prompt": "Which of the following best describes the main concept?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 2
        },
        {
          "type": "fill",
          "prompt": "The key principle is that __________ determines __________.",
          "answer": "first blank, second blank"
        },
        {
          "type": "code",
          "prompt": "Write a function that implements the concept we just learned.",
          "starter": "function example() {\n    // Your code here\n}",
          "solution": "function example() {\n    return 'correct implementation';\n}"
        }
      ]
    }
  ]
}
```

### Lesson Template

**Prompt:** "Convert my [topic] notes into an Arcanum lesson with exercises."

```json
{
  "id": 1003,
  "title": "Lesson Title",
  "content": "# Lesson Title\n\n## Introduction\nStart with an engaging introduction that hooks the learner.\n\n## Main Content\nBreak down your content into logical sections.\n\n### Section 1: Basic Concepts\nExplain the foundational ideas.\n\n### Section 2: Advanced Topics\nBuild upon the basics.\n\n## Examples\nProvide concrete examples to illustrate concepts.\n\n### Example 1\n```\ncode or example here\n```\n\n### Example 2\nStep-by-step walkthrough.\n\n## Common Mistakes\nWarn about typical errors or misconceptions.\n\n## Summary\nRecap the key points.\n\n## Next Steps\nWhat to practice or learn next.",
  "exercises": [
    {
      "type": "mcq",
      "prompt": "What is the primary purpose of this concept?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 1
    },
    {
      "type": "fill",
      "prompt": "The main idea is that __________ leads to __________.",
      "answer": "cause, effect"
    },
    {
      "type": "code",
      "prompt": "Implement the concept we just learned in code.",
      "starter": "// Starter code\nfunction implement() {\n    // Your implementation\n}",
      "solution": "// Complete solution\nfunction implement() {\n    return 'working solution';\n}"
    }
  ]
}
```

### Exercise Templates

#### Multiple Choice Question (MCQ)
```json
{
  "type": "mcq",
  "prompt": "What is the correct answer to this question?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 2
}
```

#### Fill-in-the-blank
```json
{
  "type": "fill",
  "prompt": "Complete the sentence: The key concept is __________.",
  "answer": "correct answer"
}
```

#### Code Exercise
```json
{
  "type": "code",
  "prompt": "Write a function that [describe the task].",
  "starter": "function example() {\n    // Your code here\n}",
  "solution": "function example() {\n    return 'correct solution';\n}"
}
```

### Complete Course Example (Python Programming)

**Prompt:** "Create a complete Python programming course for beginners using this template."

```json
{
  "id": 1,
  "title": "Python Programming for Beginners",
  "desc": "A comprehensive introduction to Python programming language, covering basic syntax, data structures, and problem-solving techniques.",
  "icon": "🐍",
  "summary": "By the end of this course, you will be able to write Python programs, understand basic programming concepts, and solve simple computational problems.",
  "tags": ["python", "programming", "beginner", "computer-science"],
  "image": "python-icon.png",
  "goals": [
    "Understand Python syntax and basic programming concepts",
    "Work with variables, data types, and control structures",
    "Write functions and use built-in libraries",
    "Solve problems using Python programming"
  ],
  "chapters": [
    {
      "id": 101,
      "title": "Getting Started with Python",
      "desc": "Introduction to Python programming language, installation, and your first program.",
      "summary": "You will learn what Python is, how to install it, and write your first 'Hello World' program.",
      "goals": [
        "Understand what Python is and its applications",
        "Install Python on your computer",
        "Write and run your first Python program",
        "Use the Python interactive shell"
      ],
      "resources": [
        {"label": "Python Official Website", "url": "https://python.org"},
        {"label": "Python Installation Guide", "url": "https://python.org/downloads/"},
        {"label": "Online Python Interpreter", "url": "https://replit.com"}
      ],
      "questions": [
        {"question": "What is Python and why is it popular?", "answer": "Python is a high-level, interpreted programming language known for its simplicity and readability. It's popular because of its clean syntax, extensive libraries, and wide range of applications from web development to data science."},
        {"question": "How do you run a Python program?", "answer": "You can run a Python program by saving it with a .py extension and running 'python filename.py' in the terminal, or by using an IDE that has a run button."}
      ],
      "lessons": [
        {
          "id": 1001,
          "title": "What is Python?",
          "content": "# What is Python?\n\n## Introduction\nPython is a powerful, high-level programming language that was created by Guido van Rossum and released in 1991.\n\n## Why Python?\n- **Easy to learn**: Simple, readable syntax\n- **Versatile**: Used in web development, data science, AI, and more\n- **Large community**: Extensive libraries and frameworks\n- **Cross-platform**: Runs on Windows, Mac, and Linux\n\n## Python's Philosophy\nPython follows the philosophy of 'Simple is better than complex' and 'Readability counts'.\n\n## Applications\n- Web Development (Django, Flask)\n- Data Science (Pandas, NumPy)\n- Artificial Intelligence (TensorFlow, PyTorch)\n- Automation and Scripting\n- Game Development\n\n## Getting Started\nTo start learning Python, you'll need to install it on your computer and set up a development environment.",
          "exercises": [
            {
              "type": "mcq",
              "prompt": "What year was Python first released?",
              "options": ["1989", "1991", "1995", "2000"],
              "answer": 1
            },
            {
              "type": "fill",
              "prompt": "Python is known for its __________ and __________ syntax.",
              "answer": "simple, readable"
            },
            {
              "type": "mcq",
              "prompt": "Which of these is NOT a common application of Python?",
              "options": ["Web Development", "Data Science", "Operating System Development", "Game Development"],
              "answer": 2
            }
          ]
        },
        {
          "id": 1002,
          "title": "Your First Python Program",
          "content": "# Your First Python Program\n\n## Hello, World!\nThe traditional first program in any programming language is 'Hello, World!' - a simple program that displays text on the screen.\n\n## Writing the Program\n```python\nprint('Hello, World!')\n```\n\n## Understanding the Code\n- `print()` is a function that displays text\n- The text inside quotes is called a string\n- The parentheses contain the arguments for the function\n\n## Running Your Program\n1. Save the code in a file named `hello.py`\n2. Open your terminal or command prompt\n3. Navigate to the folder containing your file\n4. Run: `python hello.py`\n\n## Expected Output\n```\nHello, World!\n```\n\n## Practice\nTry changing the text inside the quotes to display your own message!",
          "exercises": [
            {
              "type": "code",
              "prompt": "Write a Python program that prints 'Hello, [Your Name]!'",
              "starter": "print('')",
              "solution": "print('Hello, [Your Name]!')"
            },
            {
              "type": "fill",
              "prompt": "The __________ function is used to display text on the screen.",
              "answer": "print"
            },
            {
              "type": "mcq",
              "prompt": "What symbol is used to denote a string in Python?",
              "options": ["Parentheses ()", "Quotes '' or \"\"", "Brackets []", "Braces {}"],
              "answer": 1
            }
          ]
        }
      ]
    }
  ]
}
```

### Tips for Using These Templates

1. **Be Specific**: Tell the LLM exactly what subject, topic, or material you want to convert
2. **Provide Context**: Include your notes, textbook excerpts, or learning objectives
3. **Request Variety**: Ask for different types of exercises (MCQ, fill-in-the-blank, code)
4. **Specify Level**: Mention if it's for beginners, intermediate, or advanced learners
5. **Include Examples**: Provide examples of the content you want to convert
6. **Request Markdown**: Ask for proper Markdown formatting in lesson content
7. **Review and Edit**: Always review the generated content and make adjustments as needed

### Example Prompts

**For Converting Class Notes:**
> "I have notes from my [subject] class. Convert them into an Arcanum course using the course template. Include 3-4 chapters with multiple lessons each. Add a variety of exercises including multiple choice, fill-in-the-blank, and code exercises where appropriate."

**For Creating a Language Course:**
> "Create a [language] learning course for beginners using the course template. Include chapters on basic vocabulary, grammar, and conversation. Add exercises that test vocabulary, grammar understanding, and translation skills."

**For Converting a Textbook Chapter:**
> "Convert Chapter 5 of my [subject] textbook into an Arcanum chapter. The chapter covers [specific topics]. Include review questions and exercises that test understanding of the key concepts."

**For Creating Programming Exercises:**
> "Create a Python programming lesson on [specific topic] using the lesson template. Include code exercises that start simple and get more complex. Provide starter code and complete solutions."

---

## 📋 FAQ & Troubleshooting

### Common Issues

**Q: The app doesn't load properly**
A: Ensure you're using a modern browser and try opening with a local server instead of file:// protocol.

**Q: My data disappeared**
A: Check if localStorage is enabled in your browser. Data is stored locally and may be cleared by browser settings.

**Q: Admin mode isn't working**
A: Toggle the admin mode switch in the bottom-right corner of any screen.

**Q: Import/Export isn't working**
A: Ensure your JSON file follows the correct structure. Check the browser console for error messages.

**Q: Exercises aren't saving progress**
A: Make sure you're logged into a profile and localStorage is enabled.

### Browser Compatibility
- **Chrome 60+** (recommended)
- **Firefox 55+**
- **Safari 12+**
- **Edge 79+**

### Performance Tips
- **Use a local server** instead of file:// protocol
- **Clear browser cache** if experiencing issues
- **Disable browser extensions** that might interfere
- **Use modern browsers** for best performance

---

## 🤝 Contributing

### Development Setup
1. **Clone the repository**
2. **Start a local server** (see setup instructions)
3. **Make changes** to the code
4. **Test thoroughly** across different browsers
5. **Submit a pull request** with detailed description

### Code Style
- **ES6+ JavaScript** with modules
- **Semantic HTML5** with accessibility
- **CSS custom properties** for theming
- **Consistent naming** conventions
- **Comprehensive comments** for complex logic

### Testing
- **Cross-browser testing** on major browsers
- **Mobile responsiveness** testing
- **Accessibility testing** with screen readers
- **Performance testing** with large datasets

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Marked.js** for Markdown parsing
- **UI Avatars** for profile avatar generation
- **Academia aesthetic** inspiration from educational design
- **SRS algorithm** based on spaced repetition research

---

*Built with ❤️ for learners everywhere*
