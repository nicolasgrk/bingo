// components/navigation/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Home, CalendarDays, PlusCircle, Trophy, Users, Compass } from "lucide-react"; // Icônes

interface BottomNavProps {
  user: User | null;
}

export function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Accueil", icon: <Home className="h-5 w-5" /> },
    { href: "/my-events", label: "Mes Bingos", icon: <CalendarDays className="h-5 w-5" />, authRequired: true },
    { href: "/events/create", label: "Créer", icon: <PlusCircle className="h-7 w-7 text-primary" />, authRequired: true, isCentral: true },
    { href: "/events", label: "Explorer", icon: <Compass className="h-5 w-5" /> },
    { href: "/leaderboard", label: "Classement", icon: <Trophy className="h-5 w-5" /> },
  ];

  // Si l'utilisateur n'est pas connecté, on pourrait afficher une version simplifiée ou rien du tout.
  // Pour l'instant, on filtre les items qui nécessitent une authentification.
  const filteredNavItems = user 
    ? navItems 
    : navItems.filter(item => !item.authRequired || item.href === "/events" || item.href === "/leaderboard" || item.href === "/"); // Ajustez selon les liens visibles pour non-connectés


  // Ne pas afficher la BottomNav sur la page d'authentification
  if (pathname === "/auth") {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="neumorphic-panel mx-auto mb-4 grid h-16 max-w-lg items-center text-center text-xs font-medium rounded-2xl" 
           style={{gridTemplateColumns: `repeat(${filteredNavItems.length}, minmax(0, 1fr))`, padding: '0.5rem 0.5rem'}}>
        {filteredNavItems.map((item) => {
          if (item.authRequired && !user) return null;
          const isActive = (item.href === "/" && pathname === "/") || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all",
                isActive ? "neumorphic-inset bg-white text-primary" : "hover:bg-white/60 text-muted-foreground",
                item.isCentral ? "-mt-1" : ""
              )}
            >
              {item.icon}
              <span className={cn("text-[10px] leading-tight", item.isCentral ? "font-semibold" : "")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
