import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Shield, 
  Clock, 
  BarChart3, 
  Smartphone, 
  Zap,
  CheckCircle,
  ArrowRight 
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Multi-Party Coordination',
      description: 'Seamlessly manage all stakeholders in one platform',
      details: [
        'Real-time participant tracking',
        'Role-based permissions and access',
        'Automated status notifications',
        'Party communication threads'
      ],
      category: 'Collaboration'
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Document Management',
      description: 'Centralized, secure document handling',
      details: [
        'Drag-and-drop file uploads',
        'Version control and history',
        'Digital signature integration',
        'Automated document requests'
      ],
      category: 'Documents'
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'Smart Communication',
      description: 'Intelligent messaging system',
      details: [
        'Thread-based conversations',
        'Priority message flagging',
        'Email and SMS integration',
        'Automated follow-ups'
      ],
      category: 'Communication'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Enterprise Security',
      description: 'Bank-level security and compliance',
      details: [
        'End-to-end encryption',
        'SOC 2 Type II compliance',
        'Role-based access control',
        'Audit trail logging'
      ],
      category: 'Security'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Analytics & Reporting',
      description: 'Comprehensive performance insights',
      details: [
        'Transaction timeline tracking',
        'Performance metrics dashboard',
        'Custom report generation',
        'Bottleneck identification'
      ],
      category: 'Analytics'
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: 'Mobile Optimization',
      description: 'Full functionality on any device',
      details: [
        'Native mobile app experience',
        'Offline document access',
        'Push notifications',
        'Touch-optimized interface'
      ],
      category: 'Mobile'
    }
  ];

  const benefits = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: '40% Faster Closings',
      description: 'Streamlined workflows reduce average transaction time'
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: '95% Client Satisfaction',
      description: 'Improved communication leads to happier clients'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: '60% Less Admin Work',
      description: 'Automation handles routine tasks automatically'
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Powerful Features for{' '}
              <span className="text-primary">Real Estate Success</span>
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Everything you need to manage short sale transactions efficiently, securely, and successfully.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Complete Feature Set
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for real estate professionals who demand efficiency and reliability.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>
                    <Badge variant="secondary">{feature.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Proven Results
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See the impact ReAlign has on real estate professionals' success.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Seamless Integrations
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ReAlign works with the tools you already use, making adoption seamless.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
              {['CRM Systems', 'Email Platforms', 'Document Storage', 'MLS Services'].map((integration, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-lg mb-2 mx-auto flex items-center justify-center">
                    <span className="text-xs font-medium">{integration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-primary text-primary-foreground">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Experience These Features?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Start your free trial today and see how ReAlign can transform your short sale process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/solutions">
                <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  View Solutions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};