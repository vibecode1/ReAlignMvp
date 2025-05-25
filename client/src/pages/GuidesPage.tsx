import React, { useState } from 'react';
import { Link } from 'wouter';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  BookOpen, 
  Users, 
  FileText, 
  MessageSquare,
  Clock,
  Star,
  TrendingUp,
  Shield,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';

export const GuidesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const guideCategories = [
    {
      title: 'Getting Started',
      description: 'Essential guides for new users',
      icon: <Play className="h-6 w-6" />,
      guides: [
        {
          title: 'Your First Short Sale Transaction',
          description: 'Step-by-step guide to creating and managing your first transaction',
          readTime: '8 min',
          difficulty: 'Beginner',
          popular: true
        },
        {
          title: 'Setting Up Your ReAlign Workspace',
          description: 'Configure your account settings and preferences for optimal workflow',
          readTime: '5 min',
          difficulty: 'Beginner',
          popular: false
        },
        {
          title: 'Understanding Transaction Phases',
          description: 'Learn about the 11 phases of short sale transactions and how to track progress',
          readTime: '12 min',
          difficulty: 'Beginner',
          popular: true
        }
      ]
    },
    {
      title: 'Party Management',
      description: 'Coordinate with all stakeholders effectively',
      icon: <Users className="h-6 w-6" />,
      guides: [
        {
          title: 'Adding and Managing Transaction Parties',
          description: 'Best practices for inviting sellers, buyers, agents, and escrow officers',
          readTime: '10 min',
          difficulty: 'Intermediate',
          popular: true
        },
        {
          title: 'Role-Based Permissions and Access Control',
          description: 'Configure what each party can see and do within a transaction',
          readTime: '7 min',
          difficulty: 'Intermediate',
          popular: false
        },
        {
          title: 'Managing Client Communication Preferences',
          description: 'Set up email notifications and communication channels for all parties',
          readTime: '6 min',
          difficulty: 'Beginner',
          popular: false
        }
      ]
    },
    {
      title: 'Document Management',
      description: 'Streamline document collection and sharing',
      icon: <FileText className="h-6 w-6" />,
      guides: [
        {
          title: 'Document Request Workflows',
          description: 'Create, track, and manage document requests efficiently',
          readTime: '15 min',
          difficulty: 'Intermediate',
          popular: true
        },
        {
          title: 'File Upload and Organization Best Practices',
          description: 'Organize documents with proper naming conventions and folder structures',
          readTime: '8 min',
          difficulty: 'Beginner',
          popular: false
        },
        {
          title: 'Document Visibility and Privacy Controls',
          description: 'Control who can see which documents throughout the transaction',
          readTime: '6 min',
          difficulty: 'Advanced',
          popular: false
        }
      ]
    },
    {
      title: 'Communication & Messaging',
      description: 'Master effective transaction communication',
      icon: <MessageSquare className="h-6 w-6" />,
      guides: [
        {
          title: 'Effective Transaction Communication Strategies',
          description: 'Proven methods for keeping all parties informed and engaged',
          readTime: '12 min',
          difficulty: 'Intermediate',
          popular: true
        },
        {
          title: 'Using Message Threads for Complex Discussions',
          description: 'Organize conversations by topic to maintain clarity',
          readTime: '5 min',
          difficulty: 'Beginner',
          popular: false
        },
        {
          title: 'Automated Notification Setup',
          description: 'Configure smart notifications to keep everyone in the loop',
          readTime: '9 min',
          difficulty: 'Intermediate',
          popular: true
        }
      ]
    }
  ];

  const featuredGuides = [
    {
      title: 'The Complete Short Sale Coordination Playbook',
      description: 'Master the entire short sale process from listing to closing with our comprehensive 50-page guide',
      readTime: '45 min read',
      category: 'Comprehensive Guide',
      image: 'bg-gradient-to-r from-blue-500 to-purple-600',
      popular: true,
      new: false
    },
    {
      title: 'Advanced Transaction Tracking Techniques',
      description: 'Pro tips for managing complex transactions with multiple properties and parties',
      readTime: '20 min read',
      category: 'Advanced',
      image: 'bg-gradient-to-r from-green-500 to-teal-600',
      popular: false,
      new: true
    }
  ];

  const quickTips = [
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Time-Saving Shortcuts',
      tip: 'Use Ctrl+K to quickly search for any transaction or party across your workspace'
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: 'Pro Feature',
      tip: 'Set up automated weekly digest emails to keep all parties updated without manual effort'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Security Best Practice',
      tip: 'Always use private document sharing for sensitive financial information'
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Efficiency Boost',
      tip: 'Create template messages for common communications to save time'
    }
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Short Sale Mastery Guides
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Learn from industry experts and master the art of short sale coordination with our comprehensive guides
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
            </div>
          </div>
        </section>

        {/* Featured Guides */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Featured Guides</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredGuides.map((guide, index) => (
                <Card key={index} className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`h-48 ${guide.image} relative`}>
                    <div className="absolute top-4 left-4 flex gap-2">
                      {guide.popular && (
                        <Badge className="bg-white/20 text-white border-white/30">
                          Popular
                        </Badge>
                      )}
                      {guide.new && (
                        <Badge className="bg-green-500 text-white">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <Badge variant="secondary" className="text-xs">
                        {guide.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">{guide.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{guide.readTime}</span>
                      <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Guide Categories */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Browse by Category</h2>
            
            <div className="space-y-12">
              {guideCategories.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{category.title}</h3>
                      <p className="text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.guides.map((guide, guideIndex) => (
                      <Card key={guideIndex} className="group cursor-pointer hover:shadow-md transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex gap-2">
                              <Badge 
                                variant={guide.difficulty === 'Beginner' ? 'default' : guide.difficulty === 'Intermediate' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {guide.difficulty}
                              </Badge>
                              {guide.popular && (
                                <Badge variant="outline" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <h4 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors">
                            {guide.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-4">{guide.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{guide.readTime}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Tips */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Quick Tips & Tricks</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickTips.map((tip, index) => (
                <Card key={index} className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <div className="text-primary">
                        {tip.icon}
                      </div>
                    </div>
                    <h4 className="font-semibold mb-2">{tip.title}</h4>
                    <p className="text-sm text-muted-foreground">{tip.tip}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Master Short Sales?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start with our foundational guides and work your way up to advanced techniques. Join thousands of successful negotiators using ReAlign.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">Start with Basics</Button>
              <Button variant="outline" size="lg">
                Join Community
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};