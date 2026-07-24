export default function AdminLoginLoading() {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--sh-linen)" }}>
      {/* Brand panel skeleton (ink) */}
      <div className="relative hidden lg:flex lg:w-[48%] flex-col justify-between overflow-hidden p-12 xl:p-16" style={{ backgroundColor: "var(--sh-ink)" }}>
        <div className="h-6 w-32 animate-pulse rounded" style={{ backgroundColor: "var(--sh-linen-12)" }} />
        <div className="space-y-4 max-w-md">
          <div className="h-4 w-28 animate-pulse rounded" style={{ backgroundColor: "var(--sh-linen-12)" }} />
          <div className="h-12 w-72 animate-pulse rounded" style={{ backgroundColor: "var(--sh-linen-12)" }} />
          <div className="h-12 w-56 animate-pulse rounded" style={{ backgroundColor: "var(--sh-linen-12)" }} />
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-48 animate-pulse rounded" style={{ backgroundColor: "var(--sh-linen-08)" }} />
            ))}
          </div>
        </div>
        <div className="h-3 w-44 animate-pulse rounded" style={{ backgroundColor: "var(--sh-linen-08)" }} />
      </div>

      {/* Form panel skeleton (linen) */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:py-16">
        <div className="w-full max-w-[420px] space-y-8 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 w-28 rounded" style={{ backgroundColor: "var(--sh-ink-10)" }} />
            <div className="h-9 w-40 rounded" style={{ backgroundColor: "var(--sh-ink-10)" }} />
            <div className="h-4 w-64 rounded" style={{ backgroundColor: "var(--sh-ink-10)" }} />
          </div>
          <div className="space-y-5">
            <div className="h-12 rounded-[2px]" style={{ backgroundColor: "var(--sh-ink-10)" }} />
            <div className="h-12 rounded-[2px]" style={{ backgroundColor: "var(--sh-ink-10)" }} />
            <div className="h-12 rounded-[2px]" style={{ backgroundColor: "var(--sh-ink-10)" }} />
          </div>
        </div>
      </div>
    </div>
  )
}
