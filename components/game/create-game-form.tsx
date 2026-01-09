"use client";

import { useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RoleConfigurator } from "@/components/game/role-configurator";
import { createGame } from "@/lib/game/service";
import { DEFAULT_GAME_CONFIG } from "@/lib/game/defaults";
import { createGameSchema } from "@/lib/game/schemas";
import type { CreateGamePayload, RoleConfig } from "@/types/game";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

type FormValues = CreateGamePayload;

export function CreateGameForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const defaultConfig = useMemo(() => structuredClone(DEFAULT_GAME_CONFIG), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      hostName: "",
      config: defaultConfig,
    },
  });

  const maxPlayers = form.watch("config.maxPlayers");
  const roles = form.watch("config.roles");

  const handleRolesChange = (value: RoleConfig[]) => {
    form.setValue("config.roles", value, { shouldDirty: true });
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const game = await createGame(values);
      toast.success("Lobby created!", {
        description: `Share code ${game.code} with your friends.`,
      });
      router.push(`/game/${game.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Unable to create lobby. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Host details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hostName">Your display name</Label>
              <Input
                id="hostName"
                placeholder="Narrator Nora"
                {...form.register("hostName")}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Max players</Label>
                <Slider
                  min={4}
                  max={16}
                  step={1}
                  value={[maxPlayers]}
                  onValueChange={([value]) => form.setValue("config.maxPlayers", value, { shouldDirty: true })}
                />
                <p className="text-xs text-muted-foreground">{maxPlayers} seats available.</p>
              </div>
              <div className="space-y-2">
                <Label>Reveal roles on death</Label>
                <Switch
                  checked={form.watch("config.revealRolesOnDeath")}
                  onCheckedChange={(checked) =>
                    form.setValue("config.revealRolesOnDeath", checked, { shouldDirty: true })
                  }
                />
                <p className="text-xs text-muted-foreground">Keep the town guessing or reveal the truth.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DurationField
                label="Day phase length"
                value={form.watch("config.dayDurationMinutes")}
                onChange={(value) =>
                  form.setValue("config.dayDurationMinutes", value, { shouldDirty: true })
                }
              />
              <DurationField
                label="Night phase length"
                value={form.watch("config.nightDurationMinutes")}
                onChange={(value) =>
                  form.setValue("config.nightDurationMinutes", value, { shouldDirty: true })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Voice memos</Label>
              <Switch
                checked={form.watch("config.enableVoice")}
                onCheckedChange={(checked) => form.setValue("config.enableVoice", checked, { shouldDirty: true })}
              />
              <p className="text-xs text-muted-foreground">Allow players to drop 60-second voice notes.</p>
            </div>
            <div className="space-y-2">
              <Label>Anonymous voting</Label>
              <Switch
                checked={form.watch("config.enableAnonymousVotes")}
                onCheckedChange={(checked) =>
                  form.setValue("config.enableAnonymousVotes", checked, { shouldDirty: true })
                }
              />
              <p className="text-xs text-muted-foreground">Hide vote origins until the reveal moment.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Assign roles</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleConfigurator value={roles} onChange={handleRolesChange} maxPlayers={maxPlayers} />
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating lobby..." : "Create lobby"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}

function DurationField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={1}
        max={30}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <p className="text-xs text-muted-foreground">Minutes per phase.</p>
    </div>
  );
}
