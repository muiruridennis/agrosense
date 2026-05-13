// src/components/sections/CTASection.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, Phone, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to grow more with less worry?
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Join 10,000+ farmers already using AgroSense to protect their crops, 
          track their livestock, and increase their profits.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 gap-2 px-8">
            <Link href="/auth/register">
              Start Your Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 gap-2 px-8">
            <Link href="/demo">
              <Play className="w-4 h-4" />
              See Live Demo
            </Link>
          </Button>
        </div>
        
        <p className="text-sm text-white/70">
          Free for 14 days. No credit card required. Cancel anytime.
        </p>
        
        {/* Support Options */}
        <div className="flex flex-wrap justify-center gap-6 mt-8 pt-8 border-t border-white/20">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp: +254 700 123 456</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Phone className="w-4 h-4" />
            <span>Call: +254 700 123 456</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Mail className="w-4 h-4" />
            <span>Email: hello@agrosense.com</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Play icon component
function Play(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}