import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const tips = [
  {
    title: "Before nightfall",
    points: [
      "Pick a voice call or keep everyone in the in-app chat if you prefer text-only rounds.",
      "Share the lobby code in your group chat or drop a one-click invite link from the dashboard.",
      "Double-check everyone is marked ready before starting. You can toggle players manually if needed.",
    ],
  },
  {
    title: "Guiding the story",
    points: [
      "Night and day phases auto-advance, but you can jump ahead manually from the host controls.",
      "Use system messages to narrate plot twists—players will see them highlighted in chat.",
      "Lean on the built-in narration prompts to keep everyone in sync without breaking immersion.",
    ],
  },
  {
    title: "Wrapping up",
    points: [
      "Archive finished games to keep your dashboard tidy. Players can still revisit the logs.",
      "Want a rematch? Duplicate the lobby from the dashboard to reuse the same config in seconds.",
      "Share feedback with the team—Moonlit Mafia is open-source and always evolving.",
    ],
  },
];

export default function GuidePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">Host field guide</h1>
          <p className="text-muted-foreground">
            A quick cheat sheet to keep your Mafia nights smooth, suspenseful, and fair.
          </p>
        </header>
        <div className="grid gap-6">
          {tips.map((tip) => (
            <Card key={tip.title}>
              <CardHeader>
                <CardTitle>{tip.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {tip.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <Separator />
        <footer className="space-y-2 text-sm text-muted-foreground">
          <p>
            Moonlit Mafia is optimized for Vercel&apos;s free tier. Keep an eye on Firestore usage to stay within limits.
          </p>
          <p>
            Need help or want to contribute? Check the README for collaboration guidelines and roadmap items.
          </p>
        </footer>
      </div>
    </AppShell>
  );
}
