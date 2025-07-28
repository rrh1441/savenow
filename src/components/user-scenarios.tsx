"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { trpc } from "@/lib/trpc/client";

export function UserScenarios() {
  const { user } = useAuth();
  const [showScenarios, setShowScenarios] = useState(false);

  const { data: scenarios, isLoading, error } = trpc.getUserScenarios.useQuery(undefined, {
    enabled: user && showScenarios,
  });

  if (!user) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getFrequencyLabel = (days: number) => {
    if (days === 1) return "daily";
    if (days === 7) return "weekly";  
    if (days === 30) return "monthly";
    return `every ${days} days`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          My Saved Scenarios
        </h3>
        <Button 
          variant="outline" 
          onClick={() => setShowScenarios(!showScenarios)}
        >
          {showScenarios ? "Hide" : "Show"} Scenarios
        </Button>
      </div>

      {showScenarios && (
        <div>
          {isLoading && (
            <div className="text-center py-4 text-gray-500">
              Loading your scenarios...
            </div>
          )}

          {error && (
            <div className="text-center py-4 text-red-600">
              Error loading scenarios
            </div>
          )}

          {scenarios && scenarios.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No saved scenarios yet. Save a scenario above to get started!
            </div>
          )}

          {scenarios && scenarios.length > 0 && (
            <div className="space-y-4">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{scenario.title}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(scenario.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {scenario.scenario_items?.map((item: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600">
                        <div className="flex justify-between items-center">
                          <span>
                            {item.custom_item_name || item.items?.name} - 
                            ${item.price_usd} {getFrequencyLabel(item.frequency_days)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}