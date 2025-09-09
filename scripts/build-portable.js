const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Plaza Management System Portable for Windows...');

// Check if we're on Windows or cross-compiling
const isWindows = process.platform === 'win32';
const isCrossCompile = !isWindows;

if (isCrossCompile) {
  console.log('⚠️  Cross-compiling for Windows from non-Windows platform');
  console.log('   Note: Some features may not work perfectly in cross-compiled builds');
}

// Step 1: Build Next.js app
console.log('\n📦 Step 1: Building Next.js application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Next.js build completed');
} catch (error) {
  console.error('❌ Next.js build failed');
  process.exit(1);
}

// Step 2: Check if out directory exists
const outDir = path.join(__dirname, '..', 'out');
if (!fs.existsSync(outDir)) {
  console.error('❌ Build output directory not found');
  process.exit(1);
}

// Step 3: Build Electron app as portable
console.log('\n🖥️  Step 2: Building Portable Electron application for Windows...');
try {
  if (isWindows) {
    execSync('npx electron-builder --win --x64 --dir', { stdio: 'inherit' });
  } else {
    execSync('npx electron-builder --win --x64 --dir', { stdio: 'inherit' });
  }
  console.log('✅ Electron portable build completed');
} catch (error) {
  console.error('❌ Electron build failed');
  process.exit(1);
}

// Step 4: Create portable package
console.log('\n📦 Step 3: Creating portable package...');
const portableDir = path.join(__dirname, '..', 'dist', 'win-unpacked');
const portableZip = path.join(__dirname, '..', 'dist', 'Plaza Management System Portable.zip');

if (fs.existsSync(portableDir)) {
  try {
    // Create a simple batch file to run the app
    const batchContent = `@echo off
echo Starting Plaza Management System...
start "" "${path.basename(portableDir)}\\Plaza Management System.exe"
`;
    
    const batchFile = path.join(__dirname, '..', 'dist', 'Run Plaza Management System.bat');
    fs.writeFileSync(batchFile, batchContent);
    
    console.log('\n📁 Portable build output:');
    console.log(`   📄 ${path.basename(portableDir)}/ (Portable app folder)`);
    console.log(`   📄 Run Plaza Management System.bat (Launcher script)`);
    
    console.log('\n🎉 Portable build completed successfully!');
    console.log('📂 Check the "dist" folder for your portable files');
    console.log('💡 Users can run the .bat file or directly run the .exe in the win-unpacked folder');
  } catch (error) {
    console.error('❌ Error creating portable package:', error);
    process.exit(1);
  }
} else {
  console.error('❌ Portable build output directory not found');
  process.exit(1);
}

