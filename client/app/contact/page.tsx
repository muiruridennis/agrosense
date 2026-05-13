// src/app/(public)/contact/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Send,
  CheckCircle2,
  ArrowRight,
 
  Headphones,
  FileText,
  Users,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const contactOptions = [
  {
    icon: Headphones,
    title: "Customer Support",
    description: "Technical issues, account help, feature questions",
    email: "support@agrosense.com",
    phone: "+254 700 123 456",
    whatsapp: "+254 700 123 456",
    hours: "24/7",
    responseTime: "Within 2 hours"
  },
  {
    icon: Building,
    title: "Sales & Cooperatives",
    description: "Enterprise plans, cooperative pricing, bulk accounts",
    email: "sales@agrosense.com",
    phone: "+254 700 123 457",
    whatsapp: "+254 700 123 457",
    hours: "Mon-Fri, 8AM-6PM",
    responseTime: "Within 24 hours"
  },
  {
    icon: Users,
    title: "Partnerships",
    description: "NGOs, agribusiness, research institutions",
    email: "partners@agrosense.com",
    phone: "+254 700 123 458",
    whatsapp: "+254 700 123 458",
    hours: "Mon-Fri, 9AM-5PM",
    responseTime: "Within 48 hours"
  },
  {
    icon: FileText,
    title: "Press & Media",
    description: "Media inquiries, interviews, press kits",
    email: "press@agrosense.com",
    phone: "+254 700 123 459",
    hours: "By appointment",
    responseTime: "Within 48 hours"
  }
];

const faqs = [
  {
    question: "How do I reset my password?",
    answer: "Click 'Forgot password' on the sign-in page. We'll send a reset link to your email or SMS to your phone."
  },
  {
    question: "Can I use AgroSense without internet?",
    answer: "Yes! AgroSense works offline. Log activities, take photos, and track records. Data syncs when you reconnect."
  },
  {
    question: "How do I export my farm data?",
    answer: "Go to Reports → Export Data. You can download CSV files or PDF reports for your records."
  },
  {
    question: "Do you offer training for cooperatives?",
    answer: "Yes. Our Cooperative plan includes training and onboarding for all members. Contact our sales team."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. We use bank-level encryption. We never sell your data. You can export and delete anytime."
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'support'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Reset form after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  return (
    <div className="min-h-screen py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">Get in Touch</Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            We're here to help
          </h1>
          <p className="text-lg text-muted-foreground">
            Have questions about AgroSense? Need support? Want to partner with us? 
            Reach out — we'd love to hear from you.
          </p>
        </div>

        {/* Contact Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactOptions.map((option, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <option.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <a href={`mailto:${option.email}`} className="text-primary hover:underline">
                    {option.email}
                  </a>
                </div>
                {option.phone && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <a href={`tel:${option.phone}`} className="hover:text-primary">
                      {option.phone}
                    </a>
                  </div>
                )}
                {option.whatsapp && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <MessageCircle className="w-3 h-3 text-success" />
                    <a href={`https://wa.me/${option.whatsapp.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                      WhatsApp
                    </a>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  <div>Response: {option.responseTime}</div>
                  <div>Hours: {option.hours}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form & Map Row */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Message sent!</h3>
                  <p className="text-muted-foreground">
                    Thanks for reaching out. We'll respond within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Mwangi"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="farmer@example.com"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+254 700 123 456"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="inquiryType">Inquiry Type *</Label>
                    <select
                      id="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="support">Customer Support</option>
                      <option value="sales">Sales & Cooperatives</option>
                      <option value="partnership">Partnership</option>
                      <option value="press">Press & Media</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Brief description of your question"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please provide details so we can help you better..."
                      rows={5}
                      required
                      className="mt-1"
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    {!isSubmitting && <Send className="w-4 h-4" />}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Office Info & Map */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Visit our office</CardTitle>
                <CardDescription>
                  We'd love to meet you in person.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">AgroSense Headquarters</p>
                    <p className="text-sm text-muted-foreground">
                      4th Floor, Agriculture House<br />
                      Moi Avenue, Nairobi<br />
                      Kenya
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Office Hours</p>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday: 8:00 AM - 6:00 PM<br />
                      Saturday: 9:00 AM - 1:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Map preview</p>
                      <p className="text-xs text-muted-foreground">Google Maps integration here</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Follow us</CardTitle>
                <CardDescription>
                  Stay updated on new features and farming tips.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* <div className="flex gap-3">
                  <SocialLink href="https://facebook.com/agrosense"  label="Facebook" />
                  <SocialLink href="https://twitter.com/agrosense" label="Twitter" />
                  <SocialLink href="https://instagram.com/agrosense" label="Instagram" />
                  <SocialLink href="https://linkedin.com/company/agrosense"  label="LinkedIn" />
                  <SocialLink href="https://youtube.com/agrosense"  label="YouTube" />
                </div> */}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Frequently asked questions</h2>
            <p className="text-muted-foreground">
              Find quick answers to common questions.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/help" className="text-primary hover:underline text-sm">
              View all FAQs →
            </Link>
          </div>
        </div>

        {/* Emergency Support Banner */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <Headphones className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">Urgent issue?</h3>
          <p className="text-muted-foreground mb-4">
            For critical problems affecting your farm operations, call our emergency support line.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="destructive" asChild className="gap-2">
              <a href="tel:+254700123456">
                <Phone className="w-4 h-4" />
                Call Emergency Support
              </a>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <a href="https://wa.me/254700123456" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Emergency
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Available 24/7 for Pro and Cooperative plan members
          </p>
        </div>
      </div>
    </div>
  );
}

function SocialLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
    </a>
  );
}