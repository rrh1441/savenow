"use client";

import { useState } from "react";
import { ItemSearch } from "./item-search";
import { ProjectionChart } from "./projection-chart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

interface SelectedItem {
  id?: string;
  name: string;
  price: number;
  frequencyDays: number;
  isCustom?: boolean;
}

export function ProjectionCalculator() {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [customItemName, setCustomItemName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [showProjections, setShowProjections] = useState(false);

  const frequencyOptions = [
    { label: "Daily", value: "daily", days: 1 },
    { label: "Weekly", value: "weekly", days: 7 },
    { label: "Monthly", value: "monthly", days: 30 },
    { label: "Custom", value: "custom", days: 1 }
  ];

  const [customDays, setCustomDays] = useState("1");

  const currentFrequencyDays = frequency === "custom" 
    ? parseInt(customDays) || 1 
    : frequencyOptions.find(f => f.value === frequency)?.days || 1;

  const { data: projections, isLoading, error } = trpc.getGrowthProjections.useQuery(
    {
      price: selectedItem?.price || 0,
      frequencyDays: currentFrequencyDays,
      annualReturn: 0.10
    },
    { 
      enabled: showProjections && !!selectedItem && selectedItem.price > 0,
      refetchOnWindowFocus: false 
    }
  );

  const handleSelectItem = (item: any) => {
    setSelectedItem({
      id: item.id,
      name: item.name,
      price: item.default_price_usd,
      frequencyDays: currentFrequencyDays,
      isCustom: false
    });
    setShowProjections(false);
  };

  const handleAddCustomItem = () => {
    const price = parseFloat(customPrice);
    if (customItemName.trim() && price > 0) {
      setSelectedItem({
        name: customItemName.trim(),
        price: price,
        frequencyDays: currentFrequencyDays,
        isCustom: true
      });
      setCustomItemName("");
      setCustomPrice("");
      setShowProjections(false);
    }
  };

  const handleCalculate = () => {
    if (selectedItem && selectedItem.price > 0) {
      setSelectedItem(prev => prev ? { ...prev, frequencyDays: currentFrequencyDays } : null);
      setShowProjections(true);
    }
  };

  const frequencyLabel = frequency === "custom" 
    ? `every ${customDays} day${parseInt(customDays) !== 1 ? 's' : ''}` 
    : frequency;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1"></div>
          <h1 className="text-4xl font-bold text-gray-900">
            Save Now, Earn Later
          </h1>
          <div className="flex-1 flex justify-end">
            {user && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back!</p>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
        <p className="text-lg text-gray-600 mb-8">
          See how much your small daily purchases could be worth if invested instead
        </p>
      </div>

      {/* Item Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Choose an item</h2>
        
        <div className="space-y-4">
          <ItemSearch onSelectItem={handleSelectItem} />
          
          <div className="text-center text-gray-500 text-sm">or</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Enter custom item name"
              value={customItemName}
              onChange={(e) => setCustomItemName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Price (USD)"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          
          <Button 
            onClick={handleAddCustomItem} 
            className="w-full"
            disabled={!customItemName.trim() || !customPrice || parseFloat(customPrice) <= 0}
          >
            Add Custom Item
          </Button>
        </div>
      </div>

      {/* Selected Item & Frequency */}
      {selectedItem && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Configure your spending</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Item
              </label>
              <div className="p-3 bg-gray-50 rounded border text-sm">
                <span className="font-medium">{selectedItem.name}</span>
                <span className="text-gray-600 ml-2">${selectedItem.price}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How often do you buy this?
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {frequency === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Every how many days?
                </label>
                <Input
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  min="1"
                  className="w-full"
                />
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                You spend <strong>${selectedItem.price}</strong> {frequencyLabel} on{" "}
                <strong>{selectedItem.name}</strong>
              </p>
            </div>
            
            <Button onClick={handleCalculate} className="w-full" size="lg">
              Calculate Growth Potential 📈
            </Button>
          </div>
        </div>
      )}

      {/* Projections */}
      {showProjections && selectedItem && (
        <div>
          {isLoading && (
            <div className="text-center p-8">
              <div className="text-lg">Calculating your projections...</div>
            </div>
          )}
          
          {error && (
            <div className="text-center p-8 text-red-600">
              Error calculating projections. Please try again.
            </div>
          )}
          
          {projections && projections.length > 0 && (
            <div className="space-y-8">
              <ProjectionChart 
                data={projections}
                itemName={selectedItem.name}
                price={selectedItem.price}
                frequency={frequencyLabel}
              />
              
              <ScenarioSaver 
                selectedItem={selectedItem}
                projections={projections}
              />
            </div>
          )}
        </div>
      )}

      {/* User Scenarios */}
      {user && <UserScenarios />}
    </div>
  );
}