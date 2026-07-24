interface PageHeaderProps {
  title:     string
  subtitle?: string
  actions?:  React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-5">
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-slate-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="ml-4 flex flex-shrink-0 items-center gap-3">{actions}</div>
      )}
    </div>
  )
}
