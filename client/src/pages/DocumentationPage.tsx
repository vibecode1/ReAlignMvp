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
  Code, 
  Zap, 
  Shield, 
  Users, 
  FileText,
  ArrowRight,
  ExternalLink,
  Download,
  Play,
  GitBranch
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const quickStart = [
    {
      step: 1,
      title: 'Create Your Account',
      description: 'Sign up and verify your negotiator credentials',
      time: '2 min'
    },
    {
      step: 2,
      title: 'Set Up Your First Transaction',
      description: 'Input property details and transaction information',
      time: '5 min'
    },
    {
      step: 3,
      title: 'Add Transaction Parties',
      description: 'Invite sellers, buyers, agents, and escrow officers',
      time: '3 min'
    },
    {
      step: 4,
      title: 'Start Coordinating',
      description: 'Send messages, request documents, and track progress',
      time: 'Ongoing'
    }
  ];

  const apiEndpoints = [
    {
      method: 'POST',
      endpoint: '/api/v1/transactions',
      description: 'Create a new short sale transaction',
      auth: 'Bearer Token'
    },
    {
      method: 'GET',
      endpoint: '/api/v1/transactions/{id}',
      description: 'Retrieve transaction details and status',
      auth: 'Bearer Token'
    },
    {
      method: 'POST',
      endpoint: '/api/v1/transactions/{id}/parties',
      description: 'Add a party to an existing transaction',
      auth: 'Bearer Token'
    },
    {
      method: 'PUT',
      endpoint: '/api/v1/transactions/{id}/phase',
      description: 'Update transaction phase and status',
      auth: 'Bearer Token'
    }
  ];

  const integrations = [
    {
      name: 'Slack',
      description: 'Get real-time notifications in your Slack channels',
      icon: '💬',
      status: 'Available',
      docs: '/docs/integrations/slack'
    },
    {
      name: 'DocuSign',
      description: 'Seamlessly handle document signatures',
      icon: '✍️',
      status: 'Available', 
      docs: '/docs/integrations/docusign'
    },
    {
      name: 'MLS Systems',
      description: 'Sync property data from MLS platforms',
      icon: '🏠',
      status: 'Available',
      docs: '/docs/integrations/mls'
    },
    {
      name: 'Zapier',
      description: 'Connect with 5000+ apps via automation',
      icon: '⚡',
      status: 'Coming Soon',
      docs: '/docs/integrations/zapier'
    }
  ];

  const resources = [
    {
      title: 'API Reference',
      description: 'Complete API documentation with examples',
      icon: <Code className="h-6 w-6" />,
      link: '/docs/api',
      external: false
    },
    {
      title: 'Webhook Guide',
      description: 'Real-time event notifications for your applications',
      icon: <Zap className="h-6 w-6" />,
      link: '/docs/webhooks',
      external: false
    },
    {
      title: 'Security & Compliance',
      description: 'Learn about our security measures and compliance',
      icon: <Shield className="h-6 w-6" />,
      link: '/docs/security',
      external: false
    },
    {
      title: 'SDK & Libraries',
      description: 'Official SDKs for popular programming languages',
      icon: <GitBranch className="h-6 w-6" />,
      link: '/docs/sdks',
      external: false
    }
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Developer Documentation
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Everything you need to integrate ReAlign into your workflow. From API references to detailed guides.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="gap-2">
                    <Play className="h-4 w-4" />
                    Quick Start Guide
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download SDK
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <Card className="bg-card border shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">API Example</span>
                    </div>
                  </CardHeader>
                  <CardContent className="font-mono text-sm">
                    <div className="text-green-600">// Create a new transaction</div>
                    <div className="text-blue-600">curl -X POST \</div>
                    <div className="text-purple-600 ml-2">https://api.realign.com/v1/transactions \</div>
                    <div className="text-orange-600 ml-2">-H "Authorization: Bearer YOUR_TOKEN" \</div>
                    <div className="text-gray-600 ml-2">-d '&#123;"property_address": "123 Main St"&#125;'</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="py-8 border-b">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3"
              />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <Tabs defaultValue="guides" className="w-full">
              <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto mb-12">
                <TabsTrigger value="guides">Guides</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              {/* Guides Tab */}
              <TabsContent value="guides" className="space-y-12">
                <div>
                  <h2 className="text-3xl font-bold mb-8">Quick Start Guide</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickStart.map((step, index) => (
                      <Card key={index} className="relative">
                        <CardHeader>
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mb-4">
                            {step.step}
                          </div>
                          <CardTitle className="text-lg">{step.title}</CardTitle>
                          <CardDescription>{step.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="outline" className="text-xs">
                            {step.time}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-6">Detailed Guides</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="group cursor-pointer hover:shadow-md transition-all">
                      <CardContent className="p-6">
                        <FileText className="h-8 w-8 text-primary mb-4" />
                        <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                          Transaction Lifecycle Management
                        </h4>
                        <p className="text-muted-foreground text-sm mb-4">
                          Learn how to manage the complete short sale process from initial listing to closing.
                        </p>
                        <div className="flex items-center text-sm text-primary">
                          Read Guide <ArrowRight className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="group cursor-pointer hover:shadow-md transition-all">
                      <CardContent className="p-6">
                        <Users className="h-8 w-8 text-primary mb-4" />
                        <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                          Party Management Best Practices
                        </h4>
                        <p className="text-muted-foreground text-sm mb-4">
                          Optimize communication and coordination between all transaction parties.
                        </p>
                        <div className="flex items-center text-sm text-primary">
                          Read Guide <ArrowRight className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* API Tab */}
              <TabsContent value="api" className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-6">API Reference</h2>
                  <p className="text-muted-foreground mb-8 max-w-2xl">
                    Our REST API provides programmatic access to ReAlign's core functionality. All API requests require authentication.
                  </p>
                  
                  <div className="space-y-4">
                    {apiEndpoints.map((endpoint, index) => (
                      <Card key={index} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={endpoint.method === 'GET' ? 'default' : 'secondary'}
                                className="font-mono text-xs"
                              >
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {endpoint.endpoint}
                              </code>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {endpoint.auth}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations" className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Third-Party Integrations</h2>
                  <p className="text-muted-foreground mb-8 max-w-2xl">
                    Connect ReAlign with your existing tools and workflows to create a seamless experience.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {integrations.map((integration, index) => (
                      <Card key={index} className="group hover:shadow-md transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{integration.icon}</span>
                              <div>
                                <h4 className="font-semibold">{integration.name}</h4>
                                <Badge 
                                  variant={integration.status === 'Available' ? 'default' : 'secondary'}
                                  className="text-xs mt-1"
                                >
                                  {integration.status}
                                </Badge>
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                          {integration.status === 'Available' && (
                            <Button variant="outline" size="sm" className="w-full">
                              View Documentation
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Developer Resources</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resources.map((resource, index) => (
                      <Card key={index} className="group cursor-pointer hover:shadow-md transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="text-primary">{resource.icon}</div>
                            {resource.external && (
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                            {resource.title}
                          </h4>
                          <p className="text-muted-foreground text-sm mb-4">{resource.description}</p>
                          <div className="flex items-center text-sm text-primary">
                            Learn More <ArrowRight className="h-4 w-4 ml-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Build with ReAlign?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of developers using ReAlign to streamline short sale transactions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">Get API Key</Button>
              <Button variant="outline" size="lg">
                Join Developer Community
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};