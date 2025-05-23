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
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  // Temporary uploads directory
  uploadsDir: process.env.UPLOADS_DIR || './tmp/uploads',
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

export default config;
