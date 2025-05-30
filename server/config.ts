// Server configuration and environment variables

// Default config for development, can be overridden with environment variables
const config = {
  // Server
  port: Number(process.env.PORT) || 5000,
  env: process.env.NODE_ENV || 'development',
  
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Auth
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  
  // Rate limiting
  magicLinkRateLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit to 3 requests per hour
  },
  
  // File upload
  maxFileSize: 200 * 1024 * 1024, // 200MB
  
  // Temporary uploads directory
  uploadsDir: process.env.UPLOADS_DIR || './tmp/uploads',
  
  // AI Services
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: Environment variable ${envVar} is not set.`);
  }
}

// Critical check for service role key
if (!config.supabaseServiceRoleKey) {
  console.error('FATAL ERROR: SUPABASE_SERVICE_ROLE_KEY is required for backend authentication');
}

// Add console logs to verify loaded values (with masking for security)
console.log('Config loaded:');
console.log('  SUPABASE_URL:', config.supabaseUrl ? config.supabaseUrl.substring(0, 30) + '...' : 'MISSING!');
console.log('  SUPABASE_ANON_KEY:', config.supabaseAnonKey ? config.supabaseAnonKey.substring(0, 10) + '...' : 'MISSING!');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', config.supabaseServiceRoleKey ? config.supabaseServiceRoleKey.substring(0, 10) + '...' : 'MISSING!');
console.log('  DATABASE_URL:', config.databaseUrl ? 'Connected' : 'MISSING!');
console.log('  OPENAI_API_KEY:', config.openaiApiKey ? 'Configured' : 'Not configured');
console.log('  ANTHROPIC_API_KEY:', config.anthropicApiKey ? 'Configured' : 'Not configured');

export default config;
