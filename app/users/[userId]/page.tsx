// app/users/[userId]/page.tsx
import { PrismaClient, type Profile, type Event, type EventParticipant } from '@prisma/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Hash, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

// Type pour une participation avec les détails de l'événement inclus
type ParticipationWithEventDetails = EventParticipant & {
  event: Event | null;
};

interface UserProfilePageProps {
  params: {
    userId: string; // L'ID de l'utilisateur dont on affiche le profil
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId: profileUserId } = params;
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser(); // L'utilisateur actuellement connecté

  let profile: Profile | null = null;
  let participations: ParticipationWithEventDetails[] = [];
  let createdEvents: Event[] = [];

  try {
    profile = await prisma.profile.findUnique({
      where: { id: profileUserId },
    });

    if (profile) {
      // Récupérer les événements auxquels l'utilisateur participe
      participations = await prisma.eventParticipant.findMany({
        where: {
          userId: profileUserId,
          // On ne montre que les participations à des événements publics sur un profil public,
          // ou les événements privés si l'utilisateur connecté est le propriétaire du profil ou le créateur de l'événement.
          // Pour simplifier, on peut d'abord tout récupérer et filtrer ensuite, ou affiner la requête.
          // Pour l'instant, récupérons tout et laissons les RLS sur 'event' potentiellement filtrer si on accède aux détails.
          // Ou mieux, filtrons ici pour ne montrer que les événements publics ou ceux créés par le profilUserId.
        },
        include: {
          event: true, // Inclure les détails de l'événement
        },
        orderBy: {
          event: {
            createdAt: 'desc',
          },
        },
      });

      // Filtrer les participations pour ne montrer que les événements publics
      // ou les événements privés si l'utilisateur connecté est le propriétaire du profil
      // (cette logique peut être affinée selon les règles de confidentialité souhaitées)
      participations = participations.filter(p => 
        p.event?.isPublic || (authUser?.id === profileUserId && p.event) // Le propriétaire du profil voit ses événements privés
      );


      // Récupérer les événements créés par cet utilisateur
      createdEvents = await prisma.event.findMany({
        where: {
          creatorId: profileUserId,
          // Idem, filtrer pour la visibilité si nécessaire.
          // Pour l'instant, on montre tous les événements créés par l'utilisateur.
          // Si l'événement est privé, seul le créateur ou les participants autorisés le verront en détail.
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
  } catch (error) {
    console.error("Erreur Prisma lors de la récupération des données du profil:", error);
    // Gérer l'erreur, peut-être afficher un message d'erreur global
  }

  if (!profile) {
    notFound(); // Affiche une page 404 si le profil n'est pas trouvé
  }

  const isOwnProfile = authUser?.id === profileUserId;

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <div className="mb-8">
        <Button variant="outline" size="sm" asChild className="mb-6">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux événements
          </Link>
        </Button>
        <div className="flex items-center space-x-4">
          {/* Placeholder pour avatar */}
          <div className="p-3 bg-muted rounded-full">
            <UserCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{profile.username}</h1>
            <p className="text-sm text-muted-foreground">Profil utilisateur</p>
          </div>
        </div>
        {isOwnProfile && (
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link href="/profile">Modifier mon profil</Link>
          </Button>
        )}
      </div>

      {/* Événements Créés */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Événements Créés</h2>
        {createdEvents.length > 0 ? (
          <div className="space-y-4">
            {createdEvents.map(event => (
              <Link href={`/events/${event.id}`} key={event.id} className="block hover:no-underline">
                <div className="glassmorphic-card p-4 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-primary">{event.name}</h3>
                    {event.isPublic ? <Badge variant="outline">Public</Badge> : <Badge variant="secondary">Privé</Badge>}
                  </div>
                  {event.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
                  <div className="text-xs text-muted-foreground mt-2 flex items-center">
                    <CalendarDays className="h-3 w-3 mr-1.5" />
                    {event.eventDate ? new Date(event.eventDate).toLocaleDateString('fr-FR') : 'Date non définie'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Cet utilisateur n'a créé aucun événement.</p>
        )}
      </section>

      {/* Participations aux Événements */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Participations aux Événements</h2>
        {participations.length > 0 ? (
          <div className="space-y-4">
            {participations.map(participation => participation.event && ( // S'assurer que participation.event existe
              <Link href={`/events/${participation.event.id}`} key={participation.id} className="block hover:no-underline">
                <div className="glassmorphic-card p-4 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium">{participation.event.name}</h3>
                     {participation.event.isPublic ? <Badge variant="outline">Public</Badge> : <Badge variant="secondary">Privé</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 flex items-center">
                    <CalendarDays className="h-3 w-3 mr-1.5" />
                    {participation.event.eventDate ? new Date(participation.event.eventDate).toLocaleDateString('fr-FR') : 'Date non définie'}
                  </div>
                  {/* On pourrait ajouter un lien direct vers la carte de l'utilisateur pour cet événement si c'est son propre profil */}
                  {/* {isOwnProfile && (
                    <Button variant="link" size="sm" asChild className="mt-1 p-0 h-auto">
                      <Link href={`/events/${participation.event.id}/my-card`}>Voir ma grille</Link>
                    </Button>
                  )} */}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Cet utilisateur n'a participé à aucun événement (visible).</p>
        )}
      </section>
    </div>
  );
}
