import { Request, Response } from 'express';
import OpenAIService from '../services/openaiService.js';

export class OpenAIController {
  /**
   * Generate property listing descriptions
   */
  static async generatePropertyDescription(req: Request, res: Response) {
    try {
      const { propertyData } = req.body;

      if (!propertyData) {
        return res.status(400).json({
          error: { code: 'MISSING_PROPERTY_DATA', message: 'Property data is required' }
        });
      }

      const description = await OpenAIService.generatePropertyDescription(propertyData);
      
      res.json({ data: description });
    } catch (error) {
      console.error('Property description generation error:', error);
      res.status(500).json({
        error: { code: 'DESCRIPTION_GENERATION_FAILED', message: 'Failed to generate property description' }
      });
    }
  }

  /**
   * Analyze market trends
   */
  static async analyzeMarketTrends(req: Request, res: Response) {
    try {
      const { marketData } = req.body;

      if (!marketData) {
        return res.status(400).json({
          error: { code: 'MISSING_MARKET_DATA', message: 'Market data is required' }
        });
      }

      const analysis = await OpenAIService.analyzeMarketTrends(marketData);
      
      res.json({ data: analysis });
    } catch (error) {
      console.error('Market analysis error:', error);
      res.status(500).json({
        error: { code: 'MARKET_ANALYSIS_FAILED', message: 'Failed to analyze market trends' }
      });
    }
  }

  /**
   * Generate email templates
   */
  static async generateEmailTemplate(req: Request, res: Response) {
    try {
      const { templateData } = req.body;

      if (!templateData) {
        return res.status(400).json({
          error: { code: 'MISSING_TEMPLATE_DATA', message: 'Template data is required' }
        });
      }

      const template = await OpenAIService.generateEmailTemplate(templateData);
      
      res.json({ data: template });
    } catch (error) {
      console.error('Email template generation error:', error);
      res.status(500).json({
        error: { code: 'EMAIL_TEMPLATE_FAILED', message: 'Failed to generate email template' }
      });
    }
  }

  /**
   * Generate property images with DALL-E
   */
  static async generatePropertyImage(req: Request, res: Response) {
    try {
      const { description } = req.body;

      if (!description) {
        return res.status(400).json({
          error: { code: 'MISSING_DESCRIPTION', message: 'Image description is required' }
        });
      }

      const image = await OpenAIService.generatePropertyImage(description);
      
      res.json({ data: image });
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({
        error: { code: 'IMAGE_GENERATION_FAILED', message: 'Failed to generate property image' }
      });
    }
  }

  /**
   * Compare options using AI analysis
   */
  static async compareOptions(req: Request, res: Response) {
    try {
      const { comparisonData } = req.body;

      if (!comparisonData) {
        return res.status(400).json({
          error: { code: 'MISSING_COMPARISON_DATA', message: 'Comparison data is required' }
        });
      }

      const comparison = await OpenAIService.compareOptions(comparisonData);
      
      res.json({ data: comparison });
    } catch (error) {
      console.error('Comparison analysis error:', error);
      res.status(500).json({
        error: { code: 'COMPARISON_FAILED', message: 'Failed to compare options' }
      });
    }
  }

  /**
   * Transcribe audio files
   */
  static async transcribeAudio(req: Request, res: Response) {
    try {
      const { audioBuffer, filename } = req.body;

      if (!audioBuffer) {
        return res.status(400).json({
          error: { code: 'MISSING_AUDIO', message: 'Audio data is required' }
        });
      }

      const transcription = await OpenAIService.transcribeAudio(
        Buffer.from(audioBuffer, 'base64'), 
        filename || 'audio.mp3'
      );
      
      res.json({ data: transcription });
    } catch (error) {
      console.error('Audio transcription error:', error);
      res.status(500).json({
        error: { code: 'TRANSCRIPTION_FAILED', message: 'Failed to transcribe audio' }
      });
    }
  }
}

export default OpenAIController;