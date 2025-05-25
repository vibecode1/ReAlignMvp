import React from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  FileCheck, 
  Globe, 
  Scale,
  CheckCircle,
  Download,
  ExternalLink,
  Building,
  Users,
  Lock
} from 'lucide-react';

export const CompliancePage: React.FC = () => {
  const regulations = [
    {
      name: 'GDPR',
      fullName: 'General Data Protection Regulation',
      region: 'European Union',
      status: 'Compliant',
      description: 'Comprehensive data protection and privacy regulation',
      keyFeatures: [
        'Right to data portability',
        'Right to be forgotten',
        'Data breach notification',
        'Privacy by design',
        'Consent management'
      ]
    },
    {
      name: 'CCPA',
      fullName: 'California Consumer Privacy Act',
      region: 'California, USA',
      status: 'Compliant',
      description: 'Consumer privacy rights and business obligations',
      keyFeatures: [
        'Right to know about data collection',
        'Right to delete personal information',
        'Right to opt-out of data sales',
        'Non-discrimination protection',
        'Data transparency requirements'
      ]
    },
    {
      name: 'PIPEDA',
      fullName: 'Personal Information Protection and Electronic Documents Act',
      region: 'Canada',
      status: 'Compliant',
      description: 'Federal privacy law governing private sector organizations',
      keyFeatures: [
        'Consent for data collection',
        'Purpose limitation principle',
        'Data accuracy requirements',
        'Safeguarding personal information',
        'Individual access rights'
      ]
    },
    {
      name: 'SOX',
      fullName: 'Sarbanes-Oxley Act',
      region: 'United States',
      status: 'Compliant',
      description: 'Financial reporting and corporate governance requirements',
      keyFeatures: [
        'Internal controls over financial reporting',
        'Management assessment requirements',
        'Auditor independence standards',
        'Corporate responsibility measures',
        'Enhanced financial disclosures'
      ]
    }
  ];

  const frameworks = [
    {
      name: 'SOC 2 Type II',
      category: 'Security Framework',
      description: 'Comprehensive security, availability, and confidentiality controls',
      status: 'Certified',
      auditDate: '2024-06-15',
      nextAudit: '2025-06-15'
    },
    {
      name: 'ISO 27001',
      category: 'Information Security',
      description: 'International standard for information security management',
      status: 'In Progress',
      auditDate: null,
      nextAudit: '2025-03-01'
    },
    {
      name: 'NIST Framework',
      category: 'Cybersecurity',
      description: 'Cybersecurity framework for managing organizational risk',
      status: 'Implemented',
      auditDate: '2024-09-01',
      nextAudit: '2025-09-01'
    }
  ];

  const dataHandling = [
    {
      category: 'Data Collection',
      description: 'How we collect and process personal information',
      practices: [
        'Transparent data collection notices',
        'Lawful basis documentation for all processing',
        'Minimal data collection principles',
        'Purpose specification and limitation',
        'Regular data audits and inventories'
      ]
    },
    {
      category: 'Data Storage',
      description: 'Secure storage and retention of personal data',
      practices: [
        'Encrypted data storage (AES-256)',
        'Geographical data residency controls',
        'Automated retention period enforcement',
        'Secure data destruction procedures',
        'Regular backup integrity verification'
      ]
    },
    {
      category: 'Data Sharing',
      description: 'Third-party data sharing and transfer protocols',
      practices: [
        'Standard Contractual Clauses (SCCs) for international transfers',
        'Data Processing Agreements (DPAs) with all vendors',
        'Regular vendor security assessments',
        'Minimal data sharing principles',
        'User consent management for data sharing'
      ]
    },
    {
      category: 'Individual Rights',
      description: 'Supporting data subject rights and requests',
      practices: [
        'Automated data subject request handling',
        'Identity verification procedures',
        'Data portability in machine-readable formats',
        'Right to rectification processes',
        'Complaint handling and escalation procedures'
      ]
    }
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-6">
              <Scale className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Compliance & Governance
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              ReAlign operates with the highest standards of compliance, ensuring your data is handled according to global privacy regulations and industry best practices.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">
                <Download className="h-4 w-4" />
                Compliance Report
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Request DPA
              </Button>
            </div>
          </div>
        </section>

        {/* Regulatory Compliance */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Global Regulatory Compliance</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {regulations.map((regulation, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{regulation.name}</h3>
                          <Badge variant="default" className="bg-green-500">
                            {regulation.status}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          {regulation.fullName}
                        </h4>
                        <div className="flex items-center gap-1 mb-3">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{regulation.region}</span>
                        </div>
                      </div>
                    </div>
                    <CardDescription>{regulation.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h5 className="font-semibold mb-3">Key Compliance Features</h5>
                    <ul className="space-y-2">
                      {regulation.keyFeatures.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security Frameworks */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Security Frameworks & Certifications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {frameworks.map((framework, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <FileCheck className="h-8 w-8 text-primary" />
                      <Badge 
                        variant={framework.status === 'Certified' ? 'default' : framework.status === 'In Progress' ? 'secondary' : 'outline'}
                      >
                        {framework.status}
                      </Badge>
                    </div>
                    
                    <h4 className="text-lg font-semibold mb-2">{framework.name}</h4>
                    <p className="text-sm text-muted-foreground mb-1">{framework.category}</p>
                    <p className="text-sm text-muted-foreground mb-4">{framework.description}</p>
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      {framework.auditDate && (
                        <div>Last Audit: {framework.auditDate}</div>
                      )}
                      <div>Next Review: {framework.nextAudit}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Data Handling Practices */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Data Handling Practices</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {dataHandling.map((category, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {category.practices.map((practice, practiceIndex) => (
                        <li key={practiceIndex} className="flex items-start gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Business Associate Agreement */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <Building className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Business Associate Agreements</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                For enterprise customers and healthcare organizations, we provide comprehensive Business Associate Agreements (BAAs) and Data Processing Agreements (DPAs).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Data Processing Agreement (DPA)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Our standard DPA covers GDPR, CCPA, and other privacy regulations for all customer data processing activities.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Standard Contractual Clauses included
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      International data transfer protections
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Sub-processor transparency
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">
                    Request DPA
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Business Associate Agreement (BAA)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    HIPAA-compliant BAA for healthcare organizations and covered entities handling protected health information.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      HIPAA compliance guarantees
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      PHI safeguarding measures
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Breach notification procedures
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">
                    Request BAA
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Questions About Compliance?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our compliance team is here to help you understand how ReAlign meets your organization's regulatory requirements.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">Contact Compliance Team</Button>
              <Button variant="outline" size="lg">
                Schedule Compliance Review
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};