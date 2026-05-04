export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }: { user: any }) {
    const db = useDrizzle()
    
    // Check if user already exists
    let dbUser = await db.query.users.findFirst({
      where: eq(tables.users.email, user.email)
    })

    if (!dbUser) {
      // Auto-register them
      dbUser = await db.insert(tables.users).values({
        email: user.email,
        firstName: user.given_name || user.name?.split(' ')[0] || 'Utilizator',
        lastName: user.family_name || user.name?.split(' ').slice(1).join(' ') || '',
        password: 'OAUTH_USER',
        createdAt: new Date()
      }).returning().get()
    }

    // Assign session
    await setUserSession(event, {
      user: {
        id: dbUser.id,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role as 'user' | 'admin',
      }
    }, {
      // Keep Google-authenticated sessions alive for 30 days automatically
      maxAge: 60 * 60 * 24 * 30
    })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/user/login?error=oauth_failed')
  }
})
