// app/events/[eventId]/leaderboard/page.tsx
import { PrismaClient, type Event as PrismaEvent, type Profile, type EventParticipant as PrismaEventParticipant, type BingoCard } from '@prisma/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

// Type pour les champs sélectionnés de l'événement
type SelectedEventFields = {
  id: string;
  name: string;
  isPublic: boolean;
  creatorId: string;
};

// Utiliser l'alias PrismaEventParticipant ici
type ParticipantWithScore = PrismaEventParticipant & {
  user: Profile | null;
  bingoCard: BingoCard | null;
};

interface EventLeaderboardPageProps {
  params: {
    eventId: string;
  };
}

export default async function EventLeaderboardPage({ params }: EventLeaderboardPageProps) {
  const { eventId } = params;
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  // Utiliser le nouveau type pour l'événement
  let event: SelectedEventFields | null = null;
  let participantsWithScores: ParticipantWithScore[] = [];

  try {
    event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, isPublic: true, creatorId: true } // Sélectionner les champs nécessaires
    });

    if (event) {
      const participants = await prisma.eventParticipant.findMany({
        where: { eventId: eventId },
        include: {
          user: true, // Pour le nom d'utilisateur
          bingoCard: true, // Pour le score
        },
        orderBy: [
          { bingoCard: { score: 'desc' } },
          { joinedAt: 'asc' },
        ],
      });
      participantsWithScores = participants;

      const isParticipantOrCreator = authUser && 
        (event.creatorId === authUser.id || participants.some(p => p.userId === authUser.id));
      
      if (!event.isPublic && !isParticipantOrCreator) {
        return (
            <div className="container mx-auto max-w-2xl py-12 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Accès Refusé</h1>
                <p className="text-red-500">Vous n'avez pas la permission de voir le classement de cet événement privé.</p>
                <Button variant="outline" asChild className="mt-6">
                    <Link href={`/events/${eventId}`}>Retour à l'événement</Link>
                </Button>
            </div>
        );
      }

    }
  } catch (error) {
    console.error("Erreur Prisma lors de la récupération des données du classement:", error);
  }

  if (!event) {
    notFound();
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-400" />;
    return <span className="text-sm font-medium">{rank}</span>;
  };

  return (
    <div className="flex justify-center min-h-[80vh] py-12 px-2 sm:px-4">
      <div className="neumorphic-panel w-full max-w-3xl mx-auto">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Button variant="outline" size="sm" asChild className="mb-2 rounded-full">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'événement
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-center tracking-tight text-primary">Classement de l'Événement</h1>
          <p className="text-xl text-muted-foreground text-center mt-2">{event.name}</p>
        </div>

        {participantsWithScores.length === 0 ? (
          <div className="neumorphic-card text-center py-10">
            <p className="text-xl text-muted-foreground">Aucun participant ou score enregistré pour cet événement.</p>
          </div>
        ) : (
          <div className="neumorphic-card p-0 md:p-0 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Rang</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantsWithScores.map((participant, index) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium text-center">
                      <div className="flex items-center justify-center">
                        {getRankIcon(index + 1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/users/${participant.userId}`} className="hover:underline">
                          {participant.user?.username || 'Participant Inconnu'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{participant.bingoCard?.score ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
