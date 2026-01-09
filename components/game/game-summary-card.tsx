import Link from "next/link";
import type { MafiaGame } from "@/types/game";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface GameSummaryCardProps {
  game: MafiaGame;
}

export function GameSummaryCard({ game }: GameSummaryCardProps) {
  const createdRelative = game.createdAt
    ? formatDistanceToNow(new Date(game.createdAt), { addSuffix: true })
    : "Recently";
  const alive = game.players.filter((player) => player.isAlive).length;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{createdRelative}</span>
          <Badge variant={game.status === "completed" ? "outline" : "secondary"}>
            {game.status}
          </Badge>
        </div>
        <CardTitle className="text-xl">Lobby {game.code}</CardTitle>
        <p className="text-sm text-muted-foreground">Hosted by {game.hostName}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Players</dt>
            <dd className="font-semibold">
              {game.players.length}/{game.config.maxPlayers}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phase</dt>
            <dd className="font-semibold capitalize">{game.phase}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Alive</dt>
            <dd className="font-semibold">{alive}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Round</dt>
            <dd className="font-semibold">{game.round}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter>
        <Button asChild className="ml-auto">
          <Link href={`/game/${game.id}`}>Open lobby</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
