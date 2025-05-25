import React, { useState } from 'react';
import { Link } from 'wouter';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  FileText, 
  Users, 
  Settings, 
  MessageCircle, 
  BookOpen,
  Clock,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react';

export const HelpCenterPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Getting Started',
      description: 'Learn the basics of ReAlign and set up your first transaction',
      articles: 12,
      color: 'bg-blue-500',
      popular: true
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Transaction Management',
      description: 'Manage parties, documents, and communication effectively',
      articles: 18,
      color: 'bg-green-500',
      popular: true
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: 'Communication Tools',
      description: 'Master messaging, notifications, and party coordination',
      articles: 15,
      color: 'bg-purple-500',
      popular: false
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: 'Account & Settings',
      description: 'Configure your profile, notifications, and preferences',
      articles: 8,
      color: 'bg-orange-500',
      popular: false
    }
  ];

  const popularArticles = [
    {
      title: 'How to Create Your First Short Sale Transaction',
      category: 'Getting Started',
      readTime: '5 min read',
      views: '2.1k',
      rating: 4.9
    },
    {
      title: 'Adding Parties to a Transaction: Best Practices',
      category: 'Transaction Management',
      readTime: '7 min read',
      views: '1.8k',
      rating: 4.8
    },
    {
      title: 'Managing Document Requests and Submissions',
      category: 'Transaction Management',
      readTime: '6 min read',
      views: '1.5k',
      rating: 4.7
    },
    {
      title: 'Setting Up Email Notifications for All Parties',
      category: 'Communication Tools',
      readTime: '4 min read',
      views: '1.3k',
      rating: 4.6
    }
  ];

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get help from our expert team',
      action: 'Start Chat',
      icon: <MessageCircle className="h-5 w-5" />
    },
    {
      title: 'Schedule Demo',
      description: 'See ReAlign in action',
      action: 'Book Now',
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      title: 'Feature Request',
      description: 'Suggest improvements',
      action: 'Submit Idea',
      icon: <Star className="h-5 w-5" />
    }
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              How can we help you?
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Find answers, guides, and resources to master short sale coordination with ReAlign
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Browse by Category</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpCategories.map((category, index) => (
                <Card key={index} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${category.color} text-white`}>
                        {category.icon}
                      </div>
                      {category.popular && (
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {category.articles} articles
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Articles */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold">Popular Articles</h2>
              <Button variant="outline">View All Articles</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {popularArticles.map((article, index) => (
                <Card key={index} className="group cursor-pointer hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="outline" className="text-xs">
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{article.rating}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {article.readTime}
                        </div>
                        <span>{article.views} views</span>
                      </div>
                      <ArrowRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-16">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Need More Help?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <Card key={index} className="text-center group hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <div className="text-primary">
                        {action.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{action.description}</p>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {action.action}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Status Section */}
        <section className="py-12 bg-muted/30 border-t">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">All Systems Operational</span>
            </div>
            <p className="text-sm text-muted-foreground">
              ReAlign services are running smoothly. Check our{' '}
              <Link href="/status" className="text-primary hover:underline">
                status page
              </Link>{' '}
              for real-time updates.
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};