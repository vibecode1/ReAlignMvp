import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  FileText, 
  Clock, 
  Target,
  Wrench,
  GraduationCap,
  Brain,
  Calculator,
  MessageSquare,
  Award,
  Shield,
  Zap,
  TrendingUp,
  Star,
  Play
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const coreModules = [
    {
      icon: <Target className="h-8 w-8" />,
      title: 'ReAlign Tracker',
      subtitle: 'Transaction Management',
      description: 'Complete oversight of your short sale transactions with real-time progress tracking, party management, and automated communications.',
      features: ['Progress tracking', 'Party coordination', 'Document status', 'Weekly digests'],
      color: 'from-blue-500 to-blue-600',
      href: '/solutions/tracker',
      badge: 'Core Platform'
    },
    {
      icon: <Wrench className="h-8 w-8" />,
      title: 'ReAlign Maker',
      subtitle: 'Document Creation',
      description: 'AI-powered tools for creating professional forms, calculating DTI ratios, and generating compliant documentation packages.',
      features: ['Form generators', 'DTI calculator', 'Document drafting', 'AI assistance'],
      color: 'from-green-500 to-green-600',
      href: '/solutions/maker',
      badge: 'NEW'
    },
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: 'ReAlign Advisor',
      subtitle: 'Guidance & Education',
      description: 'Educational resources, eligibility screening, and 24/7 AI assistance to guide clients through the loss mitigation process.',
      features: ['Eligibility screener', 'Training courses', 'AI chatbot', 'Best practices'],
      color: 'from-purple-500 to-purple-600',
      href: '/solutions/advisor',
      badge: 'NEW'
    }
  ];

  const stats = [
    { value: '90%', label: 'Faster Document Processing' },
    { value: '15K+', label: 'Transactions Managed' },
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: '50+', label: 'Integrated Lenders' }
  ];

  const testimonials = [
    {
      quote: "ReAlign has transformed how we handle short sales. The automation saves us 20+ hours per transaction.",
      author: "Sarah Johnson",
      role: "Short Sale Negotiator",
      company: "Premier Realty"
    },
    {
      quote: "The AI-powered document creation is incredible. Our accuracy improved dramatically.",
      author: "Mike Chen", 
      role: "Real Estate Agent",
      company: "Century 21"
    },
    {
      quote: "Finally, a platform that understands the complexity of loss mitigation. Game changer.",
      author: "Lisa Rodriguez",
      role: "Mortgage Broker",
      company: "First National"
    }
  ];

  const benefits = [
    'Reduce transaction time by 60%',
    'Eliminate document errors',
    'Automate client communications', 
    'Ensure compliance standards',
    'Scale your business 3x faster',
    'Improve client satisfaction'
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container max-w-screen-2xl px-4 md:px-6 relative">
          <div className="flex flex-col items-center text-center space-y-8">
            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              New: AI-Powered Document Creation
            </Badge>
            <div className="space-y-6 max-w-5xl">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
                The Complete{' '}
                <span className="text-blue-600">Loss Mitigation</span>{' '}
                Platform
              </h1>
              <p className="text-xl text-slate-600 sm:text-2xl max-w-3xl mx-auto leading-relaxed">
                Track transactions, create documents, and guide clients through short sales and loan modifications with AI-powered tools designed for professionals.
              </p>
            </div>
            
            {/* CTA Buttons */}
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
            
            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 pt-8 text-sm text-slate-500">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                SOC 2 Compliant
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-1" />
                CFPB Approved
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

      {/* Core Modules Section */}
      <section className="py-24 lg:py-32 bg-slate-50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-20">
            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm">
              Three Powerful Modules
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Complete Loss Mitigation Solution
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to manage transactions, create documents, and guide clients through the loss mitigation process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {coreModules.map((module, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${module.color}`} />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${module.color} text-white shadow-lg`}>
                      {module.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {module.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    {module.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-slate-700 leading-relaxed">
                    {module.description}
                  </p>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Key Features:</h4>
                    <ul className="space-y-2">
                      {module.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-slate-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Link href={module.href}>
                    <Button className="w-full group-hover:shadow-lg transition-all">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI-Powered Features Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50">
              <Brain className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Intelligent Automation
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Let AI handle the heavy lifting while you focus on what matters most - your clients.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
              <Calculator className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Calculations</h3>
              <p className="text-slate-600">Automatically calculate DTI ratios, net proceeds, and insolvency with AI-powered accuracy.</p>
            </div>
            
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
              <FileText className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Document Generation</h3>
              <p className="text-slate-600">Generate professional forms and documents with intelligent field population and validation.</p>
            </div>
            
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
              <MessageSquare className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">24/7 AI Assistant</h3>
              <p className="text-slate-600">Get instant answers to complex loss mitigation questions from our comprehensive knowledge base.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 lg:py-32 bg-slate-50">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Trusted by Professionals
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              See how ReAlign is transforming the loss mitigation industry
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

      {/* Benefits Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline">Proven Results</Badge>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Transform Your Business Today
                </h2>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Join thousands of professionals who have streamlined their processes and increased their success rates with ReAlign.
                </p>
              </div>
              
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-slate-700 text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    Schedule Demo
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-2xl text-white">
                    <TrendingUp className="h-8 w-8 mb-4" />
                    <div className="text-3xl font-bold mb-2">90%</div>
                    <div className="text-blue-100">Faster Processing</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-2xl text-white">
                    <Users className="h-8 w-8 mb-4" />
                    <div className="text-3xl font-bold mb-2">15K+</div>
                    <div className="text-green-100">Transactions</div>
                  </div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-2xl text-white">
                    <Shield className="h-8 w-8 mb-4" />
                    <div className="text-3xl font-bold mb-2">99.9%</div>
                    <div className="text-purple-100">Uptime</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-2xl text-white">
                    <Award className="h-8 w-8 mb-4" />
                    <div className="text-3xl font-bold mb-2">4.9★</div>
                    <div className="text-orange-100">Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="container max-w-screen-2xl px-4 md:px-6 relative">
          <div className="text-center space-y-8">
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
              Ready to Get Started?
            </Badge>
            <div className="space-y-4 max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Start Your Free Trial Today
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Join thousands of professionals transforming their loss mitigation process. No credit card required.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg shadow-xl">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-8 text-blue-100">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                No Setup Fees
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};