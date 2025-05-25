import React, { useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Heart,
  Zap,
  Coffee,
  Laptop,
  Globe,
  ArrowRight,
  Star,
  DollarSign
} from 'lucide-react';

export const CareersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const openPositions = [
    {
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA / Remote',
      type: 'Full-time',
      experience: 'Senior',
      description: 'Build scalable features for our short sale coordination platform using React, Node.js, and PostgreSQL.',
      requirements: ['5+ years full-stack development', 'React & TypeScript expertise', 'Real estate technology experience preferred'],
      posted: '2 days ago'
    },
    {
      title: 'Product Designer (UX/UI)',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      experience: 'Mid-level',
      description: 'Design intuitive interfaces that simplify complex real estate transactions for negotiators and their clients.',
      requirements: ['3+ years product design', 'Figma proficiency', 'B2B SaaS experience'],
      posted: '1 week ago'
    },
    {
      title: 'Real Estate Industry Specialist',
      department: 'Product',
      location: 'Los Angeles, CA / Remote',
      type: 'Full-time',
      experience: 'Senior',
      description: 'Lead product strategy for short sale workflows, leveraging deep real estate industry knowledge.',
      requirements: ['7+ years real estate experience', 'Short sale expertise', 'Product management background'],
      posted: '3 days ago'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote',
      type: 'Full-time',
      experience: 'Mid-level',
      description: 'Help real estate professionals maximize value from ReAlign through onboarding, training, and ongoing support.',
      requirements: ['3+ years customer success', 'Real estate background preferred', 'Excellent communication skills'],
      posted: '5 days ago'
    },
    {
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      experience: 'Senior',
      description: 'Scale our infrastructure to support thousands of real estate transactions with enterprise-grade reliability.',
      requirements: ['4+ years DevOps experience', 'AWS/Docker expertise', 'Security-first mindset'],
      posted: '1 week ago'
    },
    {
      title: 'Marketing Manager - Content',
      department: 'Marketing',
      location: 'Austin, TX / Remote',
      type: 'Full-time',
      experience: 'Mid-level',
      description: 'Create compelling content that educates real estate professionals about short sale best practices.',
      requirements: ['4+ years content marketing', 'Real estate knowledge', 'B2B SaaS experience'],
      posted: '4 days ago'
    }
  ];

  const benefits = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Health & Wellness',
      description: 'Comprehensive health, dental, and vision insurance',
      details: ['100% premium coverage for employees', 'Mental health support', 'Annual wellness stipend']
    },
    {
      icon: <Laptop className="h-6 w-6" />,
      title: 'Remote-First Culture',
      description: 'Work from anywhere with flexible schedules',
      details: ['Home office setup allowance', 'Flexible working hours', 'Co-working space stipend']
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Professional Growth',
      description: 'Continuous learning and development opportunities',
      details: ['Annual learning budget', 'Conference attendance', 'Internal mentorship program']
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: 'Competitive Compensation',
      description: 'Fair pay with equity participation',
      details: ['Market-competitive salaries', 'Equity options for all employees', 'Annual performance bonuses']
    },
    {
      icon: <Coffee className="h-6 w-6" />,
      title: 'Work-Life Balance',
      description: 'Time off and family support',
      details: ['Unlimited PTO policy', 'Parental leave programs', 'Company retreats']
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Inclusive Culture',
      description: 'Diverse, supportive, and collaborative environment',
      details: ['Diversity & inclusion initiatives', 'Employee resource groups', 'Team building activities']
    }
  ];

  const departments = ['all', 'Engineering', 'Product', 'Design', 'Marketing', 'Customer Success'];

  const filteredPositions = openPositions.filter(position => {
    const matchesSearch = position.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         position.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || position.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Join the ReAlign Team
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Help us transform the real estate industry by building the future of short sale coordination. Work with passionate people solving real problems.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">View Open Positions</Button>
              <Button variant="outline" size="lg">
                Learn About Our Culture
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">4.9/5</div>
                <div className="text-sm text-muted-foreground">Employee Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">Remote</div>
                <div className="text-sm text-muted-foreground">First Culture</div>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
            
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search positions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Position Listings */}
            <div className="space-y-6">
              {filteredPositions.map((position, index) => (
                <Card key={index} className="group cursor-pointer hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                              {position.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <Badge variant="outline">{position.department}</Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {position.location}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {position.type}
                              </div>
                              <Badge variant="secondary">{position.experience}</Badge>
                            </div>
                            <p className="text-muted-foreground mb-4">{position.description}</p>
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Key Requirements:</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {position.requirements.map((req, reqIndex) => (
                                  <li key={reqIndex} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:items-end gap-3">
                        <div className="text-sm text-muted-foreground">
                          Posted {position.posted}
                        </div>
                        <Button className="group-hover:bg-primary/90 transition-colors">
                          Apply Now
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPositions.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No positions found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or check back soon for new openings.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Benefits & Perks */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Join ReAlign?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <div className="text-primary">
                        {benefit.icon}
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold mb-3">{benefit.title}</h4>
                    <p className="text-muted-foreground text-sm mb-4">{benefit.description}</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {benefit.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center gap-2">
                          <Star className="h-3 w-3 text-primary flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Company Culture */}
        <section className="py-16">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Our Culture & Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're building more than just software – we're creating a culture where everyone can do their best work while making a real impact.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Obsession</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Every decision we make starts with understanding our customers' needs. We're not just building features – we're solving real problems for real estate professionals.
                  </p>
                  <ul className="text-sm space-y-2">
                    <li>• Direct customer feedback drives our roadmap</li>
                    <li>• Regular customer interviews and user research</li>
                    <li>• Success measured by customer outcomes</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Continuous Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    The real estate industry is evolving rapidly, and so are we. We invest in our team's growth and encourage experimentation and learning from failure.
                  </p>
                  <ul className="text-sm space-y-2">
                    <li>• Dedicated learning time and budget</li>
                    <li>• Internal knowledge sharing sessions</li>
                    <li>• Conference and workshop attendance</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transparency & Trust</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    We believe in open communication, shared decision-making, and building trust through transparency in everything we do.
                  </p>
                  <ul className="text-sm space-y-2">
                    <li>• Open-book company metrics and goals</li>
                    <li>• Regular all-hands meetings and updates</li>
                    <li>• Transparent career progression paths</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Impact-Driven Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    We're transforming an industry that affects millions of people. Every line of code, every design decision, and every customer interaction matters.
                  </p>
                  <ul className="text-sm space-y-2">
                    <li>• Clear connection between work and impact</li>
                    <li>• Autonomy to drive meaningful change</li>
                    <li>• Recognition for contributions at all levels</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Application Process */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Hiring Process</h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Application Review</h4>
                  <p className="text-muted-foreground text-sm">
                    We review your application and portfolio within 3-5 business days. We look for passion, potential, and alignment with our values.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Initial Interview</h4>
                  <p className="text-muted-foreground text-sm">
                    30-minute video call with our talent team to discuss your background, interests, and learn about ReAlign's mission and culture.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Technical/Role-Specific Assessment</h4>
                  <p className="text-muted-foreground text-sm">
                    Take-home project or technical interview tailored to the role. We respect your time and provide clear expectations and feedback.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Team Interviews</h4>
                  <p className="text-muted-foreground text-sm">
                    Meet with team members you'll work closely with. We want to ensure mutual fit and answer any questions about day-to-day work.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  5
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Final Decision & Offer</h4>
                  <p className="text-muted-foreground text-sm">
                    We make decisions quickly and provide transparent feedback. If we move forward, we'll discuss compensation and start date.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Don't see a perfect fit? We're always looking for exceptional people. Send us your resume and tell us how you'd like to contribute.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">Browse All Positions</Button>
              <Button variant="outline" size="lg">
                Send General Application
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};