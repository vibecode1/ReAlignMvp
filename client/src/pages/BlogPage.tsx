import React, { useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar, 
  User, 
  ArrowRight, 
  TrendingUp,
  FileText,
  Users,
  Lightbulb,
  Clock,
  Eye,
  Tag
} from 'lucide-react';
import { useLocation } from 'wouter';

export const BlogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [, setLocation] = useLocation();

  const featuredPost = {
    title: 'The Future of Short Sale Coordination: AI and Automation in Real Estate',
    excerpt: 'Explore how artificial intelligence and automation are transforming the short sale process, making it faster and more efficient for all parties involved.',
    author: 'Sarah Chen',
    authorRole: 'Head of Product',
    date: '2025-01-20',
    readTime: '8 min read',
    category: 'Technology',
    image: 'bg-gradient-to-r from-blue-500 to-purple-600',
    views: '2.3k'
  };

  const blogPosts = [
    {
      title: 'Best Practices for Managing Complex Short Sale Transactions',
      excerpt: 'Learn proven strategies for coordinating multiple parties, managing documentation, and keeping transactions on track through challenging negotiations.',
      author: 'Michael Rodriguez',
      authorRole: 'Senior Real Estate Consultant',
      date: '2025-01-18',
      readTime: '12 min read',
      category: 'Best Practices',
      views: '1.8k',
      popular: true
    },
    {
      title: 'Understanding New CFPB Guidelines for Short Sale Communications',
      excerpt: 'Breaking down the latest Consumer Financial Protection Bureau guidelines and how they impact short sale coordination and communication protocols.',
      author: 'Jennifer Park',
      authorRole: 'Compliance Officer',
      date: '2025-01-15',
      readTime: '6 min read',
      category: 'Compliance',
      views: '1.2k',
      popular: false
    },
    {
      title: 'Case Study: How ReAlign Reduced Transaction Time by 40%',
      excerpt: 'Real-world example of a complex multi-property short sale that was streamlined using ReAlign\'s coordination platform and communication tools.',
      author: 'David Kim',
      authorRole: 'Customer Success Manager',
      date: '2025-01-12',
      readTime: '10 min read',
      category: 'Case Studies',
      views: '2.1k',
      popular: true
    },
    {
      title: 'The Psychology of Short Sale Negotiations: Communication Strategies',
      excerpt: 'Understanding the emotional aspects of short sales and how effective communication can help all parties navigate this challenging process.',
      author: 'Dr. Lisa Thompson',
      authorRole: 'Industry Consultant',
      date: '2025-01-10',
      readTime: '7 min read',
      category: 'Industry Insights',
      views: '1.5k',
      popular: false
    },
    {
      title: 'Technology Trends Shaping Real Estate Coordination in 2025',
      excerpt: 'From AI-powered document analysis to blockchain-based transaction records, explore the technologies transforming real estate coordination.',
      author: 'Alex Rivera',
      authorRole: 'CTO',
      date: '2025-01-08',
      readTime: '9 min read',
      category: 'Technology',
      views: '1.9k',
      popular: true
    },
    {
      title: 'Building Trust with First-Time Short Sale Clients',
      excerpt: 'Practical advice for real estate professionals on how to guide nervous homeowners through their first short sale experience.',
      author: 'Maria Gonzalez',
      authorRole: 'Senior Negotiator',
      date: '2025-01-05',
      readTime: '8 min read',
      category: 'Client Relations',
      views: '1.3k',
      popular: false
    }
  ];

  const categories = [
    { name: 'all', label: 'All Posts', count: blogPosts.length + 1 },
    { name: 'Technology', label: 'Technology', count: 2 },
    { name: 'Best Practices', label: 'Best Practices', count: 1 },
    { name: 'Industry Insights', label: 'Industry Insights', count: 1 },
    { name: 'Case Studies', label: 'Case Studies', count: 1 },
    { name: 'Compliance', label: 'Compliance', count: 1 },
    { name: 'Client Relations', label: 'Client Relations', count: 1 }
  ];

  const popularTags = [
    'Short Sales', 'Real Estate Tech', 'Negotiation', 'Compliance', 'Best Practices', 
    'Customer Success', 'Industry Trends', 'Communication', 'Documentation'
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              ReAlign Blog
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Insights, best practices, and industry trends from real estate coordination experts. Stay ahead of the curve in short sale management.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Featured Article</h2>
            
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden" onClick={() => setLocation('/blog/future-of-short-sale-coordination')}>
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className={`${featuredPost.image} h-64 lg:h-auto relative`}>
                  <Badge className="absolute top-4 left-4 bg-white/20 text-white border-white/30">
                    Featured
                  </Badge>
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="secondary" className="text-xs">
                      {featuredPost.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{featuredPost.author}</div>
                        <div className="text-xs text-muted-foreground">{featuredPost.authorRole}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(featuredPost.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {featuredPost.readTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {featuredPost.views}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </section>

        {/* Blog Categories & Filter */}
        <section className="py-8 border-t border-b bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                  className="gap-1"
                >
                  {category.label}
                  <Badge variant="secondary" className="text-xs ml-1">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="space-y-8">
                  {filteredPosts.map((post, index) => (
                    <Card key={index} className="group cursor-pointer hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {post.category}
                            </Badge>
                            {post.popular && (
                              <Badge className="text-xs bg-orange-500">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {post.views}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground mb-6">{post.excerpt}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{post.author}</div>
                              <div className="text-xs text-muted-foreground">{post.authorRole}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readTime}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredPosts.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or browse different categories.
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="space-y-8 sticky top-8">
                  {/* Newsletter Signup */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Stay Updated</CardTitle>
                      <CardDescription>
                        Get the latest insights delivered to your inbox
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input placeholder="Enter your email" />
                      <Button className="w-full">Subscribe</Button>
                      <p className="text-xs text-muted-foreground">
                        Weekly digest of new articles and industry insights
                      </p>
                    </CardContent>
                  </Card>

                  {/* Popular Tags */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Popular Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Links */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <a href="/guides" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                        <FileText className="h-4 w-4" />
                        Complete Guide Library
                      </a>
                      <a href="/help" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                        <Lightbulb className="h-4 w-4" />
                        Help Center
                      </a>
                      <a href="/contact" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                        <Users className="h-4 w-4" />
                        Contact Experts
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Share Your Expertise</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Are you a real estate professional with insights to share? We're always looking for guest contributors to share their expertise with our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">Submit Article Idea</Button>
              <Button variant="outline" size="lg">
                View Writer Guidelines
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};