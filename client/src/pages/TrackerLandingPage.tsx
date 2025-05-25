import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  CheckCircle, 
  Target,
  Users, 
  FileText, 
  Clock, 
  MessageSquare,
  TrendingUp,
  Star,
  Play,
  Shield,
  Award,
  Bell,
  Calendar,
  Eye,
  Zap
} from 'lucide-react';

export const TrackerLandingPage: React.FC = () => {
  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Real-Time Progress Tracking',
      description: 'Monitor every stage of your short sale transactions with visual progress indicators and milestone tracking.',
      benefits: ['Visual phase indicators', 'Milestone notifications', 'Progress reports', 'Timeline view']
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Multi-Party Coordination',
      description: 'Seamlessly manage all stakeholders including buyers, sellers, agents, lenders, and attorneys in one platform.',
      benefits: ['Party role management', 'Contact organization', 'Communication history', 'Access controls']
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Document Management',
      description: 'Centralized document storage with version control, status tracking, and automated organization.',
      benefits: ['Document versioning', 'Status tracking', 'Automated filing', 'Secure sharing']
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'Intelligent Communications',
      description: 'Automated notifications, message threading, and communication logs keep everyone informed.',
      benefits: ['Auto notifications', 'Message threads', 'Communication logs', 'Email integration']
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: 'Weekly Progress Digests',
      description: 'Automated weekly summaries delivered to all parties with transaction status and next steps.',
      benefits: ['Weekly summaries', 'Status updates', 'Next step alerts', 'Party-specific views']
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: 'Public Tracker Views',
      description: 'Share transaction progress with clients and parties through secure, read-only public links.',
      benefits: ['Public sharing', 'Read-only access', 'Client transparency', 'Secure links']
    }
  ];

  const stats = [
    { value: '15,000+', label: 'Transactions Tracked' },
    { value: '85%', label: 'Time Savings' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9★', label: 'User Rating' }
  ];

  const testimonials = [
    {
      quote: "ReAlign Tracker has completely transformed how we manage short sales. The visibility and coordination features are game-changing.",
      author: "Jennifer Martinez",
      role: "Senior Short Sale Negotiator",
      company: "Premier Real Estate Group"
    },
    {
      quote: "Our clients love the transparency. They can see exactly where their transaction stands at any time.",
      author: "David Chen",
      role: "Real Estate Agent",
      company: "Century 21 Excellence"
    },
    {
      quote: "The weekly digests alone save me hours of client communication. Everything is automated and professional.",
      author: "Sarah Thompson",
      role: "Loss Mitigation Specialist",
      company: "Residential Solutions LLC"
    }
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '$49',
      period: '/month',
      description: 'Perfect for individual agents and small teams',
      features: [
        'Up to 25 active transactions',
        'Basic progress tracking',
        'Document management',
        'Email notifications',
        'Standard support'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'For growing teams and negotiators',
      features: [
        'Up to 100 active transactions',
        'Advanced progress tracking',
        'Multi-party coordination',
        'Weekly digests',
        'Public tracker views',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations and brokerages',
      features: [
        'Unlimited transactions',
        'White-label options',
        'Custom integrations',
        'Advanced analytics',
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
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container max-w-screen-2xl px-4 md:px-6 relative">
          <div className="flex flex-col items-center text-center space-y-8">
            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-blue-200">
              <Target className="h-3 w-3 mr-1" />
              ReAlign Tracker
            </Badge>
            <div className="space-y-6 max-w-5xl">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 bg-clip-text text-transparent">
                Master Your{' '}
                <span className="text-blue-600">Transaction Flow</span>
              </h1>
              <p className="text-xl text-slate-600 sm:text-2xl max-w-3xl mx-auto leading-relaxed">
                The most comprehensive platform for tracking short sale transactions with real-time progress monitoring, multi-party coordination, and intelligent automation.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-slate-300 hover:bg-slate-50">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center space-x-6 pt-8 text-sm text-slate-500">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Bank-Grade Security
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-1" />
                Industry Leading
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
                4.9/5 Rating
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
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
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
              Core Features
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Everything You Need to Track Success
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive tools designed specifically for short sale transaction management and coordination.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg w-fit mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
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

      {/* Testimonials Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              See how professionals are transforming their transaction management
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
      <section className="py-24 lg:py-32 bg-slate-50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm">
              Simple Pricing
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Start free and scale as your business grows. No hidden fees, cancel anytime.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 border-2 shadow-xl' : 'border-0'} bg-white`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
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
                  <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`} size="lg">
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
      <section className="py-24 lg:py-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="container max-w-screen-2xl px-4 md:px-6 relative">
          <div className="text-center space-y-8">
            <div className="space-y-4 max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Ready to Transform Your Transaction Management?
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Join thousands of professionals who trust ReAlign Tracker for their short sale success.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg shadow-xl">
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
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-8 text-blue-100">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                30-Day Free Trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Setup in Minutes
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};