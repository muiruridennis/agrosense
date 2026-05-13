// src/app/(public)/features/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Leaf, Syringe, Wallet, Bell, Cloud, FileText, 
  Users, TrendingUp, Camera, Calendar, MapPin, 
  Truck, CheckCircle2, ArrowRight, Play,
  Shield, Clock, Smartphone, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState('crops');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary-50/50 via-background to-secondary-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Everything you need to
              <span className="text-primary block mt-2">manage your farm smarter</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              From crop disease detection to livestock health tracking and financial management — 
              AgroSense puts farm intelligence in your pocket.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/demo">
                  <Play className="w-4 h-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Tabs for Different User Types */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="crops" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="crops">Crops</TabsTrigger>
                <TabsTrigger value="livestock">Livestock</TabsTrigger>
                <TabsTrigger value="finance">Finance</TabsTrigger>
              </TabsList>
            </div>

            {/* Crops Tab */}
            <TabsContent value="crops" className="space-y-16">
              <FeatureDetail
                title="AI Disease Detection"
                description="Snap a photo. Get instant diagnosis. Save your harvest."
                features={[
                  "Identify 50+ crop diseases with 98% accuracy",
                  "Get treatment recommendations instantly",
                  "Receive alerts when disease risk is high in your area",
                  "Track disease history across seasons"
                ]}
                image="/features/disease-detection.jpg"
                imageAlt="Disease detection on maize leaf"
                reverse={false}
              />
              
              <FeatureDetail
                title="Crop Cycle Management"
                description="Track every stage from planting to harvest."
                features={[
                  "Log planting dates, fertilizer applications, and irrigation",
                  "Get reminders for key activities (spraying, weeding)",
                  "Predict harvest dates based on crop variety and weather",
                  "Compare performance across seasons"
                ]}
                image="/features/crop-cycle.jpg"
                imageAlt="Crop growth tracking dashboard"
                reverse={true}
              />

              <FeatureDetail
                title="Weather Intelligence"
                description="Hyperlocal forecasts for your exact farm location."
                features={[
                  "Real-time weather alerts for your area",
                  "Rainfall predictions for irrigation planning",
                  "Frost and drought risk warnings",
                  "Historical weather data for season planning"
                ]}
                image="/features/weather.jpg"
                imageAlt="Weather forecast for farm"
                reverse={false}
              />

              <FeatureDetail
                title="Yield Forecasting"
                description="Know what to expect before harvest."
                features={[
                  "AI-powered yield predictions based on crop health",
                  "Compare actual vs predicted harvest",
                  "Identify underperforming plots early",
                  "Plan storage and sales in advance"
                ]}
                image="/features/yield.jpg"
                imageAlt="Yield prediction chart"
                reverse={true}
              />
            </TabsContent>

            {/* Livestock Tab */}
            <TabsContent value="livestock" className="space-y-16">
              <FeatureDetail
                title="Animal Health Tracking"
                description="Monitor every animal's health history in one place."
                features={[
                  "Register animals with unique IDs and photos",
                  "Log symptoms, treatments, and health events",
                  "Track weight gain and milk production",
                  "Get alerts for abnormal behavior or symptoms"
                ]}
                image="/features/animal-health.jpg"
                imageAlt="Livestock health tracking"
                reverse={false}
              />

              <FeatureDetail
                title="Vaccination Scheduler"
                description="Never miss a vaccination again."
                features={[
                  "Set up vaccination schedules for each animal",
                  "Get reminders before doses are due",
                  "Mark administered doses with one click",
                  "Generate vaccination certificates for sale/trade"
                ]}
                image="/features/vaccination.jpg"
                imageAlt="Vaccination schedule"
                reverse={true}
              />

              <FeatureDetail
                title="Breeding Management"
                description="Track breeding cycles and improve genetics."
                features={[
                  "Log heat cycles and breeding dates",
                  "Track pregnancy and expected calving/kidding dates",
                  "Record offspring and lineage",
                  "Monitor breeding success rates"
                ]}
                image="/features/breeding.jpg"
                imageAlt="Breeding management"
                reverse={false}
              />

              <FeatureDetail
                title="Feed & Expense Tracking"
                description="Know exactly what each animal costs."
                features={[
                  "Log feed purchases and consumption",
                  "Track veterinary costs per animal",
                  "Calculate cost per litre of milk or kg of meat",
                  "Identify most profitable animals"
                ]}
                image="/features/feed-tracking.jpg"
                imageAlt="Feed expense tracking"
                reverse={true}
              />
            </TabsContent>

            {/* Finance Tab */}
            <TabsContent value="finance" className="space-y-16">
              <FeatureDetail
                title="FarmLedger"
                description="Track every income and expense. Know your real profit."
                features={[
                  "Log expenses: seeds, fertilizer, labor, equipment",
                  "Log income: crop sales, livestock sales, milk, eggs",
                  "Categorize transactions for easy reporting",
                  "Attach receipts and notes to each transaction"
                ]}
                image="/features/farmledger.jpg"
                imageAlt="Farm ledger dashboard"
                reverse={false}
              />

              <FeatureDetail
                title="Profit & Loss Reports"
                description="See what's working and what's not."
                features={[
                  "Real-time P&L by crop, livestock, or season",
                  "Compare profitability across different crops",
                  "Identify your most profitable activities",
                  "Export reports for banks or investors"
                ]}
                image="/features/profit-loss.jpg"
                imageAlt="Profit and loss chart"
                reverse={true}
              />

              <FeatureDetail
                title="Season Reports (PDF)"
                description="Download comprehensive season summaries."
                features={[
                  "One-click PDF generation",
                  "Includes all income, expenses, and profit",
                  "Crop yield and disease history",
                  "Perfect for cooperative records or loan applications"
                ]}
                image="/features/reports.jpg"
                imageAlt="PDF report preview"
                reverse={false}
              />

              <FeatureDetail
                title="Market Prices"
                description="Sell at the right time for the best price."
                features={[
                  "Real-time market prices for crops and livestock",
                  "Price history and trends",
                  "Find buyers near your location",
                  "Alerts when prices hit your target"
                ]}
                image="/features/market-prices.jpg"
                imageAlt="Market prices dashboard"
                reverse={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Platform-Wide Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Works anywhere. Works everywhere.</h2>
            <p className="text-muted-foreground">
              Built for African farmers — with or without internet.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PlatformFeature 
              icon={Smartphone}
              title="Offline Mode"
              description="Log activities, take photos, and track records without internet. Syncs automatically when connected."
            />
            <PlatformFeature 
              icon={Shield}
              title="Bank-Level Security"
              description="Your farm data is encrypted. We never sell your information."
            />
            <PlatformFeature 
              icon={Clock}
              title="24/7 Support"
              description="WhatsApp support in English and Swahili. Real humans, not chatbots."
            />
            <PlatformFeature 
              icon={Download}
              title="Export Your Data"
              description="Download your records anytime. No lock-in. Your data is yours."
            />
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Compare plans</h2>
            <p className="text-muted-foreground">
              All plans include core features. Upgrade for advanced tools.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold">Basic</th>
                  <th className="text-center py-4 px-4 font-semibold bg-primary/5">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold">Cooperative</th>
                 </tr>
              </thead>
              <tbody>
                <TableRow feature="Crop tracking" basic="✓" pro="✓" coop="✓" />
                <TableRow feature="Weather alerts" basic="✓" pro="✓" coop="✓" />
                <TableRow feature="Basic reports" basic="✓" pro="✓" coop="✓" />
                <TableRow feature="AI disease detection" basic="✗" pro="✓" coop="✓" highlight />
                <TableRow feature="Livestock health" basic="✗" pro="✓" coop="✓" highlight />
                <TableRow feature="Profit & loss reports" basic="✗" pro="✓" coop="✓" highlight />
                <TableRow feature="24/7 WhatsApp support" basic="✗" pro="✓" coop="✓" />
                <TableRow feature="Export data" basic="✗" pro="✓" coop="✓" />
                <TableRow feature="Market prices" basic="✗" pro="✓" coop="✓" />
                <TableRow feature="API access" basic="✗" pro="✗" coop="✓" />
                <TableRow feature="Dedicated account manager" basic="✗" pro="✗" coop="✓" />
              </tbody>
            </table>
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link href="/pricing">
                View full pricing details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to see AgroSense in action?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Start your 14-day free trial. No credit card required.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 gap-2">
            <Link href="/auth/signup">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

// Helper Components
function FeatureDetail({ 
  title, 
  description, 
  features, 
  image, 
  imageAlt, 
  reverse 
}: { 
  title: string; 
  description: string; 
  features: string[]; 
  image: string; 
  imageAlt: string; 
  reverse: boolean;
}) {
  return (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}>
      <div className="flex-1">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">
        <div className="bg-muted rounded-xl overflow-hidden aspect-video flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Feature preview</p>
            <p className="text-xs text-muted-foreground mt-1">Screenshot placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformFeature({ icon: Icon, title, description }: { 
  icon: any; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center p-6 bg-card rounded-xl border border-border">
      <Icon className="w-10 h-10 text-primary mx-auto mb-3" />
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TableRow({ feature, basic, pro, coop, highlight = false }: { 
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