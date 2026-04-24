import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

interface SignupUser {
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
  email?: string
}

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const { user }: { user: SignupUser } = JSON.parse(event.body || '{}')

  const requestedRole = (user?.user_metadata?.role as string) || 'client'
  const validRoles = ['client', 'photographer']
  const role = validRoles.includes(requestedRole) ? requestedRole : 'client'

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin = adminEmails.includes(user?.email || '')

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        ...user?.app_metadata,
        roles: isAdmin ? ['admin'] : [role],
      },
      user_metadata: {
        ...user?.user_metadata,
      },
    }),
  }
}

export { handler }
