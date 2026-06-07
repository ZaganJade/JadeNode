import type { Metadata } from "next";
import { Geist, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CursorFollower } from "@/components/landing/cursor-follower";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { CartProvider } from "@/lib/cart";
import { CartDrawer } from "@/components/cart/cart-drawer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JadeNode — Cloud Infrastructure Marketplace",
  description:
    "Marketplace VPS dan Dedicated Server dari Provider terverifikasi. Order, Invoice, Payment, Provisioning, dan Deployment dalam satu pengalaman digital yang transparan, auditable, dan siap production.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${geist.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Satoshi — display face for the cloned landing (scoped via .studio) */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-fg font-sans antialiased">
        <CartProvider>
          <ScrollProgress />
          <CursorFollower />
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
