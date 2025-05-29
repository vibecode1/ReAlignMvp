import { Request, Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@shared/schema';
import { 
  loe_drafts, 
  loe_versions, 
  loe_templates,
  uba_form_data,
  transactions,
  workflow_events,
  type InsertLoeDraft,
  type InsertLoeVersion,
  type InsertLoeTemplate
} from "@shared/schema";
import { aiService } from "../services/aiService";
import { workflowLogger } from "../services/workflowLogger";
import { loeExportService } from "../services/loeExportService";
import { z } from "zod";

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

const db = drizzle(pool, { schema });

// Validation schemas
const createLoeDraftSchema = z.object({
  transaction_id: z.string().uuid(),
  template_type: z.enum([
    'unemployment',
    'medical_hardship', 
    'divorce_separation',
    'death_of_spouse',
    'income_reduction',
    'business_failure',
    'military_service',
    'natural_disaster',
    'increased_expenses',
    'other_hardship'
  ]),
  custom_template_name: z.string().optional(),
  generate_with_ai: z.boolean().default(true),
  custom_context: z.string().optional(),
});

const updateLoeDraftSchema = z.object({
  letter_title: z.string().optional(),
  letter_content: z.string().optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'sent', 'archived']).optional(),
  ai_assisted: z.boolean().optional(),
});

const createVersionSchema = z.object({
  loe_draft_id: z.string().uuid(),
  letter_content: z.string(),
  change_summary: z.string().optional(),
  ai_assisted_edit: z.boolean().default(false),
  ai_suggestions_applied: z.array(z.string()).optional(),
});

// LOE Drafter Controller - Updated
export class LoeDrafterController {
  // Get all LOE drafts for a transaction
  getTransactionLoeDrafts = async (req: Request, res: Response) => {
    try {
      const { transactionId } = req.params;
      const userId = (req as any).user?.id;

      const drafts = await db
        .select()
        .from(loe_drafts)
        .where(eq(loe_drafts.transaction_id, transactionId))
        .orderBy(desc(loe_drafts.updated_at));

      // Log the retrieval (wrapped to prevent errors)
      try {
        await workflowLogger.logUserInteraction(userId, {
          event_name: 'loe_drafts_retrieved',
          event_description: `Retrieved ${drafts.length} LOE drafts`,
          transaction_id: transactionId,
          metadata: { draft_count: drafts.length },
        });
      } catch (logError) {
        console.error('Failed to log LOE drafts retrieval:', logError);
      }

      res.json({ success: true, data: drafts });
    } catch (error) {
      console.error("Error fetching LOE drafts:", error);
      res.status(500).json({ success: false, error: "Failed to fetch LOE drafts" });
    }
  }

  // Get a specific LOE draft with its versions
  getLoeDraft = async (req: Request, res: Response) => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;

      const [draft] = await db
        .select()
        .from(loe_drafts)
        .where(eq(loe_drafts.id, draftId));

      if (!draft) {
        return res.status(404).json({ success: false, error: "LOE draft not found" });
      }

      const versions = await db
        .select()
        .from(loe_versions)
        .where(eq(loe_versions.loe_draft_id, draftId))
        .orderBy(desc(loe_versions.version_number));

      res.json({ success: true, data: { draft, versions } });
    } catch (error) {
      console.error("Error fetching LOE draft:", error);
      res.status(500).json({ success: false, error: "Failed to fetch LOE draft" });
    }
  }

  // Create a new LOE draft
  createLoeDraft = async (req: Request, res: Response) => {
    console.log('=== LOE DRAFT CREATION STARTED ===');
    try {
      const userId = (req as any).user?.id;
      console.log('LOE Draft Creation - User ID:', userId);
      console.log('LOE Draft Creation - Request Body:', JSON.stringify(req.body, null, 2));
      
      if (!userId) {
        return res.status(401).json({ success: false, error: "User not authenticated" });
      }
      
      const validatedData = createLoeDraftSchema.parse(req.body);

      // Get UBA form data if available
      console.log('LOE Draft Creation - Looking for UBA data for transaction:', validatedData.transaction_id);
      const [ubaData] = await db
        .select()
        .from(uba_form_data)
        .where(eq(uba_form_data.transaction_id, validatedData.transaction_id))
        .orderBy(desc(uba_form_data.updated_at));
      console.log('LOE Draft Creation - UBA data found:', !!ubaData);

      let letterContent = "";
      let aiPromptUsed = "";
      let aiModelUsed = "";
      let aiConfidenceScore = 0;

      if (validatedData.generate_with_ai && (ubaData || validatedData.custom_context)) {
        try {
          // Generate letter content using AI
          const prompt = this.buildLoePrompt(validatedData.template_type, ubaData, validatedData.custom_context);
          aiPromptUsed = prompt;
          console.log('Generating AI content with prompt length:', prompt.length);

          const aiResponse = await aiService.generateRecommendation({
            userId: userId,
            transactionId: validatedData.transaction_id,
            contextRecipeId: 'uba_form_completion_v1',
            userInput: prompt,
            additionalContext: {
              task: 'letter_generation',
              template_type: validatedData.template_type
            }
          });

          letterContent = aiResponse.content;
          aiModelUsed = aiResponse.model_used || 'unknown';
          aiConfidenceScore = Math.floor(Math.random() * 20) + 80; // 80-100 for now
          console.log('AI generation successful, content length:', letterContent.length);
        } catch (aiError) {
          console.error('AI generation failed:', aiError);
          console.log('Falling back to basic template');
          letterContent = this.getBasicTemplate(validatedData.template_type);
          aiModelUsed = null;
          aiConfidenceScore = null;
        }

        // Log AI generation (wrapped in try-catch to not break the flow)
        try {
          if (aiModelUsed) {
            await workflowLogger.logAiRecommendation(userId, {
              transaction_id: validatedData.transaction_id,
              context_recipe_id: 'loe_generation',
              model_used: aiModelUsed,
              prompt_tokens: 0,
              completion_tokens: 0,
              execution_time_ms: 0,
              success: true,
              confidence_score: aiConfidenceScore,
            });
          }
        } catch (logError) {
          console.error('Failed to log AI recommendation:', logError);
        }
      } else {
        // Use a basic template
        console.log('Using basic template for type:', validatedData.template_type);
        letterContent = this.getBasicTemplate(validatedData.template_type);
      }

      // Ensure we have letter content
      if (!letterContent) {
        console.error('No letter content generated');
        return res.status(500).json({ 
          success: false, 
          error: "Failed to generate letter content" 
        });
      }

      console.log('Letter content ready, length:', letterContent.length);

      // Create the draft
      const newDraft: InsertLoeDraft = {
        transaction_id: validatedData.transaction_id,
        uba_form_data_id: ubaData?.id || null,
        created_by_user_id: userId,
        template_type: validatedData.template_type,
        custom_template_name: validatedData.custom_template_name || null,
        letter_title: `Letter of Explanation - ${this.getTemplateTitle(validatedData.template_type)}`,
        letter_content: letterContent,
        ai_generated: validatedData.generate_with_ai || false,
        ai_model_used: aiModelUsed || null,
        ai_prompt_used: aiPromptUsed || null,
        ai_confidence_score: aiConfidenceScore || null,
        status: 'draft',
        current_version: 1,
        export_formats: [],
      };
      
      console.log('LOE Draft Creation - New draft object:', newDraft);

      let createdDraft;
      try {
        const result = await db
          .insert(loe_drafts)
          .values(newDraft)
          .returning();
        createdDraft = result[0];
        console.log('Draft created successfully with ID:', createdDraft.id);
      } catch (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error('Failed to insert draft into database');
      }

      // Create initial version
      try {
        await db.insert(loe_versions).values({
          loe_draft_id: createdDraft.id,
          version_number: 1,
          letter_content: letterContent,
          change_summary: "Initial draft created",
          edited_by_user_id: userId,
          ai_assisted_edit: validatedData.generate_with_ai || false,
        });
        console.log('Version record created successfully');
      } catch (versionError) {
        console.error('Failed to create version record:', versionError);
        // Don't throw here, the draft was created successfully
      }

      // Log creation (wrapped to not break the flow)
      try {
        await workflowLogger.logUserInteraction(userId, {
          event_name: 'loe_draft_created',
          event_description: `Created new LOE draft for ${validatedData.template_type}`,
          transaction_id: validatedData.transaction_id,
          metadata: {
            draft_id: createdDraft.id,
            template_type: validatedData.template_type,
            ai_generated: validatedData.generate_with_ai,
          },
        });
      } catch (logError) {
        console.error('Failed to log draft creation:', logError);
      }

      res.json({ success: true, data: createdDraft });
    } catch (error) {
      console.error("Error creating LOE draft:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ success: false, error: error.errors });
      }
      
      const errorMessage = error instanceof Error ? error.message : "Failed to create LOE draft";
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // Update an LOE draft
  updateLoeDraft = async (req: Request, res: Response) => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;
      const validatedData = updateLoeDraftSchema.parse(req.body);

      const [existingDraft] = await db
        .select()
        .from(loe_drafts)
        .where(eq(loe_drafts.id, draftId));

      if (!existingDraft) {
        return res.status(404).json({ success: false, error: "LOE draft not found" });
      }

      // If content is being updated, create a new version
      if (validatedData.letter_content && validatedData.letter_content !== existingDraft.letter_content) {
        const newVersionNumber = existingDraft.current_version + 1;

        await db.insert(loe_versions).values({
          loe_draft_id: draftId,
          version_number: newVersionNumber,
          letter_content: validatedData.letter_content,
          change_summary: req.body.change_summary || "Content updated",
          edited_by_user_id: userId,
          ai_assisted_edit: validatedData.ai_assisted || false,
          ai_suggestions_applied: req.body.ai_suggestions_applied ? JSON.stringify(req.body.ai_suggestions_applied) : null,
        });

        // Update the draft with new version number
        validatedData.current_version = newVersionNumber;
      }

      // Update the draft
      const [updatedDraft] = await db
        .update(loe_drafts)
        .set({
          ...validatedData,
          updated_at: new Date(),
        })
        .where(eq(loe_drafts.id, draftId))
        .returning();

      // Log update
      await workflowLogger.logUserInteraction(userId, {
        event_name: 'loe_draft_updated',
        event_description: `Updated LOE draft`,
        transaction_id: existingDraft.transaction_id,
        metadata: {
          draft_id: draftId,
          updated_fields: Object.keys(validatedData),
          new_version: validatedData.current_version,
        },
      });

      res.json({ success: true, data: updatedDraft });
    } catch (error) {
      console.error("Error updating LOE draft:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      res.status(500).json({ success: false, error: "Failed to update LOE draft" });
    }
  }

  // Get available templates
  getTemplates = async (req: Request, res: Response) => {
    try {
      const { template_type } = req.query;

      const query = db.select().from(loe_templates).where(eq(loe_templates.is_active, true));

      if (template_type) {
        query.where(eq(loe_templates.template_type, template_type as any));
      }

      const templates = await query.orderBy(desc(loe_templates.usage_count));

      res.json({ success: true, data: templates });
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ success: false, error: "Failed to fetch templates" });
    }
  }

  // Generate AI suggestions for improving a draft
  generateSuggestions = async (req: Request, res: Response) => {
    try {
      const { draftId } = req.params;
      const userId = (req as any).user?.id;

      const [draft] = await db
        .select()
        .from(loe_drafts)
        .where(eq(loe_drafts.id, draftId));

      if (!draft) {
        return res.status(404).json({ success: false, error: "LOE draft not found" });
      }

      const prompt = `Please review this Letter of Explanation and provide specific suggestions for improvement:

Current Letter:
${draft.letter_content}

Provide 3-5 specific suggestions to make this letter more effective for a ${draft.template_type.replace(/_/g, ' ')} hardship case.`;

      const aiResponse = await aiService.generateRecommendation({
        userId: userId,
        transactionId: draft.transaction_id,
        contextRecipeId: 'uba_form_completion_v1',
        userInput: prompt,
        additionalContext: {
          task: 'letter_improvement',
          template_type: draft.template_type
        }
      });

      // Parse suggestions (assuming AI returns them in a structured format)
      const suggestions = aiResponse.content.split('\n').filter(s => s.trim());

      res.json({ 
        success: true, 
        data: {
          suggestions,
          model_used: aiResponse.model_used,
        }
      });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({ success: false, error: "Failed to generate suggestions" });
    }
  }

  // Export LOE draft
  exportLoeDraft = async (req: Request, res: Response) => {
    try {
      const { draftId } = req.params;
      const { format } = req.query;
      const userId = (req as any).user?.id;

      if (!format || !['pdf', 'docx', 'txt'].includes(format as string)) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid format. Supported formats: pdf, docx, txt" 
        });
      }

      const [draft] = await db
        .select()
        .from(loe_drafts)
        .where(eq(loe_drafts.id, draftId));

      if (!draft) {
        return res.status(404).json({ success: false, error: "LOE draft not found" });
      }

      let content: Buffer | string;
      let contentType: string;
      let filename = `LOE_${draft.template_type}_${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'pdf':
          content = await loeExportService.exportToPdf(draftId);
          contentType = 'application/pdf';
          break;
        case 'docx':
          content = await loeExportService.exportToWord(draftId);
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'txt':
          content = await loeExportService.exportToText(draftId);
          contentType = 'text/plain';
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Log export
      await workflowLogger.logUserInteraction(userId, {
        event_name: 'loe_exported',
        event_description: `Exported LOE draft in ${format} format`,
        transaction_id: draft.transaction_id,
        metadata: {
          draft_id: draftId,
          format,
          template_type: draft.template_type,
        },
      });

      // Set response headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.${format}"`);

      // Send the file
      if (typeof content === 'string') {
        res.send(content);
      } else {
        res.send(content);
      }
    } catch (error) {
      console.error("Error exporting LOE draft:", error);
      res.status(500).json({ success: false, error: "Failed to export LOE draft" });
    }
  }

  // Helper methods
  private buildLoePrompt(templateType: string, ubaData: any, customContext?: string): string {
    if (ubaData) {
      // If we have UBA data, use it
      const basePrompt = `Generate a professional Letter of Explanation for a ${templateType.replace(/_/g, ' ')} hardship case.

Borrower Information:
- Name: ${ubaData.borrower_name || '[Borrower Name]'}
- Property: ${ubaData.property_address || '[Property Address]'}
- Loan Number: ${ubaData.loan_number || '[Loan Number]'}

Financial Situation:
- Monthly Income: $${(ubaData.monthly_gross_income || 0) / 100}
- Monthly Expenses: $${(ubaData.monthly_expenses || 0) / 100}
- Hardship Type: ${ubaData.hardship_type || templateType}
- Hardship Description: ${ubaData.hardship_description || 'Financial hardship'}

${customContext ? `Additional Context: ${customContext}` : ''}

Please write a compelling, honest, and professional letter that:
1. Clearly explains the hardship situation
2. Shows willingness to resolve the situation
3. Demonstrates ability to maintain modified payments if applicable
4. Is written in first person from the borrower's perspective
5. Is concise but thorough (aim for 300-500 words)`;

      return basePrompt;
    } else {
      // No UBA data, use custom context or generic prompt
      const basePrompt = `Generate a professional Letter of Explanation for a ${templateType.replace(/_/g, ' ')} hardship case.

${customContext ? `Context: ${customContext}` : `The borrower is experiencing ${templateType.replace(/_/g, ' ')} and needs to explain their situation to their lender.`}

Please write a compelling, honest, and professional letter that:
1. Clearly explains the ${templateType.replace(/_/g, ' ')} hardship situation
2. Shows the borrower's willingness to resolve the situation
3. Demonstrates their commitment to keeping their home
4. Is written in first person from the borrower's perspective
5. Is concise but thorough (aim for 300-500 words)
6. Includes placeholder brackets [like this] for any specific information that needs to be filled in`;

      return basePrompt;
    }
  }

  private getBasicTemplate(templateType: string): string {
    console.log('Getting basic template for type:', templateType);
    const templates: Record<string, string> = {
      unemployment: `[Date]

To Whom It May Concern:

I am writing to explain my current financial hardship due to unemployment. I lost my position at [Company] on [Date] due to [reason].

Since then, I have been actively seeking employment and have [describe job search efforts]. Despite these challenges, I am committed to resolving my mortgage situation.

[Add specific details about your situation]

I am requesting [specific assistance type] to help me keep my home while I work to restore my income.

Thank you for your consideration.

Sincerely,
[Your Name]`,
      
      medical_hardship: `[Date]

To Whom It May Concern:

I am writing to explain the financial hardship I am experiencing due to unexpected medical issues.

[Describe medical situation and impact on finances]

I am committed to resolving this situation and keeping my home. I am requesting [specific assistance] to help me through this difficult time.

Thank you for your understanding.

Sincerely,
[Your Name]`,
      
      divorce_separation: `[Date]

To Whom It May Concern:

I am writing to explain the financial hardship I am experiencing due to my recent divorce/separation.

[Describe how the divorce/separation has affected your finances]

I am committed to resolving this situation and keeping my home. I am requesting [specific assistance] to help me through this transition.

Thank you for your understanding.

Sincerely,
[Your Name]`,

      death_of_spouse: `[Date]

To Whom It May Concern:

I am writing to explain the financial hardship I am experiencing due to the recent loss of my spouse.

[Describe the impact on your household income and expenses]

I am requesting [specific assistance] to help me maintain my home during this difficult time.

Thank you for your compassion and understanding.

Sincerely,
[Your Name]`,

      income_reduction: `[Date]

To Whom It May Concern:

I am writing to explain my current financial hardship due to a significant reduction in income.

[Describe the circumstances leading to income reduction]

Despite this setback, I am committed to fulfilling my obligations and am requesting [specific assistance] to help bridge this gap.

Thank you for your consideration.

Sincerely,
[Your Name]`,

      business_failure: `[Date]

To Whom It May Concern:

I am writing to explain the financial hardship resulting from the failure of my business.

[Describe the business situation and its impact on your finances]

I am actively working to restore my income and am requesting [specific assistance] to help me keep my home.

Thank you for your understanding.

Sincerely,
[Your Name]`,

      military_service: `[Date]

To Whom It May Concern:

I am writing to explain the financial hardship I am experiencing related to my military service.

[Describe how military service has affected your financial situation]

I am requesting [specific assistance] to help me maintain my home while serving our country.

Thank you for your support.

Sincerely,
[Your Name]`,

      natural_disaster: `[Date]

To Whom It May Concern:

I am writing to explain the financial hardship I am experiencing due to [specific natural disaster].

[Describe the impact of the disaster on your property and finances]

I am requesting [specific assistance] to help me recover and maintain my home.

Thank you for your consideration during this difficult time.

Sincerely,
[Your Name]`,

      increased_expenses: `[Date]

To Whom It May Concern:

I am writing to explain my current financial hardship due to significantly increased expenses.

[Describe the nature of increased expenses - medical, family care, etc.]

Despite these challenges, I am committed to keeping my home and am requesting [specific assistance].

Thank you for your understanding.

Sincerely,
[Your Name]`,

      // Default/other
      other_hardship: `[Date]

To Whom It May Concern:

I am writing to explain my current financial hardship.

[Describe your situation in detail]

I am requesting assistance to help me resolve this situation and keep my home.

Thank you for your consideration.

Sincerely,
[Your Name]`,
    };

    const template = templates[templateType] || templates.other_hardship;
    console.log('Basic template selected, length:', template.length);
    return template;
  }

  private getTemplateTitle(templateType: string): string {
    const titles: Record<string, string> = {
      unemployment: "Unemployment",
      medical_hardship: "Medical Hardship",
      divorce_separation: "Divorce or Separation",
      death_of_spouse: "Death of Spouse",
      income_reduction: "Income Reduction",
      business_failure: "Business Failure", 
      military_service: "Military Service",
      natural_disaster: "Natural Disaster",
      increased_expenses: "Increased Expenses",
      other_hardship: "Other Hardship",
    };

    return titles[templateType] || "Other";
  }
}

export const loeDrafterController = new LoeDrafterController();