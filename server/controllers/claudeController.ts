import { Request, Response } from 'express';
import ClaudeService from '../services/claudeService.js';

export class ClaudeController {
  /**
   * Analyze transaction documents for insights
   */
  static async analyzeDocument(req: Request, res: Response) {
    try {
      const { documentText } = req.body;

      if (!documentText) {
        return res.status(400).json({
          error: { code: 'MISSING_DOCUMENT', message: 'Document text is required' }
        });
      }

      const analysis = await ClaudeService.analyzeTransactionDocuments(documentText);
      
      res.json({ data: analysis });
    } catch (error) {
      console.error('Document analysis error:', error);
      res.status(500).json({
        error: { code: 'ANALYSIS_FAILED', message: 'Failed to analyze document' }
      });
    }
  }

  /**
   * Generate educational content
   */
  static async generateEducation(req: Request, res: Response) {
    try {
      const { topic, userLevel = 'intermediate' } = req.body;

      if (!topic) {
        return res.status(400).json({
          error: { code: 'MISSING_TOPIC', message: 'Topic is required' }
        });
      }

      const content = await ClaudeService.generateEducationalContent(topic, userLevel);
      
      res.json({ data: content });
    } catch (error) {
      console.error('Education content generation error:', error);
      res.status(500).json({
        error: { code: 'GENERATION_FAILED', message: 'Failed to generate educational content' }
      });
    }
  }

  /**
   * Analyze communication sentiment
   */
  static async analyzeSentiment(req: Request, res: Response) {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: { code: 'MISSING_MESSAGES', message: 'Messages array is required' }
        });
      }

      const analysis = await ClaudeService.analyzeCommunicationSentiment(messages);
      
      res.json({ data: analysis });
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      res.status(500).json({
        error: { code: 'SENTIMENT_ANALYSIS_FAILED', message: 'Failed to analyze sentiment' }
      });
    }
  }

  /**
   * Generate document templates
   */
  static async generateTemplate(req: Request, res: Response) {
    try {
      const { documentType, transactionContext = {} } = req.body;

      if (!documentType) {
        return res.status(400).json({
          error: { code: 'MISSING_DOCUMENT_TYPE', message: 'Document type is required' }
        });
      }

      const template = await ClaudeService.generateDocumentTemplate(documentType, transactionContext);
      
      res.json({ data: template });
    } catch (error) {
      console.error('Template generation error:', error);
      res.status(500).json({
        error: { code: 'TEMPLATE_GENERATION_FAILED', message: 'Failed to generate template' }
      });
    }
  }

  /**
   * Get next action recommendations
   */
  static async getRecommendations(req: Request, res: Response) {
    try {
      const { transactionData } = req.body;

      if (!transactionData) {
        return res.status(400).json({
          error: { code: 'MISSING_TRANSACTION_DATA', message: 'Transaction data is required' }
        });
      }

      const recommendations = await ClaudeService.getNextActionRecommendations(transactionData);
      
      res.json({ data: recommendations });
    } catch (error) {
      console.error('Recommendations error:', error);
      res.status(500).json({
        error: { code: 'RECOMMENDATIONS_FAILED', message: 'Failed to generate recommendations' }
      });
    }
  }
}

export default ClaudeController;