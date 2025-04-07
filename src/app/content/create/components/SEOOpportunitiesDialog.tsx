"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'

interface SEOOpportunity {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'content' | 'technical' | 'keywords' | 'structure'
}

interface SEOOpportunitiesDialogProps {
  isOpen: boolean
  onClose: () => void
  opportunities: SEOOpportunity[]
  loading: boolean
  onImplement: (selectedOpportunities: string[]) => void
  onSkip: () => void
}

export function SEOOpportunitiesDialog({
  isOpen,
  onClose,
  opportunities,
  loading,
  onImplement,
  onSkip
}: SEOOpportunitiesDialogProps) {
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([])

  const handleToggleOpportunity = (id: string) => {
    setSelectedOpportunities(prev => 
      prev.includes(id) 
        ? prev.filter(o => o !== id)
        : [...prev, id]
    )
  }

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-green-500'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>SEO Optimization Opportunities</DialogTitle>
          <DialogDescription>
            Select the optimization opportunities you'd like to implement, or skip to proceed with the current content.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Analyzing content...</span>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-2">No optimization opportunities found.</p>
            <p className="text-sm text-muted-foreground">The content appears to be well optimized, but you can still proceed with your own changes.</p>
          </div>
        ) : (
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4">
              {opportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border bg-card"
                >
                  <Checkbox
                    id={opportunity.id}
                    checked={selectedOpportunities.includes(opportunity.id)}
                    onCheckedChange={() => handleToggleOpportunity(opportunity.id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={opportunity.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {opportunity.title}
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {opportunity.description}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className={`text-xs font-medium ${getImpactColor(opportunity.impact)}`}>
                        {opportunity.impact.toUpperCase()} IMPACT
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {opportunity.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex justify-between space-x-2">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onSkip}
            >
              Skip Optimization
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
          {opportunities.length > 0 && (
            <Button
              onClick={() => onImplement(selectedOpportunities)}
              disabled={loading}
            >
              Implement Selected ({selectedOpportunities.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 