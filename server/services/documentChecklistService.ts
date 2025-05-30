import { storage } from '../storage';
import { aiService } from './aiService';
import { workflowLogger } from './workflowLogger';

interface ChecklistGenerationParams {
  transaction_id: string;
  lender_name: string;
  case_type: string;
  property_type: string;
  employment_status?: string;
  hardship_type?: string;
  delinquency_status?: string;
  bankruptcy_status?: string;
  military_status?: string;
  has_rental_income?: boolean;
  has_coborrower?: boolean;
  uba_form_data?: Record<string, any>;
}

interface ChecklistItem {
  id: string;
  checklist_id: string;
  document_requirement_id: string;
  document_name: string;
  category: string;
  priority: 'required' | 'conditional' | 'optional';
  status: string;
  progress_percentage: number;
  due_date?: string;
  notes?: string;
  ai_confidence_score?: number;
  uploaded_document_id?: string;
}

interface DocumentChecklist {
  id: string;
  transaction_id: string;
  lender_name: string;
  case_type: string;
  property_type: string;
  items: ChecklistItem[];
  total_required: number;
  total_completed: number;
  overall_progress: number;
  ai_guidance?: string;
}

class DocumentChecklistService {
  /**
   * Generate a dynamic document checklist based on transaction parameters
   */
  async generateChecklist(params: ChecklistGenerationParams): Promise<DocumentChecklist> {
    // Get lender information
    const lender = await storage.getLenderByName(params.lender_name);
    if (!lender) {
      throw new Error(`Lender ${params.lender_name} not found`);
    }

    // Create the checklist record
    const checklistId = await storage.createTransactionChecklist({
      transaction_id: params.transaction_id,
      lender_id: lender.id,
      case_type: params.case_type,
      property_type: params.property_type,
      delinquency_status: params.delinquency_status,
      hardship_type: params.hardship_type,
      employment_status: params.employment_status,
      bankruptcy_status: params.bankruptcy_status,
      military_status: params.military_status
    });

    // Get applicable document requirements based on parameters
    const requirements = await this.getApplicableRequirements(lender.id, params);

    // Create checklist items
    const items: ChecklistItem[] = [];
    for (const req of requirements) {
      const itemId = await storage.createChecklistItem({
        checklist_id: checklistId,
        document_requirement_id: req.document_id,
        document_name: req.document_name,
        category: req.category,
        priority: req.priority,
        status: 'not_started',
        progress_percentage: 0,
        due_date: this.calculateDueDate(req.priority, params.delinquency_status),
        notes: req.notes
      });

      items.push({
        id: itemId,
        checklist_id: checklistId,
        document_requirement_id: req.document_id,
        document_name: req.document_name,
        category: req.category,
        priority: req.priority,
        status: 'not_started',
        progress_percentage: 0,
        due_date: this.calculateDueDate(req.priority, params.delinquency_status),
        notes: req.notes
      });
    }

    // Calculate progress metrics
    const totalRequired = items.filter(item => item.priority === 'required').length;
    const totalCompleted = items.filter(item => 
      ['expert_approved', 'ai_verified'].includes(item.status)
    ).length;
    const overallProgress = totalRequired > 0 
      ? Math.round((totalCompleted / totalRequired) * 100) 
      : 0;

    return {
      id: checklistId,
      transaction_id: params.transaction_id,
      lender_name: params.lender_name,
      case_type: params.case_type,
      property_type: params.property_type,
      items,
      total_required: totalRequired,
      total_completed: totalCompleted,
      overall_progress: overallProgress
    };
  }

  /**
   * Get applicable document requirements based on conditions
   */
  private async getApplicableRequirements(lenderId: string, params: ChecklistGenerationParams) {
    // Get base requirements for the lender
    const baseRequirements = await storage.getLenderRequirements(
      lenderId,
      params.case_type,
      params.property_type
    );

    // Apply conditional logic based on params
    const applicableRequirements = [];

    for (const req of baseRequirements) {
      let isApplicable = true;
      let priority = req.priority;

      // Check conditions if they exist
      if (req.conditions) {
        const conditions = req.conditions as any;

        // Check employment status conditions
        if (conditions.employment_status && params.employment_status) {
          if (Array.isArray(conditions.employment_status)) {
            isApplicable = conditions.employment_status.includes(params.employment_status);
          } else {
            isApplicable = conditions.employment_status === params.employment_status;
          }
        }

        // Check delinquency conditions
        if (conditions.delinquency && params.delinquency_status) {
          isApplicable = this.checkDelinquencyCondition(
            conditions.delinquency,
            params.delinquency_status
          );
        }

        // Check bankruptcy conditions
        if (conditions.bankruptcy_status && params.bankruptcy_status) {
          isApplicable = conditions.bankruptcy_status === params.bankruptcy_status;
        }

        // Check military status conditions
        if (conditions.military_status && params.military_status) {
          isApplicable = conditions.military_status === params.military_status;
        }

        // Check rental income conditions
        if (conditions.has_rental_income !== undefined && params.has_rental_income !== undefined) {
          isApplicable = conditions.has_rental_income === params.has_rental_income;
        }

        // Check co-borrower conditions
        if (conditions.has_coborrower !== undefined && params.has_coborrower !== undefined) {
          isApplicable = conditions.has_coborrower === params.has_coborrower;
        }
      }

      // Apply Fannie Mae specific rules based on guidelines
      if (params.lender_name === 'Fannie Mae' || params.lender_name === 'Chase') {
        // BRP not required if > 18 months delinquent for short sales
        if (params.case_type === 'short_sale' && 
            params.delinquency_status === '> 18 months' &&
            req.document_name === 'Mortgage Assistance Application') {
          isApplicable = false;
        }

        // Self-employed always needs P&L and business bank statements
        if (params.employment_status === 'self_employed') {
          if (['Profit & Loss Statement', 'Business Bank Statements'].includes(req.document_name)) {
            isApplicable = true;
            priority = 'required';
          }
        }

        // Bankruptcy active requires schedules
        if (params.bankruptcy_status && params.bankruptcy_status !== 'none') {
          if (req.document_name === 'Bankruptcy Schedules') {
            isApplicable = true;
            priority = 'required';
          }
        }

        // Military with PCS orders has reduced requirements
        if (params.military_status === 'pcs_orders') {
          if (['Bank Statements', 'Tax Returns'].includes(req.document_name)) {
            priority = 'optional';
          }
        }
      }

      if (isApplicable) {
        applicableRequirements.push({
          ...req,
          priority: priority
        });
      }
    }

    // Add any missing required documents based on UBA form data
    if (params.uba_form_data) {
      applicableRequirements.push(...this.getUBABasedRequirements(params.uba_form_data));
    }

    return applicableRequirements;
  }

  /**
   * Get additional requirements based on UBA form data
   */
  private getUBABasedRequirements(ubaData: Record<string, any>) {
    const additionalRequirements = [];

    // If rental income is claimed, require lease agreements
    if (ubaData.rental_income && parseFloat(ubaData.rental_income) > 0) {
      additionalRequirements.push({
        document_id: 'rental_income_doc',
        document_name: 'Lease Agreement(s)',
        category: 'income_verification',
        priority: 'required',
        notes: 'Required because rental income was reported'
      });
    }

    // If receiving disability, require award letter
    if (ubaData.disability_income && parseFloat(ubaData.disability_income) > 0) {
      additionalRequirements.push({
        document_id: 'disability_doc',
        document_name: 'Disability Award Letter',
        category: 'income_verification',
        priority: 'required',
        notes: 'Required because disability income was reported'
      });
    }

    // If HOA fees exist, require HOA statement
    if (ubaData.hoa_fees && parseFloat(ubaData.hoa_fees) > 0) {
      additionalRequirements.push({
        document_id: 'hoa_doc',
        document_name: 'HOA Statement',
        category: 'property_information',
        priority: 'required',
        notes: 'Required because HOA fees were reported'
      });
    }

    return additionalRequirements;
  }

  /**
   * Check if delinquency meets condition
   */
  private checkDelinquencyCondition(condition: string, status: string): boolean {
    const statusMonths = this.parseDelinquencyStatus(status);
    const conditionMonths = this.parseDelinquencyStatus(condition);

    if (condition.startsWith('<')) {
      return statusMonths < conditionMonths;
    } else if (condition.startsWith('>')) {
      return statusMonths > conditionMonths;
    } else if (condition.startsWith('>=')) {
      return statusMonths >= conditionMonths;
    } else if (condition.startsWith('<=')) {
      return statusMonths <= conditionMonths;
    } else {
      return statusMonths === conditionMonths;
    }
  }

  /**
   * Parse delinquency status to months
   */
  private parseDelinquencyStatus(status: string): number {
    if (status.includes('current')) return 0;
    
    const match = status.match(/(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
    
    if (status.includes('18')) return 18;
    if (status.includes('12')) return 12;
    if (status.includes('6')) return 6;
    if (status.includes('3')) return 3;
    
    return 0;
  }

  /**
   * Calculate due date based on priority and urgency
   */
  private calculateDueDate(priority: string, delinquencyStatus?: string): string {
    const now = new Date();
    let daysToAdd = 30; // Default

    if (priority === 'required') {
      daysToAdd = 7;
    } else if (priority === 'conditional') {
      daysToAdd = 14;
    }

    // Urgent if high delinquency
    if (delinquencyStatus && this.parseDelinquencyStatus(delinquencyStatus) >= 6) {
      daysToAdd = Math.min(daysToAdd, 3);
    }

    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString().split('T')[0];
  }

  /**
   * Get checklist for a transaction
   */
  async getTransactionChecklist(transactionId: string): Promise<DocumentChecklist | null> {
    const checklist = await storage.getTransactionChecklist(transactionId);
    if (!checklist) {
      return null;
    }

    const items = await storage.getChecklistItems(checklist.id);
    
    const totalRequired = items.filter(item => item.priority === 'required').length;
    const totalCompleted = items.filter(item => 
      ['expert_approved', 'ai_verified'].includes(item.status)
    ).length;
    const overallProgress = totalRequired > 0 
      ? Math.round((totalCompleted / totalRequired) * 100) 
      : 0;

    return {
      id: checklist.id,
      transaction_id: checklist.transaction_id,
      lender_name: checklist.lender_name,
      case_type: checklist.case_type,
      property_type: checklist.property_type,
      items,
      total_required: totalRequired,
      total_completed: totalCompleted,
      overall_progress: overallProgress
    };
  }

  /**
   * Get a specific checklist item
   */
  async getChecklistItem(itemId: string): Promise<any> {
    return storage.getChecklistItem(itemId);
  }

  /**
   * Update checklist item
   */
  async updateChecklistItem(itemId: string, updates: any): Promise<any> {
    // Calculate progress based on status
    let progressPercentage = 0;
    switch (updates.status) {
      case 'uploaded':
        progressPercentage = 50;
        break;
      case 'ai_verified':
        progressPercentage = 75;
        break;
      case 'expert_approved':
        progressPercentage = 100;
        break;
      case 'rejected':
      case 'needs_attention':
        progressPercentage = 25;
        break;
    }

    return storage.updateChecklistItem(itemId, {
      ...updates,
      progress_percentage: progressPercentage,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Analyze uploaded document with AI
   */
  async analyzeUploadedDocument(itemId: string, documentId: string, userId: string) {
    try {
      const item = await storage.getChecklistItem(itemId);
      const document = await storage.getDocument(documentId);

      if (!item || !document) {
        throw new Error('Item or document not found');
      }

      // Use AI to analyze the document
      const analysis = await aiService.generateRecommendation({
        userId,
        contextRecipeId: 'document_analysis_v1',
        userInput: JSON.stringify({
          document_type: item.document_name,
          document_category: item.category,
          file_name: document.file_name,
          file_size: document.file_size
        }),
        additionalContext: {
          expected_document: item.document_name,
          checklist_item_id: itemId
        }
      });

      // Parse AI response
      let aiConfidence = 0.85; // Default
      let extractedData = {};
      
      try {
        const aiResult = JSON.parse(analysis.content);
        aiConfidence = aiResult.confidence || 0.85;
        extractedData = aiResult.extracted_data || {};
      } catch (e) {
        console.warn('Failed to parse AI analysis result');
      }

      // Update item with AI verification
      if (aiConfidence >= 0.9) {
        await this.updateChecklistItem(itemId, {
          status: 'ai_verified',
          ai_confidence_score: aiConfidence,
          ai_extracted_data: extractedData,
          verified_at: new Date().toISOString()
        });
      } else if (aiConfidence >= 0.7) {
        await this.updateChecklistItem(itemId, {
          status: 'needs_attention',
          ai_confidence_score: aiConfidence,
          ai_extracted_data: extractedData,
          notes: 'AI verification confidence below threshold. Manual review recommended.'
        });
      } else {
        await this.updateChecklistItem(itemId, {
          status: 'needs_attention',
          ai_confidence_score: aiConfidence,
          notes: 'Document may not match expected type. Please verify.'
        });
      }

      // Log the analysis
      await workflowLogger.logDocumentAnalysis({
        userId,
        documentId,
        checklistItemId: itemId,
        aiConfidence,
        status: aiConfidence >= 0.9 ? 'verified' : 'needs_review'
      });

    } catch (error) {
      console.error('Document analysis error:', error);
      throw error;
    }
  }

  /**
   * Get active lenders
   */
  async getActiveLenders() {
    return storage.getActiveLenders();
  }

  /**
   * Create a checklist template
   */
  async createTemplate(data: any) {
    return storage.createChecklistTemplate(data);
  }

  /**
   * Get templates for a user
   */
  async getTemplatesForUser(userId: string) {
    return storage.getChecklistTemplatesForUser(userId);
  }

  /**
   * Get checklist progress analytics
   */
  async getChecklistProgress(transactionId: string) {
    const checklist = await this.getTransactionChecklist(transactionId);
    if (!checklist) {
      return null;
    }

    const byCategory = checklist.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          total: 0,
          completed: 0,
          in_progress: 0,
          not_started: 0
        };
      }

      acc[item.category].total++;
      
      if (['expert_approved', 'ai_verified'].includes(item.status)) {
        acc[item.category].completed++;
      } else if (['uploaded', 'needs_attention'].includes(item.status)) {
        acc[item.category].in_progress++;
      } else {
        acc[item.category].not_started++;
      }

      return acc;
    }, {} as Record<string, any>);

    const criticalMissing = checklist.items.filter(item => 
      item.priority === 'required' && 
      item.status === 'not_started' &&
      new Date(item.due_date!) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Due in 3 days
    );

    return {
      overall_progress: checklist.overall_progress,
      total_documents: checklist.items.length,
      required_documents: checklist.total_required,
      completed_documents: checklist.total_completed,
      by_category: byCategory,
      critical_missing: criticalMissing,
      estimated_completion_time: this.estimateCompletionTime(checklist)
    };
  }

  /**
   * Estimate time to complete checklist
   */
  private estimateCompletionTime(checklist: DocumentChecklist): string {
    const remainingRequired = checklist.items.filter(item => 
      item.priority === 'required' && 
      !['expert_approved', 'ai_verified'].includes(item.status)
    ).length;

    // Assume 30 minutes per document on average
    const estimatedMinutes = remainingRequired * 30;
    
    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} minutes`;
    } else if (estimatedMinutes < 480) {
      return `${Math.round(estimatedMinutes / 60)} hours`;
    } else {
      return `${Math.round(estimatedMinutes / 480)} days`;
    }
  }
}

export const documentChecklistService = new DocumentChecklistService();