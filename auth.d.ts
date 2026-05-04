declare module '#auth-utils' {
  interface User {
    id: number
    firstName: string
    lastName: string
    role: 'user' | 'admin'
  }

  interface UserSession {
    // Add any other session properties if needed
  }
}

export { }
