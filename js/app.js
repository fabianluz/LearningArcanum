// Non-module version for testing
console.log('App.js loaded');

// Simple test function
function testApp() {
  console.log('Testing app...');
  
  // Check DOM elements
  const themeSwitcher = document.getElementById('theme-switcher');
  const appRoot = document.getElementById('app-root');
  const modalRoot = document.getElementById('modal-root');
  
  console.log('Theme switcher:', themeSwitcher);
  console.log('App root:', appRoot);
  console.log('Modal root:', modalRoot);
  
  if (themeSwitcher && appRoot && modalRoot) {
    console.log('✅ All DOM elements found');
    appRoot.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h1>✅ Arcanum Test</h1>
        <p>DOM elements loaded successfully!</p>
        <p>Theme switcher: ${themeSwitcher ? 'Found' : 'Missing'}</p>
        <p>App root: ${appRoot ? 'Found' : 'Missing'}</p>
        <p>Modal root: ${modalRoot ? 'Found' : 'Missing'}</p>
      </div>
    `;
  } else {
    console.log('❌ Missing DOM elements');
    if (appRoot) {
      appRoot.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: red;">
          <h1>❌ Error</h1>
          <p>Missing DOM elements:</p>
          <p>Theme switcher: ${themeSwitcher ? 'Found' : 'Missing'}</p>
          <p>App root: ${appRoot ? 'Found' : 'Missing'}</p>
          <p>Modal root: ${modalRoot ? 'Found' : 'Missing'}</p>
        </div>
      `;
    }
  }
}

// Call test function when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testApp);
} else {
  testApp();
} 