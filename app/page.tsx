import { AppShell } from "@/components/layout/app-shell";
import { CtaBanner } from "@/components/layout/cta-banner";
import { FeatureGrid } from "@/components/layout/feature-grid";
import { LandingHero } from "@/components/layout/landing-hero";
import { WorkflowSteps } from "@/components/layout/workflow-steps";

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-16 pb-20">
        <LandingHero />
        <FeatureGrid />
        <WorkflowSteps />
        <CtaBanner />
      </div>
    </AppShell>
  );
}
