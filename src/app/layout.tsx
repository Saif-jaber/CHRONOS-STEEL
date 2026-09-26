import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

/**
 * Two faces doing two jobs, plus one specialist.
 *
 * Playfair Display is a high-contrast Didone-adjacent serif and it carries
 * storytelling headlines only, it is never asked to set a price, a label or a
 * spec. Inter is the whole functional layer: navigation, body copy, buttons,
 * form controls, eyebrows. It tracks at +0.05em in the interface and +0.12em on
 * uppercase nav, which is what keeps the sans from reading as software.
 *
 * JetBrains Mono appears in exactly one role: the measurement column of a
 * specification table, where a 44.0 mm has to line up with a 12.1 mm. Used
 * anywhere else it would read as decoration, and decoration is the thing this
 * brand cannot afford.
 */

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const SITE = {
  name: "Chronos & Steel",
  tagline: "Mechanical watches, specified to the millimetre.",
  url: "https://chronosandsteel.example",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.tagline,
  applicationName: SITE.name,
  /* "C&S" monogram. Served from src/app/icon.svg; declaring it explicitly keeps
     the name Next files it under predictable. */
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.tagline,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.tagline,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F4F0",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${jetbrains.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
