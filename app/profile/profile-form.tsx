// app/profile/profile-form.tsx
"use client";

import { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@prisma/client";
import { updateProfileAction } from "./actions"; // Server Action que nous allons créer

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProfileFormProps {
  userProfile: Profile;
}

export function ProfileForm({ userProfile }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [username, setUsername] = useState(userProfile.username || "");
  // Plus tard, vous pourrez ajouter d'autres champs comme avatarUrl
  // const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim()) {
      toast.error("Le nom d'utilisateur ne peut pas être vide.");
      return;
    }
    if (username.trim() === userProfile.username) {
      toast.info("Aucune modification détectée pour le nom d'utilisateur.");
      return;
    }

    startTransition(() => {
      updateProfileAction({
        userId: userProfile.id, // L'ID de l'utilisateur dont on met à jour le profil
        username: username.trim(),
        // avatarUrl: avatarUrl.trim(), // Si vous ajoutez la gestion de l'avatar
      }).then(result => {
        if (result.error) {
          toast.error(result.error);
        } else if (result.data) {
          toast.success("Profil mis à jour avec succès !");
          // Mettre à jour l'état local si nécessaire ou rafraîchir
          // Pour le username, il est bon de mettre à jour l'état local
          // pour que le champ du formulaire reflète la nouvelle valeur immédiatement.
          setUsername(result.data.username || ""); // Mettre à jour avec la valeur retournée par le serveur
          router.refresh(); // Rafraîchir pour que les autres parties de l'UI (ex: header) se mettent à jour
        }
      }).catch(err => {
        console.error("Erreur inattendue lors de la mise à jour du profil:", err);
        toast.error("Une erreur inattendue s'est produite.");
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email (non modifiable)</Label>
        <Input
          id="email"
          type="email"
          value={userProfile.id === "email-simule-pour-preview" ? "utilisateur@exemple.com" : userProfile.id}
          disabled
          className="mt-1 neumorphic-input"
        />
         <p className="text-xs text-muted-foreground mt-1">Votre email de connexion n'est pas stocké ici et ne peut pas être modifié via ce formulaire.</p>
      </div>
      <div>
        <Label htmlFor="username">Nom d'utilisateur</Label>
        <Input
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isPending}
          className="mt-1 neumorphic-input"
          minLength={3}
          maxLength={50}
        />
      </div>

      {/* // Section pour l'avatar (à implémenter plus tard)
      <div>
        <Label htmlFor="avatarUrl">URL de l'avatar (optionnel)</Label>
        <Input
          id="avatarUrl"
          name="avatarUrl"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          disabled={isPending}
          className="mt-1"
          type="url"
        />
      </div>
      */}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Mise à jour en cours..." : "Sauvegarder les modifications"}
      </Button>
    </form>
  );
}
