'use client';

import { 
  Leaf, Syringe, Wallet, Bell, 
  FileText, Cloud, Users, TrendingUp,
  Camera, Calendar, MapPin, Truck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Leaf,
    title: "Crop Management",
    description: "Track planting cycles, monitor growth, and predict harvest dates. Get disease alerts before they spread.",
    color: "primary"
  },
  {
    icon: Syringe,
    title: "Livestock Health",
    description: "Schedule vaccinations, log health events, and never miss a treatment again.",
    color: "primary"
  },
  {
    icon: Wallet,
    title: "FarmLedger",
    description: "Track every expense and income. Know your real profit per crop or livestock.",
    color: "accent"
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified about disease outbreaks, weather risks, and market prices.",
    color: "warning"
  },
  {
    icon: Cloud,
    title: "Weather Intelligence",
    description: "Hyperlocal forecasts and irrigation recommendations for your exact location.",
    color: "info"
  },
  {
    icon: FileText,
    title: "Season Reports",
    description: "Download PDF reports for your records, banks, or cooperative.",
    color: "primary"
  },
  {
    icon: Users,
    title: "Cooperative Tools",
    description: "Manage group buying, shared resources, and collective sales.",
    color: "secondary"
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description: "See what's working. Compare seasons. Make data-driven decisions.",
    color: "accent"
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to manage your farm
          </h2>
          <p className="text-lg text-muted-foreground">
            From crops to livestock, expenses to insights — all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}