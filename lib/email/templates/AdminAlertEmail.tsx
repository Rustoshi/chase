import { BANK_NAME } from "@/lib/brand"

export interface AdminAlertRow { label: string; value: string }

export interface AdminAlertEmailProps {
  title:    string
  intro?:   string
  rows:     AdminAlertRow[]
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function renderAdminAlertEmail({ title, intro, rows }: AdminAlertEmailProps): string {
  const year = new Date().getFullYear()
  const adminUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const rowsHtml = rows.map((r) => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#667085;white-space:nowrap;vertical-align:top;width:40%">${escapeHtml(r.label)}</td>
      <td style="padding:8px 0;font-size:14px;color:#101828;font-weight:500;text-align:right">${escapeHtml(r.value)}</td>
    </tr>`).join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} - ${BANK_NAME} Admin</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#101828">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px">
    <tr>
      <td>
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#1A2CCE">${BANK_NAME} · Admin alert</p>
        <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#101828">${escapeHtml(title)}</h1>
        ${intro ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475467">${escapeHtml(intro)}</p>` : ""}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #eaecf0;border-radius:12px;padding:8px 16px">
          ${rowsHtml}
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
          <tr>
            <td>
              <a href="${escapeHtml(adminUrl)}/admin/dashboard" style="display:inline-block;padding:12px 24px;background-color:#1A2CCE;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px">Open admin dashboard</a>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#98a2b3">
          You are receiving this because you are an administrator of ${BANK_NAME}.<br />
          &copy; ${year} ${BANK_NAME}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}
