// Test module imports
console.log('Testing module imports...');

try {
  import('./state.js').then(stateModule => {
    console.log('✅ state.js loaded successfully');
    console.log('State functions:', Object.keys(stateModule));
  }).catch(error => {
    console.error('❌ Error loading state.js:', error);
  });
} catch (error) {
  console.error('❌ Error importing state.js:', error);
}

try {
  import('./profileManager.js').then(profileModule => {
    console.log('✅ profileManager.js loaded successfully');
    console.log('Profile functions:', Object.keys(profileModule));
  }).catch(error => {
    console.error('❌ Error loading profileManager.js:', error);
  });
} catch (error) {
  console.error('❌ Error importing profileManager.js:', error);
}

try {
  import('./dragDrop.js').then(dragModule => {
    console.log('✅ dragDrop.js loaded successfully');
    console.log('Drag functions:', Object.keys(dragModule));
  }).catch(error => {
    console.error('❌ Error loading dragDrop.js:', error);
  });
} catch (error) {
  console.error('❌ Error importing dragDrop.js:', error);
}

console.log('Module test complete'); 