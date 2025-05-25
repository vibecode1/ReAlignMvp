import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { ArrowRight, Check, ExternalLink, Zap } from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const integrationCategories = [
    {
      title: 'CRM Systems',
      description: 'Connect with your existing customer relationship management tools',
      integrations: [
        { name: 'Salesforce', description: 'Sync contacts and opportunities', status: 'Available', popular: true },
        { name: 'HubSpot', description: 'Automated lead management', status: 'Available', popular: true },
        { name: 'Pipedrive', description: 'Deal tracking and management', status: 'Available', popular: false },
        { name: 'Zoho CRM', description: 'Complete sales automation', status: 'Coming Soon', popular: false },
      ]
    },
    {
      title: 'Document Management',
      description: 'Streamline document workflows with popular storage solutions',
      integrations: [
        { name: 'Google Drive', description: 'Cloud document storage and sharing', status: 'Available', popular: true },
        { name: 'Dropbox', description: 'Secure file synchronization', status: 'Available', popular: true },
        { name: 'OneDrive', description: 'Microsoft cloud integration', status: 'Available', popular: false },
        { name: 'Box', description: 'Enterprise document management', status: 'Available', popular: false },
      ]
    },
    {
      title: 'Communication',
      description: 'Enhance your communication channels and notifications',
      integrations: [
        { name: 'Slack', description: 'Team messaging and notifications', status: 'Available', popular: true },
        { name: 'Microsoft Teams', description: 'Video calls and collaboration', status: 'Available', popular: true },
        { name: 'Twilio', description: 'SMS and voice communications', status: 'Available', popular: false },
        { name: 'Zoom', description: 'Video conferencing integration', status: 'Coming Soon', popular: false },
      ]
    },
    {
      title: 'Real Estate Tools',
      description: 'Connect with industry-specific platforms and services',
      integrations: [
        { name: 'MLS Systems', description: 'Multiple listing service data', status: 'Available', popular: true },
        { name: 'DocuSign', description: 'Digital signature workflows', status: 'Available', popular: true },
        { name: 'Zillow', description: 'Property data and valuations', status: 'Available', popular: false },
        { name: 'Transaction Desk', description: 'Deal management platform', status: 'Coming Soon', popular: false },
      ]
    }
  ];

  const benefits = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Seamless Workflow',
      description: 'Work with your existing tools without disruption'
    },
    {
      icon: <Check className="h-6 w-6" />,
      title: 'Data Synchronization',
      description: 'Keep all your systems updated automatically'
    },
    {
      icon: <ExternalLink className="h-6 w-6" />,
      title: 'One-Click Setup',
      description: 'Quick and easy integration configuration'
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Powerful{' '}
              <span className="text-primary">Integrations</span>
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Connect ReAlign with your favorite tools and platforms to create a seamless workflow that works for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Integrating
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg">
                  Request Integration
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Integrate with ReAlign?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enhance your productivity by connecting your existing tools.
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

      {/* Integrations Grid */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Available Integrations
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with the tools you already use and love.
            </p>
          </div>
          <div className="space-y-12">
            {integrationCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.integrations.map((integration, index) => (
                    <Card key={index} className="relative">
                      {integration.popular && (
                        <Badge className="absolute -top-2 -right-2 bg-primary">
                          Popular
                        </Badge>
                      )}
                      <CardHeader className="pb-4">
                        <div className="w-12 h-12 bg-muted rounded-lg mb-3 flex items-center justify-center">
                          <span className="text-xs font-medium">{integration.name.slice(0, 2)}</span>
                        </div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription className="text-sm">{integration.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={integration.status === 'Available' ? 'default' : 'secondary'}
                            className={integration.status === 'Available' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {integration.status}
                          </Badge>
                          {integration.status === 'Available' && (
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Custom Integration Section */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Need a Custom Integration?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't see your favorite tool? We offer custom integrations and API access for enterprise customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Request Integration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" size="lg">
                  View API Docs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};