import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="mt-12 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 text-center">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready to host tonight&apos;s game?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Launch a lobby for free. No downloads, no accounts—just storytelling under the moonlight.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/guide">Read the host guide</Link>
        </Button>
      </div>
    </section>
  );
}
