// State management for profiles, courses, and admin mode

const STORAGE_KEY = 'arcanum-app-state';

let state = {
  profiles: [
    {
      id: 1,
      name: 'Demo User',
      avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=6a5d3b&color=fff&rounded=true',
      level: 4,
      xp: 1280,
      xpToNext: 1500,
      streak: 4,
      achievements: 3
    }
  ],
  courses: [
    {
      id: 1,
      title: 'Learn to Code in Python',
      desc: 'Start your journey with Python. No experience required.',
      icon: '🐍',
      progress: 1,
      total: 1,
      percent: 100,
      chapters: [
        {
          id: 101,
          title: 'Introduction to Python',
          desc: 'Get started with Python, its history, and why it is so popular.',
          icon: '📖',
          percent: 100,
          progress: 3,
          total: 3,
          lessons: [
            { id: 1001, title: 'What is Python?', content: 'Python is a versatile programming language used for web development, data science, automation, and more.' },
            { id: 1002, title: 'Installing Python', content: 'Learn how to install Python on your computer for any operating system.' },
            { id: 1003, title: 'Hello, World!', content: 'Write your first Python program and print Hello, World! to the screen.' }
          ]
        },
        {
          id: 102,
          title: 'Variables and Data Types',
          desc: 'Learn about variables, numbers, strings, and basic data types in Python.',
          icon: '🔢',
          percent: 60,
          progress: 2,
          total: 3,
          lessons: [
            { id: 1004, title: 'Variables', content: 'Variables are used to store information. In Python, you do not need to declare the type.' },
            { id: 1005, title: 'Numbers and Strings', content: 'Python supports integers, floats, and strings. Learn how to use them.' },
            { id: 1006, title: 'Type Conversion', content: 'Convert between different data types using built-in functions.' }
          ]
        },
        {
          id: 103,
          title: 'Control Flow',
          desc: 'Understand how to use if statements, loops, and control the flow of your programs.',
          icon: '🔁',
          percent: 33,
          progress: 1,
          total: 3,
          lessons: [
            { id: 1007, title: 'If Statements', content: 'Use if, elif, and else to make decisions in your code.' },
            { id: 1008, title: 'For Loops', content: 'Repeat actions using for loops.' },
            { id: 1009, title: 'While Loops', content: 'Repeat actions using while loops.' }
          ]
        },
        {
          id: 104,
          title: 'Functions',
          desc: 'Write reusable code with functions and understand scope.',
          icon: '🧩',
          percent: 0,
          progress: 0,
          total: 3,
          lessons: [
            { id: 1010, title: 'Defining Functions', content: 'Use the def keyword to define a function.' },
            { id: 1011, title: 'Function Arguments', content: 'Pass information to functions using arguments.' },
            { id: 1012, title: 'Return Values', content: 'Functions can return values using the return statement.' }
          ]
        },
        {
          id: 105,
          title: 'Working with Lists',
          desc: 'Store and manipulate collections of data using lists.',
          icon: '📋',
          percent: 0,
          progress: 0,
          total: 3,
          lessons: [
            { id: 1013, title: 'Creating Lists', content: 'Lists are ordered collections of items.' },
            { id: 1014, title: 'List Methods', content: 'Use methods like append, remove, and sort to manipulate lists.' },
            { id: 1015, title: 'List Comprehensions', content: 'Create new lists using concise syntax.' }
          ]
        }
      ]
    },
    {
      id: 2,
      title: 'Learn Linux',
      desc: 'Master the Linux command line and system basics.',
      icon: '🐧',
      progress: 68,
      total: 86,
      percent: 79,
      chapters: []
    },
    {
      id: 3,
      title: 'Learn Git',
      desc: 'Version control essentials for every developer.',
      icon: '🔺',
      progress: 75,
      total: 75,
      percent: 100,
      chapters: []
    },
    {
      id: 4,
      title: 'Build a Bookbot in Python',
      desc: 'A guided project to build your own chatbot.',
      icon: '🤖',
      progress: 3,
      total: 15,
      percent: 20,
      chapters: []
    }
  ],
  selectedProfileId: 1,
  adminMode: false
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      state = JSON.parse(raw);
    } catch (e) {
      // ignore
    }
  }
}

loadState();

export function getProfiles() {
  return state.profiles;
}
export function getCourses() {
  return state.courses;
}
export function getSelectedProfile() {
  return state.profiles.find(p => p.id === state.selectedProfileId) || state.profiles[0];
}
export function setSelectedProfile(id) {
  state.selectedProfileId = id;
  saveState();
}
export function addProfiles(profiles) {
  // Accepts array
  for (const p of profiles) {
    p.id = Date.now() + Math.floor(Math.random()*10000);
    state.profiles.push(p);
  }
  saveState();
}
export function addCourses(courses) {
  // Accepts array
  for (const c of courses) {
    c.id = Date.now() + Math.floor(Math.random()*10000);
    state.courses.push(c);
  }
  saveState();
}
export function editProfile(id, newData) {
  const idx = state.profiles.findIndex(p => p.id === id);
  if (idx !== -1) {
    state.profiles[idx] = { ...state.profiles[idx], ...newData };
    saveState();
  }
}
export function editCourse(id, newData) {
  const idx = state.courses.findIndex(c => c.id === id);
  if (idx !== -1) {
    state.courses[idx] = { ...state.courses[idx], ...newData };
    saveState();
  }
}
export function deleteProfile(id) {
  state.profiles = state.profiles.filter(p => p.id !== id);
  saveState();
}
export function deleteCourse(id) {
  state.courses = state.courses.filter(c => c.id !== id);
  saveState();
}
export function isAdminMode() {
  return state.adminMode;
}
export function setAdminMode(val) {
  state.adminMode = val;
  saveState();
}
