import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";

const steps = [
  {
    title: "Spin up a lobby",
    description: "Name your session, fine-tune roles, and lock in day/night timings in under a minute.",
  },
  {
    title: "Share the code",
    description: "Friends join instantly—anonymous auth keeps friction low while still tracking players.",
  },
  {
    title: "Guide the story",
    description: "Drive day debates and night actions with built-in timers, voting, and system prompts.",
  },
];

export function WorkflowSteps() {
  return (
    <section className="py-16">
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="grid gap-6 p-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="space-y-3">
              <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
                Step {index + 1}
              </Badge>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              {index < steps.length - 1 && (
                <ArrowRightIcon className="hidden h-4 w-4 text-primary md:block" aria-hidden />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
