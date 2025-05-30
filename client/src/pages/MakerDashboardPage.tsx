import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, FileText, Calculator, Package, Bot, Folder, CheckCircle, Zap } from 'lucide-react';
import { Link } from 'wouter';

export const MakerDashboardPage: React.FC = () => {
  const toolCategories = [
    {
      title: "Preparatory Tools",
      description: "Get organized before starting your loss mitigation process",
      icon: <CheckCircle className="h-6 w-6" />,
      color: "bg-green-500",
      tools: [
        { 
          name: "Document Checklist Generator", 
          href: "/app/maker/checklist", 
          description: "Generate personalized document checklists",
          badge: "Smart"
        }
      ]
    },
    {
      title: "Form Makers",
      description: "Create and fill standardized forms with AI assistance",
      icon: <FileText className="h-6 w-6" />,
      color: "bg-blue-500",
      tools: [
        { 
          name: "IRS Form 4506-C Maker", 
          href: "/app/maker/form/4506c",
          description: "Digital IRS tax transcript request form",
          badge: "AI Help"
        },
        { 
          name: "Borrower Financial Statement", 
          href: "/app/maker/form/bfs",
          description: "Comprehensive financial intake form",
          badge: "AI Help"
        },
        { 
          name: "BFS/UBA Form Maker (Enhanced)", 
          href: "/uba-form-maker",
          description: "AI-powered conversational UBA form completion",
          badge: "NEW - AI Chat"
        },
        { 
          name: "HUD-1 / CD Estimator", 
          href: "/app/maker/form/hud1",
          description: "Closing disclosure estimate tool",
          badge: "AI Help"
        },
        { 
          name: "Lender Form Templates", 
          href: "/app/maker/templates",
          description: "Access common lender-specific forms",
          badge: "Library"
        }
      ]
    },
    {
      title: "Document Drafters", 
      description: "Generate professional documents with guided templates",
      icon: <FileText className="h-6 w-6" />,
      color: "bg-purple-500",
      tools: [
        { 
          name: "Letter of Explanation Drafter", 
          href: "/app/maker/draft/loe",
          description: "Create compelling hardship letters",
          badge: "AI Assist"
        },
        { 
          name: "Borrower Contribution Letter", 
          href: "/app/maker/draft/contribution",
          description: "Draft contribution and offer letters",
          badge: "Templates"
        },
        { 
          name: "Common Document Templates", 
          href: "/app/maker/draft/templates",
          description: "Authorization forms and certifications",
          badge: "Templates"
        }
      ]
    },
    {
      title: "Financial Calculators",
      description: "Fannie Mae compliant calculations for loss mitigation",
      icon: <Calculator className="h-6 w-6" />,
      color: "bg-orange-500",
      tools: [
        { 
          name: "DTI Calculators", 
          href: "/app/maker/calculator/dti",
          description: "Housing & total debt-to-income ratios",
          badge: "Fannie Mae"
        },
        { 
          name: "Cash Reserves & Contribution", 
          href: "/app/maker/calculator/cash",
          description: "Calculate liquid assets and required contributions",
          badge: "Short Sale"
        },
        { 
          name: "Payment Deferral Eligibility", 
          href: "/app/maker/calculator/deferral",
          description: "Comprehensive eligibility assessment",
          badge: "Retention"
        },
        { 
          name: "Property LTV & Paydown", 
          href: "/app/maker/calculator/ltv",
          description: "Loan-to-value and required paydown calculations",
          badge: "Analysis"
        },
        { 
          name: "Trial Period & Affordability", 
          href: "/app/maker/calculator/modification",
          description: "Modification payment and affordability analysis",
          badge: "Modification"
        },
        { 
          name: "All Financial Calculators", 
          href: "/app/maker/calculator/dashboard",
          description: "Access all 13 Fannie Mae guideline calculators",
          badge: "Complete Suite"
        }
      ]
    }
  ];

  const recentActivity = [
    { name: "Johnson Family BFS", type: "Financial Statement", date: "2 hours ago", status: "Draft" },
    { name: "Smith Hardship LOE", type: "Letter of Explanation", date: "1 day ago", status: "Complete" },
    { name: "Package #1247", type: "Document Package", date: "3 days ago", status: "Downloaded" }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Maker Dashboard</h1>
            <p className="text-muted-foreground">
              Document creation and calculation tools for loss mitigation
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href="/app/maker/package">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Package Center
            </Button>
          </Link>
          <Link href="/app/maker/vault">
            <Button>
              <Folder className="mr-2 h-4 w-4" />
              Document Vault
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your latest document work</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={item.status === 'Complete' ? 'default' : item.status === 'Draft' ? 'secondary' : 'outline'}>
                    {item.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tool Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {toolCategories.map((category) => (
          <Card key={category.title} className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${category.color} text-white rounded-lg`}>
                  {category.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {category.tools.map((tool) => (
                <Link key={tool.name} href={tool.href}>
                  <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{tool.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {tool.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Assistant Feature */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI-Powered Assistance</h3>
              <p className="text-muted-foreground">
                Get contextual help and guidance on any form field or document section
              </p>
            </div>
          </div>
          <Button variant="outline">
            <Zap className="mr-2 h-4 w-4" />
            Learn More
          </Button>
        </CardContent>
      </Card>

      {/* Document Packaging CTA */}
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to Package Your Documents?</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Combine your completed forms and documents into organized, professional packages ready for lender submission
          </p>
          <div className="flex space-x-3">
            <Link href="/app/maker/package">
              <Button size="lg">
                <Package className="mr-2 h-5 w-5" />
                Package Documents
              </Button>
            </Link>
            <Link href="/app/maker/vault">
              <Button variant="outline" size="lg">
                <Folder className="mr-2 h-5 w-5" />
                View Document Vault
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};