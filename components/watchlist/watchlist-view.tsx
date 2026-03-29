"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Star,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  Eye,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockStocks } from "@/lib/mock-data"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts"

interface WatchlistViewProps {
  onBack: () => void
  onSelectStock: (symbol: string) => void
}

const generateMiniChartData = (trend: "up" | "down") => {
  const data = []
  let value = 50
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - (trend === "up" ? 0.4 : 0.6)) * 5
    data.push({ value: Math.max(20, Math.min(80, value)) })
  }
  return data
}

export function WatchlistView({ onBack, onSelectStock }: WatchlistViewProps) {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useAppStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)

  const watchlistStocks = mockStocks.filter((stock) =>
    watchlist.includes(stock.symbol)
  )

  const filteredWatchlist = watchlistStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableStocks = mockStocks.filter(
    (stock) => !watchlist.includes(stock.symbol)
  )

  const totalValue = watchlistStocks.reduce((acc, stock) => acc + stock.price, 0)
  const avgChange =
    watchlistStocks.length > 0
      ? watchlistStocks.reduce((acc, stock) => acc + stock.change, 0) /
        watchlistStocks.length
      : 0

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
            <h1 className="text-2xl font-bold">My Watchlist</h1>
            <p className="text-sm text-muted-foreground">
              {watchlist.length} stocks tracked
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Stock
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Tracking</span>
            </div>
            <p className="text-2xl font-bold font-mono">{watchlist.length}</p>
            <p className="text-xs text-muted-foreground">stocks</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Gainers</span>
            </div>
            <p className="text-2xl font-bold font-mono text-accent">
              {watchlistStocks.filter((s) => s.change > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Losers</span>
            </div>
            <p className="text-2xl font-bold font-mono text-destructive">
              {watchlistStocks.filter((s) => s.change < 0).length}
            </p>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Star className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Avg Change</span>
            </div>
            <p
              className={cn(
                "text-2xl font-bold font-mono",
                avgChange >= 0 ? "text-accent" : "text-destructive"
              )}
            >
              {avgChange >= 0 ? "+" : ""}
              {avgChange.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search watchlist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card/50 border-border/50"
        />
      </div>

      {/* Watchlist */}
      {filteredWatchlist.length > 0 ? (
        <div className="space-y-3">
          {filteredWatchlist.map((stock) => {
            const isPositive = stock.change >= 0
            const chartData = generateMiniChartData(isPositive ? "up" : "down")

            return (
              <Card
                key={stock.symbol}
                className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer group"
                onClick={() => onSelectStock(stock.symbol)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold font-mono">
                          {stock.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{stock.symbol}</p>
                          <Star className="h-3 w-3 fill-accent text-accent" />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {stock.name}
                        </p>
                      </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="hidden md:block w-24 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient
                              id={`gradient-${stock.symbol}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor={isPositive ? "#00FF94" : "#FF4444"}
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor={isPositive ? "#00FF94" : "#FF4444"}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? "#00FF94" : "#FF4444"}
                            strokeWidth={1.5}
                            fill={`url(#gradient-${stock.symbol})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold font-mono">
                        ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                      <Badge
                        variant={isPositive ? "default" : "destructive"}
                        className={cn(
                          "font-mono text-xs",
                          isPositive
                            ? "bg-accent/20 text-accent hover:bg-accent/30"
                            : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {stock.change.toFixed(2)}%
                      </Badge>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelectStock(stock.symbol)}>
                          <ChevronRight className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromWatchlist(stock.symbol)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : watchlist.length === 0 ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking stocks by adding them to your watchlist
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Stock
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No stocks match your search</p>
          </CardContent>
        </Card>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Add to Watchlist</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddModal(false)}
                >
                  <span className="sr-only">Close</span>
                  &times;
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search stocks..."
                className="bg-muted/30"
              />
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableStocks.slice(0, 10).map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      addToWatchlist(stock.symbol)
                      setShowAddModal(false)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-xs font-bold font-mono">
                          {stock.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{stock.name}</p>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
