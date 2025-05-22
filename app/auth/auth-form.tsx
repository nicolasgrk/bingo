// app/auth/auth-form.tsx
"use client";

import { useState, FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function AuthForm() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!username.trim()) {
      toast.error("Le nom d'utilisateur est requis pour l'inscription.");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
        toast.error("Le mot de passe doit contenir au moins 6 caractères.");
        setIsLoading(false);
        return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Le trigger `handle_new_user` créera une entrée dans `profiles`
        // avec l'email comme username initial.
      },
    });

    if (signUpError) {
      // Gérer le cas où l'utilisateur existe déjà et est confirmé
      if (signUpError.message.includes("User already registered")) { // Le message peut varier
        toast.error("Un utilisateur avec cet email existe déjà. Veuillez vous connecter.");
      } else {
        toast.error(signUpError.message);
      }
    } else if (data.user) {
      // Si data.user existe, l'utilisateur a été créé ou trouvé.
      // Si la confirmation par e-mail est activée, data.session sera null ici.
      // Si elle est désactivée, data.session sera non null.
      if (data.session) {
        // Cas où la confirmation par e-mail est désactivée et l'inscription connecte directement
        toast.success("Inscription et connexion réussies !");
        // Vous pourriez vouloir mettre à jour le username ici si c'est le comportement souhaité
        // ou rediriger vers une page de profil.
        router.push("/");
        router.refresh();
      } else {
        // Cas où la confirmation par e-mail est activée (le plus probable)
        toast.success(
          "Inscription presque terminée !"
        );
        toast.info("Veuillez vérifier vos e-mails pour confirmer votre compte et finaliser l'inscription.");
        toast.info(`Votre nom d'utilisateur initial est basé sur votre email. Vous pourrez le personnaliser après votre première connexion.`);
      }
    } else {
      // Cas inattendu où il n'y a ni erreur, ni data.user.
      // Cela pourrait arriver si la réponse de Supabase est anormale.
      toast.warning(
        "L'inscription a été initiée, mais une réponse inattendue a été reçue. Veuillez vérifier vos e-mails."
      );
    }
    setIsLoading(false);
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      toast.error(signInError.message);
    } else {
      toast.success("Connexion réussie !");
      router.push("/");
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Se connecter</TabsTrigger>
        <TabsTrigger value="signup">S'inscrire</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <Card>
          <form onSubmit={handleSignIn}>
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>
                Accédez à votre compte pour jouer au bingo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email-signin">Email</Label>
                <Input
                  id="email-signin"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="neumorphic-input"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password-signin">Mot de passe</Label>
                <Input
                  id="password-signin"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="neumorphic-input"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
      <TabsContent value="signup">
        <Card>
          <form onSubmit={handleSignUp}>
            <CardHeader>
              <CardTitle>Inscription</CardTitle>
              <CardDescription>
                Créez un compte pour rejoindre la partie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-1">
                <Label htmlFor="username-signup">Nom d'utilisateur souhaité</Label>
                <Input
                  id="username-signup"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="neumorphic-input"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email-signup">Email</Label>
                <Input
                  id="email-signup"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="neumorphic-input"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password-signup">Mot de passe</Label>
                <Input
                  id="password-signup"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="neumorphic-input"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Inscription..." : "S'inscrire"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
