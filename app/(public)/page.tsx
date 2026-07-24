import { Metadata } from "next"
import { BANK_NAME } from "@/lib/brand"
import { HeroSection, TrustBadges, FeaturesGrid, StatsCounter, ProductShowcase, HowItWorks, Testimonials, CTABanner } from "@/components/homepage"

export const metadata: Metadata = {
  title: `${BANK_NAME} | Modern Banking for the Digital Age`,
  description: `${BANK_NAME} offers secure, seamless, and sophisticated banking services. Open your account today and experience banking reimagined.`,
  keywords: ["online banking", "digital bank", "secure banking", "checking account", "savings account", "credit cards"],
  openGraph: {
    title: `${BANK_NAME} | Modern Banking for the Digital Age`,
    description: `Experience banking reimagined with ${BANK_NAME}. Secure, seamless, and sophisticated.`,
    type: "website",
  },
}

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Stats Counter */}
      <StatsCounter />

      {/* Product Showcase */}
      <ProductShowcase />

      {/* How It Works */}
      <HowItWorks />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Banner */}
      <CTABanner />

    </>
  )
}
