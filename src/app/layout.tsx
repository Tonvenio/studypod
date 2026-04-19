import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "studypod.ai — AI-Powered Audio Flashcards",
  description: "Study smarter with AI-generated audio flashcards. Research any topic, listen to learn, export to Anki.",
  keywords: ["flashcards", "study", "audio", "anki", "AI", "learning"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('studypod-theme');
            if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
          } catch {}
        `}} />
      </head>
      <body className="min-h-screen font-sans antialiased" style={{ background: 'var(--c-bg)', color: 'var(--c-fg)' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
