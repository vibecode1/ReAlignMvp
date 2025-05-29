import Anthropic from '@anthropic-ai/sdk';
import { TextBlock } from '@anthropic-ai/sdk/resources';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
let anthropic: Anthropic | null = null;

if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== '') {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
} else {
  console.warn('Anthropic API key not found. Claude features will be disabled.');
}

export class ClaudeService {
  /**
   * Analyze transaction documents and extract key insights
   */
  static async analyzeTransactionDocuments(documentText: string): Promise<{
    summary: string;
    keyPoints: string[];
    riskFactors: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `
You are a real estate transaction expert analyzing a short sale document. Please provide:

1. A concise summary of the document
2. Key points that parties should be aware of
3. Potential risk factors or concerns
4. Actionable recommendations for next steps

Document content:
${documentText}

Please respond in JSON format with the following structure:
{
  "summary": "Brief overview of the document",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "riskFactors": ["Risk 1", "Risk 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}
`;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(block => block.type === 'text') as any;
      const result = JSON.parse(textContent.text);
      return result;
    } catch (error) {
      console.error('Claude analysis error:', error);
      throw new Error('Failed to analyze document with Claude AI');
    }
  }

  /**
   * Generate educational content for real estate negotiations
   */
  static async generateEducationalContent(topic: string, userLevel: 'beginner' | 'intermediate' | 'advanced'): Promise<{
    title: string;
    content: string;
    keyTakeaways: string[];
    nextSteps: string[];
  }> {
    try {
      const prompt = `
Create educational content about "${topic}" in real estate short sale negotiations for a ${userLevel} level audience.

Please provide:
1. A compelling title
2. Comprehensive but accessible content
3. Key takeaways (3-5 bullet points)
4. Suggested next steps for the reader

Format the response as JSON:
{
  "title": "Engaging title for the content",
  "content": "Well-structured educational content with practical insights",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", ...],
  "nextSteps": ["Next step 1", "Next step 2", ...]
}
`;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 3072,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(block => block.type === 'text') as any;
      const result = JSON.parse(textContent.text);
      return result;
    } catch (error) {
      console.error('Claude education content error:', error);
      throw new Error('Failed to generate educational content with Claude AI');
    }
  }

  /**
   * Analyze communication sentiment and provide insights
   */
  static async analyzeCommunicationSentiment(messages: string[]): Promise<{
    overallSentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    insights: string[];
    suggestions: string[];
  }> {
    try {
      const combinedMessages = messages.join('\n\n---\n\n');
      const prompt = `
Analyze the sentiment and communication patterns in these real estate transaction messages:

${combinedMessages}

Provide insights about:
1. Overall sentiment (positive, neutral, or negative)
2. Confidence level (0-1)
3. Communication insights
4. Suggestions for improving collaboration

Format as JSON:
{
  "overallSentiment": "positive|neutral|negative",
  "confidence": 0.85,
  "insights": ["Insight 1", "Insight 2", ...],
  "suggestions": ["Suggestion 1", "Suggestion 2", ...]
}
`;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1536,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(block => block.type === 'text') as any;
      const result = JSON.parse(textContent.text);
      return {
        ...result,
        confidence: Math.max(0, Math.min(1, result.confidence))
      };
    } catch (error) {
      console.error('Claude sentiment analysis error:', error);
      throw new Error('Failed to analyze communication sentiment with Claude AI');
    }
  }

  /**
   * Generate intelligent document templates based on transaction context
   */
  static async generateDocumentTemplate(
    documentType: string,
    transactionContext: {
      propertyAddress?: string;
      parties?: string[];
      transactionStage?: string;
      specificRequirements?: string[];
    }
  ): Promise<{
    template: string;
    placeholders: string[];
    instructions: string[];
  }> {
    try {
      const prompt = `
Generate a professional ${documentType} template for a real estate short sale transaction.

Transaction Context:
- Property: ${transactionContext.propertyAddress || 'Not specified'}
- Parties: ${transactionContext.parties?.join(', ') || 'Not specified'}
- Stage: ${transactionContext.transactionStage || 'Not specified'}
- Requirements: ${transactionContext.specificRequirements?.join(', ') || 'Standard requirements'}

Please create:
1. A professional template with placeholders in [BRACKETS]
2. List of all placeholders used
3. Instructions for completing the document

Format as JSON:
{
  "template": "Professional document template with [PLACEHOLDERS]",
  "placeholders": ["PLACEHOLDER1", "PLACEHOLDER2", ...],
  "instructions": ["Instruction 1", "Instruction 2", ...]
}
`;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(block => block.type === 'text') as any;
      const result = JSON.parse(textContent.text);
      return result;
    } catch (error) {
      console.error('Claude template generation error:', error);
      throw new Error('Failed to generate document template with Claude AI');
    }
  }

  /**
   * Provide intelligent next action recommendations based on transaction status
   */
  static async getNextActionRecommendations(transactionData: {
    status: string;
    daysActive: number;
    completedTasks: string[];
    pendingTasks: string[];
    parties: string[];
    lastActivity?: string;
  }): Promise<{
    priority: 'high' | 'medium' | 'low';
    recommendations: Array<{
      action: string;
      reason: string;
      timeframe: string;
      assignee?: string;
    }>;
    warnings?: string[];
  }> {
    try {
      const prompt = `
As a real estate transaction expert, analyze this short sale transaction and provide intelligent next action recommendations:

Transaction Status: ${transactionData.status}
Days Active: ${transactionData.daysActive}
Completed Tasks: ${transactionData.completedTasks.join(', ')}
Pending Tasks: ${transactionData.pendingTasks.join(', ')}
Parties Involved: ${transactionData.parties.join(', ')}
Last Activity: ${transactionData.lastActivity || 'Not specified'}

Provide:
1. Overall priority level
2. Specific action recommendations with reasons and timeframes
3. Any warnings or concerns

Format as JSON:
{
  "priority": "high|medium|low",
  "recommendations": [
    {
      "action": "Specific action to take",
      "reason": "Why this action is important",
      "timeframe": "When to complete this",
      "assignee": "Who should handle this (optional)"
    }
  ],
  "warnings": ["Warning 1", "Warning 2", ...]
}
`;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(block => block.type === 'text') as any;
      const result = JSON.parse(textContent.text);
      return result;
    } catch (error) {
      console.error('Claude recommendations error:', error);
      throw new Error('Failed to get recommendations from Claude AI');
    }
  }
}

export default ClaudeService;