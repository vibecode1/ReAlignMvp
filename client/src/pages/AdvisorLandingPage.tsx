import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  CheckCircle, 
  GraduationCap,
  Brain, 
  BookOpen, 
  MessageSquare, 
  Users,
  HelpCircle,
  Award,
  Star,
  Play,
  Shield,
  Lightbulb,
  Phone,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';

export const AdvisorLandingPage: React.FC = () => {
  const features = [
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'Eligibility Screening',
      description: 'Interactive questionnaires that help clients understand their loss mitigation options and next steps.',
      benefits: ['Am I Eligible? tool', 'Qualification assessment', 'Option recommendations', 'Next step guidance']
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: 'Educational Content',
      description: 'Comprehensive training modules and courses for professionals and educational content for clients.',
      benefits: ['CE credit courses', 'Process guides', 'Best practices', 'Industry updates']
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: '24/7 AI Knowledge Bot',
      description: 'Intelligent assistant that provides instant answers to complex loss mitigation questions.',
      benefits: ['24/7 availability', 'Comprehensive knowledge', 'Instant responses', 'Context awareness']
    },
    {
      icon: <HelpCircle className="h-8 w-8" />,
      title: 'Searchable FAQ Database',
      description: 'Extensive knowledge base with searchable answers to common loss mitigation questions.',
      benefits: ['Searchable database', 'Expert answers', 'Regular updates', 'Category organization']
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Expert Consultation',
      description: 'Direct access to loss mitigation specialists for complex cases and specialized guidance.',
      benefits: ['Expert access', 'Complex case support', 'Specialized guidance', 'Professional network']
    },
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: 'Process Explainers',
      description: 'Visual guides and step-by-step explanations for short sale and loan modification processes.',
      benefits: ['Visual guides', 'Step-by-step process', 'Client education', 'Process clarity']
    }
  ];

  const stats = [
    { value: '25,000+', label: 'Professionals Trained' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'AI Assistance' },
    { value: '500+', label: 'Expert Resources' }
  ];

  const testimonials = [
    {
      quote: "ReAlign Advisor has transformed how I educate my clients. The AI assistant answers questions I don't even think to ask, and the training content keeps me ahead of industry changes.",
      author: "Patricia Williams",
      role: "Certified Housing Counselor",
      company: "Community Housing Solutions"
    },
    {
      quote: "The eligibility screener is a game-changer for client consultations. It helps me quickly assess options and provide clear guidance from the very first meeting.",
      author: "James Thompson",
      role: "Loss Mitigation Consultant",
      company: "Residential Recovery Services"
    },
    {
      quote: "Having 24/7 access to expert knowledge through the AI assistant has made me more confident in handling complex cases. It's like having a senior consultant available anytime.",
      author: "Maria Gonzalez",
      role: "Real Estate Agent",
      company: "Premier Properties Group"
    }
  ];

  const learningPaths = [
    {
      title: 'Short Sale Mastery',
      description: 'Complete certification program for short sale professionals',
      icon: <Award className="h-6 w-6" />,
      modules: ['Process fundamentals', 'Lender negotiations', 'Documentation requirements', 'Client communication'],
      duration: '12 hours',
      ceCredits: '12 CE Credits'
    },
    {
      title: 'Loan Modification Expert',
      description: 'Advanced training for loan modification specialists',
      icon: <BookOpen className="h-6 w-6" />,
      modules: ['Modification programs', 'Financial analysis', 'Application process', 'Approval strategies'],
      duration: '8 hours',
      ceCredits: '8 CE Credits'
    },
    {
      title: 'Client Communication Excellence',
      description: 'Master the art of guiding distressed homeowners',
      icon: <MessageSquare className="h-6 w-6" />,
      modules: ['Empathy training', 'Difficult conversations', 'Expectation management', 'Solution presentation'],
      duration: '6 hours',
      ceCredits: '6 CE Credits'
    }
  ];

  const pricing = [
    {
      name: 'Individual',
      price: '$59',
      period: '/month',
      description: 'Perfect for individual professionals',
      features: [
        'Full course library',
        'AI knowledge assistant',
        'Eligibility screening tools',
        'Basic support',
        'Certificate tracking'
      ],
      cta: 'Start Learning',
      popular: false
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'For active loss mitigation professionals',
      features: [
        'All Individual features',
        'Expert consultation access',
        'Advanced AI features',
        'Custom client tools',
        'Priority support',
        'CE credit tracking'
      ],
      cta: 'Start Learning',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For teams and organizations',
      features: [
        'All Professional features',
        'Team management',
        'Custom content creation',
        'White-label options',
        'Dedicated support',
        'Custom integrations'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container max-w-screen-2xl px-4 md:px-6 relative">
          <div className="flex flex-col items-center text-center space-y-8">
            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm border-purple-200">
              <GraduationCap className="h-3 w-3 mr-1" />
              ReAlign Advisor
            </Badge>
            <div className="space-y-6 max-w-5xl">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl bg-gradient-to-r from-purple-900 via-purple-700 to-purple-900 bg-clip-text text-transparent">
                Master Loss{' '}
                <span className="text-purple-600">Mitigation</span>{' '}
                Excellence
              </h1>
              <p className="text-xl text-slate-600 sm:text-2xl max-w-3xl mx-auto leading-relaxed">
                The complete education and guidance platform for loss mitigation professionals, featuring AI-powered assistance, expert training, and client education tools.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                  Start Learning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-slate-300 hover:bg-slate-50">
                  <Play className="mr-2 h-5 w-5" />
                  Explore Features
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center space-x-6 pt-8 text-sm text-slate-500">
              <div className="flex items-center">
                <Brain className="h-4 w-4 mr-1" />
                AI-Powered Learning
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-1" />
                CE Credits Available
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                24/7 Support
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
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">{stat.value}</div>
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
              Expert Guidance Tools
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Everything You Need to Guide Clients Successfully
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              From professional education to client screening tools, we provide comprehensive resources for loss mitigation success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg w-fit mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
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

      {/* Learning Paths Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Professional Learning Paths
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Structured courses designed to advance your expertise and earn continuing education credits.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {learningPaths.map((path, index) => (
              <Card key={index} className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      {path.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{path.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>{path.duration}</span>
                        <span>•</span>
                        <span>{path.ceCredits}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6">{path.description}</p>
                  <ul className="space-y-2 mb-6">
                    {path.modules.map((module, moduleIndex) => (
                      <li key={moduleIndex} className="flex items-center text-slate-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        {module}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant="outline">
                    Start Learning Path
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Highlight */}
      <section className="py-24 lg:py-32 bg-gradient-to-r from-purple-100 to-indigo-100">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-white/50">
                  <Brain className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Your 24/7 Expert Assistant
                </h2>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Get instant answers to complex loss mitigation questions from our comprehensive AI knowledge base, trained on thousands of successful cases and industry best practices.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Zap className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Instant Expertise</h3>
                    <p className="text-slate-600">Access years of expert knowledge in seconds</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Always Available</h3>
                    <p className="text-slate-600">24/7 support for urgent client questions</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Continuously Learning</h3>
                    <p className="text-slate-600">Updated with latest industry changes and regulations</p>
                  </div>
                </div>
              </div>
              
              <Link href="/register">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  Try AI Assistant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <Card className="bg-white shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Brain className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-semibold">AI Assistant</span>
                      <Badge variant="secondary" className="text-xs">Online</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-slate-100 p-3 rounded-lg">
                        <p className="text-sm">"What DTI ratio qualifies for a loan modification?"</p>
                      </div>
                      
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-sm">Most lenders look for a DTI ratio above 31% for loan modification consideration. However, this varies by program...</p>
                        <div className="mt-2 flex space-x-2">
                          <Button size="sm" variant="outline" className="text-xs">More Details</Button>
                          <Button size="sm" variant="outline" className="text-xs">Related Topics</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="container max-w-screen-2xl px-4 md:px-6">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Trusted by Education Leaders
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              See how professionals are advancing their expertise with ReAlign Advisor
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
              Flexible Pricing
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Invest in Your Expertise
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the plan that fits your learning goals and professional development needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-purple-500 border-2 shadow-xl' : 'border-0'} bg-white`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white">Most Popular</Badge>
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
                  <Button className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : ''}`} size="lg">
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
      <section className="py-24 lg:py-32 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="container max-w-screen-2xl px-4 md:px-6 relative">
          <div className="text-center space-y-8">
            <div className="space-y-4 max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Advance Your Expertise Today
              </h2>
              <p className="text-xl text-purple-100 max-w-2xl mx-auto leading-relaxed">
                Join thousands of professionals who trust ReAlign Advisor for their continuing education and client guidance needs.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg shadow-xl">
                  Start Learning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg">
                  Schedule Demo
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-8 text-purple-100">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                7-Day Free Trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                CE Credits Included
              </div>
              <div className="flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                AI Assistant Access
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};