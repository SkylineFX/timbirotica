export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }: { user: any }) {
    const db = useDrizzle()

    // Google reports whether the email is verified on the Google account. We
    // mirror that into our own emailVerifiedAt so OAuth users don't have to
    // re-verify (and so legacy users who later sign in with Google get backfilled).
    const googleVerified = user.email_verified === true || user.verified_email === true
    const now = new Date()

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
        emailVerifiedAt: googleVerified ? now : null,
        createdAt: now
      }).returning().get()
    } else if (googleVerified && !dbUser.emailVerifiedAt) {
      // Backfill verification for an existing email/password user who is now
      // logging in with Google for the first time.
      await db.update(tables.users)
        .set({ emailVerifiedAt: now })
        .where(eq(tables.users.id, dbUser.id))
      dbUser.emailVerifiedAt = now
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
