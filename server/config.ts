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
  
  // ReAlign 3.0 AI Configuration
  ai: {
    // Model configurations
    defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-4',
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'gpt-3.5-turbo',
    claudeModel: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
    
    // API Keys (redundant with above but organized)
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      organization: process.env.OPENAI_ORGANIZATION || '',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
    
    // Processing limits
    maxTokens: Number(process.env.AI_MAX_TOKENS) || 4000,
    temperature: Number(process.env.AI_TEMPERATURE) || 0.7,
    
    // Memory system
    memory: {
      retentionDays: Number(process.env.MEMORY_RETENTION_DAYS) || 365,
      compressionThreshold: Number(process.env.MEMORY_COMPRESSION_THRESHOLD) || 100,
    },
    
    // Conversation settings
    conversation: {
      maxHistoryLength: Number(process.env.CONVERSATION_MAX_HISTORY) || 50,
      sessionTimeout: Number(process.env.CONVERSATION_TIMEOUT_MS) || 30 * 60 * 1000, // 30 minutes
    },
    
    // Document processing
    document: {
      maxFileSize: Number(process.env.DOCUMENT_MAX_SIZE) || 25 * 1024 * 1024, // 25MB
      supportedTypes: process.env.DOCUMENT_SUPPORTED_TYPES?.split(',') || ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
    },
    
    // Learning system
    learning: {
      enabled: process.env.LEARNING_ENABLED !== 'false',
      minConfidenceForPattern: Number(process.env.LEARNING_MIN_CONFIDENCE) || 0.8,
      patternObservationThreshold: Number(process.env.LEARNING_OBSERVATION_THRESHOLD) || 5,
    },
    
    // Voice system
    voice: {
      enabled: process.env.VOICE_ENABLED === 'true',
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
    
    // Feature flags
    features: {
      emotionalIntelligence: process.env.FEATURE_EMOTIONAL_INTELLIGENCE !== 'false',
      proactiveAssistance: process.env.FEATURE_PROACTIVE_ASSISTANCE !== 'false',
      continuousLearning: process.env.FEATURE_CONTINUOUS_LEARNING !== 'false',
      voiceCalling: process.env.FEATURE_VOICE_CALLING === 'true',
    },
  },
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
console.log('  AI Default Model:', config.ai.defaultModel);
console.log('  AI Features:', {
  emotionalIntelligence: config.ai.features.emotionalIntelligence,
  proactiveAssistance: config.ai.features.proactiveAssistance,
  continuousLearning: config.ai.features.continuousLearning,
  voiceCalling: config.ai.features.voiceCalling,
});

export default config;
