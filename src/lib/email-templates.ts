export interface InvitationEmailData {
  email: string
  role: string
  acceptUrl: string
  expiryDate: string
}

export function getInvitationEmailTemplate(data: InvitationEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to MixerAI</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0070f3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>Welcome to MixerAI</h1>
        <p>Hello,</p>
        <p>You have been invited to join MixerAI as a ${data.role}. Click the button below to accept your invitation and set up your account.</p>
        <p><strong>This invitation link will expire on ${data.expiryDate}.</strong></p>
        <a href="${data.acceptUrl}" class="button">Accept Invitation</a>
        <p>If you did not expect this invitation, please ignore this email.</p>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `

  const text = `
Welcome to MixerAI

Hello,

You have been invited to join MixerAI as a ${data.role}. Click the link below to accept your invitation and set up your account.

This invitation link will expire on ${data.expiryDate}.

${data.acceptUrl}

If you did not expect this invitation, please ignore this email.

This is an automated message, please do not reply to this email.
  `

  return {
    html,
    text,
  }
} 