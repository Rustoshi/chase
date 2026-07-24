import { handlers } from "@/lib/auth"

// Delegate all GET /api/auth/* and POST /api/auth/* to NextAuth v5
export const { GET, POST } = handlers
