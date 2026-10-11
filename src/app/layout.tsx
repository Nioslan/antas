import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ANTASPC — La PC que imaginas",
    template: "%s | ANTASPC",
  },
  description:
    "PCs premium para Gaming, Streaming y Trabajo. Renew, Hybrid y Elite. Usa tu PC actual como parte de pago.",
  metadataBase: new URL("https://www.antaspc.com"),
  openGraph: {
    type: "website",
    locale: "es_US",
    siteName: "ANTASPC",
    title: "ANTASPC — La PC que imaginas",
    description:
      "PCs premium para Gaming, Streaming y Trabajo. Renew, Hybrid y Elite. Usa tu PC actual como parte de pago.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ANTASPC — La PC que imaginas",
    description:
      "PCs premium para Gaming, Streaming y Trabajo. Renew, Hybrid y Elite.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#05070C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
