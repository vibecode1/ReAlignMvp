export const UBA_FIELD_MAPPINGS: Record<string, string> = {
  // Loan/Account mappings
  'account_number': 'loan_number',
  'loan_account_number': 'loan_number',
  'mortgage_account': 'loan_number',
  'loan_no': 'loan_number',
  'account_no': 'loan_number',
  'reference_number': 'loan_number',
  
  // Balance mappings
  'outstanding_principal': 'mortgage_balance',
  'principal_balance': 'mortgage_balance',
  'current_balance': 'mortgage_balance',
  'unpaid_principal_balance': 'mortgage_balance',
  'loan_balance': 'mortgage_balance',
  'remaining_balance': 'mortgage_balance',
  'payoff_amount': 'mortgage_balance',
  
  // Payment mappings
  'regular_payment': 'monthly_payment',
  'payment_amount': 'monthly_payment',
  'monthly_mortgage_payment': 'monthly_payment',
  'monthly_payment_amount': 'monthly_payment',
  'total_payment': 'monthly_payment',
  'p_i_payment': 'monthly_payment',
  'principal_and_interest': 'monthly_payment',
  
  // Interest rate mappings
  'current_interest_rate': 'interest_rate',
  'note_rate': 'interest_rate',
  'interest_percentage': 'interest_rate',
  'rate': 'interest_rate',
  
  // Borrower name mappings
  'customer_name': 'borrower_name',
  'primary_borrower': 'borrower_name',
  'account_holder': 'borrower_name',
  'borrower': 'borrower_name',
  'mortgagor': 'borrower_name',
  'name': 'borrower_name',
  
  // Property address mappings
  'property_location': 'property_address',
  'collateral_address': 'property_address',
  'subject_property': 'property_address',
  'mortgaged_property': 'property_address',
  
  // Servicer mappings
  'lender_name': 'servicer_name',
  'servicer': 'servicer_name',
  'mortgage_company': 'servicer_name',
  'bank_name': 'servicer_name',
  'institution_name': 'servicer_name',
  
  // Income mappings
  'gross_pay': 'wage_income',
  'gross_earnings': 'wage_income',
  'total_earnings': 'wage_income',
  'gross_wages': 'wage_income',
  'salary': 'wage_income',
  'base_pay': 'wage_income',
  
  // Net income mappings
  'net_pay': 'monthly_net_income',
  'take_home_pay': 'monthly_net_income',
  'net_earnings': 'monthly_net_income',
  
  // Employer mappings
  'employer': 'employer_name',
  'company_name': 'employer_name',
  'employer_information': 'employer_name',
  
  // Asset mappings
  'checking_balance': 'checking_account_balance',
  'checking': 'checking_account_balance',
  'savings_balance': 'savings_account_balance',
  'savings': 'savings_account_balance',
  
  // Date mappings
  'dob': 'borrower_dob',
  'date_of_birth': 'borrower_dob',
  'birth_date': 'borrower_dob',
  
  // SSN mappings
  'ssn': 'borrower_ssn',
  'social_security': 'borrower_ssn',
  'social_security_number': 'borrower_ssn',
  'tin': 'borrower_ssn',
  
  // Phone mappings
  'phone': 'borrower_cell_phone',
  'cell': 'borrower_cell_phone',
  'mobile': 'borrower_cell_phone',
  'contact_number': 'borrower_cell_phone',
};

export interface FieldMappingResult {
  mappedFields: Record<string, any>;
  unmappedFields: Record<string, any>;
  mappingStats: {
    totalFields: number;
    mappedCount: number;
    unmappedCount: number;
  };
}

export function mapExtractedToUbaFields(extractedData: Record<string, any>): FieldMappingResult {
  const mappedFields: Record<string, any> = {};
  const unmappedFields: Record<string, any> = {};
  
  for (const [extractedKey, value] of Object.entries(extractedData)) {
    // Skip null/undefined values
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    // Normalize the key for matching
    const normalizedKey = extractedKey
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    let mapped = false;
    
    // Direct mapping
    if (UBA_FIELD_MAPPINGS[normalizedKey]) {
      mappedFields[UBA_FIELD_MAPPINGS[normalizedKey]] = value;
      mapped = true;
    }
    
    // Fuzzy matching for common patterns
    if (!mapped) {
      // Loan number patterns
      if (normalizedKey.includes('loan') && normalizedKey.includes('number')) {
        mappedFields['loan_number'] = value;
        mapped = true;
      }
      // Balance patterns (exclude escrow)
      else if (normalizedKey.includes('balance') && !normalizedKey.includes('escrow')) {
        mappedFields['mortgage_balance'] = value;
        mapped = true;
      }
      // Monthly payment patterns
      else if (normalizedKey.includes('monthly') && normalizedKey.includes('payment')) {
        mappedFields['monthly_payment'] = value;
        mapped = true;
      }
      // Interest rate patterns
      else if (normalizedKey.includes('interest') && normalizedKey.includes('rate')) {
        mappedFields['interest_rate'] = value;
        mapped = true;
      }
      // Property value patterns
      else if (normalizedKey.includes('property') && normalizedKey.includes('value')) {
        mappedFields['property_value'] = value;
        mapped = true;
      }
      // Income patterns
      else if (normalizedKey.includes('income') && !normalizedKey.includes('net')) {
        mappedFields['monthly_gross_income'] = value;
        mapped = true;
      }
    }
    
    if (!mapped) {
      unmappedFields[extractedKey] = value;
    }
  }
  
  // Apply UBA-specific formatting rules
  mappedFields = applyUbaFormattingRules(mappedFields);
  
  return {
    mappedFields,
    unmappedFields,
    mappingStats: {
      totalFields: Object.keys(extractedData).length,
      mappedCount: Object.keys(mappedFields).length,
      unmappedCount: Object.keys(unmappedFields).length
    }
  };
}

function applyUbaFormattingRules(fields: Record<string, any>): Record<string, any> {
  const formatted = { ...fields };
  
  // Always set these fields per UBA Guide
  formatted['borrower_email'] = 'Attorney Only';
  formatted['borrower_home_phone'] = 'N/A';
  
  // Format currency values (remove symbols and convert to number)
  const currencyFields = [
    'mortgage_balance', 'monthly_payment', 'property_value',
    'wage_income', 'monthly_gross_income', 'monthly_net_income',
    'checking_account_balance', 'savings_account_balance', 'total_assets'
  ];
  
  for (const field of currencyFields) {
    if (formatted[field]) {
      const value = String(formatted[field]).replace(/[^0-9.-]/g, '');
      formatted[field] = value;
    }
  }
  
  // Format SSN
  if (formatted['borrower_ssn']) {
    const ssn = String(formatted['borrower_ssn']).replace(/\D/g, '');
    if (ssn.length === 9) {
      formatted['borrower_ssn'] = `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5)}`;
    }
  }
  
  // Format phone numbers
  const phoneFields = ['borrower_cell_phone', 'borrower_work_phone'];
  for (const field of phoneFields) {
    if (formatted[field]) {
      const phone = String(formatted[field]).replace(/\D/g, '');
      if (phone.length === 10) {
        formatted[field] = `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
      }
    }
  }
  
  // Set default values per UBA Guide
  if (!formatted['checking_account_balance']) {
    formatted['checking_account_balance'] = '500';
  }
  if (!formatted['total_assets']) {
    formatted['total_assets'] = '500';
  }
  
  return formatted;
}

export function reverseMapUbaToExtracted(ubaField: string): string[] {
  const reverseMap: string[] = [];
  
  for (const [extracted, uba] of Object.entries(UBA_FIELD_MAPPINGS)) {
    if (uba === ubaField) {
      reverseMap.push(extracted);
    }
  }
  
  return reverseMap;
}