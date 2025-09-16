#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 Optimizing app...')

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction) {
  console.log('📦 Production optimizations enabled')
  
  // Create optimized webpack config
  const webpackConfigPath = path.join(__dirname, '../webpack.config.js')
  let webpackConfig = fs.readFileSync(webpackConfigPath, 'utf8')
  
  // Enable additional production optimizations
  webpackConfig = webpackConfig.replace(
    'minimize: true,',
    `minimize: true,
      concatenateModules: true,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',`
  )
  
  fs.writeFileSync(webpackConfigPath, webpackConfig)
  console.log('✅ Webpack config optimized')
}

// Check bundle size
const distPath = path.join(__dirname, '../dist')
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath)
  let totalSize = 0
  
  files.forEach(file => {
    const filePath = path.join(distPath, file)
    const stats = fs.statSync(filePath)
    if (stats.isFile()) {
      totalSize += stats.size
    }
  })
  
  console.log(`📊 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  
  // Warn if bundle is too large
  if (totalSize > 5 * 1024 * 1024) { // 5MB
    console.warn('⚠️  Bundle size is large. Consider code splitting.')
  }
}

console.log('✨ Optimization complete!')
