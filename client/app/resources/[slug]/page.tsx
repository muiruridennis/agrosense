// src/app/(public)/resources/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowLeft, ArrowRight, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resources } from "@/lib/resources-data";
import { VideoPlayer } from "@/components/ui/video-player";

/**
 * This file is the actual SEO payoff of the resources section --
 * individual articles are what rank for real search queries ("how to
 * improve egg production"), not the listing page. Each article gets
 * its own title, description, canonical URL, and Article structured
 * data.
 *
 * generateStaticParams pre-renders every article at build time (SSG)
 * so Google gets full HTML on first crawl, not a client-rendered
 * shell.
 */

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return resources.map((r) => ({ slug: r.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const resource = resources.find((r) => r.slug === params.slug);
  if (!resource) return {};

  const isVideo = resource.type === "video" && resource.videoSrc;

  return {
    title: `${resource.title} — AgroSense`,
    description: resource.description,
    alternates: { canonical: `/resources/${resource.slug}` },
    openGraph: {
      title: resource.title,
      description: resource.description,
      url: `/resources/${resource.slug}`,
      siteName: "AgroSense",
      type: isVideo ? "video.other" : "article",
      publishedTime: resource.date,
      images: [{ url: resource.image || "/images/placeholder.jpg" }],
      ...(isVideo && {
        videos: [{ url: resource.videoSrc, type: "video/mp4" }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: resource.title,
      description: resource.description,
      images: [resource.image || "/images/placeholder.jpg"],
    },
  };
}

export default async function ResourceDetailPage({ params }: Props) {
  const { slug } = await params;
  const resource = resources.find((r) => r.slug === slug);
  if (!resource) notFound();

  const isVideo = resource.type === "video" && resource.videoSrc;

  // Structured Data (JSON-LD) for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isVideo ? "VideoObject" : "Article",
    headline: resource.title,
    description: resource.description,
    datePublished: resource.date,
    ...(isVideo
      ? {
          thumbnailUrl: resource.image,
          contentUrl: resource.videoSrc,
          uploadDate: resource.date,
        }
      : {
          image: resource.image,
        }),
    author: { "@type": "Organization", name: "AgroSense" },
    publisher: { "@type": "Organization", name: "AgroSense" },
  };

  return (
    <div className="py-12 md:py-20 bg-background">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-custom max-w-3xl">
        {/* Back Button */}
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to resources
        </Link>

        {/* Meta Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="capitalize">{resource.type}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>{resource.category}</span>
          {isVideo && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="flex items-center gap-1 text-accent">
                <Play className="h-3 w-3 fill-current" />
                Video
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
          {resource.title}
        </h1>

        {/* Meta Info */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {resource.readTime}
          </span>
          <span>
            {new Date(resource.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Media — Video or Image */}
        <div className="mt-8 rounded-2xl border border-border/50 overflow-hidden bg-black/5">
          {isVideo ? (
            <VideoPlayer
              src={resource.videoSrc!}
              poster={resource.image}
              autoPlay={false}
              className="rounded-none"
            />
          ) : (
            <div className="aspect-video bg-muted/30 relative">
              <Image
                src={resource.image || "/images/placeholder.jpg"}
                alt={resource.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>

        {/* Article Content */}
        <article className="prose prose-neutral dark:prose-invert max-w-none mt-8 text-foreground/90 leading-relaxed">
          {resource.body ? (
            resource.body.split("\n\n").map((paragraph, i) => (
              <p key={i} className="mb-4 whitespace-pre-line">
                {paragraph}
              </p>
            ))
          ) : (
            <div className="rounded-xl border border-border/50 bg-muted/30 p-6 text-sm text-muted-foreground not-prose">
              Full article content for this one is still being written -- check
              back soon.
            </div>
          )}
        </article>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
          <Badge variant="outline">{resource.category}</Badge>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/resources">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                All resources
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300"
            >
              <Link href="/register">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}