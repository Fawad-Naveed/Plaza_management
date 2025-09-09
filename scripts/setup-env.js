const fs = require('fs');
const path = require('path');

console.log('🔧 Plaza Management System - Environment Setup');
console.log('==============================================\n');

const envFile = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envFile)) {
  console.log('✅ .env.local file already exists');
  const content = fs.readFileSync(envFile, 'utf8');
  if (content.includes('your_supabase_url_here')) {
    console.log('⚠️  Please update the .env.local file with your actual Supabase credentials');
    console.log('📝 Current content:');
    console.log(content);
  } else {
    console.log('✅ Environment variables appear to be configured');
  }
} else {
  console.log('📝 Creating .env.local template...');
  const envTemplate = `# Supabase Configuration
# Replace these with your actual Supabase credentials
# You can find these in your Supabase project dashboard under Settings > API
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
`;
  fs.writeFileSync(envFile, envTemplate);
  console.log('✅ Created .env.local template');
}

console.log('\n📋 Next Steps:');
console.log('1. Open your Supabase project dashboard');
console.log('2. Go to Settings > API');
console.log('3. Copy the "Project URL" and "anon public" key');
console.log('4. Update the .env.local file with these values');
console.log('5. Run: npm run build-exe');
console.log('\n💡 The .env.local file is in your project root directory');

