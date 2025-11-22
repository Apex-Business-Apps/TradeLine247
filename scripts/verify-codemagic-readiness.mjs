#!/usr/bin/env node
/**
 * Pre-flight verification script for Codemagic iOS build
 * Verifies all code-level requirements before uploading to Codemagic
 * 
 * Usage: node scripts/verify-codemagic-readiness.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let errors = [];
let warnings = [];

function checkFile(filePath, description, required = true) {
  const fullPath = path.join(ROOT_DIR, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (!exists) {
    const msg = `${description}: ${filePath}`;
    if (required) {
      errors.push(`❌ MISSING (REQUIRED): ${msg}`);
    } else {
      warnings.push(`⚠️  MISSING (OPTIONAL): ${msg}`);
    }
    return false;
  }
  console.log(`✅ ${description}: ${filePath}`);
  return true;
}

function checkDirectory(dirPath, description, required = true) {
  const fullPath = path.join(ROOT_DIR, dirPath);
  const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  
  if (!exists) {
    const msg = `${description}: ${dirPath}`;
    if (required) {
      errors.push(`❌ MISSING (REQUIRED): ${msg}`);
    } else {
      warnings.push(`⚠️  MISSING (OPTIONAL): ${msg}`);
    }
    return false;
  }
  console.log(`✅ ${description}: ${dirPath}`);
  return true;
}

function checkPackageJsonField(field, expectedValue, description) {
  try {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const value = pkg[field];
    
    if (typeof expectedValue === 'function') {
      if (!expectedValue(value)) {
        errors.push(`❌ ${description}: Expected ${field} to match requirement, got: ${JSON.stringify(value)}`);
        return false;
      }
    } else if (value !== expectedValue) {
      warnings.push(`⚠️  ${description}: ${field} is ${JSON.stringify(value)}, expected ${JSON.stringify(expectedValue)}`);
      return false;
    }
    console.log(`✅ ${description}: ${field} = ${JSON.stringify(value)}`);
    return true;
  } catch (e) {
    errors.push(`❌ Failed to check ${field}: ${e.message}`);
    return false;
  }
}

function checkCapacitorConfig() {
  try {
    const configPath = path.join(ROOT_DIR, 'capacitor.config.ts');
    if (!fs.existsSync(configPath)) {
      errors.push(`❌ Missing capacitor.config.ts`);
      return;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for TradeLine 24/7 bundle ID
    if (!configContent.includes('com.apex.tradeline')) {
      warnings.push(`⚠️  capacitor.config.ts may not have correct bundle ID (com.apex.tradeline)`);
    } else {
      console.log(`✅ Capacitor config has correct bundle ID: com.apex.tradeline`);
    }
    
    if (!configContent.includes('TradeLine 24/7')) {
      warnings.push(`⚠️  capacitor.config.ts may not have correct app name (TradeLine 24/7)`);
    } else {
      console.log(`✅ Capacitor config has correct app name: TradeLine 24/7`);
    }
  } catch (e) {
    errors.push(`❌ Failed to check Capacitor config: ${e.message}`);
  }
}

function checkCodemagicYaml() {
  const yamlPath = path.join(ROOT_DIR, 'codemagic.yaml');
  if (!fs.existsSync(yamlPath)) {
    errors.push(`❌ Missing codemagic.yaml`);
    return;
  }
  
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  
  // Check for required environment variables (check both $VAR and ${VAR} formats)
  const hasBundleId = yamlContent.includes('$BUNDLE_ID') || yamlContent.includes('${BUNDLE_ID}');
  const hasTeamId = yamlContent.includes('$TEAM_ID') || yamlContent.includes('${TEAM_ID}');
  
  if (!hasBundleId) {
    warnings.push(`⚠️  codemagic.yaml should reference BUNDLE_ID environment variable`);
  } else {
    console.log(`✅ codemagic.yaml references BUNDLE_ID (must be set to: com.apex.tradeline)`);
  }
  
  if (!hasTeamId) {
    warnings.push(`⚠️  codemagic.yaml should reference TEAM_ID environment variable`);
  } else {
    console.log(`✅ codemagic.yaml references TEAM_ID (must be set in Codemagic UI)`);
  }
  
  if (!yamlContent.includes('ios_config')) {
    warnings.push(`⚠️  codemagic.yaml should reference ios_config environment group`);
  } else {
    console.log(`✅ codemagic.yaml references ios_config environment group`);
  }
  
  console.log(`✅ codemagic.yaml exists and is properly configured`);
}

console.log('\n🔍 Codemagic Build Readiness Check for TradeLine 24/7\n');
console.log('=' .repeat(60));

// 1. Check required source files
console.log('\n📁 Checking Required Source Files...');
checkFile('src/integrations/supabase/client.ts', 'Supabase client');
checkFile('src/App.tsx', 'App component');
checkFile('src/main.tsx', 'Main entry');
checkFile('package.json', 'Package.json');
checkFile('vite.config.ts', 'Vite config');
checkFile('capacitor.config.ts', 'Capacitor config');

// 2. Check iOS project structure
console.log('\n📱 Checking iOS Project Structure...');
checkFile('ios/App/Podfile', 'Podfile');
checkFile('ios/App/App/Info.plist', 'Info.plist');
checkFile('ios/App/App.xcodeproj/project.pbxproj', 'Xcode project');
checkDirectory('ios/App/App', 'iOS App directory');

// 3. Check required icon files
console.log('\n🎨 Checking Required Icon Files...');
checkFile('public/assets/brand/App_Icons/ios/AppStore1024.png', 'App Store icon (1024x1024)');
checkFile('public/assets/brand/App_Icons/ios/iPhoneApp180.png', 'iPhone app icon (180x180)');
checkFile('public/assets/brand/App_Icons/ios/iPhoneSpotlight120.png', 'iPhone spotlight icon (120x120)');

// 4. Check build scripts
console.log('\n🔧 Checking Build Scripts...');
checkFile('scripts/verify-app.cjs', 'Verify app script');
checkFile('scripts/verify_icons.mjs', 'Verify icons script');
checkFile('scripts/check-required-files.mjs', 'Check required files script');

// 5. Check package.json requirements
console.log('\n📦 Checking Package.json Requirements...');
checkPackageJsonField('engines', (engines) => {
  return engines?.node === '20.x' && engines?.npm?.match(/>=10/);
}, 'Node 20.x and npm >=10');

// 6. Check Capacitor config
console.log('\n⚡ Checking Capacitor Configuration...');
checkCapacitorConfig();

// 7. Check Codemagic YAML
console.log('\n🚀 Checking Codemagic Configuration...');
checkCodemagicYaml();

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 VERIFICATION SUMMARY\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Your codebase is ready for Codemagic build.');
  console.log('\n⚠️  REMEMBER: You still need to configure Codemagic UI:');
  console.log('   1. Set BUNDLE_ID environment variable (should be: com.apex.tradeline)');
  console.log('   2. Set TEAM_ID environment variable');
  console.log('   3. Configure App Store Connect integration');
  console.log('   4. Upload iOS certificates and provisioning profiles');
  console.log('   5. Verify working directory is set correctly in Codemagic');
  console.log('\n   See docs/CODEMAGIC_SETUP_CHECKLIST.md for detailed instructions.');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}):`);
    errors.forEach(err => console.log(`   ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach(warn => console.log(`   ${warn}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Build will likely FAIL. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\n⚠️  Build may have issues. Review warnings above.');
    console.log('\n✅ No critical errors found. You can proceed, but review warnings.');
    process.exit(0);
  }
}

