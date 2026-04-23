import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Press_Start_2P } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "studypod.ai — AI-Powered Audio Flashcards",
  description: "Study smarter with AI-generated audio flashcards. Research any topic, listen to learn, export to Anki.",
  keywords: ["flashcards", "study", "audio", "anki", "AI", "learning"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "studypod.ai",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0B0E17" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#E8E4D8" media="(prefers-color-scheme: light)" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('studypod-theme');
            if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
          } catch {}
        `}} />
      </head>
      <body className="min-h-screen font-sans antialiased overscroll-none" style={{ background: 'var(--c-bg)', color: 'var(--c-fg)' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
