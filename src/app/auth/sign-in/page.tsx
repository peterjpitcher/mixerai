'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      console.log('Attempting sign in with:', { email })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Sign in response:', { 
        success: !!data, 
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name
        } : null,
        user: data?.user ? {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role
        } : null
      })

      if (error) {
        console.error('Sign in error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        })
        
        if (error.message === 'Invalid login credentials') {
          toast({
            title: 'Error',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          })
        }
        return
      }

      console.log('Sign in successful, redirecting...')
      toast({
        title: 'Success',
        description: 'Signed in successfully.',
      })

      router.push('/admin/brands')
      router.refresh()
    } catch (error) {
      console.error('Unexpected error during sign in:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-primary-foreground">Sign In</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignIn}>
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
          <div className="space-y-2">
            <Label htmlFor="password" className="text-primary-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          <div className="text-sm text-center space-y-1">
            <p className="text-primary-foreground/80">
              Don&apos;t have an account?{' '}
              <Link href="/auth/sign-up" className="text-white hover:underline">
                Sign up
              </Link>
            </p>
            <p>
              <Link href="/auth/reset-password" className="text-white hover:underline">
                Forgot your password?
              </Link>
            </p>
          </div>
          <div className="mt-4 text-sm text-center text-primary-foreground/60">
            <p>Need access to MixerAI?</p>
            <p>Contact <a href="mailto:peter.pitcher@genmills.com" className="text-white hover:underline">peter.pitcher@genmills.com</a> or via Teams</p>
            <p className="mt-2">For support or issues while using the system, please reach out to the same contact.</p>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
} 