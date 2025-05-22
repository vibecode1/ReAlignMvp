// Frontend configuration values
const config = {
  // Supabase configuration - using environment variables
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // API configuration
  apiBaseUrl: '/api/v1',
  
  // Application settings
  appName: 'ReAlign',
  appDescription: 'Short Sale Coordination Platform',
  
  // Default transaction phases
  transactionPhases: [
    { id: 'intro', label: 'Introduction', description: 'Initial contact and setup' },
    { id: 'documents', label: 'Document Collection', description: 'Gathering necessary paperwork' },
    { id: 'offer_review', label: 'Offer Review', description: 'Evaluating purchase offers' },
    { id: 'offer_acceptance', label: 'Offer Acceptance', description: 'Finalizing purchase agreement' },
    { id: 'lender_approval', label: 'Lender Approval', description: 'Getting lender sign-off' },
    { id: 'escrow', label: 'Escrow', description: 'Managing escrow process' },
    { id: 'closing_docs', label: 'Closing Documents', description: 'Preparing final paperwork' },
    { id: 'funding', label: 'Funding', description: 'Securing transaction funding' },
    { id: 'closed', label: 'Closed', description: 'Transaction complete' }
  ]
};

export default config;