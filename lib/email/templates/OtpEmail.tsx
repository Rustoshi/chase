import { BANK_NAME, SUPPORT_EMAIL } from "@/lib/brand"

export interface OtpEmailProps {
  firstName: string
  otp:       string
}

export function renderOtpEmail({ firstName, otp }: OtpEmailProps): string {
  const year = new Date().getFullYear()
  const spaced = otp.split("").join("&nbsp;&nbsp;")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email - ${BANK_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#F2EEE4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#17140F">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px">
    <tr>
      <td>
        <!-- Wordmark -->
        <p style="margin:0 0 32px;font-size:13px;font-weight:500;letter-spacing:0.09em;text-transform:uppercase;color:#8A6428">${BANK_NAME} Private</p>

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FBFAF7;border:1px solid rgba(23,20,15,0.10);border-radius:8px">
          <tr>
            <td style="padding:40px">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:rgba(23,20,15,0.80)">Hi ${escapeHtml(firstName)},</p>

              <p style="margin:0 0 8px;font-size:22px;line-height:1.3;color:#17140F">Confirm your email address</p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:rgba(23,20,15,0.50)">
                Enter the code below to finish creating your ${BANK_NAME} account.
              </p>

              <!-- OTP -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
                <tr>
                  <td style="padding:18px 28px;background-color:#F2EEE4;border:1px solid rgba(23,20,15,0.10);border-radius:4px;font-family:'Courier New',Courier,monospace;font-size:30px;letter-spacing:2px;color:#17140F;text-align:center">
                    ${spaced}
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;line-height:1.6;color:rgba(23,20,15,0.50)">
                This code expires in 10 minutes. If you didn&rsquo;t request it, you can safely ignore this email &mdash; no account will be created.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:rgba(23,20,15,0.50)">
          Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#8A6428;text-decoration:none">${SUPPORT_EMAIL}</a>
        </p>
        <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:rgba(23,20,15,0.50)">
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
