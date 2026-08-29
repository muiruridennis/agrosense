'use client';

import Link from 'next/link';
import { Bird, Mail, Phone, MapPin } from 'lucide-react';

/**
 * Footer -- background changed from bg-card (light neutral) to
 * bg-primary (navy) so it bookends the page with the same navy the
 * hero's market-section uses, instead of a generic gray footer.
 *
 * Flagged but NOT changed here (out of scope for "little tweaks" --
 * these are content/product decisions, not styling):
 *  - social links (facebook.com/agrosense etc.) -- confirm these
 *    accounts are real before shipping, and the icons themselves are
 *    commented out because lucide-react dropped brand icons; need a
 *    different icon source before this section can render anything
 *  - phone/email in the contact block -- confirm these are real
 *  - newsletter form has no onSubmit -- currently decorative
 *  - "Solutions" links (Cooperatives/Agronomists/Agribusiness) are
 *    inherited from the pre-poultry-narrowing positioning
 */

const footerLinks = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Demo', href: '/demo' },
    { label: 'Integrations', href: '/integrations' },
  ],
  solutions: [
    { label: 'For Small Farmers', href: '/solutions/small-farmers' },
    { label: 'For Cooperatives', href: '/solutions/cooperatives' },
    { label: 'For Agronomists', href: '/solutions/agronomists' },
    { label: 'For Agribusiness', href: '/solutions/agribusiness' },
  ],
  resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Guides', href: '/guides' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'Help Center', href: '/help' },
    { label: 'API Docs', href: '/docs' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

const socialLinks = [
  { href: 'https://facebook.com/agrosense', label: 'Facebook' },
  { href: 'https://twitter.com/agrosense', label: 'Twitter' },
  { href: 'https://instagram.com/agrosense', label: 'Instagram' },
  { href: 'https://linkedin.com/company/agrosense', label: 'LinkedIn' },
  { href: 'https://youtube.com/agrosense', label: 'YouTube' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Bird className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-primary-foreground">
                Agro<span className="text-accent">Sense</span>
              </span>
            </Link>
            <p className="text-sm text-primary-foreground/70 mb-4 leading-relaxed">
              Poultry farm intelligence -- flock, production, and market
              data in one place, for farms of any size.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="w-4 h-4" />
                <span>hello@agrosense.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="w-4 h-4" />
                <span>+254 700 123 456</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <MapPin className="w-4 h-4" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>

            {/* Social links -- icons intentionally not rendered.
                lucide-react dropped brand icons; nothing to uncomment
                here until a replacement icon source is chosen, and
                the accounts themselves should be confirmed real first. */}
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-sm font-semibold text-primary-foreground uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-primary-foreground uppercase tracking-wider mb-4">
              Solutions
            </h4>
            <ul className="space-y-2">
              {footerLinks.solutions.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-primary-foreground uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-primary-foreground uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/15">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-base font-semibold text-primary-foreground mb-1">
                Subscribe to our newsletter
              </h4>
              <p className="text-sm text-primary-foreground/70">
                Get the latest farming tips, product updates, and market insights.
              </p>
            </div>
            {/* NOTE: no onSubmit wired up yet -- this form doesn't do
                anything on submit. Flagging rather than silently
                leaving it looking functional. */}
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-primary-foreground/5 border border-primary-foreground/20 rounded-md text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent transition-all"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-md hover:bg-accent-muted transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-primary-foreground/15">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-primary-foreground/60">
              &copy; {currentYear} AgroSense. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/privacy" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}