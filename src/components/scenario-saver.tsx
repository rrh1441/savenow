"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/components/auth/auth-provider";
import { trpc } from "@/lib/trpc/client";

interface SelectedItem {
  id?: string;
  name: string;
  price: number;
  frequencyDays: number;
  isCustom?: boolean;
}

interface ScenarioSaverProps {
  selectedItem: SelectedItem;
  projections?: any[];
}

export function ScenarioSaver({ selectedItem, projections }: ScenarioSaverProps) {
  const { user, loading } = useAuth();
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const saveScenarioMutation = trpc.saveScenario.useMutation({
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "Scenario saved successfully!" });
      setScenarioTitle("");
      setIsSaving(false);
    },
    onError: (error) => {
      setSaveMessage({ type: "error", text: error.message });
      setIsSaving(false);
    },
  });

  const handleSaveScenario = async () => {
    if (!scenarioTitle.trim() || !selectedItem) return;
    
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await saveScenarioMutation.mutateAsync({
        title: scenarioTitle.trim(),
        items: [{
          itemId: selectedItem.isCustom ? undefined : selectedItem.id,
          customName: selectedItem.isCustom ? selectedItem.name : undefined,
          price: selectedItem.price,
          frequencyDays: selectedItem.frequencyDays,
        }],
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user && !showLogin) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Save This Scenario
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Sign in to save your scenarios and track your investment potential over time
          </p>
          <Button onClick={() => setShowLogin(true)}>
            Sign In to Save
          </Button>
        </div>
      </div>
    );
  }

  if (!user && showLogin) {
    return (
      <div>
        <LoginForm onSuccess={() => setShowLogin(false)} />
        <div className="text-center mt-4">
          <Button variant="ghost" onClick={() => setShowLogin(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Save This Scenario
        </h3>
        <p className="text-sm text-gray-600">
          Welcome back! Give this scenario a name to save it to your profile.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="scenario-title" className="block text-sm font-medium text-gray-700 mb-2">
            Scenario Name
          </label>
          <Input
            id="scenario-title"
            type="text"
            placeholder={`My ${selectedItem.name} savings plan`}
            value={scenarioTitle}
            onChange={(e) => setScenarioTitle(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="p-3 bg-gray-50 rounded border text-sm">
          <div className="font-medium">Scenario Summary:</div>
          <div className="text-gray-600 mt-1">
            Stop spending ${selectedItem.price} every{" "}
            {selectedItem.frequencyDays === 1 
              ? "day" 
              : selectedItem.frequencyDays === 7 
                ? "week" 
                : selectedItem.frequencyDays === 30 
                  ? "month"
                  : `${selectedItem.frequencyDays} days`
            } on <span className="font-medium">{selectedItem.name}</span>
            {projections && projections.length > 0 && (
              <span> and earn up to{" "}
                <span className="font-bold text-green-600">
                  ${Number(projections[projections.length - 1]?.future_value || 0).toLocaleString()}
                </span>{" "}
                in {projections[projections.length - 1]?.years} years
              </span>
            )}
          </div>
        </div>

        <Button 
          onClick={handleSaveScenario} 
          className="w-full"
          disabled={!scenarioTitle.trim() || isSaving}
        >
          {isSaving ? "Saving..." : "Save Scenario"}
        </Button>

        {saveMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            saveMessage.type === "success" 
              ? "bg-green-50 border border-green-200 text-green-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {saveMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}