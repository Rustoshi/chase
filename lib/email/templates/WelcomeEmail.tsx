import { BANK_NAME, SUPPORT_EMAIL } from "@/lib/brand"

export interface WelcomeEmailProps {
  firstName: string
}

export function renderWelcomeEmail({ firstName }: WelcomeEmailProps): string {
  const year = new Date().getFullYear()
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${BANK_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px">
    <tr>
      <td>
        <!-- Header -->
        <h1 style="margin:0 0 32px;font-size:24px;font-weight:600;color:#111111">${BANK_NAME}</h1>
        
        <!-- Greeting -->
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333333">
          Hi ${escapeHtml(firstName)},
        </p>
        
        <!-- Main content -->
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#333333">
          Welcome to ${BANK_NAME}! Your account has been created and is ready to use. You can log in now and start banking.
        </p>
        
        <p style="margin:0 0 32px;font-size:14px;line-height:1.6;color:#666666">
          If you did not create an account with ${BANK_NAME}, please contact us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#666666">${SUPPORT_EMAIL}</a>.
        </p>
        
        <!-- Divider -->
        <hr style="margin:32px 0;border:none;border-top:1px solid #eeeeee" />
        
        <!-- Footer -->
        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#333333">
          Best regards,<br />
          The ${BANK_NAME} Team
        </p>
        
        <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#999999">
          If you have any questions, contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#666666">${SUPPORT_EMAIL}</a>
        </p>
        
        <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#999999">
          &copy; ${year} ${BANK_NAME}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
