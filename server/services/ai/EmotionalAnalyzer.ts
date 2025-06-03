/**
 * @ai-context Emotional analysis service for detecting user emotional state
 * @ai-purpose Analyze emotional indicators to provide appropriate support
 * @ai-modifiable true
 */

export interface EmotionalAnalysisInput {
  currentMessage: string;
  recentMessages: Array<{
    content: string;
    timestamp: Date;
    sender: 'user' | 'ai';
  }>;
  linguisticMarkers: Array<{
    type: string;
    value: string;
    position: number;
  }>;
  attachments?: Array<{
    id: string;
    type: string;
    url: string;
  }>;
}

export interface EmotionalAnalysisResult {
  distress: number; // 0-1 scale
  hope: number; // 0-1 scale
  frustration: number; // 0-1 scale
  confidence: number; // Analysis confidence
  trends: Array<{
    timestamp: Date;
    distress: number;
    hope: number;
    frustration: number;
  }>;
  indicators: Array<{
    type: 'linguistic' | 'contextual' | 'temporal';
    marker: string;
    weight: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  recommendations: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }>;
}

/**
 * @ai-purpose Analyze emotional state from user communications
 * @debug-trace Log all emotional analysis with confidence scores
 */
export class EmotionalAnalyzer {
  private emotionalKeywords: {
    distress: Array<{ word: string; weight: number }>;
    hope: Array<{ word: string; weight: number }>;
    frustration: Array<{ word: string; weight: number }>;
  };

  constructor() {
    this.initializeEmotionalKeywords();
  }

  /**
   * @ai-purpose Analyze emotional state from input
   */
  async analyze(input: EmotionalAnalysisInput): Promise<EmotionalAnalysisResult> {
    console.log('[EmotionalAnalyzer] Starting emotional analysis', {
      messageLength: input.currentMessage.length,
      recentMessageCount: input.recentMessages.length,
      linguisticMarkerCount: input.linguisticMarkers.length
    });

    try {
      // Step 1: Analyze current message for emotional indicators
      const currentAnalysis = await this.analyzeMessage(input.currentMessage);
      
      // Step 2: Analyze conversation trends
      const conversationTrends = await this.analyzeConversationTrends(input.recentMessages);
      
      // Step 3: Process linguistic markers
      const linguisticAnalysis = this.processLinguisticMarkers(input.linguisticMarkers);
      
      // Step 4: Analyze contextual factors
      const contextualAnalysis = await this.analyzeContextualFactors(input);
      
      // Step 5: Combine all analyses
      const combinedAnalysis = this.combineAnalyses([
        currentAnalysis,
        conversationTrends,
        linguisticAnalysis,
        contextualAnalysis
      ]);

      // Step 6: Generate recommendations
      const recommendations = this.generateRecommendations(combinedAnalysis);

      const result: EmotionalAnalysisResult = {
        distress: combinedAnalysis.distress,
        hope: combinedAnalysis.hope,
        frustration: combinedAnalysis.frustration,
        confidence: combinedAnalysis.confidence,
        trends: combinedAnalysis.trends,
        indicators: combinedAnalysis.indicators,
        recommendations
      };

      console.log('[EmotionalAnalyzer] Analysis completed', {
        distress: result.distress,
        hope: result.hope,
        frustration: result.frustration,
        confidence: result.confidence,
        indicatorCount: result.indicators.length
      });

      return result;

    } catch (error) {
      console.error('[EmotionalAnalyzer] Analysis failed:', error);
      
      // Return safe default analysis
      return {
        distress: 0.3,
        hope: 0.5,
        frustration: 0.2,
        confidence: 0.1,
        trends: [],
        indicators: [],
        recommendations: [{
          action: 'monitor_closely',
          priority: 'medium',
          reason: 'Unable to complete emotional analysis'
        }]
      };
    }
  }

  /**
   * @ai-purpose Analyze individual message for emotional content
   */
  private async analyzeMessage(message: string): Promise<{
    distress: number;
    hope: number;
    frustration: number;
    confidence: number;
    indicators: Array<any>;
  }> {
    const words = message.toLowerCase().split(/\s+/);
    const indicators: Array<any> = [];
    
    let distressScore = 0;
    let hopeScore = 0;
    let frustrationScore = 0;
    let totalWeight = 0;

    // Analyze each word against emotional keywords
    words.forEach((word, index) => {
      // Check distress keywords
      const distressMatch = this.emotionalKeywords.distress.find(k => 
        word.includes(k.word) || k.word.includes(word)
      );
      if (distressMatch) {
        distressScore += distressMatch.weight;
        totalWeight += distressMatch.weight;
        indicators.push({
          type: 'linguistic',
          marker: word,
          weight: distressMatch.weight,
          sentiment: 'negative',
          category: 'distress'
        });
      }

      // Check hope keywords
      const hopeMatch = this.emotionalKeywords.hope.find(k => 
        word.includes(k.word) || k.word.includes(word)
      );
      if (hopeMatch) {
        hopeScore += hopeMatch.weight;
        totalWeight += hopeMatch.weight;
        indicators.push({
          type: 'linguistic',
          marker: word,
          weight: hopeMatch.weight,
          sentiment: 'positive',
          category: 'hope'
        });
      }

      // Check frustration keywords
      const frustrationMatch = this.emotionalKeywords.frustration.find(k => 
        word.includes(k.word) || k.word.includes(word)
      );
      if (frustrationMatch) {
        frustrationScore += frustrationMatch.weight;
        totalWeight += frustrationMatch.weight;
        indicators.push({
          type: 'linguistic',
          marker: word,
          weight: frustrationMatch.weight,
          sentiment: 'negative',
          category: 'frustration'
        });
      }
    });

    // Check for capitalization (indicates emphasis/emotion)
    const capsCount = (message.match(/[A-Z]/g) || []).length;
    const capsRatio = capsCount / message.length;
    if (capsRatio > 0.3) {
      frustrationScore += 0.2;
      indicators.push({
        type: 'contextual',
        marker: 'excessive_capitalization',
        weight: 0.2,
        sentiment: 'negative',
        category: 'frustration'
      });
    }

    // Check for punctuation patterns (multiple exclamation marks, etc.)
    const exclamationCount = (message.match(/!/g) || []).length;
    if (exclamationCount > 2) {
      const emotionBoost = Math.min(exclamationCount * 0.1, 0.3);
      distressScore += emotionBoost;
      indicators.push({
        type: 'contextual',
        marker: 'multiple_exclamations',
        weight: emotionBoost,
        sentiment: 'negative',
        category: 'distress'
      });
    }

    // Normalize scores
    const maxPossibleScore = Math.max(totalWeight, 1);
    
    return {
      distress: Math.min(distressScore / maxPossibleScore, 1),
      hope: Math.min(hopeScore / maxPossibleScore, 1),
      frustration: Math.min(frustrationScore / maxPossibleScore, 1),
      confidence: totalWeight > 0 ? Math.min(totalWeight / 5, 1) : 0.5,
      indicators
    };
  }

  /**
   * @ai-purpose Analyze trends across conversation history
   */
  private async analyzeConversationTrends(
    recentMessages: Array<{
      content: string;
      timestamp: Date;
      sender: 'user' | 'ai';
    }>
  ): Promise<{
    distress: number;
    hope: number;
    frustration: number;
    confidence: number;
    trends: Array<any>;
    indicators: Array<any>;
  }> {
    const trends: Array<any> = [];
    const indicators: Array<any> = [];
    
    // Only analyze user messages for emotional content
    const userMessages = recentMessages.filter(m => m.sender === 'user');
    
    if (userMessages.length === 0) {
      return {
        distress: 0,
        hope: 0,
        frustration: 0,
        confidence: 0,
        trends: [],
        indicators: []
      };
    }

    // Analyze each message and build trend
    let totalDistress = 0;
    let totalHope = 0;
    let totalFrustration = 0;

    for (const message of userMessages) {
      const analysis = await this.analyzeMessage(message.content);
      
      trends.push({
        timestamp: message.timestamp,
        distress: analysis.distress,
        hope: analysis.hope,
        frustration: analysis.frustration
      });

      totalDistress += analysis.distress;
      totalHope += analysis.hope;
      totalFrustration += analysis.frustration;
    }

    // Calculate trending patterns
    if (trends.length >= 2) {
      const recent = trends.slice(-2);
      const distressTrend = recent[1].distress - recent[0].distress;
      const hopeTrend = recent[1].hope - recent[0].hope;
      const frustrationTrend = recent[1].frustration - recent[0].frustration;

      if (distressTrend > 0.2) {
        indicators.push({
          type: 'temporal',
          marker: 'increasing_distress',
          weight: 0.3,
          sentiment: 'negative',
          category: 'trend'
        });
      }

      if (hopeTrend < -0.2) {
        indicators.push({
          type: 'temporal',
          marker: 'decreasing_hope',
          weight: 0.3,
          sentiment: 'negative',
          category: 'trend'
        });
      }

      if (frustrationTrend > 0.3) {
        indicators.push({
          type: 'temporal',
          marker: 'increasing_frustration',
          weight: 0.4,
          sentiment: 'negative',
          category: 'trend'
        });
      }
    }

    const messageCount = userMessages.length;
    
    return {
      distress: totalDistress / messageCount,
      hope: totalHope / messageCount,
      frustration: totalFrustration / messageCount,
      confidence: Math.min(messageCount / 3, 1), // More confident with more messages
      trends,
      indicators
    };
  }

  /**
   * @ai-purpose Process linguistic markers for emotional indicators
   */
  private processLinguisticMarkers(
    markers: Array<{
      type: string;
      value: string;
      position: number;
    }>
  ): {
    distress: number;
    hope: number;
    frustration: number;
    confidence: number;
    indicators: Array<any>;
  } {
    const indicators: Array<any> = [];
    let distressScore = 0;
    let hopeScore = 0;
    let frustrationScore = 0;

    markers.forEach(marker => {
      switch (marker.type) {
        case 'distress':
          distressScore += 0.3;
          indicators.push({
            type: 'linguistic',
            marker: marker.value,
            weight: 0.3,
            sentiment: 'negative',
            category: 'distress'
          });
          break;
        case 'hope':
          hopeScore += 0.3;
          indicators.push({
            type: 'linguistic',
            marker: marker.value,
            weight: 0.3,
            sentiment: 'positive',
            category: 'hope'
          });
          break;
        case 'frustration':
          frustrationScore += 0.3;
          indicators.push({
            type: 'linguistic',
            marker: marker.value,
            weight: 0.3,
            sentiment: 'negative',
            category: 'frustration'
          });
          break;
      }
    });

    return {
      distress: Math.min(distressScore, 1),
      hope: Math.min(hopeScore, 1),
      frustration: Math.min(frustrationScore, 1),
      confidence: markers.length > 0 ? 0.8 : 0.3,
      indicators
    };
  }

  /**
   * @ai-purpose Analyze contextual factors
   */
  private async analyzeContextualFactors(
    input: EmotionalAnalysisInput
  ): Promise<{
    distress: number;
    hope: number;
    frustration: number;
    confidence: number;
    indicators: Array<any>;
  }> {
    const indicators: Array<any> = [];
    let distressScore = 0;
    let hopeScore = 0;
    let frustrationScore = 0;

    // Message length analysis (very long messages may indicate distress)
    if (input.currentMessage.length > 500) {
      distressScore += 0.1;
      indicators.push({
        type: 'contextual',
        marker: 'lengthy_message',
        weight: 0.1,
        sentiment: 'negative',
        category: 'context'
      });
    }

    // Attachment analysis (documents may indicate urgency/hope)
    if (input.attachments && input.attachments.length > 0) {
      hopeScore += 0.2; // User is taking action
      indicators.push({
        type: 'contextual',
        marker: 'document_sharing',
        weight: 0.2,
        sentiment: 'positive',
        category: 'engagement'
      });
    }

    // Response time analysis (if available in recent messages)
    if (input.recentMessages.length >= 2) {
      const userMessages = input.recentMessages.filter(m => m.sender === 'user');
      if (userMessages.length >= 2) {
        const timeDiff = userMessages[userMessages.length - 1].timestamp.getTime() - 
                        userMessages[userMessages.length - 2].timestamp.getTime();
        
        // Quick responses might indicate urgency/distress
        if (timeDiff < 60000) { // Less than 1 minute
          distressScore += 0.15;
          indicators.push({
            type: 'contextual',
            marker: 'rapid_responses',
            weight: 0.15,
            sentiment: 'negative',
            category: 'urgency'
          });
        }
      }
    }

    return {
      distress: Math.min(distressScore, 1),
      hope: Math.min(hopeScore, 1),
      frustration: Math.min(frustrationScore, 1),
      confidence: 0.6,
      indicators
    };
  }

  /**
   * @ai-purpose Combine multiple analyses into final result
   */
  private combineAnalyses(analyses: Array<{
    distress: number;
    hope: number;
    frustration: number;
    confidence: number;
    indicators: Array<any>;
    trends?: Array<any>;
  }>): {
    distress: number;
    hope: number;
    frustration: number;
    confidence: number;
    indicators: Array<any>;
    trends: Array<any>;
  } {
    let weightedDistress = 0;
    let weightedHope = 0;
    let weightedFrustration = 0;
    let totalWeight = 0;
    const allIndicators: Array<any> = [];
    const allTrends: Array<any> = [];

    analyses.forEach((analysis, index) => {
      // Weight analyses differently (current message gets more weight)
      const weight = index === 0 ? 0.5 : 0.5 / (analyses.length - 1);
      
      weightedDistress += analysis.distress * weight * analysis.confidence;
      weightedHope += analysis.hope * weight * analysis.confidence;
      weightedFrustration += analysis.frustration * weight * analysis.confidence;
      totalWeight += weight * analysis.confidence;

      allIndicators.push(...analysis.indicators);
      if (analysis.trends) {
        allTrends.push(...analysis.trends);
      }
    });

    return {
      distress: totalWeight > 0 ? weightedDistress / totalWeight : 0,
      hope: totalWeight > 0 ? weightedHope / totalWeight : 0,
      frustration: totalWeight > 0 ? weightedFrustration / totalWeight : 0,
      confidence: totalWeight,
      indicators: allIndicators,
      trends: allTrends
    };
  }

  /**
   * @ai-purpose Generate recommendations based on emotional analysis
   */
  private generateRecommendations(analysis: {
    distress: number;
    hope: number;
    frustration: number;
    confidence: number;
  }): Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }> {
    const recommendations: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      reason: string;
    }> = [];

    // High distress recommendations
    if (analysis.distress > 0.7) {
      recommendations.push({
        action: 'escalate_to_human',
        priority: 'high',
        reason: 'User showing high levels of emotional distress'
      });
      recommendations.push({
        action: 'provide_emotional_support',
        priority: 'high',
        reason: 'User needs immediate empathetic response'
      });
    }

    // High frustration recommendations
    if (analysis.frustration > 0.8) {
      recommendations.push({
        action: 'acknowledge_frustration',
        priority: 'high',
        reason: 'User is highly frustrated and needs validation'
      });
      recommendations.push({
        action: 'simplify_process',
        priority: 'medium',
        reason: 'Complex processes may be increasing frustration'
      });
    }

    // Low hope recommendations
    if (analysis.hope < 0.3) {
      recommendations.push({
        action: 'provide_encouragement',
        priority: 'medium',
        reason: 'User needs hope and positive reinforcement'
      });
      recommendations.push({
        action: 'share_success_stories',
        priority: 'low',
        reason: 'Success stories may help rebuild hope'
      });
    }

    // General monitoring
    if (analysis.confidence > 0.7) {
      recommendations.push({
        action: 'continue_monitoring',
        priority: 'low',
        reason: 'Emotional state is stable, continue regular monitoring'
      });
    }

    return recommendations;
  }

  /**
   * @ai-purpose Initialize emotional keyword dictionaries
   */
  private initializeEmotionalKeywords(): void {
    this.emotionalKeywords = {
      distress: [
        { word: 'help', weight: 0.6 },
        { word: 'desperate', weight: 0.9 },
        { word: 'urgent', weight: 0.7 },
        { word: 'crisis', weight: 0.9 },
        { word: 'emergency', weight: 0.8 },
        { word: 'struggling', weight: 0.7 },
        { word: 'overwhelmed', weight: 0.8 },
        { word: 'scared', weight: 0.7 },
        { word: 'worried', weight: 0.6 },
        { word: 'anxious', weight: 0.6 },
        { word: 'panic', weight: 0.9 },
        { word: 'terrified', weight: 0.9 },
        { word: 'disaster', weight: 0.8 },
        { word: 'nightmare', weight: 0.8 }
      ],
      hope: [
        { word: 'hope', weight: 0.8 },
        { word: 'optimistic', weight: 0.7 },
        { word: 'confident', weight: 0.6 },
        { word: 'positive', weight: 0.6 },
        { word: 'trust', weight: 0.7 },
        { word: 'believe', weight: 0.6 },
        { word: 'solution', weight: 0.7 },
        { word: 'better', weight: 0.5 },
        { word: 'improve', weight: 0.6 },
        { word: 'progress', weight: 0.7 },
        { word: 'forward', weight: 0.5 },
        { word: 'success', weight: 0.8 },
        { word: 'grateful', weight: 0.7 },
        { word: 'thankful', weight: 0.7 }
      ],
      frustration: [
        { word: 'frustrated', weight: 0.8 },
        { word: 'angry', weight: 0.9 },
        { word: 'disappointed', weight: 0.7 },
        { word: 'annoyed', weight: 0.6 },
        { word: 'ridiculous', weight: 0.8 },
        { word: 'stupid', weight: 0.8 },
        { word: 'impossible', weight: 0.7 },
        { word: 'unfair', weight: 0.7 },
        { word: 'useless', weight: 0.8 },
        { word: 'pointless', weight: 0.7 },
        { word: 'waste', weight: 0.6 },
        { word: 'terrible', weight: 0.7 },
        { word: 'awful', weight: 0.7 },
        { word: 'horrible', weight: 0.8 }
      ]
    };
  }
}