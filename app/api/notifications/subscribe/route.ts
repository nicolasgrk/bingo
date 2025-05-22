import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import webpush from "web-push";
import prisma from "@/lib/prisma";

// Configuration de web-push avec les clés VAPID
webpush.setVapidDetails(
  'mailto:nicolasgurak@gmail.com', // Remplacez par votre email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { subscription } = await request.json();

    // Stocker la subscription dans la base de données avec Prisma
    await prisma.pushSubscription.upsert({
      where: {
        userId: user.id,
      },
      update: {
        subscription: subscription,
      },
      create: {
        userId: user.id,
        subscription: subscription,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'abonnement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
} 