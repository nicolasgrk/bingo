// app/leaderboard/page.tsx
import { PrismaClient, type Profile } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Medal, Award, ShieldQuestion } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Pour l'utilisateur connecté (optionnel ici)

import prisma from '@/lib/prisma'; // Ajustez le chemin si nécessaire
;

interface UserTotalScore {
  userId: string;
  username: string | null;
  totalScore: number;
  // On pourrait ajouter le nombre d'événements participés, etc.
}

export default async function GeneralLeaderboardPage() {
  // Optionnel: récupérer l'utilisateur connecté si on veut personnaliser l'affichage pour lui
  // const supabase = createSupabaseServerClient();
  // const { data: { user: authUser } } = await supabase.auth.getUser();

  let leaderboardData: UserTotalScore[] = [];

  try {
    // Récupérer tous les profils
    const allProfiles = await prisma.profile.findMany({
      select: {
        id: true,
        username: true,
      }
    });

    // Pour chaque profil, calculer le score total
    const scoresPromises = allProfiles.map(async (profile) => {
      const participations = await prisma.eventParticipant.findMany({
        where: { userId: profile.id },
        include: {
          bingoCard: { // Inclure la carte de bingo pour obtenir le score
            select: {
              score: true,
            }
          }
        }
      });

      let totalScoreForUser = 0;
      participations.forEach(participation => {
        if (participation.bingoCard && participation.bingoCard.score) {
          totalScoreForUser += participation.bingoCard.score;
        }
      });

      return {
        userId: profile.id,
        username: profile.username,
        totalScore: totalScoreForUser,
      };
    });

    leaderboardData = await Promise.all(scoresPromises);

    // Trier par score total décroissant
    leaderboardData.sort((a, b) => b.totalScore - a.totalScore);

  } catch (error) {
    console.error("Erreur Prisma lors de la récupération des données du classement général:", error);
    // Gérer l'erreur, peut-être afficher un message à l'utilisateur
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
            <Link href="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux événements
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-center tracking-tight text-primary">Classement Général</h1>
          <p className="text-xl text-muted-foreground text-center mt-2">Tous les joueurs, tous les événements</p>
        </div>

        {leaderboardData.length === 0 ? (
          <div className="neumorphic-card text-center py-10">
            <ShieldQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">Aucune donnée de classement disponible pour le moment.</p>
            <p className="text-sm mt-2">Participez à des événements et marquez des points !</p>
          </div>
        ) : (
          <div className="neumorphic-card p-0 md:p-0 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Rang</TableHead>
                  <TableHead>Joueur</TableHead>
                  <TableHead className="text-right">Score Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((player, index) => (
                  <TableRow key={player.userId}>
                    <TableCell className="font-medium text-center">
                      <div className="flex items-center justify-center">
                        {getRankIcon(index + 1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/users/${player.userId}`} className="hover:underline">
                          {player.username || 'Joueur Inconnu'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{player.totalScore}</TableCell>
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
