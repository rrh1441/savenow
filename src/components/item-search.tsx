"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

interface Item {
  id: string;
  name: string;
  category: string;
  default_price_usd: number;
}

interface ItemSearchProps {
  onSelectItem: (item: Item) => void;
}

export function ItemSearch({ onSelectItem }: ItemSearchProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: items = [], isLoading } = trpc.searchItems.useQuery(
    { query },
    { 
      enabled: query.length > 0,
      refetchOnWindowFocus: false 
    }
  );

  const handleSelectItem = useCallback((item: Item) => {
    onSelectItem(item);
    setQuery("");
    setShowResults(false);
  }, [onSelectItem]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for an item (e.g., latte, Netflix, rideshare)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(e.target.value.length > 0);
          }}
          className="pl-10 pr-4"
          onFocus={() => setShowResults(query.length > 0)}
        />
      </div>
      
      {showResults && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No items found. You can add a custom item below.
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex justify-between items-center"
              >
                <span>{item.name}</span>
                <span className="text-gray-500">${item.default_price_usd}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}