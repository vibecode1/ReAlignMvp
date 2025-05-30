import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

export const simpleDocumentController = {
  /**
   * Simple document processing - just send file directly to Claude
   */
  async processDocument(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { fileName, fileContent, fileType } = req.body;

      if (!fileName || !fileContent) {
        return res.status(400).json({ error: 'File name and content are required' });
      }

      console.log(`Processing ${fileName} (${fileType})`);

      // Check API key
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Claude API not configured');
      }

      // Import Claude
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      // Simple prompt
      const prompt = `Look at this document and extract all the data fields and their values. Return as JSON with descriptive field names.`;

      let claudeResponse;

      // Handle images vs other files
      if (fileType?.startsWith('image/')) {
        // For images, send directly to Claude vision
        let base64Data = fileContent;
        if (fileContent.startsWith('data:')) {
          base64Data = fileContent.split(',')[1];
        }

        claudeResponse = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: fileType as any,
                    data: base64Data
                  }
                }
              ]
            }
          ],
        });
      } else {
        // For text/PDFs (already processed)
        claudeResponse = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\nDocument content:\n${fileContent}`
            }
          ],
        });
      }

      // Extract response
      const textContent = claudeResponse.content.find(block => block.type === 'text') as any;
      const responseText = textContent?.text || '';

      console.log('Claude response:', responseText);

      // Try to parse as JSON
      let extractedData = {};
      try {
        const cleanText = responseText.trim()
          .replace(/^```(?:json)?\n?/, '')
          .replace(/\n?```$/, '')
          .trim();
        extractedData = JSON.parse(cleanText);
      } catch (parseError) {
        console.log('Could not parse as JSON, returning raw text');
        extractedData = { raw_response: responseText };
      }

      return res.status(200).json({
        fileName,
        extractedData,
        message: `Successfully processed ${fileName}`,
        fileType,
        processingMethod: 'direct_claude'
      });

    } catch (error) {
      console.error('Simple document processing error:', error);
      
      return res.status(500).json({
        error: {
          code: 'PROCESSING_FAILED',
          message: `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });
    }
  }
};