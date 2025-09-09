const fs = require('fs');
const path = require('path');

function createDebugVersion() {
  console.log('🔧 Creating debug version of Electron main process...');
  
  const mainPath = path.join(__dirname, '../electron/main.js');
  const debugMainPath = path.join(__dirname, '../electron/main-debug.js');
  
  let content = fs.readFileSync(mainPath, 'utf8');
  
  // Enable DevTools in production for debugging
  content = content.replace(
    '// Temporarily enable DevTools to debug the client-side error',
    '// Debug version - always enable DevTools for customer debugging'
  );
  
  // Add more detailed error logging
  content = content.replace(
    'mainWindow.webContents.on(\'console-message\', (event, level, message, line, sourceId) => {',
    `// Add detailed error logging for customer debugging
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('❌ Failed to load:', {
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame
    });
  });
  
  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('💥 Renderer process crashed:', { killed });
  });
  
  mainWindow.webContents.on('unresponsive', () => {
    console.error('🐌 Renderer process became unresponsive');
  });
  
  mainWindow.webContents.on('responsive', () => {
    console.log('✅ Renderer process became responsive again');
  });
  
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {`
  );
  
  // Add more explicit error handling
  content = content.replace(
    'mainWindow.loadFile(outPath);',
    `mainWindow.loadFile(outPath)
        .catch((error) => {
          console.error('❌ Failed to load index.html:', error);
        });`
  );
  
  fs.writeFileSync(debugMainPath, content, 'utf8');
  console.log('✅ Debug version created at:', path.relative(process.cwd(), debugMainPath));
  
  // Update package.json temporarily to use debug version
  const packagePath = path.join(__dirname, '../package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  packageJson.main = 'electron/main-debug.js';
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
  console.log('✅ Updated package.json to use debug version');
}

function restoreOriginalVersion() {
  console.log('🔄 Restoring original version...');
  
  const packagePath = path.join(__dirname, '../package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  packageJson.main = 'electron/main.js';
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
  console.log('✅ Restored original package.json');
}

// Check command line arguments
const action = process.argv[2];

if (action === 'restore') {
  restoreOriginalVersion();
} else {
  createDebugVersion();
}
