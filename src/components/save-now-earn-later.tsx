"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, DollarSign, TrendingUp, Calculator, PiggyBank } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { useItemSearch, type Item } from "@/hooks/useItems"

const frequencies = [
  { value: "daily", label: "Daily", multiplier: 365 },
  { value: "weekly", label: "Weekly", multiplier: 52 },
  { value: "monthly", label: "Monthly", multiplier: 12 },
  { value: "yearly", label: "Yearly", multiplier: 1 },
]

export default function SaveNowEarnLater() {
  const { items, loading, error, searchItems } = useItemSearch()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [customPrice, setCustomPrice] = useState("")
  const [frequency, setFrequency] = useState("")
  const [showResults, setShowResults] = useState(false)

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchItems(searchTerm)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchItems])

  const calculations = useMemo(() => {
    if (!selectedItem || !frequency) return null

    const price = customPrice ? Number.parseFloat(customPrice) : selectedItem.avgPrice
    const freqData = frequencies.find((f) => f.value === frequency)
    if (!price || !freqData) return null

    const annualSavings = price * freqData.multiplier
    const spReturn = 0.1 // Historical S&P 500 average return (~10%)

    const timeframes = [5, 10, 15, 30]
    const projections = timeframes.map((years) => {
      // Compound interest formula: A = P * (((1 + r)^t - 1) / r)
      // This is for regular contributions (annuity)
      const futureValue = annualSavings * ((Math.pow(1 + spReturn, years) - 1) / spReturn)
      const totalContributions = annualSavings * years
      const totalReturns = futureValue - totalContributions

      return {
        years,
        futureValue: Math.round(futureValue),
        totalContributions: Math.round(totalContributions),
        totalReturns: Math.round(totalReturns),
        returnPercentage: Math.round((totalReturns / totalContributions) * 100),
      }
    })

    // Data for line chart
    const chartData = []
    for (let year = 1; year <= 30; year++) {
      const futureValue = annualSavings * ((Math.pow(1 + spReturn, year) - 1) / spReturn)
      const contributions = annualSavings * year
      chartData.push({
        year,
        value: Math.round(futureValue),
        contributions: Math.round(contributions),
        returns: Math.round(futureValue - contributions),
      })
    }

    return {
      annualSavings,
      projections,
      chartData,
      itemName: selectedItem.name,
      itemPrice: price,
      frequencyLabel: freqData.label.toLowerCase(),
    }
  }, [selectedItem, frequency, customPrice])

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item)
    setCustomPrice(item.avgPrice.toString())
    setSearchTerm("")
  }

  const handleCalculate = () => {
    if (selectedItem && frequency) {
      setShowResults(true)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }


  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-semibold">Error loading items</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-grid space-y-8 py-8">
        {/* Header */}
        <header className="text-center space-y-6 section-spacing animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <PiggyBank className="h-14 w-14 text-primary" />
            <h1 className="text-5xl font-semibold text-foreground">Save Now, Earn Later</h1>
          </div>
          <p className="text-xl text-muted-foreground mx-auto leading-relaxed">
            Discover how much money you could earn by investing the cost of your frequent purchases in the S&P 500
            instead.
          </p>
        </header>

        {/* Input Section */}
        <section className="animate-slide-up">
        <Card className="card-enhanced" role="region" aria-label="Investment calculator">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-primary" />
              Calculate Your Potential Returns
            </CardTitle>
            <CardDescription className="text-base">
              Search for an item you frequently purchase and see how much you could earn by investing that money
              instead.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Bar */}
            <div className="space-y-2">
              <Label htmlFor="search">Search for an item</Label>
              <div className="relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search for items like coffee, lunch, streaming..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-enhanced pl-12 text-base"
                  aria-describedby="search-help"
                />
              </div>

              <div id="search-help" className="sr-only">
                Type to search for common purchase items
              </div>

              {/* Search Results */}
              {searchTerm && items.length > 0 && (
                <div className="border border-gray-200 rounded-xl bg-white shadow-md max-h-48 overflow-y-auto animate-fade-in" role="listbox" aria-label="Search results">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors duration-150"
                      onClick={() => handleItemSelect(item)}
                      role="option"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleItemSelect(item)
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">{item.category || 'Other'}</div>
                        </div>
                        <Badge variant="secondary" className="font-medium">${item.avgPrice}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm && !loading && items.length === 0 && (
                <div className="text-center py-6 text-muted-foreground animate-fade-in" role="status">
                  No items found matching &ldquo;{searchTerm}&rdquo;
                </div>
              )}

              {loading && searchTerm && (
                <div className="text-center py-6 text-muted-foreground animate-fade-in" role="status" aria-live="polite">
                  Searching...
                </div>
              )}
            </div>

            {/* Selected Item */}
            {selectedItem && (
              <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-200/50 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-blue-900">Selected Item</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedItem(null)
                      setCustomPrice("")
                      setShowResults(false)
                    }}
                  >
                    Change
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Item</Label>
                    <p className="font-medium text-foreground">{selectedItem.name}</p>
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-sm font-medium text-blue-700">
                      Price per item
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="input-enhanced pl-12"
                        aria-describedby="price-help"
                      />
                      <div id="price-help" className="sr-only">
                        Enter the price you typically pay for this item
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Purchase Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="select-enhanced">
                        <SelectValue placeholder="How often?" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-xl">
                        {frequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value} className="rounded-lg">
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Calculate Button */}
            {selectedItem && frequency && (
              <Button 
                onClick={handleCalculate} 
                className="btn-primary w-full text-lg py-4" 
                size="lg"
                aria-describedby="calculate-help"
              >
                <TrendingUp className="mr-3 h-5 w-5" />
                Calculate Investment Returns
              </Button>
            )}
            <div id="calculate-help" className="sr-only">
              Calculate how much you could earn by investing instead of spending
            </div>
          </CardContent>
        </Card>
        </section>

        {/* Results Section */}
        {showResults && calculations && (
          <section className="space-y-8 animate-slide-up" aria-live="polite" role="region" aria-label="Investment projection results">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {calculations.projections.map((projection) => (
                <Card key={projection.years} className="card-enhanced hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-semibold">{projection.years} Years</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                      <p className="text-3xl font-bold text-green-600">{formatCurrency(projection.futureValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">You Saved</p>
                      <p className="text-lg font-semibold text-foreground">{formatCurrency(projection.totalContributions)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Investment Returns</p>
                      <p className="text-lg font-semibold text-primary">{formatCurrency(projection.totalReturns)}</p>
                    </div>
                    <Badge variant="secondary" className="w-full justify-center py-2 text-sm font-medium">
                      +{projection.returnPercentage}% gain
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart Section */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="text-2xl">Investment Growth Over Time</CardTitle>
                <CardDescription className="text-base mt-2">
                  See how your money would grow by investing {formatCurrency(calculations.annualSavings)} annually (from
                  avoiding {calculations.frequencyLabel} {calculations.itemName} purchases)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={calculations.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value, name) => [
                          formatCurrency(value as number),
                          name === "value"
                            ? "Total Value"
                            : name === "contributions"
                              ? "Total Saved"
                              : "Investment Returns",
                        ]}
                        labelFormatter={(year) => `Year ${year}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="contributions"
                        stroke="#6b7280"
                        strokeWidth={2}
                        name="contributions"
                      />
                      <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={3} name="value" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown Chart */}
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="text-2xl">Savings vs Returns Breakdown</CardTitle>
                <CardDescription className="text-base mt-2">
                  Compare your total savings with investment returns over different time periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calculations.projections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="years" tickFormatter={(years) => `${years} years`} />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="totalContributions" fill="#6b7280" name="Total Saved" />
                      <Bar dataKey="totalReturns" fill="#059669" name="Investment Returns" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card className="card-enhanced bg-gradient-to-r from-green-50/50 to-blue-50/50">
              <CardHeader>
                <CardTitle className="text-2xl text-green-800">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3">Your Spending Pattern</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        • You spend {formatCurrency(calculations.itemPrice)} per {calculations.itemName.toLowerCase()}
                      </li>
                      <li>• That&apos;s {formatCurrency(calculations.annualSavings)} per year</li>
                      <li>• Over 30 years: {formatCurrency(calculations.annualSavings * 30)} in total spending</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3">Investment Potential</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        • Investing instead could yield {formatCurrency(calculations.projections[3].futureValue)} in 30
                        years
                      </li>
                      <li>• That&apos;s {formatCurrency(calculations.projections[3].totalReturns)} in investment returns</li>
                      <li>• A {calculations.projections[3].returnPercentage}% increase over your savings</li>
                    </ul>
                  </div>
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  * Calculations assume a 10% annual return based on historical S&P 500 performance. Past performance
                  doesn&apos;t guarantee future results. Consider consulting a financial advisor.
                </p>
              </CardContent>
            </Card>

            {/* Start Investing CTA */}
            <Card className="card-enhanced bg-gradient-to-r from-green-600 to-blue-600 text-white border-0">
              <CardContent className="text-center py-12">
                <h3 className="text-3xl font-bold mb-6">Ready to Start Your Investment Journey?</h3>
                <p className="text-xl mb-8 text-green-50 max-w-2xl mx-auto">
                  Turn your spending insights into real wealth building
                </p>
                <Button 
                  asChild
                  size="lg" 
                  className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-10 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <a 
                    href="https://join.robinhood.com/ryanh11888" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-describedby="referral-disclaimer"
                  >
                    Start Investing with Robinhood
                  </a>
                </Button>
                <p id="referral-disclaimer" className="text-sm mt-4 text-green-100 opacity-90">
                  This is a referral link. We may receive compensation if you sign up through this link.
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  )
}