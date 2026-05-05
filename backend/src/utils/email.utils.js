const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates
const templates = {
  verification: (name, verificationLink) => ({
    subject: 'Verify your ClassLens Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to ClassLens, ${name}!</h2>
        <p>Thank you for signing up. Please verify your email address to get started.</p>
        <p style="margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>Or copy this link: <a href="${verificationLink}">${verificationLink}</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours.
        </p>
      </div>
    `
  }),
  welcome: (name, role) => ({
    subject: 'Welcome to ClassLens! 🎓',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to ClassLens, ${name}!</h2>
        <p>Your account has been successfully created as a <strong>${role}</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Getting Started:</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>Complete your profile with a profile picture</li>
            <li>${role === 'teacher' ? 'Create your first classroom' : 'Join or explore available classrooms'}</li>
            <li>Set up your preferences in Settings</li>
            <li>Explore the dashboard for more features</li>
          </ul>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you have any questions, feel free to reach out to our support team.
        </p>
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px;">
          © 2026 ClassLens. All rights reserved.
        </p>
      </div>
    `
  }),
  googleWelcome: (name, role) => ({
    subject: 'Welcome to ClassLens! 🎓',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to ClassLens, ${name}!</h2>
        <p>Your account has been successfully created via Google Sign-In as a <strong>${role}</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Getting Started:</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>Complete your profile information</li>
            <li>${role === 'teacher' ? 'Create your first classroom' : 'Join or explore available classrooms'}</li>
            <li>Set up your preferences in Settings</li>
            <li>Explore the dashboard for more features</li>
          </ul>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you have any questions, feel free to reach out to our support team.
        </p>
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px;">
          © 2026 ClassLens. All rights reserved.
        </p>
      </div>
    `
  })
};

// Send verification email
async function sendVerificationEmail(email, name, verificationToken, frontendUrl) {
  try {
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    const template = templates.verification(name, verificationLink);
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      ...template
    });
    
    console.log(`✉️ [EMAIL] Verification email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('❌ [EMAIL] Error sending verification email:', err);
    return false;
  }
}

// Send welcome email
async function sendWelcomeEmail(email, name, role, isOAuth = false) {
  try {
    const template = isOAuth 
      ? templates.googleWelcome(name, role)
      : templates.welcome(name, role);
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      ...template
    });
    
    console.log(`✉️ [EMAIL] Welcome email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('❌ [EMAIL] Error sending welcome email:', err);
    return false;
  }
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail
};
