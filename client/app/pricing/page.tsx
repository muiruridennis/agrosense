// src/app/(public)/pricing/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  ArrowRight, 
  Leaf, 
  X, 
  HelpCircle,
  Infinity,
  Users,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: "Basic",
      price: {
        monthly: 0,
        yearly: 0
      },
      period: "",
      description: "For small-scale farmers starting out",
      features: [
        { name: "Up to 2 farms", included: true },
        { name: "Basic crop tracking", included: true },
        { name: "Weather alerts", included: true },
        { name: "Email support", included: true },
        { name: "Basic reports", included: true },
        { name: "AI disease detection", included: false },
        { name: "Livestock health tracking", included: false },
        { name: "Profit & loss reports", included: false },
        { name: "24/7 WhatsApp support", included: false },
        { name: "Export data", included: false },
        { name: "Market prices", included: false },
        { name: "API access", included: false }
      ],
      cta: "Get Started",
      popular: false,
      buttonVariant: "outline" as const
    },
    {
      name: "Pro",
      price: {
        monthly: 499,
        yearly: 4990  // 2 months free (4990 vs 5988)
      },
      period: "/month",
      description: "Most popular. For serious farmers.",
      features: [
        { name: "Unlimited farms", included: true },
        { name: "Basic crop tracking", included: true },
        { name: "Weather alerts", included: true },
        { name: "Email support", included: true },
        { name: "Basic reports", included: true },
        { name: "AI disease detection", included: true },
        { name: "Livestock health tracking", included: true },
        { name: "Profit & loss reports", included: true },
        { name: "24/7 WhatsApp support", included: true },
        { name: "Export data", included: true },
        { name: "Market prices", included: true },
        { name: "API access", included: false }
      ],
      cta: "Start 14-Day Trial",
      popular: true,
      buttonVariant: "default" as const
    },
    {
      name: "Cooperative",
      price: {
        monthly: "Custom",
        yearly: "Custom"
      },
      period: "",
      description: "For groups and agribusiness",
      features: [
        { name: "Unlimited farms", included: true },
        { name: "Basic crop tracking", included: true },
        { name: "Weather alerts", included: true },
        { name: "Email support", included: true },
        { name: "Basic reports", included: true },
        { name: "AI disease detection", included: true },
        { name: "Livestock health tracking", included: true },
        { name: "Profit & loss reports", included: true },
        { name: "24/7 WhatsApp support", included: true },
        { name: "Export data", included: true },
        { name: "Market prices", included: true },
        { name: "API access", included: true }
      ],
      cta: "Contact Sales",
      popular: false,
      buttonVariant: "outline" as const
    }
  ];

  // Calculate yearly savings
  const yearlySavings = (plans[1].price.monthly * 12) - plans[1].price.yearly;

  return (
    <div className="min-h-screen py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your farm. Start free, upgrade when you need more.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-3 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs text-success">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative ${
                plan.popular ? 'md:scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              <Card className={`h-full ${plan.popular ? 'border-primary shadow-xl' : 'border-border'}`}>
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      {typeof plan.price[billingCycle] === 'number' 
                        ? `KES ${plan.price[billingCycle].toLocaleString()}`
                        : plan.price[billingCycle]
                      }
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && plan.name === 'Pro' && (
                    <p className="text-xs text-success mt-1">
                      Save KES {yearlySavings.toLocaleString()} annually
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={plan.buttonVariant} 
                    className="w-full gap-2"
                    asChild
                  >
                    <Link href={plan.name === 'Cooperative' ? '/contact' : '/auth/signup'}>
                      {plan.cta}
                      {plan.cta !== 'Contact Sales' && <ArrowRight className="w-4 h-4" />}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>

        {/* Free Trial Notice */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-full">
            <Leaf className="w-4 h-4 text-primary" />
            <span>All plans include a 14-day free trial. No credit card required.</span>
          </div>
        </div>

        {/* Feature Comparison Table (Detailed) */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Compare all features</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold">Basic</th>
                  <th className="text-center py-4 px-4 font-semibold bg-primary/5">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold">Cooperative</th>
                </tr>
              </thead>
              <tbody>
                <TableRow feature="Farms" basic="Up to 2" pro="Unlimited" coop="Unlimited" />
                <TableRow feature="Crop tracking" basic="✓" pro="✓" coop="✓" />
                <TableRow feature="Weather alerts" basic="✓" pro="✓" coop="✓" />
                <TableRow feature="Email support" basic="✓" pro="✓" coop="✓" />
                <TableRow feature="AI disease detection" basic="✗" pro="✓" coop="✓" highlight />
                <TableRow feature="Livestock health" basic="✗" pro="✓" coop="✓" highlight />
                <TableRow feature="Profit & loss reports" basic="✗" pro="✓" coop="✓" highlight />
                <TableRow feature="24/7 WhatsApp support" basic="✗" pro="✓" coop="✓" highlight />
                <TableRow feature="Export data" basic="✗" pro="✓" coop="✓" />
                <TableRow feature="Market prices" basic="✗" pro="✓" coop="✓" />
                <TableRow feature="API access" basic="✗" pro="✗" coop="✓" highlight />
                <TableRow feature="Dedicated account manager" basic="✗" pro="✗" coop="✓" />
                <TableRow feature="Training & onboarding" basic="✗" pro="✗" coop="✓" />
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Can I switch plans later?</AccordionTrigger>
              <AccordionContent>
                Yes, you can upgrade or downgrade at any time. If you upgrade, the new price will be prorated for the remaining period. If you downgrade, the new price will apply at the next billing cycle.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                We accept M-Pesa, Visa, Mastercard, and bank transfers. For cooperatives, we also offer invoice-based payments.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Is there a contract?</AccordionTrigger>
              <AccordionContent>
                No. All plans are month-to-month. You can cancel anytime with no penalties.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Do you offer discounts for non-profits?</AccordionTrigger>
              <AccordionContent>
                Yes, we offer a 25% discount for registered agricultural non-profits and farmer training organizations. Contact our sales team for details.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Can I use AgroSense offline?</AccordionTrigger>
              <AccordionContent>
                Yes, AgroSense works offline. You can log activities, take photos, and track records without internet. Data syncs automatically when you reconnect.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>What support do you offer?</AccordionTrigger>
              <AccordionContent>
                Basic plan includes email support. Pro and Cooperative plans include 24/7 WhatsApp support in English and Swahili. Cooperative plans also include a dedicated account manager.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Enterprise CTA */}
        <div className="text-center bg-card border border-border rounded-2xl p-8 md:p-12">
          <div className="max-w-2xl mx-auto">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Need a custom plan for your cooperative?
            </h2>
            <p className="text-muted-foreground mb-6">
              Get volume discounts, custom integrations, and priority support for large organizations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/contact">
                  Contact Sales
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/demo">
                  Schedule a Demo
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>+254 700 123 456</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>enterprise@agrosense.com</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp Business</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for table rows
function TableRow({ 
  feature, 
  basic, 
  pro, 
  coop, 
  highlight = false 
}: { 
  feature: string; 
  basic: string; 
  pro: string; 
  coop: string; 
  highlight?: boolean;
}) {
  return (
    <tr className={`border-b border-border ${highlight ? 'bg-primary/5' : ''}`}>
      <td className="py-3 px-4 text-sm font-medium">{feature}</td>
      <td className="py-3 px-4 text-sm text-center">{basic}</td>
      <td className={`py-3 px-4 text-sm text-center ${highlight ? 'font-semibold text-primary' : ''}`}>
        {pro}
      </td>
      <td className="py-3 px-4 text-sm text-center">{coop}</td>
    </tr>
  );
}