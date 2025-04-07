import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface CustomSuggestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (suggestion: string) => void
  loading?: boolean
}

export function CustomSuggestionDialog({ open, onOpenChange, onSubmit, loading }: CustomSuggestionDialogProps) {
  const [suggestion, setSuggestion] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What type of content are you looking for?</DialogTitle>
          <DialogDescription>
            Tell us about the content you'd like to create, and we'll generate relevant ideas.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="suggestion">Your Content Preferences</Label>
          <Textarea
            id="suggestion"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Example: I want recipe ideas that are quick weeknight meals using pantry staples..."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              onSubmit(suggestion)
              setSuggestion('')
            }}
            disabled={!suggestion.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Ideas...
              </>
            ) : (
              'Get Content Ideas'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 