const fs = require('fs');
const path = require('path');

function fixElectronPaths() {
  const outDir = path.join(__dirname, '../out');
  
  console.log('🔧 Fixing asset paths for Electron...');
  
  // Function to recursively find all files that need path fixing
  function findFilesToFix(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        files.push(...findFilesToFix(itemPath));
      } else if (item.endsWith('.html') || item.endsWith('.js')) {
        files.push(itemPath);
      }
    }
    
    return files;
  }
  
  // Find all files that need path fixing in the out directory
  const filesToFix = findFilesToFix(outDir);
  
  let filesFixed = 0;
  
  filesToFix.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace absolute paths with relative paths
    content = content.replace(/href="\/_next\//g, 'href="./_next/');
    content = content.replace(/src="\/_next\//g, 'src="./_next/');
    content = content.replace(/"\/_next\//g, '"./_next/');
    
    // Replace any remaining absolute references in the JavaScript code
    content = content.replace(/\\\"\/_next\//g, '\\"./_next/');
    content = content.replace(/"\/_next\//g, '"./_next/');
    
    // Fix webpack chunk loading errors - replace various formats
    content = content.replace(/\'\/_next\//g, '\'./_next/');
    content = content.replace(/file:\/\/\/C:\/_next\//g, './_next/');
    content = content.replace(/file:\/\/\/_next\//g, './_next/');
    content = content.replace(/\/_next\/static\/chunks\//g, './_next/static/chunks/');
    content = content.replace(/\"static\/chunks\//g, '"./_next/static/chunks/');
    
    // Fix all formats of absolute _next paths found in minified JS
    content = content.replace(/(["'])\/_next\/([^"']*)/g, '$1./_next/$2');
    content = content.replace(/path:"\.\/_next\/image"/g, 'path:"./_next/image"');
    content = content.replace(/\.\/_next\/data\/"/g, './_next/data/');
    content = content.replace(/"\.\/_next\/data\/"/g, '"./_next/data/"');
    
    // Fix encoded paths for webpack
    content = content.replace(/\\"\/_next\\\/data\\\/"/g, '\\"./_next\\/data\\/"');
    
    // Additional patterns specifically found in Next.js chunks
    content = content.replace(/\.\/_next\/"/g, './_next/');
    content = content.replace(/,"\/_next\/"/g, ',"./_next/"');
    content = content.replace(/o\.addBasePath\("\.\/_next\/data\/"/g, 'o.addBasePath("./_next/data/"');
    
    // Fix any remaining absolute paths
    content = content.replace(/"\/_next"/g, '"./_next"');
    content = content.replace(/\B\/_next\//g, './_next/');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesFixed++;
      console.log(`✅ Fixed paths in: ${path.relative(outDir, filePath)}`);
    }
  });
  
  console.log(`🎉 Fixed asset paths in ${filesFixed} files for Electron compatibility!`);
}

// Only run if this script is called directly
if (require.main === module) {
  fixElectronPaths();
}

module.exports = fixElectronPaths;
