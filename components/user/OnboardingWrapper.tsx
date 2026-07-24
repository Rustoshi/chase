"use client"

import type { Session } from "next-auth"
import { OnboardingFlow } from "@/components/user/onboarding/OnboardingFlow"

interface Props {
  session:      Session
  fiatAccount?: { accountNumber: string }
  btcAccount?:  { btcAddress: string }
}

export function OnboardingWrapper({ session, fiatAccount, btcAccount }: Props) {
  return (
    <OnboardingFlow
      session={session}
      fiatAccount={fiatAccount}
      btcAccount={btcAccount}
    />
  )
}
