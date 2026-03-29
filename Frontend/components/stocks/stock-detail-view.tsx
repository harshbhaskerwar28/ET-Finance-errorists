"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Star,
  Bell,
  Share2,
  ChevronRight,
  Building2,
  Users,
  Calendar,
  BarChart3,
  FileText,
  MessageSquare,
  Sparkles,
  Info,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { mockStocks } from "@/lib/mock-data"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

interface StockDetailViewProps {
  symbol: string
  onBack: () => void
}

const generateChartData = (trend: "up" | "down", days: number) => {
  const data = []
  let baseValue = trend === "up" ? 2400 : 2600
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - (trend === "up" ? 0.4 : 0.6)) * 50
    baseValue += change
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      price: Math.max(2000, baseValue),
      volume: Math.floor(Math.random() * 10000000) + 5000000,
    })
  }
  return data
}

export function StockDetailView({ symbol, onBack }: StockDetailViewProps) {
  const { addToWatchlist, removeFromWatchlist, watchlist } = useAppStore()
  const [timeframe, setTimeframe] = useState("1M")
  const [activeTab, setActiveTab] = useState("overview")

  const stock = mockStocks.find((s) => s.symbol === symbol)
  const isInWatchlist = watchlist.includes(symbol)

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Stock not found</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  const isPositive = stock.change >= 0
  const chartData = generateChartData(isPositive ? "up" : "down", timeframe === "1W" ? 7 : timeframe === "1M" ? 30 : timeframe === "3M" ? 90 : timeframe === "1Y" ? 365 : 180)

  const [articles, setArticles] = useState<any[]>([])
  const [loadingNews, setLoadingNews] = useState(true)

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data && data.articles) {
          setArticles(data.articles)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingNews(false))
  }, [])

  const relatedNews = articles.filter((n) => 
    n.affectedStocks?.includes(symbol) || 
    n.title.toLowerCase().includes(symbol.toLowerCase()) || 
    n.summary.toLowerCase().includes(symbol.toLowerCase())
  ).slice(0, 3)

  const fundamentals = {
    marketCap: "₹18.5L Cr",
    peRatio: "28.4",
    pbRatio: "4.2",
    dividendYield: "1.2%",
    eps: "₹87.2",
    bookValue: "₹580",
    debtToEquity: "0.15",
    roe: "18.5%",
    roce: "22.3%",
    promoterHolding: "57.2%",
    fiiHolding: "23.4%",
    diiHolding: "12.1%",
  }

  const technicals = {
    rsi: 58.4,
    macd: "Bullish",
    sma20: "₹2,380",
    sma50: "₹2,320",
    sma200: "₹2,180",
    support: "₹2,350",
    resistance: "₹2,480",
    atr: "45.2",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{stock.symbol}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {stock.sector}
              </Badge>
            </div>
            <p className="text-muted-foreground">{stock.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() =>
              isInWatchlist ? removeFromWatchlist(symbol) : addToWatchlist(symbol)
            }
          >
            <Star
              className={`h-4 w-4 ${isInWatchlist ? "fill-accent text-accent" : ""}`}
            />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Price Section */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold font-mono">
                ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={isPositive ? "default" : "destructive"}
                  className={`${
                    isPositive
                      ? "bg-accent/20 text-accent hover:bg-accent/30"
                      : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {isPositive ? "+" : ""}
                  {stock.change.toFixed(2)}%
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {isPositive ? "+" : ""}₹
                  {((stock.price * stock.change) / 100).toFixed(2)} today
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {["1W", "1M", "3M", "6M", "1Y"].map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className={`font-mono text-xs ${
                    timeframe === tf ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#666"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value}`}
                  domain={["dataMin - 50", "dataMax + 50"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    `₹${value.toFixed(2)}`,
                    "Price",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#00FF94" : "#FF4444"}
                  strokeWidth={2}
                  fill="url(#stockGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="fundamentals" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            Fundamentals
          </TabsTrigger>
          <TabsTrigger value="technicals" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            Technicals
          </TabsTrigger>
          <TabsTrigger value="news" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            News
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* AI Insight */}
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-accent" />
                ET AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {stock.symbol} shows strong momentum with consistent institutional buying over the past month. 
                The stock is trading above all major moving averages and RSI indicates healthy buying interest 
                without being overbought. Key catalyst: Upcoming quarterly results expected to beat estimates 
                by 8-12%. Consider accumulating on dips near ₹2,350 support level.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge className="bg-accent/20 text-accent">
                  Strong Buy
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Target: ₹{(stock.price * 1.15).toFixed(0)} (15% upside)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Day High", value: `₹${(stock.price * 1.02).toFixed(2)}` },
              { label: "Day Low", value: `₹${(stock.price * 0.98).toFixed(2)}` },
              { label: "52W High", value: `₹${(stock.price * 1.25).toFixed(2)}` },
              { label: "52W Low", value: `₹${(stock.price * 0.75).toFixed(2)}` },
              { label: "Open", value: `₹${(stock.price * 0.995).toFixed(2)}` },
              { label: "Prev Close", value: `₹${(stock.price * 0.99).toFixed(2)}` },
              { label: "Volume", value: "12.5M" },
              { label: "Avg Volume", value: "8.2M" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/50 bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold font-mono mt-1">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Company Info */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                About {stock.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {stock.name} is one of India&apos;s leading companies in the {stock.sector} sector. 
                With a strong track record of consistent growth and shareholder value creation, 
                the company has established itself as a market leader with robust fundamentals 
                and excellent corporate governance practices.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">45,000+ Employees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Founded 1991</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">HQ: Mumbai</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fundamentals" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(fundamentals).map(([key, value]) => (
              <Card key={key} className="border-border/50 bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-semibold font-mono mt-2">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="technicals" className="mt-6 space-y-6">
          {/* Technical Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(technicals).map(([key, value]) => (
              <Card key={key} className="border-border/50 bg-card/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {key}
                  </p>
                  <p className="text-lg font-semibold font-mono mt-2">
                    {typeof value === "number" ? value.toFixed(1) : value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* RSI Gauge */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                RSI Indicator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="w-[30%] bg-destructive/50" />
                  <div className="w-[40%] bg-accent/50" />
                  <div className="w-[30%] bg-destructive/50" />
                </div>
                <div
                  className="absolute top-0 h-full w-1 bg-foreground rounded-full"
                  style={{ left: `${technicals.rsi}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Oversold (0-30)</span>
                <span>Neutral (30-70)</span>
                <span>Overbought (70-100)</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="mt-6 space-y-4">
          {loadingNews ? (
             Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-border/50 bg-card/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex gap-2"><div className="w-16 h-5 bg-muted rounded animate-pulse" /><div className="w-20 h-5 bg-muted rounded animate-pulse" /></div>
                    <div className="w-full h-4 bg-muted rounded animate-pulse" />
                    <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
             ))
          ) : relatedNews.length > 0 ? (
            relatedNews.map((news) => (
              <Card
                key={news.id}
                className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                onClick={() => window.open(news.url, '_blank')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {news.source}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {news.time}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm">{news.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {news.summary}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No recent news for {symbol}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <span className="text-sm">Ask ET AI about {symbol}</span>
            </div>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Start Chat
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
