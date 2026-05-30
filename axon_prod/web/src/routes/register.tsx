import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2Icon, BuildingIcon, UserIcon, LockIcon, MailIcon, ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/contexts/auth-context'
import { register as registerApi, ApiError } from '@/lib/api'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organization_name: z.string().min(1, 'Organization name is required'),
})
type FormData = z.infer<typeof schema>

function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', organization_name: '' },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      await registerApi({
        email: data.email,
        password: data.password,
        name: data.name,
        organization_name: data.organization_name,
      })
      // Tokens are stored by registerApi(); now set user state via login
      await login(data.email, data.password)
      navigate({ to: '/dashboard' })
    } catch (err) {
      if (err instanceof ApiError && err.data) {
        const d = err.data as Record<string, string>
        if (d.email) form.setError('email', { message: d.email })
        if (d.password) form.setError('password', { message: d.password })
        if (d.organization_name) form.setError('organization_name', { message: d.organization_name })
        if (d.non_field_errors) setServerError(d.non_field_errors)
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 mb-4 shadow-lg">
            <BuildingIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create your free account</h1>
          <p className="text-slate-400 mt-2">Free plan · No credit card required</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {serverError ? (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {serverError}
            </div>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Full name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input {...field} placeholder="Jane Smith" className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input {...field} type="email" placeholder="you@company.com" className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input {...field} type="password" placeholder="Min 8 characters" className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="organization_name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Company / Workspace name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input {...field} placeholder="Acme Corp" className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-2.5 mt-2"
              >
                {form.formState.isSubmitting ? (
                  <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
                ) : 'Create Free Account'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mt-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
