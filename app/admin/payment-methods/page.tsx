import type { Metadata }        from "next"
import { auth }                  from "@/lib/auth"
import { redirect }              from "next/navigation"
import { getAllPaymentMethods }   from "@/lib/services/paymentMethod.service"
import { PaymentMethodsClient }  from "@/components/admin/payment-methods/PaymentMethodsClient"

export const metadata: Metadata = { title: "Payment Methods" }
export const dynamic = "force-dynamic"

export default async function PaymentMethodsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const initialMethods = await getAllPaymentMethods().catch(() => [])

  return (
    <div className="px-6 py-8 max-w-screen-xl mx-auto">
      <PaymentMethodsClient initialMethods={initialMethods} />
    </div>
  )
}
