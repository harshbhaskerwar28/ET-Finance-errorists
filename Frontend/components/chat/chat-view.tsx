'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type ChatMessage } from '@/lib/store'
import { chatSuggestions, mockPortfolio, formatCurrency } from '@/lib/mock-data'
import { 
  Send, 
  Mic, 
  Paperclip, 
  Sparkles, 
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronRight,
  Bot,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Simulate AI response generation
const generateAIResponse = (query: string): { content: string; sources?: string[] } => {
  const queryLower = query.toLowerCase()
  
  if (queryLower.includes('pharma') || queryLower.includes('insider')) {
    return {
      content: `Based on my analysis of recent insider trading data and fundamental metrics, here are **3 mid-cap pharma stocks** with notable insider buying activity this quarter:

**1. Alkem Laboratories** (ALKEM)
- Promoter stake increased by 0.8% in Q3
- Operating margin improved to 18.2% from 16.5% YoY
- Current P/E: 24.5x vs sector average 28x

**2. Torrent Pharma** (TORNTPHARM)  
- Management purchased shares worth ₹45 Cr in Feb
- Domestic formulations grew 12% YoY
- Debt-to-equity reduced to 0.3x

**3. Ipca Laboratories** (IPCALAB)
- Director acquired 25,000 shares at ₹1,180
- Margins expanding due to API vertical
- Export business showing strong recovery

💡 *Recommendation:* Consider adding ALKEM to watchlist given the valuation gap and improving fundamentals.`,
      sources: ['NSE Insider Trading Data', 'Company Filings Q3 FY25', 'ET Markets Research']
    }
  }
  
  if (queryLower.includes('portfolio') || queryLower.includes('margin')) {
    const holdings = mockPortfolio.slice(0, 3)
    return {
      content: `Here's a quick analysis of your holdings with improving margins:

**Positive Margin Trends:**

${holdings.map((h, i) => `${i + 1}. **${h.symbol}** - ${h.sector}
   - Current allocation: ${h.allocation.toFixed(1)}%
   - Total return: ${h.totalReturn >= 0 ? '+' : ''}${h.totalReturn.toFixed(2)}%
`).join('\n')}

Based on the latest quarterly results, **TCS** and **RELIANCE** have shown the strongest margin expansion in your portfolio. Consider maintaining your current positions.

⚠️ *Note:* ASIANPAINT is showing margin pressure due to rising input costs. Monitor for next quarter results.`,
      sources: ['Your Portfolio Data', 'Q3 FY25 Results', 'Sector Analysis']
    }
  }

  if (queryLower.includes('tax') || queryLower.includes('sell')) {
    return {
      content: `**Tax Impact Analysis for RELIANCE Sale:**

If you sell your entire RELIANCE holding today:

| Metric | Value |
|--------|-------|
| Holding Period | 18 months |
| Purchase Value | ₹1,22,500 |
| Current Value | ₹1,44,622 |
| Capital Gain | ₹22,122 |
| Tax Type | **Long-term (LTCG)** |
| Tax Rate | 12.5% above ₹1.25L |
| Estimated Tax | **₹0** (within exemption) |

✅ Since your gains are below the ₹1.25 lakh LTCG exemption limit, you can sell without any capital gains tax liability.

*Would you like me to model the tax impact for your other holdings?*`,
      sources: ['IT Act Section 112A', 'Your Demat Statement', 'FY25 Tax Rules']
    }
  }

  if (queryLower.includes('sip') || queryLower.includes('mutual fund') || queryLower.includes('compare')) {
    return {
      content: `**Portfolio Comparison: Your MFs vs Nifty 50 Index**

| Metric | Your MF Portfolio | Nifty 50 Index |
|--------|------------------|----------------|
| 1Y Return | 16.8% | 14.2% |
| 3Y CAGR | 14.5% | 12.8% |
| Expense Ratio | 0.65% avg | 0.10% |
| Alpha Generated | **+2.6%** | Benchmark |

**Key Insights:**
- Your active funds have outperformed the index by ~2.6% annually
- However, the higher expense ratio (0.55% excess) eats into ~₹2,700/year on your corpus
- **Parag Parikh Flexi Cap** is your best performer with 18.5% XIRR

💡 *Suggestion:* Your current fund selection is solid. The alpha generation justifies the higher expenses. Consider consolidating smaller funds into your top performers.`,
      sources: ['CAMS Statement', 'NSE Index Data', 'MF Research']
    }
  }

  if (queryLower.includes('sector') || queryLower.includes('fii')) {
    return {
      content: `**Sector-wise FII Flow Analysis (This Week):**

🟢 **Net Buyers:**
- Banking & Finance: +₹890 Cr
- Energy: +₹780 Cr  
- Auto: +₹560 Cr
- Metals: +₹450 Cr

🔴 **Net Sellers:**
- IT Services: -₹1,250 Cr
- Realty: -₹680 Cr
- FMCG: -₹340 Cr

**Portfolio Impact:**
Your IT exposure (34%) is in the sector seeing maximum selling pressure. However, domestic institutional investors (DIIs) are providing support.

⚡ *Action Item:* Consider reducing IT allocation to 25% over the next 2-3 months if FII selling continues.`,
      sources: ['NSDL FII Data', 'Sector Analysis', 'Your Portfolio']
    }
  }

  // Default response
  return {
    content: `I understand you're asking about "${query}". Let me analyze this for you.

Based on current market conditions and your portfolio profile, here are my thoughts:

1. **Market Context:** Nifty is trading near all-time highs with moderate volatility
2. **Your Portfolio:** You have a well-diversified portfolio with good sector spread
3. **Risk Assessment:** Your current allocation aligns with your moderate risk profile

Would you like me to:
- Analyze specific stocks in detail?
- Review your sector allocation?
- Suggest rebalancing opportunities?

Just ask a follow-up question and I'll dive deeper!`,
    sources: ['Market Data', 'Portfolio Analysis']
  }
}

export function ChatView() {
  const { chatMessages, addChatMessage, clearChat } = useAppStore()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    addChatMessage(userMessage)
    setInput('')
    setIsTyping(true)

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

    const response = generateAIResponse(userMessage.content)
    
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      sources: response.sources
    }

    addChatMessage(aiMessage)
    setIsTyping(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">ET AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Portfolio-aware market intelligence</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Clear chat
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">How can I help you today?</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              Ask me anything about markets, your portfolio, tax planning, or financial advice. I have full context of your holdings.
            </p>

            {/* Suggestions */}
            <div className="w-full max-w-2xl">
              <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
              <div className="grid gap-2">
                {chatSuggestions.slice(0, 4).map((suggestion, i) => (
                  <motion.button
                    key={suggestion}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 transition-all text-sm group"
                  >
                    <span className="flex items-center justify-between">
                      {suggestion}
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[80%] md:max-w-[70%]",
                  message.role === 'user' ? "order-1" : ""
                )}>
                  <div className={cn(
                    "rounded-2xl p-4",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-br-md" 
                      : "bg-card border border-border rounded-bl-md"
                  )}>
                    <div className={cn(
                      "prose prose-sm max-w-none",
                      message.role === 'user' ? "prose-invert" : "prose-neutral dark:prose-invert"
                    )}>
                      {message.content.split('\n').map((line, i) => {
                        // Handle bold text
                        const boldRegex = /\*\*(.*?)\*\*/g
                        const parts = line.split(boldRegex)
                        
                        if (line.startsWith('|')) {
                          // Table row
                          return (
                            <div key={i} className="font-mono text-xs my-1 px-2 py-1 bg-muted/50 rounded">
                              {line}
                            </div>
                          )
                        }
                        
                        return (
                          <p key={i} className="mb-1 last:mb-0">
                            {parts.map((part, j) => 
                              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                            )}
                          </p>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Sources:</span>
                      {message.sources.map((source, i) => (
                        <span 
                          key={i}
                          className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions for AI messages */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 order-2">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md p-4">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about markets, your portfolio, or financial planning..."
              rows={1}
              className="w-full resize-none rounded-xl bg-muted/50 border border-transparent focus:border-primary px-4 py-3 pr-24 text-sm outline-none transition-all"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={cn(
              "p-3 rounded-xl transition-all",
              input.trim() && !isTyping
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          AI responses are for informational purposes only. Always verify before making investment decisions.
        </p>
      </div>
    </div>
  )
}
