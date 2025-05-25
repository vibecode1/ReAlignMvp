import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, Users, FileText, MessageSquare, BarChart3, Shield, Clock } from 'lucide-react';

export const SolutionsPage: React.FC = () => {
  const solutions = [
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Multi-Party Coordination',
      description: 'Seamlessly manage communication between buyers, sellers, agents, lenders, and other stakeholders in one centralized platform.',
      features: ['Real-time participant tracking', 'Role-based permissions', 'Automated notifications', 'Status updates'],
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Document Management',
      description: 'Centralized document storage, sharing, and tracking with automated collection workflows.',
      features: ['Secure document storage', 'Version control', 'Digital signatures', 'Compliance tracking'],
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'Communication Hub',
      description: 'Intelligent messaging system that keeps all parties informed and engaged throughout the process.',
      features: ['Thread-based conversations', 'Priority messaging', 'Mobile notifications', 'Email integration'],
    },
  ];

  const benefits = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Faster Closings',
      description: 'Reduce average transaction time by 40% through streamlined workflows.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Enhanced Security',
      description: 'Bank-level encryption and compliance with industry standards.',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Better Insights',
      description: 'Track performance metrics and optimize your processes.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Complete Solutions for{' '}
              <span className="text-primary">Short Sale Success</span>
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Comprehensive tools and workflows designed specifically for real estate professionals managing complex short sale transactions.
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

      {/* Solutions Section */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful Solutions for Every Challenge
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Address the most common pain points in short sale transactions with our comprehensive suite of tools.
            </p>
          </div>
          <div className="space-y-16">
            {solutions.map((solution, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    {solution.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{solution.title}</h3>
                  <p className="text-lg text-muted-foreground">{solution.description}</p>
                  <ul className="space-y-2">
                    {solution.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`bg-muted rounded-lg p-8 ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div className="aspect-video bg-background rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">{solution.title} Demo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Choose ReAlign?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by real estate professionals for real estate professionals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-background rounded-lg p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Your Process?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of professionals who have streamlined their short sale transactions with ReAlign.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};