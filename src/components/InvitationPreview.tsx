'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { getInvitationEmailTemplate } from '@/lib/email-templates'

interface InvitationPreviewProps {
  email: string
  role: string
}

export function InvitationPreview({ email, role }: InvitationPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Generate preview data
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7)

  const emailTemplate = getInvitationEmailTemplate({
    email,
    role,
    acceptUrl: '#preview',
    expiryDate: expiryDate.toLocaleDateString(),
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Preview Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invitation Email Preview</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-gray-700 p-4">
            <div className="text-sm text-gray-400 mb-2">
              <strong>To:</strong> {email}
            </div>
            <div className="text-sm text-gray-400 mb-4">
              <strong>Subject:</strong> You have been invited to MixerAI
            </div>
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: emailTemplate.html }}
            />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Plain Text Version</h4>
            <pre className="whitespace-pre-wrap rounded-lg border border-gray-700 bg-gray-800/50 p-4 text-sm text-gray-300 font-mono">
              {emailTemplate.text}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 