// src/lib/resources-data.ts
//
// Single source of truth for AgroSense resources.
// Used by:
//   - /resources
//   - /resources/[slug]
//
// Keep this file factual and honest:
// - Do not invent customers, testimonials, statistics, or engagement numbers.
// - Only add `body` when the article content actually exists.
// - Update dates when publishing or substantially revising content.

export type ResourceType = "article" | "guide" | "video";

export type ResourceCategory =
  | "Poultry Farming"
  | "Farm Management"
  | "Health & Biosecurity"
  | "Production"
  | "Feed & Costs"
  | "Market Intelligence"
  | "AgroSense Guides";

export interface Resource {
  slug: string;
  type: ResourceType;
  title: string;
  description: string;
  image?: string;
  videoSrc?: string;
  category: ResourceCategory;
  readTime: string;
  date: string;
  featured?: boolean;
  body?: string;
}

export const resources: Resource[] = [
  {
    slug: "getting-started-with-agrosense",
    type: "guide",
    title: "Getting Started with AgroSense",
    description:
      "Set up your poultry farm, add your first flock, and start building useful farm records from day one.",
    image: "/resources/getting-started.jpg",
    category: "AgroSense Guides",
    readTime: "5 min read",
    date: "2026-08-28",
    featured: true,
    body: `
Getting started with AgroSense is designed to be simple. The goal is to get your farm records organized without adding unnecessary work to your daily routine.

**1. Create your account.**

Create your AgroSense account and complete the basic farm information.

**2. Set up your poultry farm.**

Add your farm details and create the poultry houses or production units you use to manage your birds.

**3. Add your first flock.**

Record the flock details, including its name, breed, placement date, initial population, and housing location.

This gives AgroSense the context it needs to organize the records that follow.

**4. Record your daily operations.**

As the flock progresses, record the information that matters to your operation.

Depending on your production system, this may include:

- Egg production
- Feed consumption
- Mortality
- Culling
- Water consumption
- Health events
- Vaccination records

The objective isn't to record everything possible. It is to consistently capture the information that helps you understand what is happening on your farm.

**5. Review your farm data.**

As records accumulate, AgroSense can help you see changes in production, flock population, health activity, and other important indicators.

The longer you maintain consistent records, the more useful those trends become.

**Start small.**

You don't need years of historical data before AgroSense becomes useful. Start with your current flock, build the habit of recording daily operations, and allow your farm data to grow over time.
`,
  },

  {
    slug: "how-to-improve-egg-production",
    type: "article",
    title: "Understanding Egg Production on Your Farm",
    description:
      "Learn which day-to-day factors can influence layer performance and why consistent production records matter.",
    image: "/resources/egg-production.jpg",
    category: "Production",
    readTime: "8 min read",
    date: "2026-08-20",
    body: `
Egg production is influenced by several factors, including flock age, nutrition, water availability, lighting, environmental conditions, health, and stress.

Instead of looking at a single day's egg count, farmers can learn more by following production over time.

**Track production consistently.**

Record the number of eggs collected each day. Consistent records make it easier to identify changes from the flock's normal production pattern.

**Pay attention to feed and water.**

Changes in feed consumption or interruptions in water availability can affect flock performance. Recording these alongside egg production gives you useful context when production changes.

**Consider flock age.**

Layer performance changes as birds progress through their production cycle. Knowing the age and history of a flock helps you interpret production numbers more realistically.

**Monitor flock health.**

Disease, health problems, and environmental stress can affect production. Keeping health and vaccination records alongside production records makes it easier to connect events with changes in performance.

**Look for trends rather than isolated numbers.**

A single low-production day does not necessarily indicate a serious problem. A persistent change in the production pattern deserves closer attention.

Good production management starts with good records. The objective is not simply to collect numbers, but to use them to understand what is happening inside the flock.
`,
  },

  {
    slug: "dashboard-walkthrough",
    type: "video",
    title: "AgroSense Dashboard Walkthrough",
    description:
      "Take a quick tour of the AgroSense dashboard and see where to find your most important poultry-farm information.",
    videoSrc: "/resources/dashboard-walkthrough.mp4",
    category: "AgroSense Guides",
    readTime: "6 min watch",
    date: "2026-08-15",
  },

  {
    slug: "understanding-poultry-feed-costs",
    type: "article",
    title: "Understanding Poultry Feed Costs",
    description:
      "Learn how to track feed usage and understand its effect on the economics of your poultry operation.",
    image: "/resources/feeds.png",
    category: "Feed & Costs",
    readTime: "7 min read",
    date: "2026-08-10",
    body: `
Feed is one of the most important operating costs in poultry production. Understanding how much feed your flock consumes and what that feed costs can give you a clearer picture of farm performance.

**Track feed consumption.**

Record the amount of feed used by each flock rather than relying only on purchases or estimates.

**Separate usage from purchasing.**

The amount of feed purchased and the amount consumed are not necessarily the same. Keeping both records helps you understand inventory and actual flock consumption.

**Watch consumption alongside production.**

For layers, feed consumption can be considered alongside egg production. For broilers, feed consumption can be considered alongside growth and flock performance.

The goal is not simply to use less feed. Birds need adequate nutrition for healthy growth and production.

**Track the cost.**

Feed price changes can significantly affect the economics of a flock. Recording feed costs over time helps you understand how changing prices affect your operation.

**Use your own farm records.**

Every farm is different. Your own historical records can become one of the most useful references for understanding normal feed consumption and identifying unusual changes.
`,
  },

  {
    slug: "poultry-farm-record-keeping",
    type: "guide",
    title: "Poultry Farm Record-Keeping Guide",
    description:
      "A practical guide to the records every poultry farmer should consider keeping and why they matter.",
    image: "/resources/record-keeping.jpg",
    category: "Farm Management",
    readTime: "6 min read",
    date: "2026-08-05",
    body: `
Good farm management starts with reliable records.

You don't need complicated paperwork. You need consistent records that help you answer important questions about your flock.

**Flock records**

Keep track of flock identity, breed, placement date, initial population, current population, and housing location.

**Production records**

For layers, this can include daily egg collection. For other production systems, relevant production measurements should be recorded according to the flock's purpose.

**Feed records**

Record feed type, quantity used, and cost where possible.

**Health records**

Keep records of health events, treatments where appropriate, vaccination schedules, and other important interventions.

**Mortality and culling**

Record losses consistently and, where known, the relevant reason or cause.

**Financial records**

Track important farm expenses and income so that production performance can eventually be understood in financial terms.

The value of record keeping increases over time. A consistent history gives you something much more useful than memory when making farm decisions.
`,
  },

  {
    slug: "poultry-biosecurity-basics",
    type: "article",
    title: "Poultry Biosecurity Basics",
    description:
      "Understand the everyday practices that can help reduce disease risks around a poultry operation.",
    image: "/resources/biosecurity.jpg",
    category: "Health & Biosecurity",
    readTime: "8 min read",
    date: "2026-07-30",
  },

  {
    slug: "poultry-market-prices-explained",
    type: "article",
    title: "Understanding Poultry Market Prices",
    description:
      "Learn why poultry prices vary, what market information can tell you, and why local context matters when making selling decisions.",
    image: "/resources/market-guide.jpg",
    category: "Market Intelligence",
    readTime: "7 min read",
    date: "2026-07-25",
  },
];

export const categories: Array<"All" | ResourceCategory> = [
  "All",
  "AgroSense Guides",
  "Poultry Farming",
  "Farm Management",
  "Production",
  "Health & Biosecurity",
  "Feed & Costs",
  "Market Intelligence",
];
