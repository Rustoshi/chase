import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export interface AdminUser {
  id:        string
  email:     string
  role:      "admin" | "user"
  firstName: string
  lastName:  string
}

type GuardSuccess = { user: AdminUser;  error: null         }
type GuardFailure = { user: null;       error: NextResponse }

/**
 * Call at the top of every admin API route handler.
 *
 * Usage:
 *   const { user, error } = await adminGuard()
 *   if (error) return error
 *   // proceed with user.id, user.email, …
 */
export async function adminGuard(): Promise<GuardSuccess | GuardFailure> {
  const session = await auth()

  if (!session?.user || session.user.role !== "admin") {
    return {
      user:  null,
      error: NextResponse.json(
        { error: "Unauthorized", message: "Valid admin session required." },
        { status: 401 }
      ),
    }
  }

  return {
    user: {
      id:        session.user.id,
      email:     session.user.email!,
      role:      session.user.role,
      firstName: session.user.firstName,
      lastName:  session.user.lastName,
    },
    error: null,
  }
}
