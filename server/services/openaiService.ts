import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class OpenAIService {
  /**
   * Generate property listing descriptions with GPT-4o
   */
  static async generatePropertyDescription(propertyData: {
    address: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    price: number;
    features?: string[];
    neighborhood?: string;
  }): Promise<{
    description: string;
    highlights: string[];
    marketingPoints: string[];
  }> {
    try {
      const prompt = `Create a compelling property listing description for this real estate property:

Address: ${propertyData.address}
Bedrooms: ${propertyData.bedrooms}
Bathrooms: ${propertyData.bathrooms}
Square Feet: ${propertyData.sqft}
Price: $${propertyData.price.toLocaleString()}
Features: ${propertyData.features?.join(', ') || 'Standard features'}
Neighborhood: ${propertyData.neighborhood || 'Great location'}

Please provide:
1. A compelling property description (2-3 paragraphs)
2. Key highlights (3-5 bullet points)
3. Marketing points that emphasize value

Format as JSON:
{
  "description": "Compelling description text",
  "highlights": ["Highlight 1", "Highlight 2", ...],
  "marketingPoints": ["Point 1", "Point 2", ...]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('OpenAI property description error:', error);
      throw new Error('Failed to generate property description with OpenAI');
    }
  }

  /**
   * Analyze market trends and provide insights
   */
  static async analyzeMarketTrends(marketData: {
    location: string;
    priceHistory: Array<{ date: string; price: number }>;
    comparableProperties?: Array<{ address: string; price: number; sqft: number }>;
    marketConditions?: string;
  }): Promise<{
    trend: 'rising' | 'falling' | 'stable';
    confidence: number;
    insights: string[];
    recommendations: string[];
    futureOutlook: string;
  }> {
    try {
      const prompt = `Analyze this real estate market data and provide insights:

Location: ${marketData.location}
Price History: ${JSON.stringify(marketData.priceHistory)}
Comparable Properties: ${JSON.stringify(marketData.comparableProperties || [])}
Market Conditions: ${marketData.marketConditions || 'Not specified'}

Please provide:
1. Overall trend (rising, falling, or stable)
2. Confidence level (0-1)
3. Key market insights
4. Recommendations for buyers/sellers
5. Future outlook summary

Format as JSON:
{
  "trend": "rising|falling|stable",
  "confidence": 0.85,
  "insights": ["Insight 1", "Insight 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "futureOutlook": "Summary of future market expectations"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        ...result,
        confidence: Math.max(0, Math.min(1, result.confidence))
      };
    } catch (error) {
      console.error('OpenAI market analysis error:', error);
      throw new Error('Failed to analyze market trends with OpenAI');
    }
  }

  /**
   * Generate professional email templates
   */
  static async generateEmailTemplate(templateData: {
    type: 'followup' | 'negotiation' | 'update' | 'welcome' | 'closing';
    recipientRole: string;
    context: string;
    keyPoints?: string[];
    tone?: 'professional' | 'friendly' | 'urgent';
  }): Promise<{
    subject: string;
    body: string;
    callToAction: string;
  }> {
    try {
      const prompt = `Generate a professional email template for real estate communication:

Email Type: ${templateData.type}
Recipient Role: ${templateData.recipientRole}
Context: ${templateData.context}
Key Points: ${templateData.keyPoints?.join(', ') || 'Standard communication'}
Tone: ${templateData.tone || 'professional'}

Please create:
1. Compelling subject line
2. Professional email body with placeholders in [BRACKETS]
3. Clear call to action

Format as JSON:
{
  "subject": "Subject line",
  "body": "Email body with [PLACEHOLDERS]",
  "callToAction": "Clear next step for recipient"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('OpenAI email template error:', error);
      throw new Error('Failed to generate email template with OpenAI');
    }
  }

  /**
   * Generate property images using DALL-E
   */
  static async generatePropertyImage(description: string): Promise<{ url: string }> {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Professional real estate photography style: ${description}. High quality, well-lit, inviting atmosphere, suitable for property listings.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return { url: response.data[0].url };
    } catch (error) {
      console.error('OpenAI image generation error:', error);
      throw new Error('Failed to generate property image with OpenAI');
    }
  }

  /**
   * Transcribe audio recordings using Whisper
   */
  static async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<{
    text: string;
    summary: string;
    actionItems: string[];
  }> {
    try {
      // Create a temporary file for the audio
      const fs = await import('fs');
      const path = await import('path');
      const tmpDir = '/tmp';
      const tmpPath = path.join(tmpDir, `audio_${Date.now()}_${filename}`);
      
      fs.writeFileSync(tmpPath, audioBuffer);
      
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tmpPath),
        model: "whisper-1",
      });

      // Clean up temporary file
      fs.unlinkSync(tmpPath);

      // Generate summary and action items
      const analysisPrompt = `Analyze this meeting transcription and provide:
1. A concise summary
2. Action items or next steps mentioned

Transcription:
${transcription.text}

Format as JSON:
{
  "summary": "Meeting summary",
  "actionItems": ["Action 1", "Action 2", ...]
}`;

      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(analysisResponse.choices[0].message.content);

      return {
        text: transcription.text,
        summary: analysis.summary,
        actionItems: analysis.actionItems
      };
    } catch (error) {
      console.error('OpenAI transcription error:', error);
      throw new Error('Failed to transcribe audio with OpenAI');
    }
  }

  /**
   * Compare and contrast analysis between two options
   */
  static async compareOptions(comparisonData: {
    option1: any;
    option2: any;
    criteria: string[];
    context: string;
  }): Promise<{
    winner: 'option1' | 'option2' | 'tie';
    reasoning: string;
    scoreBreakdown: Array<{
      criterion: string;
      option1Score: number;
      option2Score: number;
      explanation: string;
    }>;
    recommendation: string;
  }> {
    try {
      const prompt = `Compare these two options based on the given criteria:

Option 1: ${JSON.stringify(comparisonData.option1)}
Option 2: ${JSON.stringify(comparisonData.option2)}
Criteria: ${comparisonData.criteria.join(', ')}
Context: ${comparisonData.context}

Please provide:
1. Overall winner (option1, option2, or tie)
2. Reasoning for the decision
3. Score breakdown for each criterion (1-10 scale)
4. Final recommendation

Format as JSON:
{
  "winner": "option1|option2|tie",
  "reasoning": "Explanation of the decision",
  "scoreBreakdown": [
    {
      "criterion": "Criterion name",
      "option1Score": 8,
      "option2Score": 6,
      "explanation": "Why these scores"
    }
  ],
  "recommendation": "Final recommendation"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('OpenAI comparison error:', error);
      throw new Error('Failed to compare options with OpenAI');
    }
  }
}

export default OpenAIService;