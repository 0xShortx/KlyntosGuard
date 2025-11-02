import { auth } from '@/lib/auth'

// Export all HTTP methods for Better Auth
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = auth.handler
