// components/navigation/header-nav.tsx
"use client"; // Ce composant utilise des hooks et des interactions client

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // `npx shadcn@latest add avatar`
import { LayoutGrid, LogOut, Settings, UserCircle, Users, PlusCircle, Trophy } from "lucide-react";
import { useEffect } from "react";

interface HeaderNavProps {
  user: User | null;
}

export function HeaderNav({ user }: HeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // Enregistrement du service worker PWA
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service worker enregistré:", reg);
        })
        .catch((err) => {
          console.warn("Erreur lors de l'enregistrement du service worker:", err);
        });
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: "Accueil", icon: <LayoutGrid className="h-4 w-4" /> },
    { href: "/my-events", label: "Mes Événements", icon: <Users className="h-4 w-4" />, authRequired: true },
    { href: "/events", label: "Explorer", icon: <LayoutGrid className="h-4 w-4" /> },
    { href: "/leaderboard", label: "Classement", icon: <Trophy className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div className="neumorphic-panel mx-auto mt-4 flex items-center justify-between gap-8 px-8 py-3 rounded-3xl max-w-6xl">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold sm:inline-block text-xl">QuoicouBingo</span>
        </Link>
        <nav className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center gap-2">
            {navLinks.map((link) => {
              if (link.authRequired && !user) return null;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-5 py-2 rounded-xl font-medium transition-all text-base",
                    isActive ? "neumorphic-inset bg-white text-primary" : "hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground dark:text-gray-300 dark:hover:text-primary"
                  )}
                  style={{ minWidth: '7rem', textAlign: 'center' }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="flex items-center space-x-2 md:space-x-4">
          {user && (
            <Button asChild variant="outline" size="icon" className="neumorphic-inset rounded-full">
              <Link href="/events/create" title="Créer un nouvel événement">
                <PlusCircle className="h-6 w-6" />
              </Link>
            </Button>
          )}
          <ThemeSwitcher />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="relative h-8 w-8 rounded-full bg-transparent p-0 border-0 focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.username || user.email} />
                    <AvatarFallback>
                      {user.email?.[0]?.toUpperCase() || <UserCircle className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.username || user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Mon Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">Connexion</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
