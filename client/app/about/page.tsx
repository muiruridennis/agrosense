// src/app/(public)/about/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Leaf,
  Users,
  Target,
  Heart,
  Award,
  MapPin,
  Quote,
  CheckCircle2,
  ArrowRight,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary-50/50 via-background to-secondary-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Our Story
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              We're on a mission to
              <span className="text-primary block mt-2">
                empower African farmers
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              AgroSense was born from a simple belief: every farmer deserves
              access to technology that makes farming smarter, not harder.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Target className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
                <p className="text-muted-foreground">
                  To equip every African farmer with AI-powered tools that
                  prevent losses, increase yields, and build sustainable farm
                  businesses.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
                <p className="text-muted-foreground">
                  A future where no farmer loses their livelihood to preventable
                  disease — and every farm reaches its full potential.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Problem We Saw */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              We saw a problem. So we built a solution.
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Smallholder farmers lose up to 40% of their crops to
                  preventable diseases — simply because they detect them too
                  late.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Livestock keepers miss vaccination schedules, leading to
                  outbreaks that wipe out entire herds.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Most farmers don't know their real profit — they track
                  nothing, guess everything.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Extension agents are few. Advice is hard to get. Farmers are
                  left alone.
                </p>
              </div>
            </div>
            <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/10">
              <Quote className="w-8 h-8 text-primary/40 mb-3" />
              <p className="text-foreground italic">
                "We spent months talking to farmers in Nakuru, Kisumu, and
                Eldoret. The pain was real. The need was urgent. So we built
                AgroSense — not for Silicon Valley, but for the farmer waking up
                at 5 AM to check on their crops."
              </p>
              <p className="text-sm text-primary mt-3 font-medium">
                — John Mwangi, Co-founder & CEO
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              The team behind AgroSense
            </h2>
            <p className="text-muted-foreground">
              Farmers, engineers, and agronomists working together to build
              better tools.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <TeamMember
              name="John Mwangi"
              role="Co-founder & CEO"
              bio="Former agronomist who saw the gap between farmers and technology."
              initials="JM"
            />
            <TeamMember
              name="Dr. Grace Atieno"
              role="Head of Agriculture"
              bio="PhD in Crop Science. 15 years working with smallholder farmers."
              initials="GA"
            />
            <TeamMember
              name="Peter Omondi"
              role="Lead Engineer"
              bio="Built farm management systems for 5+ years. Passionate about offline-first tech."
              initials="PO"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              What we believe
            </h2>
            <p className="text-muted-foreground">
              These values guide every decision we make.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <ValueCard
              icon={Users}
              title="Farmer-first"
              description="We build for the farmer waking up at dawn — not for investors."
            />
            <ValueCard
              icon={Leaf}
              title="Practical technology"
              description="AI that works offline. SMS for basic phones. No complexity."
            />
            <ValueCard
              icon={Heart}
              title="African-built"
              description="Made in Kenya, for Africa. We understand local challenges."
            />
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Our impact so far
            </h2>
            <p className="text-muted-foreground">
              We're just getting started, but farmers are already seeing
              results.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
            <div>
              <div className="text-3xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">
                Farmers using AgroSense
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">
                Cooperatives partnered
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">40%</div>
              <div className="text-sm text-muted-foreground">
                Average yield increase
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">
                Support in English & Swahili
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-4">
              Trusted by organizations across Africa
            </h2>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-center">
              <div className="w-24 h-12 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold">KENYA FARMERS</span>
              </div>
            </div>
            <div className="text-center">
              <div className="w-24 h-12 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold">AGRICORP</span>
              </div>
            </div>
            <div className="text-center">
              <div className="w-24 h-12 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold">FARM COOP</span>
              </div>
            </div>
            <div className="text-center">
              <div className="w-24 h-12 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold">AGRI-TECH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Want to be part of our mission?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            We're always looking for partners, agronomists, and farmers to help
            us build better tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-gray-100 gap-2"
            >
              <Link href="/contact">
                Get in touch
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Link href="/careers">View careers</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// Helper components
function TeamMember({
  name,
  role,
  bio,
  initials,
}: {
  name: string;
  role: string;
  bio: string;
  initials: string;
}) {
  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl font-semibold text-primary">{initials}</span>
      </div>
      <h3 className="font-semibold text-lg">{name}</h3>
      <p className="text-sm text-primary mb-2">{role}</p>
      <p className="text-sm text-muted-foreground">{bio}</p>
    </div>
  );
}

function ValueCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
