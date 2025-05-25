import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  Search, 
  BookOpen, 
  Video, 
  MessageCircle, 
  Mail, 
  Phone,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  FileText,
  Users,
  Shield
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Getting Started',
      description: 'New to ReAlign? Start here with the basics',
      articles: [
        'Setting up your first transaction',
        'Understanding user roles and permissions',
        'Inviting parties to your transaction',
        'Uploading and organizing documents',
      ],
      badge: 'Popular'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Managing Transactions',
      description: 'Learn how to effectively manage your deals',
      articles: [
        'Creating and configuring transactions',
        'Phase management and tracking',
        'Communication best practices',
        'Document request workflows',
      ]
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Document Management',
      description: 'Master document handling and organization',
      articles: [
        'Document upload and sharing',
        'Setting visibility permissions',
        'Version control and history',
        'Digital signature integration',
      ]
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Security & Privacy',
      description: 'Understanding our security measures',
      articles: [
        'Data encryption and protection',
        'User access controls',
        'Compliance and regulations',
        'Privacy settings and controls',
      ]
    }
  ];

  const quickActions = [
    {
      icon: <Video className="h-6 w-6" />,
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      action: 'Watch Videos'
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: 'Live Chat',
      description: 'Get instant help from our team',
      action: 'Start Chat'
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Email Support',
      description: 'Send us your questions',
      action: 'Send Email'
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: 'Phone Support',
      description: 'Call our support team',
      action: 'Call Now'
    }
  ];

  const faqItems = [
    {
      question: 'How do I add parties to a transaction?',
      answer: 'You can add parties by going to the transaction details page and clicking "Add Party". Enter their email address and select their role in the transaction.'
    },
    {
      question: 'Can I customize the transaction phases?',
      answer: 'Yes! Transaction phases can be customized based on your workflow. Go to Settings > Transaction Settings to modify the default phases.'
    },
    {
      question: 'How secure is my data?',
      answer: 'We use bank-level encryption and comply with SOC 2 Type II standards. All data is encrypted in transit and at rest.'
    },
    {
      question: 'Can I integrate with my existing CRM?',
      answer: 'Yes, we support integrations with major CRM systems including Salesforce, HubSpot, and Pipedrive. Check our Integrations page for the full list.'
    },
    {
      question: 'What file types can I upload?',
      answer: 'We support most common file types including PDF, DOC, DOCX, JPG, PNG, and more. Maximum file size is 100MB per file.'
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              How Can We{' '}
              <span className="text-primary">Help You?</span>
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Find answers, get support, and learn how to make the most of ReAlign.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get Help Your Way
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the support method that works best for you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mx-auto mb-4">
                    {action.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{action.description}</p>
                  <Button variant="outline" size="sm">
                    {action.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Browse by Category
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find detailed guides and documentation for every aspect of ReAlign.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {helpCategories.map((category, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {category.icon}
                    </div>
                    {category.badge && (
                      <Badge variant="secondary">{category.badge}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex} className="flex items-center space-x-2 cursor-pointer hover:text-primary transition-colors">
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-sm">{article}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Quick answers to the most common questions about ReAlign.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqItems.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <span>{faq.question}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 lg:py-32 bg-primary text-primary-foreground">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Still Need Help?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" variant="secondary">
                  Contact Support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Schedule a Call
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};