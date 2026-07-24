/**
 * Minimal markdown renderer for payment method instructions.
 * Handles: **bold**, *italic*, - bullet lists, [text](url), line breaks.
 * No external dependencies — safe to run in browser or server.
 */
export function renderMarkdownLite(md: string): string {
  const lines = md.split("\n")
  const html: string[] = []
  let inList = false

  for (const raw of lines) {
    let line = raw

    // Escape HTML
    line = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    // Bold: **text**
    line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic: *text*
    line = line.replace(/\*([^*]+?)\*/g, "<em>$1</em>")
    // Link: [text](url)
    line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-600 underline">$1</a>')

    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      if (!inList) { html.push("<ul class=\"list-disc pl-5 space-y-1\">"); inList = true }
      html.push(`<li>${line.replace(/^[-*]\s+/, "")}</li>`)
      continue
    }
    if (inList) { html.push("</ul>"); inList = false }

    if (line.trim() === "") {
      html.push("<br>")
    } else {
      html.push(`<p>${line}</p>`)
    }
  }
  if (inList) html.push("</ul>")

  return html.join("\n")
}
