// src/components/sections/TestimonialsSection.tsx
'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "James Mwangi",
    location: "Nakuru, Kenya",
    role: "Maize Farmer",
    content: "AgroSense saved my maize crop twice this season. The disease alerts came early enough for me to act. I would have lost everything to late blight.",
    rating: 5,
    image: "/testimonials/james.jpg"
  },
  {
    name: "Grace Atieno",
    location: "Kisumu, Kenya",
    role: "Dairy Farmer",
    content: "The vaccination reminders are a lifesaver. I used to forget schedules. Now my cows are healthier and my milk production is up 40%.",
    rating: 5,
    image: "/testimonials/grace.jpg"
  },
  {
    name: "Peter Omondi",
    location: "Eldoret, Kenya",
    role: "Cooperative Manager",
    content: "Managing 200+ farmers used to be chaos. Now we track everything digitally. The reports help us get better loans from banks.",
    rating: 5,
    image: "/testimonials/peter.jpg"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Loved by farmers across East Africa
          </h2>
          <p className="text-lg text-muted-foreground">
            Join 10,000+ farmers who trust AgroSense daily
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6">
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-primary/20 mb-4" />
              
              {/* Content */}
              <p className="text-foreground mb-4 italic">
                "{testimonial.content}"
              </p>
              
              {/* Rating */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              
              {/* Farmer Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.location} • {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span>Rated 4.9/5 by 500+ farmers on Google</span>
          </div>
        </div>
      </div>
    </section>
  );
}