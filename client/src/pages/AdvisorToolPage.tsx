import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, 
  Play, 
  Pause,
  MessageSquare, 
  BookOpen, 
  HelpCircle, 
  CheckCircle,
  AlertCircle,
  Brain,
  Phone,
  Award,
  Users,
  Lightbulb,
  Search,
  Send
} from 'lucide-react';
import { Link } from 'wouter';

interface AdvisorToolPageProps {
  tool: string;
  subTool?: string;
}

export const AdvisorToolPage: React.FC<AdvisorToolPageProps> = ({ tool, subTool }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const onSubmit = (data: any) => {
    console.log('Form data:', data);
    
    if (tool === 'screener') {
      generateRecommendation(data);
    }
  };

  const generateRecommendation = (data: any) => {
    // Simple logic for demonstration
    const hasHardship = data.hardship === 'yes';
    const behindPayments = data.payments === 'behind';
    const wantsToStay = data.stayInHome === 'yes';
    
    let recommendation = '';
    let nextSteps = [];
    
    if (hasHardship && behindPayments) {
      if (wantsToStay) {
        recommendation = 'Loan Modification';
        nextSteps = [
          'Gather hardship documentation',
          'Complete financial statement',
          'Submit modification application',
          'Work with housing counselor'
        ];
      } else {
        recommendation = 'Short Sale';
        nextSteps = [
          'Get property valuation',
          'Find qualified agent',
          'Prepare hardship package',
          'List property for sale'
        ];
      }
    } else {
      recommendation = 'Standard Sale or Refinance';
      nextSteps = [
        'Consult with mortgage professional',
        'Review current loan terms',
        'Explore refinancing options'
      ];
    }
    
    setRecommendation({ type: recommendation, steps: nextSteps });
  };

  const sendChatMessage = (message: string) => {
    setChatMessages(prev => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: getAIResponse(message) }
    ]);
  };

  const getAIResponse = (message: string) => {
    // Simple AI response logic for demonstration
    const responses = {
      'dti': 'DTI (Debt-to-Income) ratio is calculated by dividing your total monthly debt payments by your gross monthly income. Most lenders prefer a DTI below 43%.',
      'short sale': 'A short sale occurs when you sell your home for less than what you owe on the mortgage. It requires lender approval and can help avoid foreclosure.',
      'loan modification': 'Loan modification involves permanently changing the terms of your mortgage to make payments more affordable. This might include reducing the interest rate or extending the loan term.',
      'hardship': 'Hardship documentation should include proof of financial difficulty such as job loss, medical bills, divorce decree, or other qualifying circumstances.'
    };
    
    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return "I understand you're asking about loss mitigation. Could you be more specific about what you'd like to know? I can help with topics like DTI ratios, short sales, loan modifications, and documentation requirements.";
  };

  const renderTool = () => {
    switch (tool) {
      case 'screener':
        return renderEligibilityScreener();
      case 'process':
        return renderProcessExplainer();
      case 'courses':
        return renderCourseLibrary();
      case 'content':
        return renderAIContent();
      case 'chatbot':
        return renderAIChatbot();
      case 'faq':
        return renderFAQDatabase();
      case 'expert':
        return renderExpertConsultation();
      default:
        return <div>Tool not found</div>;
    }
  };

  const renderEligibilityScreener = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5" />
            Am I Eligible? Screener
          </CardTitle>
          <CardDescription>
            Answer a few questions to understand your loss mitigation options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Are you currently experiencing financial hardship?</Label>
                <RadioGroup onValueChange={(value) => setValue('hardship', value)} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="hardship-yes" />
                    <Label htmlFor="hardship-yes">Yes, I'm experiencing hardship</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="hardship-no" />
                    <Label htmlFor="hardship-no">No, just exploring options</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Are you behind on mortgage payments?</Label>
                <RadioGroup onValueChange={(value) => setValue('payments', value)} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="current" id="payments-current" />
                    <Label htmlFor="payments-current">Current on payments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="behind" id="payments-behind" />
                    <Label htmlFor="payments-behind">Behind on payments</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Do you want to stay in your home?</Label>
                <RadioGroup onValueChange={(value) => setValue('stayInHome', value)} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="stay-yes" />
                    <Label htmlFor="stay-yes">Yes, I want to keep my home</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="stay-no" />
                    <Label htmlFor="stay-no">No, I'm ready to sell</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Primary reason for hardship (optional)</Label>
                <Select onValueChange={(value) => setValue('hardshipReason', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hardship reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job-loss">Job Loss</SelectItem>
                    <SelectItem value="medical">Medical Expenses</SelectItem>
                    <SelectItem value="divorce">Divorce</SelectItem>
                    <SelectItem value="death">Death in Family</SelectItem>
                    <SelectItem value="business">Business Failure</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Get My Recommendation
            </Button>
          </form>

          {recommendation && (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-800">Recommended Path: {recommendation.type}</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-green-700 mb-3">Based on your responses, here are your next steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                  {recommendation.steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  This is general guidance only. Consult with a qualified housing counselor or attorney for personalized advice.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProcessExplainer = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Short Sale Process</CardTitle>
            <CardDescription>Step-by-step guide to short sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">1</div>
                <div>
                  <h4 className="font-medium">Financial Hardship</h4>
                  <p className="text-sm text-muted-foreground">Document your financial difficulties</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">2</div>
                <div>
                  <h4 className="font-medium">Market Analysis</h4>
                  <p className="text-sm text-muted-foreground">Determine current property value</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">3</div>
                <div>
                  <h4 className="font-medium">Lender Approval</h4>
                  <p className="text-sm text-muted-foreground">Submit short sale package</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">4</div>
                <div>
                  <h4 className="font-medium">Marketing & Sale</h4>
                  <p className="text-sm text-muted-foreground">List and sell the property</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loan Modification Process</CardTitle>
            <CardDescription>How to modify your existing loan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-sm">1</div>
                <div>
                  <h4 className="font-medium">Contact Servicer</h4>
                  <p className="text-sm text-muted-foreground">Reach out to your loan servicer</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-sm">2</div>
                <div>
                  <h4 className="font-medium">Submit Application</h4>
                  <p className="text-sm text-muted-foreground">Complete modification application</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-sm">3</div>
                <div>
                  <h4 className="font-medium">Review Process</h4>
                  <p className="text-sm text-muted-foreground">Lender evaluates your situation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-sm">4</div>
                <div>
                  <h4 className="font-medium">New Terms</h4>
                  <p className="text-sm text-muted-foreground">Receive modified loan terms</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCourseLibrary = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Library</CardTitle>
          <CardDescription>Professional development courses for loss mitigation specialists</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Short Sale Fundamentals", progress: 0, duration: "2 hours", badge: "Beginner" },
              { title: "Loan Modification Mastery", progress: 75, duration: "3 hours", badge: "Intermediate" },
              { title: "Client Communication", progress: 100, duration: "1.5 hours", badge: "Essential" },
              { title: "Legal Compliance", progress: 0, duration: "2.5 hours", badge: "Advanced" },
              { title: "Market Analysis", progress: 30, duration: "2 hours", badge: "Intermediate" },
              { title: "Documentation Best Practices", progress: 0, duration: "1 hour", badge: "Essential" }
            ].map((course, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{course.badge}</Badge>
                    <span className="text-sm text-muted-foreground">{course.duration}</span>
                  </div>
                  <h3 className="font-medium mb-2">{course.title}</h3>
                  <Progress value={course.progress} className="mb-3" />
                  <Button variant="outline" size="sm" className="w-full">
                    {course.progress > 0 ? 'Continue' : 'Start'} Course
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAIChatbot = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            AI Knowledge Assistant
          </CardTitle>
          <CardDescription>
            Ask questions about loss mitigation processes and get instant answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-muted/30">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4" />
                  <p>Start a conversation with the AI assistant</p>
                  <p className="text-sm mt-2">Try asking about DTI ratios, short sales, or loan modifications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-white border'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Input 
                placeholder="Ask a question about loss mitigation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    sendChatMessage(searchQuery);
                    setSearchQuery('');
                  }
                }}
              />
              <Button 
                onClick={() => {
                  if (searchQuery.trim()) {
                    sendChatMessage(searchQuery);
                    setSearchQuery('');
                  }
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFAQDatabase = () => (
    <Card>
      <CardHeader>
        <CardTitle>FAQ Database</CardTitle>
        <CardDescription>Searchable knowledge base of common questions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">FAQ Database Coming Soon</h3>
          <p className="text-muted-foreground">
            Comprehensive searchable knowledge base will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderAIContent = () => (
    <Card>
      <CardHeader>
        <CardTitle>AI-Narrated Content</CardTitle>
        <CardDescription>Engaging educational content with AI avatars</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Play className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Content Coming Soon</h3>
          <p className="text-muted-foreground">
            Interactive AI-narrated educational content will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderExpertConsultation = () => (
    <Card>
      <CardHeader>
        <CardTitle>Expert Consultation</CardTitle>
        <CardDescription>Connect with loss mitigation specialists</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Expert Consultation Coming Soon</h3>
          <p className="text-muted-foreground">
            Direct access to loss mitigation experts will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/app/advisor">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Advisor
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {tool} {subTool && `- ${subTool.replace('-', ' ')}`}
            </h1>
            <p className="text-muted-foreground">
              Guidance and educational tools for loss mitigation
            </p>
          </div>
        </div>
      </div>

      {/* Tool Content */}
      {renderTool()}
    </div>
  );
};