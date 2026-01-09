"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { joinGameSchema } from "@/lib/game/schemas";
import type { JoinGamePayload } from "@/types/game";
import { joinGameByCode } from "@/lib/game/service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type FormValues = JoinGamePayload;

export function JoinGameForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(joinGameSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const game = await joinGameByCode(values);
      toast.success("Joined the lobby", {
        description: `You are now in lobby ${game.code}.`,
      });
      router.push(`/game/${game.id}`);
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message ?? "Unable to join the lobby");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Join a lobby</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Lobby code</Label>
            <Input id="code" placeholder="ABC123" {...register("code")} className="uppercase" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" placeholder="Moonlit Maverick" {...register("name")} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="ml-auto">
            {isSubmitting ? "Joining..." : "Join game"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
