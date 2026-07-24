/* ══════════════════════════════════════════════════════════════════════════
   Card network brand logos — official Visa / Mastercard / American Express
   marks (downloaded to /public/images/cards). Two variants:

   • <CardBrandBadge>  colored payment chip on the brand's own background —
                        use on light UI (network selection, lists).
   • <CardBrandMark>   logo for dark card faces — white Visa/Amex (forced via
                        filter) and the colored Mastercard circles.
   ══════════════════════════════════════════════════════════════════════════ */

type Network = string

function brandKey(n: Network): "visa" | "mastercard" | "amex" {
  const k = (n || "").toLowerCase()
  return k === "mastercard" ? "mastercard" : k === "amex" ? "amex" : "visa"
}

const BADGE: Record<string, string> = {
  visa:       "/images/cards/visa.svg",
  mastercard: "/images/cards/mastercard.svg",
  amex:       "/images/cards/amex.svg",
}

const MARK: Record<string, string> = {
  visa:       "/images/cards/visa-mono.svg",       // dark grey → whitened via filter
  mastercard: "/images/cards/mastercard-logo.svg", // colored circles (transparent bg)
  amex:       "/images/cards/amex-mono.svg",        // dark grey → whitened via filter
}

const LABEL: Record<string, string> = {
  visa:       "Visa",
  mastercard: "Mastercard",
  amex:       "American Express",
}

// Colored payment badge (brand background, rounded chip). For light backgrounds.
export function CardBrandBadge({ network, className }: { network: Network; className?: string }) {
  const k = brandKey(network)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={BADGE[k]} alt={LABEL[k]} className={className} draggable={false} />
  )
}

// Brand mark for dark card faces. Visa/Amex are forced white; Mastercard keeps color.
export function CardBrandMark({ network, className }: { network: Network; className?: string }) {
  const k = brandKey(network)
  const whiten = k !== "mastercard"
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={MARK[k]}
      alt={LABEL[k]}
      className={className}
      draggable={false}
      style={whiten ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  )
}
