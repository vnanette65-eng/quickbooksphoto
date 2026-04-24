import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getUser } from '@netlify/identity'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardRedirect,
})

function DashboardRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    getUser().then(user => {
      if (!user) { navigate({ to: '/auth/login' }); return }
      const role = (user?.app_metadata as any)?.roles?.[0] || 'client'
      if (role === 'admin') navigate({ to: '/dashboard/admin' })
      else if (role === 'photographer') navigate({ to: '/dashboard/photographer' })
      else navigate({ to: '/dashboard/client' })
    })
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )
}
