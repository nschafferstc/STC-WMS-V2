'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      setError('Invalid credentials. Please try again.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - STC branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12" style={{ background: '#1a2744' }}>
        <div>
          <div className="text-white text-3xl font-bold tracking-tight">STC Logistics</div>
          <div className="text-sm font-medium mt-1 tracking-widest uppercase" style={{ color: '#f4811f' }}>Warehouse Management System</div>
        </div>
        <div className="text-slate-400 text-sm">
          <p className="text-white font-semibold text-lg mb-2">Warehouse. Managed.</p>
          <p>Real-time inventory, inbound receipts, order fulfillment, and shipment tracking — purpose-built for 3PL operations.</p>
        </div>
        <div className="text-slate-600 text-xs">© {new Date().getFullYear()} STC Logistics. All rights reserved.</div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <div className="text-2xl font-bold text-slate-900">STC Logistics</div>
            <div className="text-sm font-medium" style={{ color: '#f4811f' }}>Warehouse Management System</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Sign In</h2>
            <p className="text-slate-500 text-sm mb-6">Enter your credentials to access the WMS</p>

            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="you@shipstc.com" className="mt-1" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} placeholder="••••••••" className="mt-1" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <Button
                type="submit"
                className="w-full text-white"
                style={{ background: '#1a2744' }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            STC Logistics WMS — Internal Operations Platform
          </p>
        </div>
      </div>
    </div>
  )
}
