#!/usr/bin/env node

/**
 * Performance testing script for Darbaal Plaza
 * 
 * Usage: node scripts/performance-test.js
 */

const { spawn } = require('child_process')
const { performance } = require('perf_hooks')
const path = require('path')

console.log('🚀 Starting Performance Test Suite for Darbaal Plaza\n')

// Test build performance
async function testBuildPerformance() {
  console.log('📦 Testing Build Performance...')
  const startTime = performance.now()
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      shell: true
    })
    
    let output = ''
    
    buildProcess.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    buildProcess.stderr.on('data', (data) => {
      output += data.toString()
    })
    
    buildProcess.on('close', (code) => {
      const endTime = performance.now()
      const buildTime = ((endTime - startTime) / 1000).toFixed(2)
      
      if (code === 0) {
        console.log(`✅ Build completed successfully in ${buildTime}s`)
        
        // Extract bundle information
        const bundleInfo = extractBundleInfo(output)
        if (bundleInfo) {
          console.log('📊 Bundle Analysis:')
          console.log(`   Total Size: ${bundleInfo.totalSize}`)
          console.log(`   Pages: ${bundleInfo.pages}`)
          console.log(`   Static Files: ${bundleInfo.staticFiles}`)
        }
        
        resolve({ buildTime: parseFloat(buildTime), success: true })
      } else {
        console.log(`❌ Build failed with code ${code}`)
        console.log('Error output:', output)
        resolve({ buildTime: parseFloat(buildTime), success: false, error: output })
      }
    })
  })
}

// Extract bundle information from build output
function extractBundleInfo(output) {
  try {
    const lines = output.split('\\n')
    let totalSize = 'Unknown'
    let pages = 0
    let staticFiles = 0
    
    for (const line of lines) {
      // Look for route information
      if (line.includes('○') || line.includes('●') || line.includes('λ')) {
        pages++
      }
      
      // Look for static files
      if (line.includes('├') && line.includes('kB')) {
        staticFiles++
      }
      
      // Look for total size information
      if (line.includes('Total size:') || line.includes('Bundle size:')) {
        const match = line.match(/([\\d.]+\\s*[kKmM]?B)/)
        if (match) {
          totalSize = match[1]
        }
      }
    }
    
    return { totalSize, pages, staticFiles }
  } catch (error) {
    return null
  }
}

// Test development server startup
async function testDevServerStartup() {
  console.log('\\n🔧 Testing Development Server Startup...')
  const startTime = performance.now()
  
  return new Promise((resolve) => {
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    })
    
    let hasStarted = false
    
    devProcess.stdout.on('data', (data) => {
      const output = data.toString()
      
      if (!hasStarted && (output.includes('Ready in') || output.includes('Local:'))) {
        const endTime = performance.now()
        const startupTime = ((endTime - startTime) / 1000).toFixed(2)
        
        console.log(`✅ Dev server started in ${startupTime}s`)
        hasStarted = true
        
        // Kill the dev server
        devProcess.kill('SIGTERM')
        resolve({ startupTime: parseFloat(startupTime), success: true })
      }
    })
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!hasStarted) {
        console.log('❌ Dev server startup timeout (30s)')
        devProcess.kill('SIGTERM')
        resolve({ startupTime: 30, success: false, error: 'Timeout' })
      }
    }, 30000)
  })
}

// Analyze package.json for potential optimizations
function analyzePackageJson() {
  console.log('\\n📋 Analyzing Dependencies...')
  
  try {
    const packageJson = require(path.join(process.cwd(), 'package.json'))
    const dependencies = Object.keys(packageJson.dependencies || {})
    const devDependencies = Object.keys(packageJson.devDependencies || {})
    
    console.log(`📦 Total Dependencies: ${dependencies.length}`)
    console.log(`🛠️  Dev Dependencies: ${devDependencies.length}`)
    
    // Check for heavy dependencies
    const heavyDeps = dependencies.filter(dep => 
      dep.includes('lodash') || 
      dep.includes('moment') || 
      dep.includes('recharts') ||
      dep.includes('xlsx')
    )
    
    if (heavyDeps.length > 0) {
      console.log('⚠️  Heavy dependencies detected:')
      heavyDeps.forEach(dep => {
        console.log(`   - ${dep}`)
        
        // Suggest alternatives
        if (dep.includes('lodash')) {
          console.log('     💡 Consider using native JS methods or lodash-es for tree shaking')
        }
        if (dep.includes('moment')) {
          console.log('     💡 Consider switching to date-fns or day.js for smaller bundle size')
        }
      })
    }
    
    // Check for performance-related packages
    const perfPackages = [...dependencies, ...devDependencies].filter(dep =>
      dep.includes('bundle-analyzer') ||
      dep.includes('webpack') ||
      dep.includes('next')
    )
    
    console.log('🚀 Performance-related packages:')
    perfPackages.forEach(pkg => console.log(`   - ${pkg}`))
    
  } catch (error) {
    console.log('❌ Could not analyze package.json:', error.message)
  }
}

// Main test runner
async function runPerformanceTests() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  }
  
  try {
    // 1. Analyze dependencies
    analyzePackageJson()
    
    // 2. Test build performance
    const buildResult = await testBuildPerformance()
    results.tests.build = buildResult
    
    // 3. Test dev server startup
    const devResult = await testDevServerStartup()
    results.tests.devServer = devResult
    
    // 4. Generate summary
    console.log('\\n📊 Performance Test Summary')
    console.log('================================')
    
    if (buildResult.success) {
      const rating = buildResult.buildTime < 30 ? '🟢 Excellent' : 
                    buildResult.buildTime < 60 ? '🟡 Good' : '🔴 Needs Improvement'
      console.log(`Build Time: ${buildResult.buildTime}s ${rating}`)
    }
    
    if (devResult.success) {
      const rating = devResult.startupTime < 5 ? '🟢 Excellent' : 
                    devResult.startupTime < 10 ? '🟡 Good' : '🔴 Needs Improvement'
      console.log(`Dev Startup: ${devResult.startupTime}s ${rating}`)
    }
    
    // 5. Recommendations
    console.log('\\n💡 Optimization Recommendations:')
    console.log('- Run `npm run analyze` to check bundle sizes')
    console.log('- Use dynamic imports for heavy components')
    console.log('- Implement the optimized Supabase client')
    console.log('- Enable image optimization in next.config.mjs')
    console.log('- Monitor Core Web Vitals in production')
    
    // 6. Next steps
    console.log('\\n🎯 Next Steps:')
    console.log('1. npm run analyze     # Analyze bundle size')
    console.log('2. npm run build       # Test production build')
    console.log('3. npm start           # Test production server')
    console.log('4. Check Lighthouse scores in browser DevTools')
    
  } catch (error) {
    console.error('❌ Performance test failed:', error)
    results.error = error.message
  }
  
  // Save results
  const fs = require('fs')
  fs.writeFileSync(
    path.join(process.cwd(), 'performance-results.json'),
    JSON.stringify(results, null, 2)
  )
  
  console.log('\\n📄 Results saved to performance-results.json')
}

// Run the tests
runPerformanceTests().catch(console.error)
