// Mock data for ET AI Investment Intelligence Platform

export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: string
  marketCap: string
  sector: string
  pe?: number
  high52w?: number
  low52w?: number
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  time: string
  category: string
  impactScore: number
  affectedStocks: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
}

export interface Alert {
  id: string
  type: 'price' | 'earnings' | 'insider' | 'technical' | 'news'
  title: string
  description: string
  stock: string
  time: string
  priority: 'high' | 'medium' | 'low'
  read: boolean
}

export interface PortfolioHolding {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  value: number
  dayChange: number
  totalReturn: number
  allocation: number
  sector: string
}

export interface MutualFund {
  name: string
  scheme: string
  nav: number
  units: number
  value: number
  invested: number
  returns: number
  xirr: number
  category: string
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  persona: 'beginner' | 'active_trader' | 'sip_investor' | 'hni' | 'retiree' | 'nri'
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  investmentExperience: string
  goals: string[]
  moneyHealthScore: number
  lastActive: string
}

export const mockUser: UserProfile = {
  name: 'Arjun Mehta',
  email: 'arjun.mehta@email.com',
  phone: '+91 98765 43210',
  persona: 'active_trader',
  riskProfile: 'moderate',
  investmentExperience: '5-10 years',
  goals: ['Retirement', 'Child Education', 'Wealth Creation'],
  moneyHealthScore: 72,
  lastActive: '2 hours ago'
}

export const mockPortfolio: PortfolioHolding[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    quantity: 50,
    avgPrice: 2450,
    currentPrice: 2892.45,
    value: 144622.50,
    dayChange: 1.24,
    totalReturn: 18.06,
    allocation: 22.4,
    sector: 'Energy'
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    quantity: 25,
    avgPrice: 3200,
    currentPrice: 4156.80,
    value: 103920,
    dayChange: -0.45,
    totalReturn: 29.90,
    allocation: 16.1,
    sector: 'IT'
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    quantity: 60,
    avgPrice: 1580,
    currentPrice: 1678.25,
    value: 100695,
    dayChange: 0.82,
    totalReturn: 6.22,
    allocation: 15.6,
    sector: 'Banking'
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd',
    quantity: 45,
    avgPrice: 1420,
    currentPrice: 1534.60,
    value: 69057,
    dayChange: -1.12,
    totalReturn: 8.07,
    allocation: 10.7,
    sector: 'IT'
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd',
    quantity: 75,
    avgPrice: 890,
    currentPrice: 1156.90,
    value: 86767.50,
    dayChange: 0.95,
    totalReturn: 29.99,
    allocation: 13.4,
    sector: 'Banking'
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Ltd',
    quantity: 40,
    avgPrice: 780,
    currentPrice: 1245.30,
    value: 49812,
    dayChange: 2.15,
    totalReturn: 59.65,
    allocation: 7.7,
    sector: 'Telecom'
  },
  {
    symbol: 'WIPRO',
    name: 'Wipro Ltd',
    quantity: 100,
    avgPrice: 420,
    currentPrice: 485.75,
    value: 48575,
    dayChange: 0.32,
    totalReturn: 15.65,
    allocation: 7.5,
    sector: 'IT'
  },
  {
    symbol: 'ASIANPAINT',
    name: 'Asian Paints Ltd',
    quantity: 15,
    avgPrice: 2850,
    currentPrice: 2756.40,
    value: 41346,
    dayChange: -0.68,
    totalReturn: -3.28,
    allocation: 6.4,
    sector: 'Consumer'
  }
]

export const mockMutualFunds: MutualFund[] = [
  {
    name: 'Axis Bluechip Fund',
    scheme: 'Direct Growth',
    nav: 52.34,
    units: 2500,
    value: 130850,
    invested: 100000,
    returns: 30850,
    xirr: 14.2,
    category: 'Large Cap'
  },
  {
    name: 'Parag Parikh Flexi Cap',
    scheme: 'Direct Growth',
    nav: 68.92,
    units: 1800,
    value: 124056,
    invested: 90000,
    returns: 34056,
    xirr: 18.5,
    category: 'Flexi Cap'
  },
  {
    name: 'Mirae Asset Emerging Bluechip',
    scheme: 'Direct Growth',
    nav: 112.45,
    units: 850,
    value: 95582.50,
    invested: 75000,
    returns: 20582.50,
    xirr: 12.8,
    category: 'Large & Mid Cap'
  },
  {
    name: 'SBI Small Cap Fund',
    scheme: 'Direct Growth',
    nav: 145.67,
    units: 450,
    value: 65551.50,
    invested: 50000,
    returns: 15551.50,
    xirr: 16.4,
    category: 'Small Cap'
  },
  {
    name: 'HDFC Index Fund Nifty 50',
    scheme: 'Direct Growth',
    nav: 198.23,
    units: 350,
    value: 69380.50,
    invested: 60000,
    returns: 9380.50,
    xirr: 11.2,
    category: 'Index Fund'
  }
]

export const mockStocks: Stock[] = [
  { symbol: 'NIFTY50', name: 'Nifty 50', price: 24823.15, change: 156.45, changePercent: 0.63, volume: '1.2B', marketCap: '-', sector: 'Index' },
  { symbol: 'SENSEX', name: 'BSE Sensex', price: 81892.34, change: 498.72, changePercent: 0.61, volume: '850M', marketCap: '-', sector: 'Index' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2892.45, change: 35.60, changePercent: 1.24, volume: '12.5M', marketCap: '19.5L Cr', sector: 'Energy', pe: 28.4 },
  { symbol: 'TCS', name: 'TCS Ltd', price: 4156.80, change: -18.90, changePercent: -0.45, volume: '3.2M', marketCap: '15.2L Cr', sector: 'IT', pe: 32.1 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1678.25, change: 13.65, changePercent: 0.82, volume: '8.4M', marketCap: '12.8L Cr', sector: 'Banking', pe: 19.8 },
  { symbol: 'INFY', name: 'Infosys', price: 1534.60, change: -17.35, changePercent: -1.12, volume: '5.1M', marketCap: '6.4L Cr', sector: 'IT', pe: 24.6 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1156.90, change: 10.90, changePercent: 0.95, volume: '6.8M', marketCap: '8.1L Cr', sector: 'Banking', pe: 18.2 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1245.30, change: 26.20, changePercent: 2.15, volume: '4.5M', marketCap: '7.5L Cr', sector: 'Telecom', pe: 45.3 },
]

export const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'RBI Keeps Repo Rate Unchanged at 6.5%, Maintains Neutral Stance',
    summary: 'The Reserve Bank of India maintained its key lending rate for the eighth consecutive time, citing inflation concerns while keeping growth projections steady.',
    source: 'ET Markets',
    time: '2 hours ago',
    category: 'Macro',
    impactScore: 85,
    affectedStocks: ['HDFCBANK', 'ICICIBANK', 'SBIN'],
    sentiment: 'neutral'
  },
  {
    id: '2',
    title: 'Reliance Jio Announces Major Tariff Hike, Stock Surges 3%',
    summary: 'Reliance Jio has announced a 15-20% increase in mobile tariffs effective next month, boosting the telecom sector sentiment.',
    source: 'ET Tech',
    time: '3 hours ago',
    category: 'Corporate',
    impactScore: 92,
    affectedStocks: ['RELIANCE', 'BHARTIARTL', 'VIL'],
    sentiment: 'positive'
  },
  {
    id: '3',
    title: 'TCS Q3 Results: Net Profit Up 8.2% YoY, Revenue Beats Estimates',
    summary: 'Tata Consultancy Services reported strong Q3 results with net profit of Rs 12,380 crore, beating street expectations on operational efficiency.',
    source: 'ET Markets',
    time: '5 hours ago',
    category: 'Earnings',
    impactScore: 88,
    affectedStocks: ['TCS', 'INFY', 'WIPRO', 'HCLTECH'],
    sentiment: 'positive'
  },
  {
    id: '4',
    title: 'FII Outflows Continue: Rs 8,500 Crore Sold in March So Far',
    summary: 'Foreign institutional investors continue their selling spree in Indian markets amid global risk-off sentiment and rising US yields.',
    source: 'ET Markets',
    time: '6 hours ago',
    category: 'FII/DII',
    impactScore: 78,
    affectedStocks: [],
    sentiment: 'negative'
  },
  {
    id: '5',
    title: 'HDFC Bank Insider Trade: MD Sells Shares Worth Rs 45 Crore',
    summary: 'HDFC Bank MD exercised stock options and sold shares in a pre-planned transaction disclosed to exchanges.',
    source: 'ET Corporate',
    time: '8 hours ago',
    category: 'Insider',
    impactScore: 65,
    affectedStocks: ['HDFCBANK'],
    sentiment: 'neutral'
  },
  {
    id: '6',
    title: 'Auto Sales February: Maruti, Tata Motors Report Double-Digit Growth',
    summary: 'Passenger vehicle sales continue strong momentum with Maruti Suzuki reporting 12% growth and Tata Motors up 15% YoY.',
    source: 'ET Auto',
    time: '10 hours ago',
    category: 'Sector',
    impactScore: 72,
    affectedStocks: ['MARUTI', 'TATAMOTORS', 'M&M'],
    sentiment: 'positive'
  },
]

export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'price',
    title: 'BHARTIARTL hit 52-week high',
    description: 'Bharti Airtel touched Rs 1,252 - a new 52-week high. Up 59% from your average cost.',
    stock: 'BHARTIARTL',
    time: '15 min ago',
    priority: 'high',
    read: false
  },
  {
    id: '2',
    type: 'earnings',
    title: 'TCS Q3 Results Released',
    description: 'TCS reported Q3 FY25 results. Net profit up 8.2% YoY at Rs 12,380 crore.',
    stock: 'TCS',
    time: '2 hours ago',
    priority: 'high',
    read: false
  },
  {
    id: '3',
    type: 'technical',
    title: 'RELIANCE: Golden Cross Forming',
    description: '50-day MA about to cross above 200-day MA. Historically bullish signal.',
    stock: 'RELIANCE',
    time: '4 hours ago',
    priority: 'medium',
    read: true
  },
  {
    id: '4',
    type: 'insider',
    title: 'HDFCBANK: Promoter Stake Change',
    description: 'MD sold shares worth Rs 45 Cr as part of planned ESOP exercise.',
    stock: 'HDFCBANK',
    time: '8 hours ago',
    priority: 'low',
    read: true
  },
  {
    id: '5',
    type: 'news',
    title: 'RBI Policy Announcement',
    description: 'RBI kept repo rate unchanged. Your banking stocks may see muted reaction.',
    stock: 'HDFCBANK',
    time: '1 day ago',
    priority: 'medium',
    read: true
  },
]

export const mockSectorPerformance = [
  { name: 'IT', change: -0.82, fiiFlow: -1250, trend: 'bearish' as const },
  { name: 'Banking', change: 1.15, fiiFlow: 890, trend: 'bullish' as const },
  { name: 'Auto', change: 2.34, fiiFlow: 560, trend: 'bullish' as const },
  { name: 'Pharma', change: 0.45, fiiFlow: 120, trend: 'neutral' as const },
  { name: 'Energy', change: 1.78, fiiFlow: 780, trend: 'bullish' as const },
  { name: 'FMCG', change: -0.32, fiiFlow: -340, trend: 'neutral' as const },
  { name: 'Metals', change: 3.12, fiiFlow: 450, trend: 'bullish' as const },
  { name: 'Realty', change: -1.45, fiiFlow: -680, trend: 'bearish' as const },
]

export const mockChartPatterns = [
  {
    stock: 'RELIANCE',
    pattern: 'Golden Cross',
    confidence: 85,
    description: '50-day MA crossing above 200-day MA',
    historicalSuccess: 72,
    timeframe: 'Daily'
  },
  {
    stock: 'TATASTEEL',
    pattern: 'Cup and Handle',
    confidence: 78,
    description: 'Breakout above resistance at Rs 145',
    historicalSuccess: 68,
    timeframe: 'Weekly'
  },
  {
    stock: 'BHARTIARTL',
    pattern: 'Bullish Flag',
    confidence: 82,
    description: 'Consolidation after strong uptrend',
    historicalSuccess: 71,
    timeframe: 'Daily'
  },
  {
    stock: 'SBIN',
    pattern: 'Double Bottom',
    confidence: 75,
    description: 'Support tested twice at Rs 780',
    historicalSuccess: 65,
    timeframe: 'Daily'
  },
]

export const mockBulkDeals = [
  {
    stock: 'ZOMATO',
    buyer: 'Goldman Sachs',
    quantity: '2.5 Cr shares',
    price: 245.50,
    value: '613 Cr',
    date: 'Today',
    historicalAccuracy: 68
  },
  {
    stock: 'PAYTM',
    seller: 'SoftBank Vision Fund',
    quantity: '1.8 Cr shares',
    price: 385.20,
    value: '693 Cr',
    date: 'Today',
    historicalAccuracy: 45
  },
  {
    stock: 'POLYCAB',
    buyer: 'HDFC MF',
    quantity: '45 Lakh shares',
    price: 5890.00,
    value: '265 Cr',
    date: 'Yesterday',
    historicalAccuracy: 72
  },
]

export const mockMoneyHealthMetrics = {
  overall: 72,
  dimensions: [
    { name: 'Emergency Fund', score: 85, status: 'good', advice: '6 months expenses covered' },
    { name: 'Insurance Coverage', score: 45, status: 'needs_attention', advice: 'Term cover inadequate' },
    { name: 'Investment Diversity', score: 78, status: 'good', advice: 'Well diversified portfolio' },
    { name: 'Debt Health', score: 92, status: 'excellent', advice: 'No high-interest debt' },
    { name: 'Tax Efficiency', score: 65, status: 'average', advice: 'Rs 50K 80C limit unused' },
    { name: 'Retirement Readiness', score: 58, status: 'needs_attention', advice: 'Increase SIP by 15%' },
  ]
}

export const mockFirePlan = {
  currentAge: 35,
  retirementAge: 50,
  currentNetWorth: 1250000,
  targetCorpus: 50000000,
  monthlyExpenses: 80000,
  currentSIP: 75000,
  requiredSIP: 125000,
  projectedCorpus: 42000000,
  shortfall: 8000000,
  milestones: [
    { year: 2025, corpus: 1800000, milestone: 'Emergency Fund Complete' },
    { year: 2028, corpus: 5500000, milestone: 'Child Education Funded' },
    { year: 2032, corpus: 15000000, milestone: 'Home Loan Cleared' },
    { year: 2038, corpus: 35000000, milestone: '70% to FIRE' },
    { year: 2041, corpus: 50000000, milestone: 'Financial Independence' },
  ]
}

export const onboardingQuestions = [
  {
    id: 'experience',
    question: "How long have you been investing in stocks or mutual funds?",
    options: ['Just starting out', '1-3 years', '3-5 years', '5-10 years', '10+ years']
  },
  {
    id: 'income',
    question: "What's your approximate annual income range?",
    options: ['Under 5 Lakhs', '5-10 Lakhs', '10-25 Lakhs', '25-50 Lakhs', '50 Lakhs+']
  },
  {
    id: 'goals',
    question: "What are your primary financial goals?",
    options: ['Retirement Planning', 'Child Education', 'Wealth Creation', 'Home Purchase', 'Tax Saving', 'Short-term Trading']
  },
  {
    id: 'risk',
    question: "If your portfolio dropped 20% in a month, what would you do?",
    options: ['Sell everything immediately', 'Sell some holdings', 'Wait and watch', 'Buy more at lower prices']
  },
  {
    id: 'style',
    question: "Which best describes your investment style?",
    options: ['Set it and forget it (SIPs)', 'Active trading', 'Mix of both', 'Not sure yet']
  }
]

export const chatSuggestions = [
  "Which mid-cap pharma stocks have insider buying this quarter?",
  "Show me stocks with improving margins in my portfolio",
  "What's the tax impact if I sell RELIANCE today?",
  "Compare my MF portfolio with a simple Nifty index fund",
  "Which sectors are seeing FII inflows this week?",
  "Suggest stocks for long-term SIP under Rs 500",
]

export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)} L`
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num)
}

export function formatPercent(num: number, showSign = true): string {
  const sign = showSign && num > 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}
