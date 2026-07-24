"use client"

const PREFIX_COLORS: Record<string, { bg: string; text: string }> = {
  user:            { bg: "bg-indigo-100",   text: "text-indigo-800"   },
  loan:            { bg: "bg-indigo-100", text: "text-indigo-800" },
  card:            { bg: "bg-purple-100", text: "text-purple-800" },
  kyc:             { bg: "bg-teal-100",   text: "text-teal-800"   },
  deposit:         { bg: "bg-green-100",  text: "text-green-800"  },
  transaction:     { bg: "bg-amber-100",  text: "text-amber-800"  },
  settings:        { bg: "bg-orange-100", text: "text-orange-800" },
  history:         { bg: "bg-pink-100",   text: "text-pink-800"   },
  payment_method:  { bg: "bg-slate-100",  text: "text-slate-800"  },
  notification:    { bg: "bg-cyan-100",   text: "text-cyan-800"   },
}

const DEFAULT_COLOR = { bg: "bg-gray-100", text: "text-gray-700" }

interface Props {
  action: string
}

export function ActionBadge({ action }: Props) {
  const prefix = action.split(".")[0]
  const { bg, text } = PREFIX_COLORS[prefix] ?? DEFAULT_COLOR

  return (
    <span className={`inline-block font-mono text-xs px-2 py-0.5 rounded-md ${bg} ${text} whitespace-nowrap`}>
      {action}
    </span>
  )
}

export function actionColor(action: string): string {
  const prefix = action.split(".")[0]
  return (PREFIX_COLORS[prefix] ?? DEFAULT_COLOR).text
}
