// app/profile/actions.ts
"use server";

import { z } from "zod";
import { PrismaClient, type Profile } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

// Schéma pour les données de mise à jour du profil
const UpdateProfileSchema = z.object({
  userId: z.string().uuid("ID utilisateur invalide."), // L'ID de l'utilisateur dont on met à jour le profil
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères.").max(50, "Maximum 50 caractères."),
  // avatarUrl: z.string().url("URL de l'avatar invalide.").optional().or(z.literal('')), // Permet une chaîne vide
});

interface UpdateProfileActionProps {
  userId: string;
  username: string;
  // avatarUrl?: string;
}

export async function updateProfileAction(
  payload: UpdateProfileActionProps
): Promise<{ error?: string | null; data?: Profile | null }> {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "Utilisateur non authentifié.", data: null };
  }

  // Vérifier que l'utilisateur connecté est bien celui dont on essaie de modifier le profil
  if (authUser.id !== payload.userId) {
    return { error: "Action non autorisée : vous ne pouvez modifier que votre propre profil.", data: null };
  }

  const validatedFields = UpdateProfileSchema.safeParse(payload);

  if (!validatedFields.success) {
    const errors = Object.values(validatedFields.error.flatten().fieldErrors).flat().join(', ');
    return { error: `Erreurs de validation: ${errors}`, data: null };
  }

  const { userId, username /*, avatarUrl */ } = validatedFields.data;

  try {
    // Vérifier si le nouveau nom d'utilisateur est déjà pris par quelqu'un d'autre
    if (username) {
      const existingUserWithUsername = await prisma.profile.findUnique({
        where: { username: username },
      });
      // Si le username existe ET qu'il n'appartient pas à l'utilisateur actuel
      if (existingUserWithUsername && existingUserWithUsername.id !== userId) {
        return { error: "Ce nom d'utilisateur est déjà pris.", data: null };
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: userId }, // L'ID de l'utilisateur à mettre à jour
      data: {
        username: username,
        // avatarUrl: avatarUrl || null, // Mettre à null si chaîne vide
        // updatedAt est géré automatiquement par @updatedAt
      },
    });

    revalidatePath("/profile"); // Revalider la page de profil
    // Revalider d'autres pages où le username pourrait être affiché (ex: header, listes d'événements)
    revalidatePath("/"); 
    revalidatePath("/events");


    return { error: null, data: updatedProfile };
  } catch (e: any) {
    console.error("Database error updating profile:", e);
     if (e.code === 'P2002' && e.meta?.target?.includes('username')) {
      return { error: "Ce nom d'utilisateur est déjà pris (erreur base de données).", data: null };
    }
    return { error: "Erreur de base de données lors de la mise à jour du profil.", data: null };
  }
}
