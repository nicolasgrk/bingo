import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import webpush from "web-push";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { title, body, url, userIds } = await request.json();

    // Récupérer les subscriptions des utilisateurs concernés avec Prisma
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });

    // Envoyer la notification à chaque abonné
    const notifications = subscriptions.map(sub => {
      const pushSubscription = sub.subscription as unknown as webpush.PushSubscription;
      return webpush.sendNotification(
        pushSubscription,
        JSON.stringify({
          title,
          body,
          url
        })
      ).catch(async (error) => {
        console.error("Erreur lors de l'envoi de la notification:", error);
        // Si la subscription n'est plus valide, la supprimer
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: {
              id: sub.id
            }
          });
        }
      });
    });

    await Promise.all(notifications);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'envoi des notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
} 