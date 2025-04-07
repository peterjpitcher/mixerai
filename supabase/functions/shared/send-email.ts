// @ts-ignore: Deno env
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(options: EmailOptions) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MixerAI <invitations@mixer-ai.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return response.json()
} 