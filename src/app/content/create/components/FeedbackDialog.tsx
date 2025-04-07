import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (feedback: string) => void
  loading?: boolean
}

export function FeedbackDialog({ open, onOpenChange, onSubmit, loading }: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Why would you like to regenerate?</DialogTitle>
          <DialogDescription>
            Your feedback helps us improve future content generation.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="feedback">Feedback</Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Please explain what you'd like to improve in the generated content..."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              onSubmit(feedback)
              setFeedback('')
            }}
            disabled={!feedback.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              'Regenerate Content'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 