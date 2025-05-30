import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export interface FormFieldMapping {
  [pdfFieldName: string]: string | ((data: Record<string, any>) => any);
}

export interface FormTemplate {
  templatePath: string;
  fieldMappings: FormFieldMapping;
  description: string;
}

export class UbaFormExportService {
  private static formTemplates: Record<string, FormTemplate> = {
    'fannie_mae_710': {
      templatePath: 'assets/forms/fannie_mae_form_710_template.pdf',
      description: 'Fannie Mae Form 710 - Mortgage Assistance Application',
      fieldMappings: {
        // Page 1 - Borrower Information Section
        'BorrowerName': 'borrower_name',
        'BorrowerSSN': 'borrower_ssn',
        'BorrowerDOB': 'borrower_dob',
        'PropertyAddress': 'property_address',
        'PropertyCity': (data) => data.property_address?.split(',')[1]?.trim() || '',
        'PropertyState': (data) => data.property_address?.split(',')[2]?.trim()?.split(' ')[0] || '',
        'PropertyZip': (data) => data.property_address?.match(/\d{5}(-\d{4})?$/)?.[0] || '',
        'MailingAddress': 'mailing_address',
        'PhoneNumber': 'borrower_cell_phone',
        'Email': 'borrower_email',
        
        // Co-Borrower Information
        'CoBorrowerName': 'coborrower_name',
        'CoBorrowerSSN': 'coborrower_ssn',
        
        // Loan Information
        'LoanNumber': 'loan_number',
        'ServicerName': 'servicer_name',
        'MonthlyPayment': 'monthly_payment',
        'UnpaidPrincipalBalance': 'mortgage_balance',
        'InterestRate': 'interest_rate',
        
        // Property Information
        'PropertyType': 'property_type',
        'PropertyOccupancy': (data) => {
          if (data.owner_occupied === 'Yes') return 'Owner Occupied';
          if (data.renter_occupied === 'Yes') return 'Renter Occupied';
          if (data.vacant === 'Yes') return 'Vacant';
          return 'Owner Occupied';
        },
        'IntentToOccupy': (data) => data.intent === 'Keep' ? 'Yes' : 'No',
        'PropertyListed': 'property_listed',
        'ListingDate': 'listing_date',
        'ListingAgent': 'listing_agent_name',
        'ListingAgentPhone': 'listing_agent_phone',
        'ListingPrice': 'listing_price',
        
        // Employment Information
        'EmployerName': 'employer_name',
        'EmploymentStartDate': 'employment_start_date',
        'EmployerPhone': 'employer_phone',
        'CoBorrowerEmployer': 'coborrower_employer_name',
        'CoBorrowerEmploymentDate': 'coborrower_employment_start_date',
        
        // Financial Information - Income
        'GrossMonthlyIncome': 'monthly_gross_income',
        'NetMonthlyIncome': 'monthly_net_income',
        'WageIncome': 'wage_income',
        'OvertimeIncome': 'overtime_income',
        'ChildSupportReceived': 'child_support_received',
        'SocialSecurityIncome': 'social_security_income',
        'SelfEmploymentIncome': 'self_employment_income',
        'RentalIncome': 'rental_income',
        'UnemploymentIncome': 'unemployment_income',
        'OtherIncome': 'other_income',
        'OtherIncomeDescription': 'other_income_description',
        
        // Financial Information - Expenses
        'FirstMortgagePayment': 'first_mortgage_payment',
        'SecondMortgagePayment': 'second_mortgage_payment',
        'HomeownersInsurance': 'homeowners_insurance',
        'PropertyTaxes': 'property_taxes',
        'HOAFees': 'hoa_fees',
        'Utilities': 'utilities',
        'CarPayment': 'car_payment',
        'CarInsurance': 'car_insurance',
        'CreditCardPayments': 'credit_card_payments',
        'ChildSupportPaid': 'child_support_paid',
        'FoodGroceries': 'food_groceries',
        'MedicalExpenses': 'medical_expenses',
        'OtherExpenses': 'other_expenses',
        'TotalMonthlyExpenses': 'monthly_expenses',
        
        // Assets
        'CheckingAccountBalance': 'checking_account_balance',
        'SavingsAccountBalance': 'savings_account_balance',
        'MoneyMarketBalance': 'money_market_balance',
        'StocksBondsValue': 'stocks_bonds_value',
        'RetirementAccounts': 'retirement_accounts',
        'OtherRealEstateValue': 'other_real_estate_value',
        'CashOnHand': 'cash_on_hand',
        'OtherAssets': 'other_assets',
        'TotalAssets': 'total_assets',
        
        // Liabilities
        'CreditCardDebt': 'credit_card_debt',
        'AutoLoanBalance': 'auto_loan_balance',
        'StudentLoanBalance': 'student_loan_balance',
        'InstallmentLoans': 'installment_loans',
        'PersonalLoans': 'personal_loans',
        'OtherMortgages': 'other_mortgages',
        'OtherLiabilities': 'other_liabilities',
        'TotalLiabilities': 'total_liabilities',
        
        // Hardship Information
        'HardshipType': 'hardship_type',
        'HardshipExplanation': 'hardship_description',
        'HardshipDate': 'hardship_date',
        'HardshipDuration': 'hardship_duration',
        
        // Additional Information
        'CreditCounseling': 'credit_counseling',
        'CreditCounselingDetails': 'credit_counseling_details',
        'MilitaryService': 'military_service',
        'BankruptcyFiled': 'bankruptcy_filed',
        
        // Lien Holder Information
        'SecondLienHolder': 'second_lien_holder',
        'SecondLienBalance': 'second_lien_balance',
        'SecondLienLoanNumber': 'second_lien_loan_number',
        'ThirdLienHolder': 'third_lien_holder',
        'ThirdLienBalance': 'third_lien_balance',
        'ThirdLienLoanNumber': 'third_lien_loan_number',
        
        // HOA Information
        'HasHOA': 'has_hoa',
        'HOAName': 'hoa_name',
        'HOAContactName': 'hoa_contact_name',
        'HOAContactPhone': 'hoa_contact_phone',
        'HOAContactAddress': 'hoa_contact_address',
        'HOAMonthlyFee': 'hoa_monthly_fee',
        
        // Intent/Request
        'Intent': 'intent',
        'AssistanceRequested': (data) => {
          if (!data.assistance_type_requested || !Array.isArray(data.assistance_type_requested)) {
            return data.intent === 'Sell' ? 'Short Sale' : 'Loan Modification';
          }
          return data.assistance_type_requested.join(', ');
        }
      }
    }
  };

  static async populateForm(
    formType: string,
    formData: Record<string, any>,
    extractedDocumentData: Record<string, any>
  ): Promise<Buffer> {
    const template = this.formTemplates[formType];
    if (!template) {
      throw new Error(`Form template ${formType} not found`);
    }

    // For now, create a PDF from scratch since we don't have the actual Form 710 template
    // In production, you would load the actual PDF template
    const pdfDoc = await this.createForm710FromScratch(formData, extractedDocumentData);
    
    // Save and return the PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private static async createForm710FromScratch(
    formData: Record<string, any>,
    extractedDocumentData: Record<string, any>
  ): Promise<PDFDocument> {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add pages
    const page1 = pdfDoc.addPage([612, 792]); // Letter size
    const page2 = pdfDoc.addPage([612, 792]);
    
    // Get font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Combine form data with extracted document data
    const allData = {
      ...extractedDocumentData,
      ...formData // Form data takes precedence
    };
    
    // Draw form header on page 1
    const { width, height } = page1.getSize();
    let yPosition = height - 50;
    
    page1.drawText('UNIFORM BORROWER ASSISTANCE FORM', {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    page1.drawText('Form 710', {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Section 1: Borrower Information
    yPosition -= 40;
    page1.drawText('SECTION 1: BORROWER INFORMATION', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 25;
    const borrowerInfo = [
      { label: 'Borrower Name:', value: allData.borrower_name || 'N/A' },
      { label: 'Social Security Number:', value: allData.borrower_ssn || 'N/A' },
      { label: 'Date of Birth:', value: allData.borrower_dob || 'N/A' },
      { label: 'Phone Number:', value: allData.borrower_cell_phone || 'N/A' },
      { label: 'Email:', value: allData.borrower_email || 'Attorney Only' },
    ];
    
    for (const item of borrowerInfo) {
      page1.drawText(item.label, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page1.drawText(item.value, {
        x: 200,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= 20;
    }
    
    // Property Information
    yPosition -= 20;
    page1.drawText('SECTION 2: PROPERTY INFORMATION', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 25;
    const propertyInfo = [
      { label: 'Property Address:', value: allData.property_address || 'N/A' },
      { label: 'Property Type:', value: allData.property_type || 'My Primary Residence' },
      { label: 'Property Value:', value: this.formatCurrency(allData.property_value) },
      { label: 'Mortgage Balance:', value: this.formatCurrency(allData.mortgage_balance) },
      { label: 'Monthly Payment:', value: this.formatCurrency(allData.monthly_payment) },
    ];
    
    for (const item of propertyInfo) {
      page1.drawText(item.label, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page1.drawText(item.value, {
        x: 200,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= 20;
    }
    
    // Financial Information on page 2
    yPosition = height - 50;
    page2.drawText('SECTION 3: FINANCIAL INFORMATION', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 25;
    page2.drawText('Monthly Income:', {
      x: 50,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    const incomeInfo = [
      { label: 'Gross Monthly Income:', value: this.formatCurrency(allData.monthly_gross_income) },
      { label: 'Net Monthly Income:', value: this.formatCurrency(allData.monthly_net_income) },
    ];
    
    for (const item of incomeInfo) {
      page2.drawText(item.label, {
        x: 70,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page2.drawText(item.value, {
        x: 220,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= 20;
    }
    
    // Hardship Information
    yPosition -= 20;
    page2.drawText('SECTION 4: HARDSHIP INFORMATION', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 25;
    page2.drawText('Hardship Type: ' + (allData.hardship_type || 'Not specified'), {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    page2.drawText('Hardship Description:', {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    const description = allData.hardship_description || 'Not provided';
    const descriptionLines = this.wrapText(description, 80);
    for (const line of descriptionLines) {
      page2.drawText(line, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }
    
    // Add metadata
    pdfDoc.setTitle('Form 710 - Borrower Assistance Form');
    pdfDoc.setSubject(`Generated on ${new Date().toLocaleDateString()}`);
    pdfDoc.setCreator('ReAlign Document System');
    pdfDoc.setProducer('ReAlign UBA Form Export Service');
    pdfDoc.setAuthor(allData.borrower_name || 'Unknown');
    pdfDoc.setKeywords(['Form 710', 'UBA', 'Mortgage Assistance', allData.loan_number || ''].filter(Boolean));
    
    return pdfDoc;
  }

  private static formatCurrency(value: any): string {
    if (!value) return '$0.00';
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? '$0.00' : '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  private static formatSSN(value: string): string {
    if (!value) return 'N/A';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return value;
  }

  private static wrapText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  static async getAvailableForms(): Promise<Array<{id: string, name: string, description: string}>> {
    return Object.entries(this.formTemplates).map(([id, template]) => ({
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: template.description
    }));
  }
}