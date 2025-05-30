export const AI_SERVICE_CONFIG = {
  providers: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      models: {
        fast: 'claude-3-haiku-20240307',
        balanced: 'claude-3-5-sonnet-20241022', 
        powerful: 'claude-3-7-sonnet-20250219'
      }
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      models: {
        fast: 'gpt-3.5-turbo',
        balanced: 'gpt-4-turbo',
        powerful: 'gpt-4'
      }
    }
  },
  
  defaultProvider: 'anthropic',
  defaultModel: 'powerful',
  
  taskConfigs: {
    document_extraction: {
      provider: 'anthropic',
      model: 'powerful',
      maxTokens: 8000,
      temperature: 0
    },
    uba_form_completion: {
      provider: 'anthropic', 
      model: 'balanced',
      maxTokens: 4000,
      temperature: 0.1
    },
    uba_form_validation: {
      provider: 'anthropic',
      model: 'fast',
      maxTokens: 2000,
      temperature: 0
    }
  }
};

export const ENHANCED_DOCUMENT_EXTRACTION_PROMPT = `You are an expert at extracting structured data from financial documents. Your task is to carefully extract ALL data fields and their values from the provided document.

Instructions:
1. Read the entire document thoroughly
2. Extract every piece of information you can identify
3. Use descriptive, clear field names that match standard financial terminology
4. For amounts, extract the raw numeric value without currency symbols or commas
5. Preserve all dates, account numbers, names, and reference numbers exactly as shown
6. If you see tables or structured data, preserve the relationships between values
7. Include metadata like document date, document type, and issuing institution

Output format: Return a clean JSON object with all extracted fields as key-value pairs.

Example output structure:
{
  "document_type": "Mortgage Statement",
  "statement_date": "2024-01-31",
  "servicer_name": "Wells Fargo Home Mortgage",
  "account_number": "0001234567",
  "borrower_name": "John Smith",
  "property_address": "123 Main St, City, ST 12345",
  "principal_balance": "285000.00",
  "monthly_payment": "1850.00",
  "interest_rate": "3.875",
  "payment_due_date": "2024-02-01",
  "escrow_balance": "3200.00",
  "next_escrow_payment": "450.00",
  "property_tax_amount": "300.00",
  "insurance_amount": "150.00",
  "pmi_amount": "0.00",
  "late_charge_amount": "0.00",
  "other_fees": "0.00",
  "total_amount_due": "1850.00",
  "past_due_amount": "0.00",
  "current_payment_due": "1850.00"
}

Extract EVERYTHING you can see - the more complete, the better. Do not summarize or skip any data.`;