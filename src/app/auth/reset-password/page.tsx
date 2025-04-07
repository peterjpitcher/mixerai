'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      setSubmitted(true)
      toast({
        title: 'Success',
        description: 'Check your email for the password reset link.',
      })
    } catch (error) {
      console.error('Error resetting password:', error)
      toast({
        title: 'Error',
        description: 'Failed to send reset password email. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-primary-foreground">Check Your Email</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            We&apos;ve sent you a password reset link. Please check your email to continue.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/auth/sign-in" className="w-full">
            <Button variant="outline" className="w-full bg-white text-primary hover:bg-white/90">
              Return to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-primary-foreground">Reset Password</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Enter your email address and we&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleResetPassword}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full bg-white text-primary hover:bg-white/90" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
          <p className="text-sm text-center text-primary-foreground/80">
            Remember your password?{' '}
            <Link href="/auth/sign-in" className="text-white hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
} 