import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Users, FileText, ArrowRight } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Order Management',
      description: 'Track all your event bookings, schedules, and customer details in one centralized system.'
    },
    {
      icon: DollarSign,
      title: 'Financial Tracking',
      description: 'Monitor payments, invoices, and outstanding balances with real-time financial insights.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Assign designers and crew members to projects, track their work, and manage team payments.'
    },
    {
      icon: FileText,
      title: 'Invoice System',
      description: 'Generate professional invoices automatically and share them with clients via multiple channels.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Thenarsis Management System V1.0 - Professional Event Management</title>
        <meta name="description" content="Complete event management solution for photography and videography businesses. Track orders, manage finances, and collaborate with your team." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <section className="bg-gradient-to-br from-white via-yellow-50 to-white py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{letterSpacing: '-0.02em'}}>
                Professional event management for creative teams
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
                Streamline your photography and videography business with complete order tracking, financial management, and team collaboration tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/invoice/lookup">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    View Invoice
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to manage events</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built specifically for photography and videography businesses to handle complex workflows with ease.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-2 hover:border-primary transition-all duration-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* <section className="py-20 bg-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your workflow?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join event professionals who trust Thenarsis to manage their business operations.
            </p>
            <Link to="/signup">
              <Button size="lg">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section> */}
      </div>
    </>
  );
};

export default HomePage;