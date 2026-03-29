'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Heart, GraduationCap, Baby, Briefcase, Plus, Trash2, CheckCircle,
  Clock, AlertTriangle, ChevronRight, Loader2, Calendar, Target, ListTodo, Save, X, Edit2
} from 'lucide-react'
import { cn } from '@/lib/utils'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

const EVENT_TYPES = [
  { id: 'home_purchase', name: 'Home Purchase', icon: Home, color: 'text-blue-400' },
  { id: 'wedding', name: 'Grand Wedding', icon: Heart, color: 'text-rose-400' },
  { id: 'education', name: 'Higher Education', icon: GraduationCap, color: 'text-indigo-400' },
  { id: 'child_birth', name: 'Child Birth', icon: Baby, color: 'text-emerald-400' }
]

export function LifeEventTab() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newPlan, setNewPlan] = useState({
    event_type: 'home_purchase',
    event_date: new Date(Date.now() + 157680000000).toISOString().split('T')[0], // 5 years
    target_amount: 5000000,
    current_progress: 0,
    to_do_list: []
  })

  useEffect(() => {
    fetch('/api/life-events')
      .then(r => r.json())
      .then(d => setPlans(d.plans || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/life-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
      })
      const data = await res.json()
      setPlans([data.plan, ...plans])
      setShowAdd(false)
    } catch {}
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/life-events?id=${id}`, { method: 'DELETE' })
      setPlans(plans.filter(p => p.id !== id))
    } catch {}
  }

  const handleUpdate = async (id: string, updates: any) => {
    try {
      const res = await fetch('/api/life-events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      const data = await res.json()
      setPlans(plans.map(p => p.id === id ? data.plan : p))
    } catch {}
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Financial Goal Advisor</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Plan New Goal
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleAdd} className="bg-card border-2 border-primary/20 rounded-xl p-6 mb-6">
               <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">What's the goal?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EVENT_TYPES.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNewPlan({...newPlan, event_type: t.id})}
                          className={cn("flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all",
                            newPlan.event_type === t.id ? "bg-primary/10 border-primary text-primary" : "bg-muted/50 border-transparent hover:border-primary/30"
                          )}
                        >
                          <t.icon className={cn("w-4 h-4", t.color)} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground opacity-60">Target Date</label>
                      <input type="date" value={newPlan.event_date} onChange={e => setNewPlan({...newPlan, event_date: e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border-transparent focus:border-primary outline-none text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground opacity-60">Target Amount (₹)</label>
                      <input type="number" value={newPlan.target_amount} onChange={e => setNewPlan({...newPlan, target_amount: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border-transparent focus:border-primary outline-none text-sm" />
                    </div>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button type="submit" className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-bold">Start Planning Journey</button>
                  <button type="button" onClick={() => setShowAdd(false)} className="h-10 px-4 bg-muted rounded-lg text-sm font-bold">Cancel</button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {plans.length === 0 && !showAdd && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
           <Target className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" />
           <p className="text-muted-foreground">No life event plans yet. Start planning for your dreams!</p>
        </div>
      )}
    </div>
  )
}

function PlanCard({ plan, onUpdate, onDelete }: { plan: any; onUpdate: (id: string, updates: any) => void; onDelete: (id: string) => void }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftGoal, setDraftGoal] = useState(plan.target_amount)
  const event = EVENT_TYPES.find(t => t.id === plan.event_type) || EVENT_TYPES[0]
  const progress = Math.min((plan.current_progress / plan.target_amount) * 100, 100)

  const toggleTodo = (index: number) => {
    const list = [...(plan.to_do_list || [])]
    list[index].completed = !list[index].completed
    onUpdate(plan.id, { to_do_list: list })
  }

  const addTodo = (text: string) => {
    if (!text.trim()) return
    const list = [...(plan.to_do_list || []), { text, completed: false }]
    onUpdate(plan.id, { to_do_list: list })
  }

  const deleteTodo = (index: number) => {
    const list = [...(plan.to_do_list || [])]
    list.splice(index, 1)
    onUpdate(plan.id, { to_do_list: list })
  }

  return (
    <motion.div layout className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
      <div className="p-5 border-b border-border bg-muted/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border">
               <event.icon className={cn("w-5 h-5", event.color)} />
             </div>
             <div>
               <h4 className="font-bold text-sm tracking-tight">{event.name} Roadmap</h4>
               <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium uppercase tracking-wider">
                 <Calendar className="w-3 h-3" />
                 Target: {new Date(plan.event_date).toLocaleDateString()}
               </p>
             </div>
          </div>
          <button onClick={() => onDelete(plan.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
           <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Target Amount</span>
                {editingTitle ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input autoFocus type="number" value={draftGoal} onChange={e => setDraftGoal(+e.target.value)} className="bg-background border border-primary/50 text-sm font-bold p-1 rounded w-32" />
                    <button onClick={() => { onUpdate(plan.id, { target_amount: draftGoal }); setEditingTitle(false) }} className="text-primary hover:scale-110"><Save className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingTitle(false)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <p className="text-lg font-bold flex items-center gap-2">
                    {formatCurrency(plan.target_amount)}
                    <button onClick={() => setEditingTitle(true)} className="text-muted-foreground opacity-40 hover:opacity-100"><Edit2 className="w-3 h-3" /></button>
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground font-medium">Saved</span>
                <p className="text-lg font-bold text-primary">{formatCurrency(plan.current_progress)}</p>
              </div>
           </div>
           <div className="h-2 bg-muted rounded-full overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary" />
           </div>
        </div>
      </div>

      <div className="p-5 flex-1 space-y-4">
         <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <ListTodo className="w-3 h-3" />
              Strategic To-Do List
            </h5>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold">{plan.to_do_list?.filter((t:any) => t.completed).length || 0}/{plan.to_do_list?.length || 0}</span>
         </div>

         <div className="space-y-2">
           {(plan.to_do_list || []).map((todo: any, idx: number) => (
             <div key={idx} className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-all border border-transparent hover:border-border">
                <button onClick={() => toggleTodo(idx)} className="flex items-center gap-3 text-left">
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", todo.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30")}>
                    {todo.completed && <CheckCircle className="w-3 h-3" />}
                  </div>
                  <span className={cn("text-xs font-medium", todo.completed && "line-through text-muted-foreground")}>{todo.text}</span>
                </button>
                <button onClick={() => deleteTodo(idx)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
             </div>
           ))}

           <div className="relative pt-1">
              <input
                onKeyDown={(e) => { if (e.key === 'Enter') { addTodo((e.target as any).value); (e.target as any).value = '' } }}
                placeholder="+ Add task (e.g. Check credit score)"
                className="w-full h-8 text-xs bg-muted/30 border border-dashed border-border rounded px-3 outline-none focus:border-primary/50 transition-colors"
              />
           </div>
         </div>
      </div>
    </motion.div>
  )
}
