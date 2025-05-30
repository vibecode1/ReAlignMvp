/**
 * Calculation Export Utilities
 * 
 * Functions for exporting financial calculation results to various formats.
 * Supports PDF, Excel, and JSON exports with professional formatting.
 */

import { CalculationResult } from './financialCalculatorApi';

interface CalculationExportData {
  borrowerName?: string;
  propertyAddress?: string;
  loanNumber?: string;
  calculationType: string;
  calculations: Record<string, CalculationResult<any>>;
  timestamp: string;
  evaluationType?: string;
}

/**
 * Export calculation results to PDF format
 */
export const exportCalculationsToPDF = async (data: CalculationExportData): Promise<void> => {
  // This would typically use a library like jsPDF or html2pdf
  // For now, we'll create a printable HTML version
  
  const printContent = generatePrintableHTML(data);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please check popup settings.');
  }
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Trigger print dialog
  printWindow.onload = () => {
    printWindow.print();
    // Close after printing (user may cancel, so we wait a bit)
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  };
};

/**
 * Export calculation results to Excel format (CSV for now)
 */
export const exportCalculationsToExcel = (data: CalculationExportData): void => {
  const csvContent = generateCSVContent(data);
  downloadFile(csvContent, `financial_calculations_${data.timestamp.replace(/[:.]/g, '-')}.csv`, 'text/csv');
};

/**
 * Export calculation results to JSON format
 */
export const exportCalculationsToJSON = (data: CalculationExportData): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `financial_calculations_${data.timestamp.replace(/[:.]/g, '-')}.json`, 'application/json');
};

/**
 * Generate printable HTML content for PDF export
 */
const generatePrintableHTML = (data: CalculationExportData): string => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (ratio: number) => {
    return `${(ratio * 100).toFixed(2)}%`;
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      if (value < 1 && value > 0) {
        return formatPercentage(value);
      } else if (value > 100) {
        return formatCurrency(value);
      } else {
        return value.toFixed(2);
      }
    } else if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    } else if (typeof value === 'object' && value !== null) {
      return Object.entries(value).map(([key, val]) => 
        `${key.replace(/([A-Z])/g, ' $1').trim()}: ${formatValue(val)}`
      ).join('<br>');
    }
    return String(value);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Financial Calculation Results</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 20px; 
          color: #333; 
        }
        .header { 
          border-bottom: 2px solid #007bff; 
          padding-bottom: 10px; 
          margin-bottom: 20px; 
        }
        .header h1 { 
          color: #007bff; 
          margin: 0; 
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px; 
          margin-bottom: 30px; 
        }
        .info-item { 
          padding: 10px; 
          background-color: #f8f9fa; 
          border-radius: 5px; 
        }
        .info-label { 
          font-weight: bold; 
          color: #666; 
          font-size: 12px; 
          text-transform: uppercase; 
        }
        .info-value { 
          font-size: 16px; 
          margin-top: 5px; 
        }
        .calculation { 
          margin-bottom: 30px; 
          border: 1px solid #dee2e6; 
          border-radius: 8px; 
          overflow: hidden; 
        }
        .calculation-header { 
          background-color: #007bff; 
          color: white; 
          padding: 15px; 
          font-weight: bold; 
          font-size: 18px; 
        }
        .calculation-content { 
          padding: 20px; 
        }
        .result-main { 
          font-size: 28px; 
          font-weight: bold; 
          color: #007bff; 
          margin-bottom: 15px; 
        }
        .result-details { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 15px; 
          margin-bottom: 15px; 
        }
        .detail-item { 
          padding: 8px; 
          background-color: #f8f9fa; 
          border-radius: 4px; 
        }
        .detail-label { 
          font-size: 12px; 
          color: #666; 
          text-transform: uppercase; 
          font-weight: bold; 
        }
        .detail-value { 
          font-size: 14px; 
          margin-top: 3px; 
        }
        .warnings { 
          background-color: #fff3cd; 
          border: 1px solid #ffeaa7; 
          border-radius: 5px; 
          padding: 10px; 
          margin-top: 15px; 
        }
        .warning-title { 
          font-weight: bold; 
          color: #856404; 
          margin-bottom: 8px; 
        }
        .warning-item { 
          font-size: 14px; 
          color: #856404; 
          margin-bottom: 5px; 
        }
        .guideline { 
          background-color: #e7f3ff; 
          border-left: 4px solid #007bff; 
          padding: 10px; 
          margin-top: 15px; 
          font-size: 12px; 
          color: #666; 
        }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #dee2e6; 
          text-align: center; 
          color: #666; 
          font-size: 12px; 
        }
        @media print {
          body { margin: 0; }
          .calculation { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Financial Calculation Results</h1>
        <p>Fannie Mae Loss Mitigation Analysis</p>
      </div>

      <div class="info-grid">
        ${data.borrowerName ? `
          <div class="info-item">
            <div class="info-label">Borrower Name</div>
            <div class="info-value">${data.borrowerName}</div>
          </div>
        ` : ''}
        ${data.propertyAddress ? `
          <div class="info-item">
            <div class="info-label">Property Address</div>
            <div class="info-value">${data.propertyAddress}</div>
          </div>
        ` : ''}
        ${data.loanNumber ? `
          <div class="info-item">
            <div class="info-label">Loan Number</div>
            <div class="info-value">${data.loanNumber}</div>
          </div>
        ` : ''}
        <div class="info-item">
          <div class="info-label">Analysis Date</div>
          <div class="info-value">${new Date(data.timestamp).toLocaleDateString()}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Calculation Type</div>
          <div class="info-value">${data.calculationType}</div>
        </div>
        ${data.evaluationType ? `
          <div class="info-item">
            <div class="info-label">Evaluation Type</div>
            <div class="info-value">${data.evaluationType.replace('_', ' ').toUpperCase()}</div>
          </div>
        ` : ''}
      </div>

      ${Object.entries(data.calculations).map(([calcName, calcResult]) => `
        <div class="calculation">
          <div class="calculation-header">
            ${calcName.replace(/([A-Z])/g, ' $1').trim()}
          </div>
          <div class="calculation-content">
            <div class="result-main">
              ${formatValue(calcResult.result)}
            </div>
            
            ${calcResult.details ? `
              <div class="result-details">
                ${Object.entries(calcResult.details).map(([key, value]) => `
                  <div class="detail-item">
                    <div class="detail-label">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div class="detail-value">${formatValue(value)}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${calcResult.warnings && calcResult.warnings.length > 0 ? `
              <div class="warnings">
                <div class="warning-title">Important Considerations:</div>
                ${calcResult.warnings.map(warning => `
                  <div class="warning-item">• ${warning}</div>
                `).join('')}
              </div>
            ` : ''}
            
            ${calcResult.guidelineReference ? `
              <div class="guideline">
                <strong>Fannie Mae Guideline:</strong> ${calcResult.guidelineReference}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}

      <div class="footer">
        <p>Generated by ReAlign Financial Calculator Dashboard</p>
        <p>All calculations based on Fannie Mae Servicing Guide requirements</p>
        <p>This analysis is for informational purposes only and should be reviewed by qualified professionals</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate CSV content for Excel export
 */
const generateCSVContent = (data: CalculationExportData): string => {
  const rows: string[][] = [];
  
  // Header information
  rows.push(['Financial Calculation Results', '']);
  rows.push(['Analysis Date', new Date(data.timestamp).toLocaleDateString()]);
  rows.push(['Calculation Type', data.calculationType]);
  if (data.borrowerName) rows.push(['Borrower Name', data.borrowerName]);
  if (data.propertyAddress) rows.push(['Property Address', data.propertyAddress]);
  if (data.loanNumber) rows.push(['Loan Number', data.loanNumber]);
  if (data.evaluationType) rows.push(['Evaluation Type', data.evaluationType]);
  rows.push(['', '']); // Empty row
  
  // Calculation results
  rows.push(['Calculation', 'Result', 'Details', 'Warnings', 'Guideline Reference']);
  
  Object.entries(data.calculations).forEach(([calcName, calcResult]) => {
    const resultValue = typeof calcResult.result === 'object' 
      ? JSON.stringify(calcResult.result)
      : String(calcResult.result);
    
    const details = calcResult.details 
      ? Object.entries(calcResult.details)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ')
      : '';
    
    const warnings = calcResult.warnings ? calcResult.warnings.join('; ') : '';
    const guideline = calcResult.guidelineReference || '';
    
    rows.push([
      calcName.replace(/([A-Z])/g, ' $1').trim(),
      resultValue,
      details,
      warnings,
      guideline
    ]);
  });
  
  // Convert to CSV format
  return rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
       .join(',')
  ).join('\n');
};

/**
 * Download file utility
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Prepare calculation data for export
 */
export const prepareCalculationExport = (
  calculations: Record<string, CalculationResult<any>>,
  metadata: {
    borrowerName?: string;
    propertyAddress?: string;
    loanNumber?: string;
    calculationType?: string;
    evaluationType?: string;
  } = {}
): CalculationExportData => {
  return {
    ...metadata,
    calculationType: metadata.calculationType || 'Financial Analysis',
    calculations,
    timestamp: new Date().toISOString()
  };
};

export default {
  exportCalculationsToPDF,
  exportCalculationsToExcel,
  exportCalculationsToJSON,
  prepareCalculationExport
};