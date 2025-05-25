import React from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock, 
  Eye, 
  FileCheck, 
  Server,
  Globe,
  CheckCircle,
  AlertTriangle,
  Download,
  ExternalLink
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const securityFeatures = [
    {
      icon: <Lock className="h-8 w-8" />,
      title: 'End-to-End Encryption',
      description: 'All data is encrypted in transit and at rest using AES-256 encryption',
      details: 'TLS 1.3 for data in transit, AES-256 for data at rest'
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: 'Role-Based Access Control',
      description: 'Granular permissions ensure users only see what they need to see',
      details: 'Document-level privacy controls for sensitive information'
    },
    {
      icon: <FileCheck className="h-8 w-8" />,
      title: 'Audit Logging',
      description: 'Complete audit trail of all actions and document access',
      details: 'Immutable logs with timestamp and user attribution'
    },
    {
      icon: <Server className="h-8 w-8" />,
      title: 'Infrastructure Security',
      description: 'Enterprise-grade cloud infrastructure with 99.9% uptime',
      details: 'SOC 2 Type II compliant hosting with redundant backups'
    }
  ];

  const certifications = [
    {
      name: 'SOC 2 Type II',
      description: 'Security, availability, and confidentiality controls',
      status: 'Certified',
      validUntil: '2025-12-31'
    },
    {
      name: 'GDPR Compliant',
      description: 'European data protection regulation compliance',
      status: 'Compliant',
      validUntil: 'Ongoing'
    },
    {
      name: 'CCPA Compliant',
      description: 'California Consumer Privacy Act compliance',
      status: 'Compliant',
      validUntil: 'Ongoing'
    },
    {
      name: 'PIPEDA Compliant',
      description: 'Personal Information Protection and Electronic Documents Act',
      status: 'Compliant',
      validUntil: 'Ongoing'
    }
  ];

  const securityPractices = [
    {
      category: 'Data Protection',
      practices: [
        'Data encrypted at rest using AES-256',
        'All communications use TLS 1.3',
        'Regular penetration testing by third-party security firms',
        'Zero-trust network architecture',
        'Data residency controls for international compliance'
      ]
    },
    {
      category: 'Access Management',
      practices: [
        'Multi-factor authentication (MFA) required',
        'Single sign-on (SSO) integration available',
        'Role-based access control (RBAC)',
        'Session management with automatic timeout',
        'API rate limiting and monitoring'
      ]
    },
    {
      category: 'Monitoring & Response',
      practices: [
        '24/7 security monitoring and alerting',
        'Automated threat detection and response',
        'Incident response team on standby',
        'Regular security training for all employees',
        'Bug bounty program for responsible disclosure'
      ]
    },
    {
      category: 'Business Continuity',
      practices: [
        'Automated daily backups with 30-day retention',
        'Disaster recovery plan tested quarterly',
        'Geographically distributed infrastructure',
        'Real-time data replication',
        'Recovery time objective (RTO) of 4 hours'
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
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Security & Privacy
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your data security is our top priority. Learn how we protect your sensitive transaction information with enterprise-grade security measures.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">
                <Download className="h-4 w-4" />
                Security Whitepaper
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Certifications
              </Button>
            </div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Enterprise-Grade Security</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {securityFeatures.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <div className="text-primary">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{feature.description}</p>
                    <p className="text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded">
                      {feature.details}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Compliance & Certifications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {certifications.map((cert, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                      <Badge variant="outline" className="text-xs">
                        {cert.status}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-2">{cert.name}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{cert.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Valid until: {cert.validUntil}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security Practices */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Security Practices</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {securityPractices.map((category, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{category.category}</CardTitle>
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

        {/* Security Incident Response */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Security Incident Response</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                If you discover a security vulnerability, please report it responsibly through our security disclosure process.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Report a Security Issue</CardTitle>
                <CardDescription>
                  We take security seriously and appreciate responsible disclosure of vulnerabilities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Email our security team</h4>
                    <p className="text-sm text-muted-foreground">
                      Send details to security@realign.com with a clear description
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">We investigate promptly</h4>
                    <p className="text-sm text-muted-foreground">
                      Our security team will acknowledge and investigate within 24 hours
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Resolution and recognition</h4>
                    <p className="text-sm text-muted-foreground">
                      We fix the issue and may offer recognition in our security hall of fame
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Trust Center */}
        <section className="py-16">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Trust Center</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Access detailed security documentation, compliance reports, and trust metrics in our comprehensive trust center.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <FileCheck className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">Audit Reports</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download our latest SOC 2 Type II report
                  </p>
                  <Button variant="outline" size="sm">
                    Download Report
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">Security Updates</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Stay informed about our latest security measures
                  </p>
                  <Button variant="outline" size="sm">
                    Subscribe
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Server className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">Status Page</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Real-time system status and uptime metrics
                  </p>
                  <Button variant="outline" size="sm">
                    View Status
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};