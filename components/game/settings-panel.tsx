"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserSettings } from "@/hooks/use-user-settings";
import { Volume2Icon } from "lucide-react";

export function SettingsPanel() {
  const { settings, updateSettings, isLoaded } = useUserSettings();

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Settings</CardTitle>
        <p className="text-xs text-muted-foreground">
          Customize your game experience
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Message Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Volume2Icon className="h-4 w-4" />
            <span>Audio</span>
          </div>
          
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex-1 space-y-1">
              <Label 
                htmlFor="autoplay-voice" 
                className="cursor-pointer text-sm font-medium"
              >
                Auto-play voice messages
              </Label>
              <p className="text-xs text-muted-foreground">
                Plays new voice messages automatically when they arrive
              </p>
            </div>
            <Switch
              id="autoplay-voice"
              checked={settings.autoplayVoiceMessages}
              onCheckedChange={(checked) => 
                updateSettings({ autoplayVoiceMessages: checked })
              }
            />
          </div>
        </div>

        {/* Future settings can be added here */}
        <div className="rounded-md border border-dashed border-border/40 bg-muted/10 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            More settings coming soon...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
