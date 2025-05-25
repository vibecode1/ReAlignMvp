import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  Phone, 
  CheckCircle, 
  Play,
  Brain,
  Users,
  Award,
  Lightbulb
} from 'lucide-react';
import { Link } from 'wouter';

export const AdvisorDashboardPage: React.FC = () => {
  const guidanceTools = [
    {
      title: "Pre-Qualification Tools",
      description: "Help clients determine their best options",
      icon: <CheckCircle className="h-6 w-6" />,
      color: "bg-green-500",
      tools: [
        { 
          name: "Am I Eligible? Screener", 
          href: "/app/advisor/screener",
          description: "Interactive questionnaire for homeowners",
          badge: "Quick Start"
        },
        { 
          name: "Process Explainer", 
          href: "/app/advisor/process",
          description: "Visual guides for short sales and loan mods",
          badge: "Educational"
        }
      ]
    },
    {
      title: "Educational Content",
      description: "Comprehensive learning modules and courses",
      icon: <BookOpen className="h-6 w-6" />,
      color: "bg-blue-500",
      tools: [
        { 
          name: "Course Library", 
          href: "/app/advisor/courses",
          description: "Loss mitigation training modules",
          badge: "CE Credits"
        },
        { 
          name: "AI-Narrated Content", 
          href: "/app/advisor/content",
          description: "Engaging avatar-delivered lessons",
          badge: "Interactive"
        },
        { 
          name: "Best Practices Guide", 
          href: "/app/advisor/guides",
          description: "Expert tips and strategies",
          badge: "Expert"
        }
      ]
    },
    {
      title: "Knowledge & Support",
      description: "Instant answers and expert guidance",
      icon: <MessageSquare className="h-6 w-6" />,
      color: "bg-purple-500",
      tools: [
        { 
          name: "AI Knowledge Bot", 
          href: "/app/advisor/chatbot",
          description: "24/7 AI assistant for common questions",
          badge: "AI Powered"
        },
        { 
          name: "FAQ Database", 
          href: "/app/advisor/faq",
          description: "Searchable knowledge base",
          badge: "Searchable"
        },
        { 
          name: "Expert Consultation", 
          href: "/app/advisor/expert",
          description: "Connect with loss mitigation specialists",
          badge: "Premium"
        }
      ]
    }
  ];

  const coursesInProgress = [
    { title: "Understanding Short Sales", progress: 75, nextLesson: "Lender Communications" },
    { title: "Loan Modification Basics", progress: 45, nextLesson: "Documentation Requirements" },
    { title: "Client Communication Skills", progress: 90, nextLesson: "Final Assessment" }
  ];

  const recentActivity = [
    { type: "Course Completed", title: "Short Sale Process Overview", time: "2 hours ago" },
    { type: "FAQ Accessed", title: "DTI Calculation Questions", time: "1 day ago" },
    { type: "Screener Used", title: "Client Eligibility Check", time: "3 days ago" }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Advisor Dashboard</h1>
            <p className="text-muted-foreground">
              Guidance, coaching, and educational resources for loss mitigation
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href="/app/advisor/chatbot">
            <Button variant="outline">
              <Brain className="mr-2 h-4 w-4" />
              Ask AI Assistant
            </Button>
          </Link>
          <Link href="/app/advisor/courses">
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              Continue Learning
            </Button>
          </Link>
        </div>
      </div>

      {/* Learning Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Learning Journey</CardTitle>
          <CardDescription>Continue your professional development</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {coursesInProgress.map((course, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{course.title}</h3>
                    <span className="text-sm text-muted-foreground">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">Next: {course.nextLesson}</p>
                </div>
                <Button variant="outline" size="sm" className="ml-4">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tool Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {guidanceTools.map((category) => (
          <Card key={category.title} className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${category.color} text-white rounded-lg`}>
                  {category.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.tools.map((tool) => (
                <Link key={tool.name} href={tool.href}>
                  <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{tool.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {tool.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your latest learning and guidance activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="p-2 bg-muted rounded-full">
                  {item.type === 'Course Completed' ? <Award className="h-4 w-4" /> :
                   item.type === 'FAQ Accessed' ? <HelpCircle className="h-4 w-4" /> :
                   <CheckCircle className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.type}</p>
                </div>
                <span className="text-sm text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant Feature */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">24/7 AI Knowledge Assistant</h3>
              <p className="text-muted-foreground">
                Get instant answers to loss mitigation questions from our comprehensive knowledge base
              </p>
            </div>
          </div>
          <Link href="/app/advisor/chatbot">
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Start Chat
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Experimental Feature */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Phone className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold">AI Agent Follow-Up Calls</h3>
                <Badge variant="outline" className="text-xs">Experimental</Badge>
              </div>
              <p className="text-muted-foreground">
                Automated follow-up calls for simple confirmations and updates
              </p>
            </div>
          </div>
          <Button variant="outline">
            <Lightbulb className="mr-2 h-4 w-4" />
            Learn More
          </Button>
        </CardContent>
      </Card>

      {/* Quick Start CTA */}
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Help a Client Get Started</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Use our pre-qualification screener to help clients understand their options and next steps
          </p>
          <div className="flex space-x-3">
            <Link href="/app/advisor/screener">
              <Button size="lg">
                <CheckCircle className="mr-2 h-5 w-5" />
                Start Screener
              </Button>
            </Link>
            <Link href="/app/advisor/process">
              <Button variant="outline" size="lg">
                <BookOpen className="mr-2 h-5 w-5" />
                View Process Guide
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};