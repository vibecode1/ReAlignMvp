import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Users, FileText, Clock } from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Multi-Party Collaboration',
      description: 'Seamlessly coordinate between buyers, sellers, agents, and lenders in one platform.',
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Document Management',
      description: 'Centralized document storage and sharing with real-time status tracking.',
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Real-Time Updates',
      description: 'Stay informed with instant notifications and transaction progress tracking.',
    },
  ];

  const benefits = [
    'Reduce transaction time by 40%',
    'Eliminate communication gaps',
    'Streamline document collection',
    'Ensure regulatory compliance',
    'Improve client satisfaction',
    'Scale your business efficiently',
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background to-muted/50 py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="space-y-4 max-w-4xl">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Streamline Your{' '}
                <span className="text-primary">Short Sale</span>{' '}
                Transactions
              </h1>
              <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                The complete platform for managing complex real estate transactions with intelligent communication tools and comprehensive party management.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/solutions">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed specifically for short sale professionals and their clients.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Transform Your Business
              </h2>
              <p className="text-lg text-muted-foreground">
                Join hundreds of real estate professionals who have revolutionized their short sale process with ReAlign.
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="bg-background rounded-lg p-8 shadow-lg">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Platform Demo Video</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of professionals who trust ReAlign for their short sale transactions.
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
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};