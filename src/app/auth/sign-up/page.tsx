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

export default function SignUpPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: email === 'admin@mixerai.local' ? 'admin' : 'user'
          }
        }
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // Create roles table if it doesn't exist
        await supabase.from('roles').upsert([
          {
            name: 'admin',
            permissions: ['all']
          }
        ])

        // If this is the admin user, assign the admin role
        if (email === 'admin@mixerai.local') {
          await supabase.from('user_roles').insert({
            user_id: authData.user.id,
            role_id: (await supabase.from('roles').select('id').eq('name', 'admin').single()).data?.id
          })
        }
      }

      toast({
        title: 'Success',
        description: 'Account created successfully. Please check your email to confirm your account.',
      })

      router.push('/auth/sign-in')
    } catch (error) {
      console.error('Error signing up:', error)
      toast({
        title: 'Error',
        description: 'Failed to create account. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-primary-foreground">Create Account</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Sign up for a new account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-primary-foreground">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
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
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
            <p className="text-sm text-center text-primary-foreground/80">
              Already have an account?{' '}
              <Link href="/auth/sign-in" className="text-white hover:underline">
                Sign in
              </Link>
            </p>
            <div className="mt-4 text-sm text-center text-primary-foreground/60">
              <p>Need access to MixerAI?</p>
              <p>Contact <a href="mailto:peter.pitcher@genmills.com" className="text-white hover:underline">peter.pitcher@genmills.com</a> or via Teams</p>
              <p className="mt-2">For support or issues while using the system, please reach out to the same contact.</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 