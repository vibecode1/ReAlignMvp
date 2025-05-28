import React, { useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Code, 
  Key, 
  Shield, 
  Zap,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const ApiReferencePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMethod, setActiveMethod] = useState('');

  const endpoints = [
    {
      category: 'Authentication',
      description: 'Manage API authentication and access tokens',
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/auth/login',
          description: 'Authenticate user and receive access token',
          auth: 'None',
          body: {
            email: 'string',
            password: 'string'
          },
          response: {
            access_token: 'string',
            user: 'object',
            expires_in: 'number'
          }
        },
        {
          method: 'POST',
          path: '/api/v1/auth/refresh',
          description: 'Refresh an expired access token',
          auth: 'Bearer Token',
          body: {
            refresh_token: 'string'
          },
          response: {
            access_token: 'string',
            expires_in: 'number'
          }
        }
      ]
    },
    {
      category: 'Transactions',
      description: 'Create and manage short sale transactions',
      endpoints: [
        {
          method: 'GET',
          path: '/api/v1/transactions',
          description: 'List all transactions for authenticated user',
          auth: 'Bearer Token',
          parameters: {
            page: 'number (optional)',
            limit: 'number (optional)',
            status: 'string (optional)'
          },
          response: {
            data: 'array',
            total: 'number',
            page: 'number',
            limit: 'number'
          }
        },
        {
          method: 'POST',
          path: '/api/v1/transactions',
          description: 'Create a new transaction',
          auth: 'Bearer Token',
          body: {
            property_address: 'string',
            property_city: 'string',
            property_state: 'string',
            property_zip: 'string',
            listing_price: 'number',
            loan_amount: 'number'
          },
          response: {
            id: 'string',
            property_address: 'string',
            current_phase: 'string',
            created_at: 'string'
          }
        },
        {
          method: 'GET',
          path: '/api/v1/transactions/{id}',
          description: 'Get transaction details by ID',
          auth: 'Bearer Token',
          parameters: {
            id: 'string (required)'
          },
          response: {
            id: 'string',
            property_address: 'string',
            current_phase: 'string',
            parties: 'array',
            documents: 'array'
          }
        },
        {
          method: 'PUT',
          path: '/api/v1/transactions/{id}/phase',
          description: 'Update transaction phase',
          auth: 'Bearer Token',
          body: {
            phase: 'string',
            notes: 'string (optional)'
          },
          response: {
            id: 'string',
            current_phase: 'string',
            updated_at: 'string'
          }
        }
      ]
    },
    {
      category: 'Parties',
      description: 'Manage transaction participants',
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/transactions/{id}/parties',
          description: 'Add a party to a transaction',
          auth: 'Bearer Token',
          body: {
            email: 'string',
            role: 'string',
            name: 'string (optional)'
          },
          response: {
            id: 'string',
            email: 'string',
            role: 'string',
            status: 'string'
          }
        },
        {
          method: 'GET',
          path: '/api/v1/transactions/{id}/parties',
          description: 'List all parties in a transaction',
          auth: 'Bearer Token',
          response: {
            data: 'array',
            total: 'number'
          }
        }
      ]
    },
    {
      category: 'Documents',
      description: 'Handle document requests and uploads',
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/transactions/{id}/document-requests',
          description: 'Create a document request',
          auth: 'Bearer Token',
          body: {
            title: 'string',
            description: 'string',
            due_date: 'string',
            required_from: 'array'
          },
          response: {
            id: 'string',
            title: 'string',
            status: 'string',
            created_at: 'string'
          }
        },
        {
          method: 'POST',
          path: '/api/v1/uploads',
          description: 'Upload a document file',
          auth: 'Bearer Token',
          body: {
            file: 'multipart/form-data',
            transaction_id: 'string',
            document_request_id: 'string (optional)'
          },
          response: {
            id: 'string',
            filename: 'string',
            url: 'string',
            size: 'number'
          }
        }
      ]
    }
  ];

  const statusCodes = [
    { code: '200', description: 'Success - Request completed successfully', type: 'success' },
    { code: '201', description: 'Created - Resource created successfully', type: 'success' },
    { code: '400', description: 'Bad Request - Invalid request parameters', type: 'error' },
    { code: '401', description: 'Unauthorized - Invalid or missing authentication', type: 'error' },
    { code: '403', description: 'Forbidden - Insufficient permissions', type: 'error' },
    { code: '404', description: 'Not Found - Resource does not exist', type: 'error' },
    { code: '422', description: 'Unprocessable Entity - Validation errors', type: 'error' },
    { code: '500', description: 'Internal Server Error - Server-side error', type: 'error' }
  ];

  const codeExamples = {
    javascript: `// Create a new transaction
const response = await fetch('https://api.realign.com/v1/transactions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    property_address: '123 Main Street',
    property_city: 'San Francisco',
    property_state: 'CA',
    property_zip: '94102',
    listing_price: 750000,
    loan_amount: 650000
  })
});

const transaction = await response.json();
console.log('Transaction created:', transaction.id);`,
    python: `import requests

# Create a new transaction
url = 'https://api.realign.com/v1/transactions'
headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}
data = {
    'property_address': '123 Main Street',
    'property_city': 'San Francisco',
    'property_state': 'CA',
    'property_zip': '94102',
    'listing_price': 750000,
    'loan_amount': 650000
}

response = requests.post(url, headers=headers, json=data)
transaction = response.json()
print(f'Transaction created: {transaction["id"]}')`,
    curl: `# Create a new transaction
curl -X POST https://api.realign.com/v1/transactions \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "property_address": "123 Main Street",
    "property_city": "San Francisco", 
    "property_state": "CA",
    "property_zip": "94102",
    "listing_price": 750000,
    "loan_amount": 650000
  }'`
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              API Reference
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Complete reference for the ReAlign REST API. Build powerful integrations with our short sale platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">
                <Key className="h-4 w-4" />
                Get API Key
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Postman Collection
              </Button>
            </div>
          </div>
        </section>

        {/* Search and Navigation */}
        <section className="py-8 border-b">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search endpoints..."
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Quick Links</h3>
                    <div className="space-y-1 text-sm">
                      <a href="#authentication" className="block text-muted-foreground hover:text-foreground transition-colors">
                        Authentication
                      </a>
                      <a href="#rate-limits" className="block text-muted-foreground hover:text-foreground transition-colors">
                        Rate Limits
                      </a>
                      <a href="#status-codes" className="block text-muted-foreground hover:text-foreground transition-colors">
                        Status Codes
                      </a>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Endpoints</h3>
                    <div className="space-y-1 text-sm">
                      {endpoints.map((category, index) => (
                        <a 
                          key={index}
                          href={`#${category.category.toLowerCase()}`}
                          className="block text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {category.category}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-12">
                {/* Authentication */}
                <div id="authentication">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <CardTitle className="text-2xl">Authentication</CardTitle>
                      </div>
                      <CardDescription>
                        All API requests require authentication using Bearer tokens.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <code className="text-sm">
                          Authorization: Bearer YOUR_ACCESS_TOKEN
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Include your access token in the Authorization header for all requests. 
                        Tokens expire after 24 hours and can be refreshed using the refresh endpoint.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Rate Limits */}
                <div id="rate-limits">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-6 w-6 text-primary" />
                        <CardTitle className="text-2xl">Rate Limits</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">1000</div>
                          <div className="text-sm text-muted-foreground">requests per hour</div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">100</div>
                          <div className="text-sm text-muted-foreground">concurrent requests</div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">10MB</div>
                          <div className="text-sm text-muted-foreground">max file upload</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Status Codes */}
                <div id="status-codes">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">HTTP Status Codes</CardTitle>
                      <CardDescription>
                        Standard HTTP status codes used by the ReAlign API.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {statusCodes.map((status, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <Badge variant={status.type === 'success' ? 'default' : 'destructive'}>
                              {status.code}
                            </Badge>
                            <span className="text-sm">{status.description}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* API Endpoints */}
                {endpoints.map((category, categoryIndex) => (
                  <div key={categoryIndex} id={category.category.toLowerCase()}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{category.category}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {category.endpoints.map((endpoint, endpointIndex) => (
                          <div key={endpointIndex} className="border rounded-lg p-6 space-y-4">
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={endpoint.method === 'GET' ? 'default' : 'secondary'}
                                className="font-mono"
                              >
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {endpoint.path}
                              </code>
                              <Badge variant="outline" className="text-xs">
                                {endpoint.auth}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                            
                            {'parameters' in endpoint && endpoint.parameters && (
                              <div>
                                <h5 className="font-semibold mb-2">Parameters</h5>
                                <div className="bg-muted/30 p-3 rounded text-sm font-mono">
                                  {Object.entries(endpoint.parameters).map(([key, value]) => (
                                    <div key={key}>
                                      <span className="text-blue-600">{key}</span>: <span className="text-green-600">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {endpoint.body && (
                              <div>
                                <h5 className="font-semibold mb-2">Request Body</h5>
                                <div className="bg-muted/30 p-3 rounded text-sm font-mono">
                                  {Object.entries(endpoint.body).map(([key, value]) => (
                                    <div key={key}>
                                      <span className="text-blue-600">{key}</span>: <span className="text-green-600">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <h5 className="font-semibold mb-2">Response</h5>
                              <div className="bg-muted/30 p-3 rounded text-sm font-mono">
                                {Object.entries(endpoint.response).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="text-blue-600">{key}</span>: <span className="text-green-600">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {/* Code Examples */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Code Examples</CardTitle>
                      <CardDescription>
                        Example implementations in popular programming languages.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="javascript" className="w-full">
                        <TabsList className="grid grid-cols-3 w-full max-w-md">
                          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                          <TabsTrigger value="python">Python</TabsTrigger>
                          <TabsTrigger value="curl">cURL</TabsTrigger>
                        </TabsList>
                        
                        {Object.entries(codeExamples).map(([language, code]) => (
                          <TabsContent key={language} value={language}>
                            <div className="relative">
                              <pre className="bg-muted/30 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{code}</code>
                              </pre>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => navigator.clipboard.writeText(code)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};