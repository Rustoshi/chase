import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import Account from "@/lib/models/Account"
import { UserAppShell } from "@/components/user/UserAppShell"
import { OnboardingWrapper } from "@/components/user/OnboardingWrapper"
import { SplashScreen } from "@/components/user/SplashScreen"
import { SmartsuppChat } from "@/components/user/SmartsuppChat"
import { getActiveUserAlert } from "@/lib/services/alert.service"

export default async function UserAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    const headersList = await headers()
    const pathname = headersList.get("x-pathname") ?? "/app/dashboard"
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
  }

  if (session.user.role === "admin") {
    redirect("/admin/dashboard")
  }

  // Fetch accounts for onboarding wallet previews
  let fiatAccount: { accountNumber: string } | undefined
  let btcAccount: { btcAddress: string } | undefined

  if (session.user.kycStatus === "unverified") {
    try {
      await connectDB()
      const accounts = await Account.find({ userId: session.user.id })
        .select("walletType accountNumber btcAddress")
        .lean()

      const fiat = accounts.find((a) => a.walletType === "fiat")
      const btc  = accounts.find((a) => a.walletType === "bitcoin")

      if (fiat) fiatAccount = { accountNumber: fiat.accountNumber }
      if (btc)  btcAccount  = { btcAddress: btc.btcAddress || "" }
    } catch {
      // Non-critical — onboarding will show placeholders
    }
  }

  // Admin-authored critical alert (rendered server-side so there is no flash)
  const alert = await getActiveUserAlert(session.user.id).catch(() => null)

  return (
    <SplashScreen>
      <UserAppShell session={session} alert={alert}>
        <OnboardingWrapper
          session={session}
          fiatAccount={fiatAccount}
          btcAccount={btcAccount}
        />
        {children}
        <SmartsuppChat />
      </UserAppShell>
    </SplashScreen>
  )
}
