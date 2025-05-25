import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  CheckCircle, 
  Wrench,
  Calculator, 
  FileText, 
  Brain, 
  Download,
  FormInput,
  Star,
  Play,
  Shield,
  Award,
  Zap,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';

export const MakerLandingPage: React.FC = () => {
  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Smart Form Generation',
      description: 'Create professional loss mitigation forms with AI-powered field population and intelligent validation.',
      benefits: ['IRS 4506-C forms', 'Borrower financial statements', 'Hardship letters', 'Custom templates']
    },
    {
      icon: <Calculator className="h-8 w-8" />,
      title: 'Financial Calculators',
      description: 'Accurate DTI ratios, insolvency calculations, and net proceeds analysis with real-time validation.',
      benefits: ['DTI ratio calculator', 'Insolvency analysis', 'Net proceeds calculator', 'Qualification tools']
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Document Drafting',
      description: 'AI-assisted document creation with professional templates and compliance checking.',
      benefits: ['Template library', 'AI assistance', 'Compliance checking', 'Version control']
    },
    {
      icon: <Download className="h-8 w-8" />,
      title: 'Package Assembly',
      description: 'Automatically organize and package documents for lender submission with validation checks.',
      benefits: ['Auto organization', 'Package validation', 'Submission ready', 'Quality checks']
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: 'AI-Powered Assistance',
      description: 'Get intelligent suggestions, error detection, and guidance throughout the document creation process.',
      benefits: ['Smart suggestions', 'Error detection', 'Process guidance', 'Best practices']
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure Document Vault',
      description: 'Encrypted storage for all generated documents with version history and secure sharing.',
      benefits: ['Encrypted storage', 'Version history', 'Secure sharing', 'Access controls']
    }
  ];

  const stats = [
    { value: '50,000+', label: 'Documents Created' },
    { value: '95%', label: 'Accuracy Rate' },
    { value: '10x', label: 'Faster Creation' },
    { value: '100%', label: 'Compliance Rate' }
  ];

  const testimonials = [
    {
      quote: "ReAlign Maker has revolutionized our document preparation. What used to take hours now takes minutes, with perfect accuracy every time.",
      author: "Michael Rodriguez",
      role: "Loss Mitigation Specialist",
      company: "Mortgage Solutions Inc."
    },
    {
      quote: "The AI assistance is incredible. It catches errors I would have missed and suggests improvements that make our packages stronger.",
      author: "Amanda Foster",
      role: "Short Sale Negotiator",
      company: "Elite Real Estate Services"
    },
    {
      quote: "Our approval rates have increased 40% since using ReAlign Maker. The quality and completeness of our submissions is unmatched.",
      author: "Robert Kim",
      role: "Senior Processor",
      company: "Premier Mortgage Group"
    }
  ];

  const useCases = [
    {
      title: 'Short Sale Packages',
      description: 'Complete documentation packages for short sale submissions',
      icon: <FileText className="h-6 w-6" />,
      features: ['Hardship documentation', 'Financial statements', 'Property valuations', 'Lender communications']
    },
    {
      title: 'Loan Modification Docs',
      description: 'Comprehensive loan modification application packages',
      icon: <Calculator className="h-6 w-6" />,
      features: ['Income documentation', 'Expense calculations', 'Modification proposals', 'Supporting evidence']
    },
    {
      title: 'Compliance Forms',
      description: 'Regulatory compliant forms and disclosures',
      icon: <Shield className="h-6 w-6" />,
      features: ['CFPB compliant forms', 'State disclosures', 'Lender requirements', 'Audit trails']
    }
  ];

  const pricing = [
    {
      name: 'Basic',
      price: '$79',
      period: '/month',
      description: 'Essential tools for individual professionals',
      features: [
        '50 documents per month',
        'Basic form templates',
        'DTI calculator',
        'Standard support',
        'Document vault'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: '$149',
      period: '/month',
      description: 'Advanced features for busy professionals',
      features: [
        '200 documents per month',
        'All form templates',
        'Advanced calculators',
        'AI assistance',
        'Package assembly',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Unlimited power for large organizations',
      features: [
        'Unlimited documents',
        'Custom templates',
        'Advanced integrations',
        'White-label options',
        'Dedicated support',
        'Custom training'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container max-w-screen-2xl px-4 md:px-6 relative">
          <div className="flex flex-col items-center text-center space-y-8">
            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-green-200">
              <Wrench className="h-3 w-3 mr-1" />
              ReAlign Maker
            </Badge>
            <div className="space-y-6 max-w-5xl">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl bg-gradient-to-r from-green-900 via-green-700 to-green-900 bg-clip-text text-transparent">
                Create Perfect{' '}
                <span className="text-green-600">Documents</span>{' '}
                Every Time
              </h1>
              <p className="text-xl text-slate-600 sm:text-2xl max-w-3xl mx-auto leading-relaxed">
                AI-powered document creation tools that generate professional, compliant forms and packages in minutes, not hours.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                  Start Creating Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-slate-300 hover:bg-slate-50">
                  <Play className="mr-2 h-5 w-5" />
                  See It In Action
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center space-x-6 pt-8 text-sm text-slate-500">
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                AI-Powered
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-1" />
                100% Compliant
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                10x Faster
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{stat.value}</div>
                <div className="text-slate-600 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 bg-slate-50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-20">
            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm">
              Powerful Tools
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Everything You Need to Create Professional Documents
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              From simple forms to complex financial packages, our AI-powered tools ensure accuracy and compliance every time.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg w-fit mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-slate-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Built for Every Use Case
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Whether you're handling short sales, loan modifications, or compliance documentation, we have you covered.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      {useCase.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{useCase.title}</h3>
                  </div>
                  <p className="text-slate-600 mb-6">{useCase.description}</p>
                  <ul className="space-y-2">
                    {useCase.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-slate-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 lg:py-32 bg-slate-50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Trusted by Document Professionals
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              See how professionals are transforming their document creation process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-slate-700 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="border-t pt-4">
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-slate-600 text-sm">{testimonial.role}</div>
                    <div className="text-slate-500 text-sm">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm">
              Transparent Pricing
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Plans That Scale With You
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Start free and upgrade as your document needs grow. All plans include our core features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-green-500 border-2 shadow-xl' : 'border-0'} bg-white`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600">{plan.period}</span>
                  </div>
                  <CardDescription className="text-center">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full ${plan.popular ? 'bg-green-600 hover:bg-green-700' : ''}`} size="lg">
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="container max-w-screen-2xl px-4 md:px-6 relative">
          <div className="text-center space-y-8">
            <div className="space-y-4 max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Start Creating Perfect Documents Today
              </h2>
              <p className="text-xl text-green-100 max-w-2xl mx-auto leading-relaxed">
                Join thousands of professionals who trust ReAlign Maker for accurate, compliant document creation.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 px-8 py-4 text-lg shadow-xl">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg">
                  Schedule Demo
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-8 text-green-100">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                14-Day Free Trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Instant Access
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};