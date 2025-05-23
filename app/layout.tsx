// app/layout.tsx
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { HeaderNav } from "@/components/navigation/header-nav";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Head from "next/head";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Bingo Friends App",
  description: "Jouez au bingo entre amis !",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="fr" suppressHydrationWarning className="h-full"> {/* Ajout de h-full ici */}
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6d5dfc" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <body
        className={cn(
          "min-h-full bg-background font-sans antialiased flex flex-col", // min-h-full au lieu de min-h-screen
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <HeaderNav user={user} />
          
          {/* Le contenu principal prendra l'espace restant */}
          {/* Ajout de overflow-y-auto pour permettre le scroll interne si le contenu dépasse */}
          <main className="flex-grow container mx-auto px-4 pt-4 pb-20 md:pb-8 overflow-y-auto">
            {children}
          </main>
          
          <BottomNav user={user} />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
