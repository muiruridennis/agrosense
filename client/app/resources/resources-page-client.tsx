// src/app/(public)/resources/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Search, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { resources, categories } from "@/lib/resources-data";

/**
 * Listing/filter UI. Article content and metadata live in
 * lib/resources-data.ts (shared with the [slug] detail page) so the
 * card copy here and the actual article can never drift apart.
 */
export default function ResourcesPageClient() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResources = resources.filter((resource) => {
    const matchesCategory =
      selectedCategory === "All" || resource.category === selectedCategory;
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper to render resource thumbnail with video support
  const renderThumbnail = (resource: (typeof resources)[0]) => {
    const isVideo = resource.type === "video" && resource.videoSrc;

    if (isVideo) {
      return (
        <div className="relative w-full h-full">
          <video
            src={resource.videoSrc}
            poster={resource.image}
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/40">
            <div className="rounded-full bg-white/20 backdrop-blur-sm p-3 transition-transform group-hover:scale-110">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          <Badge className="absolute top-3 right-3 bg-black/60 text-white border-none text-[10px] backdrop-blur-sm">
            Video
          </Badge>
        </div>
      );
    }

    return (
      <Image
        src={resource.image || "/images/placeholder.jpg"}
        alt={resource.title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
    );
  };

  return (
    <div className="py-12 md:py-20 bg-background">
      <div className="container-custom">
        {/* ========================================
            PAGE HEADER
        ======================================== */}

        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4 border-primary/15 bg-primary/5 text-primary">
            Resources
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Learn, grow, and{" "}
            <span className="text-gradient-hero">succeed.</span>
          </h1>
          <p className="text-base text-muted-foreground">
            Guides and tutorials to help you get the most out of your poultry
            farm.
          </p>
        </div>

        {/* ========================================
            FEATURED RESOURCES
        ======================================== */}

        {resources.filter((r) => r.featured).length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-6">Featured</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {resources
                .filter((r) => r.featured)
                .map((resource) => (
                  <Link
                    key={resource.slug}
                    href={`/resources/${resource.slug}`}
                    className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 block"
                  >
                    <div className="aspect-video bg-muted/30 relative overflow-hidden">
                      {renderThumbnail(resource)}
                      <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-none">
                        Featured
                      </Badge>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className="capitalize">{resource.type}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>{resource.category}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {resource.description}
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {resource.readTime}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* ========================================
            ALL RESOURCES
        ======================================== */}

        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                    "hover:scale-105 active:scale-95",
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources
              .filter((r) => !r.featured)
              .map((resource) => (
                <Link
                  key={resource.slug}
                  href={`/resources/${resource.slug}`}
                  className="group rounded-xl border border-border/50 bg-card overflow-hidden hover:shadow-md hover:border-border/80 transition-all duration-300 block"
                >
                  <div className="aspect-video bg-muted/30 relative overflow-hidden">
                    {renderThumbnail(resource)}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="capitalize">{resource.type}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span>{resource.category}</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="flex items-center mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {resource.readTime}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>

          {/* Empty state */}
          {filteredResources.filter((r) => !r.featured).length === 0 &&
            filteredResources.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No resources found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Try adjusting your filters or search
                </p>
              </div>
            )}
        </div>

        {/* ========================================
            NEWSLETTER CTA
        ======================================== */}

        <div className="mt-16 text-center bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-2xl border border-border/50 p-8 md:p-12">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Stay Updated
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              Get poultry farming tips in your inbox
            </h3>
            <p className="text-muted-foreground text-sm mt-2">
              Guides and product updates, occasionally, no spam.
            </p>
            <form className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 rounded-xl border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary"
                required
              />
              <Button
                type="submit"
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300"
              >
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-3">
              Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}