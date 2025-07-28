"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, DollarSign, TrendingUp, Calculator, PiggyBank } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { useItems, type Item } from "@/hooks/useItems"

const frequencies = [
  { value: "daily", label: "Daily", multiplier: 365 },
  { value: "weekly", label: "Weekly", multiplier: 52 },
  { value: "monthly", label: "Monthly", multiplier: 12 },
  { value: "yearly", label: "Yearly", multiplier: 1 },
]

export default function SaveNowEarnLater() {
  const { items, loading, error } = useItems()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [customPrice, setCustomPrice] = useState("")
  const [frequency, setFrequency] = useState("")
  const [showResults, setShowResults] = useState(false)

  const filteredItems = useMemo(() => {
    if (!items) return []
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [searchTerm, items])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <PiggyBank className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading items...</p>
        </div>
      </div>
    )
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" style={{backgroundColor: '#f0f7ff'}}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <PiggyBank className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Save Now, Earn Later</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how much money you could earn by investing the cost of your frequent purchases in the S&P 500
            instead.
          </p>
        </div>

        {/* Input Section */}
        <Card className="shadow-lg bg-white border border-gray-200" style={{backgroundColor: '#ffffff', color: '#171717'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculate Your Potential Returns
            </CardTitle>
            <CardDescription>
              Search for an item you frequently purchase and see how much you could earn by investing that money
              instead.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Bar */}
            <div className="space-y-2">
              <Label htmlFor="search">Search for an item</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search for items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Search Results or All Items */}
              {(searchTerm && filteredItems.length > 0) || (!searchTerm && items.length > 0) ? (
                <div className="border rounded-md bg-white shadow-sm max-h-48 overflow-y-auto" style={{backgroundColor: '#ffffff', color: '#171717'}}>
                  {!searchTerm && (
                    <div className="p-2 bg-blue-50 text-sm text-blue-700 border-b">
                      Available items (click to select):
                    </div>
                  )}
                  {(searchTerm ? filteredItems : items.slice(0, 10)).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{item.category || 'Other'}</div>
                        </div>
                        <Badge variant="secondary">${item.avgPrice}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {searchTerm && filteredItems.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No items found matching &ldquo;{searchTerm}&rdquo;
                </div>
              )}
            </div>

            {/* Selected Item */}
            {selectedItem && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-900">Selected Item</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(null)
                      setCustomPrice("")
                      setShowResults(false)
                    }}
                  >
                    Change
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-blue-700">Item</Label>
                    <p className="font-medium">{selectedItem.name}</p>
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-sm text-blue-700">
                      Price per item
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-blue-700">Purchase Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue placeholder="How often?" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
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
              <Button onClick={handleCalculate} className="w-full" size="lg">
                <TrendingUp className="mr-2 h-4 w-4" />
                Calculate Investment Returns
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {showResults && calculations && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {calculations.projections.map((projection) => (
                <Card key={projection.years} className="shadow-md bg-white border border-gray-200" style={{backgroundColor: '#ffffff', color: '#171717'}}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{projection.years} Years</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(projection.futureValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">You Saved</p>
                      <p className="font-semibold">{formatCurrency(projection.totalContributions)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Investment Returns</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(projection.totalReturns)}</p>
                    </div>
                    <Badge variant="secondary" className="w-full justify-center">
                      +{projection.returnPercentage}% gain
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart Section */}
            <Card className="shadow-lg bg-white border border-gray-200" style={{backgroundColor: '#ffffff', color: '#171717'}}>
              <CardHeader>
                <CardTitle>Investment Growth Over Time</CardTitle>
                <CardDescription>
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
            <Card className="shadow-lg bg-white border border-gray-200" style={{backgroundColor: '#ffffff', color: '#171717'}}>
              <CardHeader>
                <CardTitle>Savings vs Returns Breakdown</CardTitle>
                <CardDescription>
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
            <Card className="shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-green-800">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Your Spending Pattern</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>
                        • You spend {formatCurrency(calculations.itemPrice)} per {calculations.itemName.toLowerCase()}
                      </li>
                      <li>• That&apos;s {formatCurrency(calculations.annualSavings)} per year</li>
                      <li>• Over 30 years: {formatCurrency(calculations.annualSavings * 30)} in total spending</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Investment Potential</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
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
                <p className="text-sm text-gray-600 italic">
                  * Calculations assume a 10% annual return based on historical S&P 500 performance. Past performance
                  doesn&apos;t guarantee future results. Consider consulting a financial advisor.
                </p>
              </CardContent>
            </Card>

            {/* Start Investing CTA */}
            <Card className="shadow-lg bg-gradient-to-r from-green-600 to-blue-600 text-white">
              <CardContent className="text-center py-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Start Your Investment Journey?</h3>
                <p className="text-lg mb-6 text-green-50">
                  Turn your spending insights into real wealth building
                </p>
                <Button 
                  asChild
                  size="lg" 
                  className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg"
                >
                  <a 
                    href="https://join.robinhood.com/ryanh11888" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Start Investing with Robinhood
                  </a>
                </Button>
                <p className="text-xs mt-3 text-green-100 opacity-80">
                  This is a referral link. We may receive compensation if you sign up through this link.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}