import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, Target, Users, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const values = [
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Mission-Driven',
      description: 'We\'re committed to simplifying complex real estate transactions for everyone involved.',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Client-Focused',
      description: 'Our platform is built with real estate professionals\' needs at the center of everything we do.',
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Excellence',
      description: 'We strive for the highest standards in security, reliability, and user experience.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              About ReAlign
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              We're revolutionizing the way real estate professionals manage short sale transactions through innovative technology and intelligent communication tools.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Our Story
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  ReAlign was born from the frustration of real estate professionals dealing with the complexity and inefficiency of traditional short sale processes. We saw an industry struggling with communication gaps, document chaos, and lengthy transaction times.
                </p>
                <p>
                  Our team of experienced real estate professionals and technology experts came together to create a solution that would transform how short sales are managed, making them more efficient, transparent, and successful for all parties involved.
                </p>
                <p>
                  Today, ReAlign serves hundreds of real estate professionals across the country, helping them close transactions faster and with greater confidence.
                </p>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-8">
              <div className="aspect-square bg-background rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Company Story Image</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at ReAlign.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Meet Our Team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Passionate professionals dedicated to transforming real estate transactions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((member) => (
              <div key={member} className="text-center space-y-4">
                <div className="mx-auto w-32 h-32 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-muted-foreground">Team Member {member}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Team Member Name</h3>
                  <p className="text-muted-foreground">Position Title</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-primary text-primary-foreground">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Join the growing community of real estate professionals who trust ReAlign for their short sale transactions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Get Started Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};