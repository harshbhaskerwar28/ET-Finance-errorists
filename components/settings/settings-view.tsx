'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { mockUser } from '@/lib/mock-data'
import { 
  User, 
  Bell, 
  Shield, 
  Link2, 
  Smartphone, 
  Globe,
  Moon,
  LogOut,
  ChevronRight,
  Check,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export function SettingsView() {
  const { user, resetOnboarding } = useAppStore()
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    earnings: true,
    morningBrief: true,
    weeklyReport: true,
    marketing: false
  })

  const personaLabels: Record<string, string> = {
    beginner: 'Curious Beginner',
    active_trader: 'Active Trader',
    sip_investor: 'SIP Investor',
    hni: 'High Net Worth',
    retiree: 'Retiree',
    nri: 'NRI Investor'
  }

  const riskLabels: Record<string, string> = {
    conservative: 'Conservative',
    moderate: 'Balanced',
    aggressive: 'Aggressive'
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 space-y-6 max-w-4xl"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </motion.div>

      {/* Profile Section */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Profile</h3>
        </div>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-semibold text-primary">
              {(user.name || mockUser.name).split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-lg">{user.name || mockUser.name}</h4>
            <p className="text-sm text-muted-foreground">{mockUser.email}</p>
            <p className="text-sm text-muted-foreground">{mockUser.phone}</p>
          </div>
          <button className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
            Edit Profile
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Investor Type</p>
            <p className="font-medium">
              {user.persona ? personaLabels[user.persona] : personaLabels[mockUser.persona]}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Risk Profile</p>
            <p className="font-medium">
              {user.riskProfile ? riskLabels[user.riskProfile] : riskLabels[mockUser.riskProfile]}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Experience</p>
            <p className="font-medium">{mockUser.investmentExperience}</p>
          </div>
        </div>

        <button 
          onClick={resetOnboarding}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Retake profile assessment
        </button>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Notifications</h3>
        </div>

        <div className="space-y-4">
          {[
            { key: 'priceAlerts', label: 'Price Alerts', desc: 'Get notified when stocks hit your target prices' },
            { key: 'earnings', label: 'Earnings Alerts', desc: 'Notifications for quarterly results of your holdings' },
            { key: 'morningBrief', label: 'Morning Brief', desc: 'Daily personalized market summary at 8:00 AM' },
            { key: 'weeklyReport', label: 'Weekly Report', desc: 'Portfolio performance digest every Sunday' },
            { key: 'marketing', label: 'Product Updates', desc: 'New features and promotional content' },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium">{setting.label}</p>
                <p className="text-sm text-muted-foreground">{setting.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ 
                  ...prev, 
                  [setting.key]: !prev[setting.key as keyof typeof prev] 
                }))}
                className={cn(
                  "w-12 h-7 rounded-full transition-all relative",
                  notifications[setting.key as keyof typeof notifications]
                    ? "bg-primary"
                    : "bg-muted"
                )}
              >
                <span className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                  notifications[setting.key as keyof typeof notifications]
                    ? "left-6"
                    : "left-1"
                )} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Connected Accounts */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link2 className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Connected Accounts</h3>
        </div>

        <div className="space-y-3">
          {[
            { name: 'Zerodha', type: 'Broker', status: 'connected', icon: '📈' },
            { name: 'CAMS', type: 'MF Statement', status: 'connected', icon: '📊' },
            { name: 'KFintech', type: 'MF Statement', status: 'connected', icon: '📋' },
            { name: 'Groww', type: 'Broker', status: 'not_connected', icon: '🌱' },
          ].map((account) => (
            <div key={account.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{account.icon}</span>
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.type}</p>
                </div>
              </div>
              {account.status === 'connected' ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary">Connected</span>
                </div>
              ) : (
                <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Security</h3>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">Enabled</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage devices where {"you're"} logged in</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">3 devices</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Appearance</p>
                <p className="text-sm text-muted-foreground">Theme and display settings</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Dark</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        </div>
      </motion.div>

      {/* Data & Privacy */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Data & Privacy</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Your financial data is encrypted and never sold. You have full control over what you share.
        </p>

        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
            Download My Data
          </button>
          <button className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
            Privacy Settings
          </button>
          <button className="px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors">
            Delete Account
          </button>
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div variants={item}>
        <button className="flex items-center gap-2 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </motion.div>
    </motion.div>
  )
}
