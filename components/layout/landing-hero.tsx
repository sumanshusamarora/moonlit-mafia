import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SparklesIcon, ShieldHalfIcon, Users2Icon } from "lucide-react";

export function LandingHero() {
  return (
    <section className="grid gap-10 py-12 md:grid-cols-2 md:items-center">
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1 text-sm text-muted-foreground backdrop-blur">
          <SparklesIcon className="h-4 w-4 text-primary" aria-hidden />
          Host immersive social deduction nights online
        </div>
        <div className="space-y-6">
          <h1 className={cn("text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl")}>Moonlit Mafia</h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Spin up a lobby, assign custom roles, and keep the night lively with live chat, voting, and voice memos—all right in the browser.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/lobby/new">Create a lobby</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/lobby/join">Join with a code</Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldHalfIcon className="h-4 w-4 text-primary" aria-hidden />
            Moderation controls
          </span>
          <span className="flex items-center gap-2">
            <Users2Icon className="h-4 w-4 text-primary" aria-hidden />
            Up to 16 players
          </span>
        </div>
      </div>
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-2xl font-semibold">A control panel built for narrators</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Configure roles per session with instant previews</li>
            <li>• Track player status and ready checks at a glance</li>
            <li>• Drive the story forward with automated day/night pacing</li>
          </ul>
          <div className="rounded-md border border-dashed border-primary/40 bg-background/80 p-4 text-sm text-muted-foreground">
            Tip: Share the game code with friends or drop a magic invite link from your dashboard.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
