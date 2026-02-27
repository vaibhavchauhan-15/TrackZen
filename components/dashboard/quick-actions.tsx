'use client'

import { motion } from 'framer-motion'
import { Plus, Target, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const actions = [
  {
    label: 'Create New Plan',
    href: '/planner/new',
    icon: Plus,
    color: 'text-accent-purple',
    hoverBg: 'hover:bg-accent-purple/10',
  },
  {
    label: 'Log Habits',
    href: '/habits',
    icon: Target,
    color: 'text-accent-green',
    hoverBg: 'hover:bg-accent-green/10',
  },
  {
    label: 'Study Session',
    href: '/planner',
    icon: BookOpen,
    color: 'text-accent-cyan',
    hoverBg: 'hover:bg-accent-cyan/10',
  },
]

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="bg-bg-surface border-bg-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.08 }}
            >
              <Link href={action.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    className={`w-full justify-start ${action.hoverBg} transition-colors`} 
                    variant="outline"
                  >
                    <motion.div
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <action.icon className={`mr-3 h-4 w-4 ${action.color}`} />
                    </motion.div>
                    {action.label}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
