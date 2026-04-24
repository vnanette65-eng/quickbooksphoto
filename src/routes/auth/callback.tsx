import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { handleAuthCallback, getUser } from '@netlify/identity'
import { Camera } from 'lucide-react'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    async function process() {
      try {
        const result = await handleAuthCallback()
        if (result) {
          const user = await getUser()
          const role = (user?.app_metadata as any)?.roles?.[0] || 'client'
          if (role === 'admin') navigate({ to: '/dashboard/admin' })
          else if (role === 'photographer') navigate({ to: '/dashboard/photographer' })
          else navigate({ to: '/dashboard/client' })
        } else {
          navigate({ to: '/' })
        }
      } catch {
        navigate({ to: '/' })
      }
    }
    process()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4">
          <Camera size={28} className="text-stone-950" />
        </div>
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-400">Completing sign in...</p>
      </div>
    </div>
  )
}
