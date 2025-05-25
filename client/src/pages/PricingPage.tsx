import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Check, ArrowRight } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$49',
      period: 'per month',
      description: 'Perfect for individual agents getting started',
      features: [
        'Up to 5 active transactions',
        'Basic document management',
        'Email notifications',
        'Standard support',
        'Mobile app access',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: '$99',
      period: 'per month',
      description: 'Ideal for busy real estate professionals',
      features: [
        'Up to 25 active transactions',
        'Advanced document management',
        'Real-time notifications',
        'Priority support',
        'Mobile app access',
        'Custom branding',
        'Analytics dashboard',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For teams and brokerages',
      features: [
        'Unlimited transactions',
        'Enterprise document management',
        'Multi-user collaboration',
        'Dedicated support',
        'Custom integrations',
        'White-label solution',
        'Advanced analytics',
        'Training and onboarding',
      ],
      popular: false,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Choose the plan that fits your business needs. All plans include a 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== 'Custom' && (
                      <span className="text-muted-foreground">/{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.price === 'Custom' ? '/contact' : '/register'}>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: 'Can I change plans at any time?',
                answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we prorate any billing differences.',
              },
              {
                question: 'Is there a free trial?',
                answer: 'All plans come with a 14-day free trial. No credit card required to get started.',
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards, ACH payments, and can arrange invoicing for Enterprise customers.',
              },
              {
                question: 'Can I cancel at any time?',
                answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.',
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
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
              Join thousands of real estate professionals who trust ReAlign for their transactions.
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