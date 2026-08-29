// "use client"

// import { useTheme } from "next-themes"
// import { Toaster as Sonner, type ToasterProps } from "sonner"
// import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// const Toaster = ({ ...props }: ToasterProps) => {
//   const { theme = "system" } = useTheme()

//   return (
//     <Sonner
//       theme={theme as ToasterProps["theme"]}
//       className="toaster group"
//       icons={{
//         success: (
//           <CircleCheckIcon className="size-4" />
//         ),
//         info: (
//           <InfoIcon className="size-4" />
//         ),
//         warning: (
//           <TriangleAlertIcon className="size-4" />
//         ),
//         error: (
//           <OctagonXIcon className="size-4" />
//         ),
//         loading: (
//           <Loader2Icon className="size-4 animate-spin" />
//         ),
//       }}
//       style={
//         {
//           "--normal-bg": "var(--popover)",
//           "--normal-text": "var(--popover-foreground)",
//           "--normal-border": "var(--border)",
//           "--border-radius": "var(--radius)",
//         } as React.CSSProperties
//       }
//       toastOptions={{
//         classNames: {
//           toast: "cn-toast",
//         },
//       }}
//       {...props}
//     />
//   )
// }

// export { Toaster }
// src/components/ui/sonner.tsx
"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { 
  CircleCheckIcon, 
  InfoIcon, 
  TriangleAlertIcon, 
  OctagonXIcon, 
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      offset="280px"  // 👈 This pushes it down below the navbar
      gap={12}
      icons={{
        success: (
          <CircleCheckIcon className="size-5 text-emerald-400" />
        ),
        info: (
          <InfoIcon className="size-5 text-blue-400" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5 text-amber-400" />
        ),
        error: (
          <OctagonXIcon className="size-5 text-red-400" />
        ),
        loading: (
          <Loader2Icon className="size-5 animate-spin text-amber-400" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--toast-width": "420px",
          "--toast-padding": "16px 20px",
          "--toast-gap": "12px",
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: `
            group-[.toaster]:bg-card
            group-[.toaster]:text-foreground
            group-[.toaster]:border-border
            group-[.toaster]:shadow-lg
            group-[.toaster]:shadow-black/5
            group-[.toaster]:rounded-xl
            group-[.toaster]:backdrop-blur-sm
            group-[.toaster]:gap-3
            group-[.toaster]:p-4
            group-[.toaster]:border
            group-[.toaster]:min-h-[72px]
            group-[.toaster]:max-w-[420px]
          `,
          title: `
            group-[.toaster]:text-sm
            group-[.toaster]:font-semibold
            group-[.toaster]:tracking-tight
            group-[.toaster]:text-foreground
          `,
          description: `
            group-[.toaster]:text-sm
            group-[.toaster]:leading-relaxed
            group-[.toaster]:text-muted-foreground
          `,
          actionButton: `
            group-[.toaster]:bg-primary
            group-[.toaster]:text-primary-foreground
            group-[.toaster]:px-4
            group-[.toaster]:py-1.5
            group-[.toaster]:rounded-lg
            group-[.toaster]:text-xs
            group-[.toaster]:font-medium
            group-[.toaster]:transition-all
            group-[.toaster]:hover:opacity-90
            group-[.toaster]:active:scale-95
          `,
          cancelButton: `
            group-[.toaster]:bg-muted
            group-[.toaster]:text-muted-foreground
            group-[.toaster]:px-4
            group-[.toaster]:py-1.5
            group-[.toaster]:rounded-lg
            group-[.toaster]:text-xs
            group-[.toaster]:font-medium
            group-[.toaster]:transition-all
            group-[.toaster]:hover:bg-muted/80
            group-[.toaster]:active:scale-95
          `,
          closeButton: `
            group-[.toaster]:bg-muted/50
            group-[.toaster]:text-muted-foreground
            group-[.toaster]:rounded-full
            group-[.toaster]:p-1
            group-[.toaster]:transition-all
            group-[.toaster]:hover:bg-muted
            group-[.toaster]:hover:text-foreground
            group-[.toaster]:size-6
            group-[.toaster]:top-3
            group-[.toaster]:right-3
          `,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
