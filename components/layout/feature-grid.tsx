import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AudioLinesIcon,
  BadgeCheckIcon,
  GaugeIcon,
  LockIcon,
  MessagesSquareIcon,
  UsersIcon,
} from "lucide-react";

const features = [
  {
    title: "Configurable Roles",
    description: "Tailor every story with adjustable role counts and quick presets for any group size.",
    icon: BadgeCheckIcon,
  },
  {
    title: "Real-time Sync",
    description: "Players stay in lockstep via Firestore-powered presence, ready checks, and phase timers.",
    icon: GaugeIcon,
  },
  {
    title: "Tight-knit Chat",
    description: "Day discussion and night whispers stay organized with emoji-ready threads and reactions.",
    icon: MessagesSquareIcon,
  },
  {
    title: "Voice Memos",
    description: "Drop quick voice notes directly in the lobby and let the drama unfold asynchronously.",
    icon: AudioLinesIcon,
  },
  {
    title: "Player Safety",
    description: "Host tools let you mute, kick, or reshuffle roles to keep the night fair and fun.",
    icon: LockIcon,
  },
  {
    title: "One-click Invites",
    description: "Share a short join code or invite link—no accounts or downloads required.",
    icon: UsersIcon,
  },
] as const;

export function FeatureGrid() {
  return (
    <section className="py-16">
      <div className="mb-10 space-y-3 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Tools built for storytellers</h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Moonlit Mafia keeps the spotlight on your friends with quick actions, intuitive controls, and a touch of cinematic flair.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="group h-full border-border/60 transition hover:border-primary/40">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={cn("rounded-md bg-primary/10 p-2 text-primary")}> 
                <feature.icon className="h-6 w-6" aria-hidden />
              </div>
              <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {feature.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
