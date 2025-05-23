// components/navigation/header-nav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js"; // Importer AuthChangeEvent
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutGrid, LogOut, Settings, UserCircle, Users, PlusCircle, Trophy, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface HeaderNavProps {
  user: User | null; // L'utilisateur initial passé par le serveur
}

export function HeaderNav({ user: initialUser }: HeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [loadingSession, setLoadingSession] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setLoadingSession(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setLoadingSession(false);
      if (!session && initialUser && pathname !== "/auth") {
        // router.refresh(); 
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => { 
        console.log("HeaderNav onAuthStateChange:", event, session);
        setCurrentUser(session?.user ?? null);
        setLoadingSession(false);

        const handleSignOutOrDelete = () => {
          if (pathname !== "/auth" && !pathname.startsWith("/public")) { // Ajuster les chemins publics si besoin
            router.push("/auth?message=Session terminée.");
          }
          router.refresh(); 
        };

        // Caster 'event' en 'string' pour le switch pour éviter l'erreur TS2678
        switch (event as string) {
          case "SIGNED_OUT":
            handleSignOutOrDelete();
            break;
          case "USER_DELETED": 
            handleSignOutOrDelete();
            break;
          case "USER_UPDATED":
            if (!session) {
              // Cas où l'utilisateur est mis à jour mais la session devient nulle
              if (pathname !== "/auth" && !pathname.startsWith("/public")) {
                  router.push("/auth?message=Session invalidée suite à une mise à jour.");
              }
              router.refresh();
            } else {
              // L'utilisateur a été mis à jour et la session est toujours valide
              router.refresh(); // Rafraîchir pour prendre en compte les mises à jour du profil
            }
            break;
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
          case "MFA_CHALLENGE_VERIFIED": // Regrouper les événements qui signifient une session active/renouvelée
            if (pathname === "/auth") {
              router.push("/");
            }
            router.refresh();
            break;
          case "INITIAL_SESSION":
            if (!session && initialUser && pathname !== "/auth") {
              toast.info("Votre session a peut-être expiré.");
              router.refresh();
            }
            break;
          case "PASSWORD_RECOVERY":
            router.refresh();
            break;
          default:
            // Gère tous les autres AuthChangeEvent non listés explicitement
            // ou si 'event' n'est pas l'un des cas ci-dessus.
            // console.log("Unhandled AuthChangeEvent:", event);
            break;
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, supabase.auth, initialUser, pathname]);


  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service worker PWA enregistré:", reg);
          if ("Notification" in window) {
            setNotificationPermission(Notification.permission);
          }
        })
        .catch((err) => {
          console.warn("Erreur lors de l'enregistrement du service worker PWA:", err);
        });
    } else if (typeof window !== "undefined" && "Notification" in window) {
        setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window) || !currentUser) {
      toast.error("Les notifications ne sont pas supportées ou vous n'êtes pas connecté.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        toast.success("Notifications activées !");
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            console.log("Souscription push existante:", existingSubscription);
            return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            toast.error("Clé VAPID manquante pour les notifications push.");
            console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY n'est pas défini.");
            return;
        }
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        });

        console.log("Nouvelle souscription push:", subscription);
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, userId: currentUser.id }),
        });
      } else {
        toast.info(`Permission de notification : ${permission}`);
      }
    } catch (error) {
      console.error("Erreur demande de permission de notification / souscription:", error);
      toast.error("Erreur lors de l'activation des notifications.");
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Erreur lors de la déconnexion: " + error.message);
  };

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/my-events", label: "Mes Événements", authRequired: true },
    { href: "/events", label: "Explorer" },
    { href: "/leaderboard", label: "Classement" },
  ];

  if (loadingSession && !currentUser && initialUser && pathname !== "/auth") {
    return (
        <header className="sticky top-0 z-50 w-full bg-transparent">
          <div className="neumorphic-panel mx-auto mt-4 flex items-center justify-between gap-8 px-8 py-3 rounded-3xl max-w-6xl">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold sm:inline-block text-xl">QuoicouBingo</span>
            </Link>
            <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        </header>
      );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent print:hidden">
      <div className="neumorphic-panel mx-auto mt-4 flex items-center justify-between gap-8 px-8 py-3 rounded-3xl max-w-6xl">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold sm:inline-block text-xl text-[var(--foreground)]">QuoicouBingo</span>
        </Link>
        <nav className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center gap-2">
            {navLinks.map((link) => {
              if (link.authRequired && !currentUser) return null;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-5 py-2 rounded-xl font-medium transition-all text-base",
                    isActive ? "neumorphic-inset bg-white dark:bg-slate-700 text-primary" : "hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground dark:text-gray-300 dark:hover:text-primary"
                  )}
                  style={{ minWidth: '7rem', textAlign: 'center' }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="flex items-center space-x-2 md:space-x-3">
          {currentUser && (
            <>
              { "Notification" in window && Notification.permission !== "denied" && (
                <Button
                    variant="outline"
                    size="icon"
                    className="neumorphic-inset rounded-full p-2"
                    onClick={requestNotificationPermission}
                    title={notificationPermission === 'granted' ? 'Notifications activées' : (notificationPermission === 'denied' ? 'Notifications bloquées' : 'Activer les notifications')}
                    disabled={notificationPermission === 'denied'}
                >
                    <Bell className={`h-5 w-5 ${notificationPermission === 'granted' ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                </Button>
              )}
              <Button asChild variant="outline" size="icon" className="neumorphic-inset rounded-full p-2">
                <Link href="/events/create" title="Créer un nouvel événement">
                  <PlusCircle className="h-5 w-5" />
                </Link>
              </Button>
            </>
          )}
          <ThemeSwitcher />
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="relative h-9 w-9 rounded-full bg-transparent p-0 border-0 focus:outline-none neumorphic-inset">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={currentUser.user_metadata?.avatar_url} alt={currentUser.user_metadata?.username || currentUser.email} />
                    <AvatarFallback>
                      {currentUser.email?.[0]?.toUpperCase() || <UserCircle className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 neumorphic-panel mt-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1 p-1">
                    <p className="text-sm font-medium leading-none">
                      {currentUser.user_metadata?.username || currentUser.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="hover:bg-white/50 dark:hover:bg-white/5">
                  <Link href="/profile">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Mon Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="hover:bg-white/50 dark:hover:bg-white/5 text-red-600 dark:text-red-400 dark:hover:text-red-300">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             pathname !== "/auth" && (
                <Button asChild size="sm" className="neumorphic-btn">
                <Link href="/auth">Connexion</Link>
                </Button>
             )
          )}
        </div>
      </div>
    </header>
  );
}
