"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Filter,
  TrendingUp,
  TrendingDown,
  Star,
  Search,
  Sparkles,
  RotateCcw,
  Download,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react"
import { mockStocks } from "@/lib/mock-data"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface ScreenerViewProps {
  onBack: () => void
  onSelectStock: (symbol: string) => void
}

const presetScreeners = [
  {
    id: "momentum",
    name: "Momentum Leaders",
    description: "Stocks with strong upward momentum",
    icon: TrendingUp,
    filters: { minChange: 2, sector: "all" },
  },
  {
    id: "value",
    name: "Value Picks",
    description: "Undervalued stocks with growth potential",
    icon: Search,
    filters: { maxPE: 15, sector: "all" },
  },
  {
    id: "dividend",
    name: "Dividend Champions",
    description: "High dividend yield stocks",
    icon: Star,
    filters: { minDividend: 2, sector: "all" },
  },
  {
    id: "ai-recommended",
    name: "AI Recommended",
    description: "Top picks by ET AI",
    icon: Sparkles,
    filters: { aiScore: 80, sector: "all" },
  },
]

const sectors = [
  "All Sectors",
  "Technology",
  "Banking",
  "Financial Services",
  "FMCG",
  "Healthcare",
  "Energy",
  "Infrastructure",
  "Auto",
  "Metals",
  "Telecom",
]

export function ScreenerView({ onBack, onSelectStock }: ScreenerViewProps) {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useAppStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSector, setSelectedSector] = useState("All Sectors")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [changeFilter, setChangeFilter] = useState<"all" | "positive" | "negative">("all")
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const filteredStocks = mockStocks.filter((stock) => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSector =
      selectedSector === "All Sectors" || stock.sector === selectedSector
    const matchesPrice =
      stock.price >= priceRange[0] && stock.price <= priceRange[1]
    const matchesChange =
      changeFilter === "all" ||
      (changeFilter === "positive" && stock.change > 0) ||
      (changeFilter === "negative" && stock.change < 0)

    return matchesSearch && matchesSector && matchesPrice && matchesChange
  })

  const handlePresetClick = (presetId: string) => {
    setActivePreset(activePreset === presetId ? null : presetId)
    // Apply preset filters
    if (presetId === "momentum") {
      setChangeFilter("positive")
    } else {
      setChangeFilter("all")
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedSector("All Sectors")
    setPriceRange([0, 10000])
    setChangeFilter("all")
    setActivePreset(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Stock Screener</h1>
            <p className="text-sm text-muted-foreground">
              {filteredStocks.length} stocks found
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Preset Screeners */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {presetScreeners.map((preset) => {
          const Icon = preset.icon
          return (
            <Card
              key={preset.id}
              className={cn(
                "border-border/50 cursor-pointer transition-all hover:border-accent/50",
                activePreset === preset.id && "border-accent bg-accent/5"
              )}
              onClick={() => handlePresetClick(preset.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      activePreset === preset.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{preset.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {preset.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search and Filters */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="w-[180px] bg-background/50">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-accent text-accent-foreground" : ""}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Price Range</label>
                    <span className="text-xs text-muted-foreground font-mono">
                      ₹{priceRange[0]} - ₹{priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={10000}
                    step={100}
                    className="w-full"
                  />
                </div>

                {/* Change Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Price Change</label>
                  <div className="flex items-center gap-2">
                    {[
                      { value: "all", label: "All" },
                      { value: "positive", label: "Gainers" },
                      { value: "negative", label: "Losers" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={changeFilter === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChangeFilter(option.value as typeof changeFilter)}
                        className={
                          changeFilter === option.value
                            ? "bg-accent text-accent-foreground"
                            : ""
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Screener Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Change
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="text-center p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const isPositive = stock.change >= 0
                  const isInWatchlist = watchlist.includes(stock.symbol)
                  return (
                    <tr
                      key={stock.symbol}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => onSelectStock(stock.symbol)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-xs font-bold font-mono">
                              {stock.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{stock.symbol}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {stock.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono font-medium">
                          ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Badge
                          variant={isPositive ? "default" : "destructive"}
                          className={cn(
                            "font-mono",
                            isPositive
                              ? "bg-accent/20 text-accent hover:bg-accent/30"
                              : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                          )}
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {isPositive ? "+" : ""}
                          {stock.change.toFixed(2)}%
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-normal text-xs">
                          {stock.sector}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              isInWatchlist
                                ? removeFromWatchlist(stock.symbol)
                                : addToWatchlist(stock.symbol)
                            }}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                isInWatchlist && "fill-accent text-accent"
                              )}
                            />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredStocks.length === 0 && (
            <div className="p-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No stocks match your criteria</p>
              <Button variant="link" onClick={resetFilters} className="mt-2">
                Reset filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
