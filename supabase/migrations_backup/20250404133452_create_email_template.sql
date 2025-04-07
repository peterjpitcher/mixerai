-- Create email templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.email_templates (
    template_id TEXT PRIMARY KEY,
    is_active BOOLEAN DEFAULT TRUE,
    template TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create custom email template for invitations
INSERT INTO auth.email_templates (
  template_id,
  is_active,
  template,
  subject
)
VALUES (
  'invite',
  true,
  '
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to MixerAI</title>
  <style>
    body { 
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
    }
    .logo {
      text-align: center;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0066CC;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="https://mixerai.com/logo.png" alt="MixerAI Logo" width="200">
    </div>
    <h1>Welcome to MixerAI!</h1>
    <p>You have been invited to join MixerAI as a {{ .role }} for {{ .brands }}.</p>
    <p>MixerAI is an AI-powered content creation platform that helps teams create, manage, and optimize their content workflow.</p>
    <p>As a {{ .role }}, you will be able to:</p>
    {{ .roleDescription }}
    <p>To get started, click the button below to set up your account:</p>
    <div style="text-align: center;">
      <a href="{{ .link }}" class="button">Set Up Your Account</a>
    </div>
    <p>This invitation will expire in 7 days.</p>
    <div class="footer">
      <p>If you did not expect this invitation, please ignore this email.</p>
      <p>MixerAI - AI-powered content creation platform</p>
    </div>
  </div>
</body>
</html>
',
  'Welcome to MixerAI - You''ve been invited to join!'
)
ON CONFLICT (template_id) DO UPDATE
SET
  is_active = EXCLUDED.is_active,
  template = EXCLUDED.template,
  subject = EXCLUDED.subject; 