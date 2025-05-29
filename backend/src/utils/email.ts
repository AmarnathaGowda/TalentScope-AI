import sgMail from '@sendgrid/mail'
import { AppError } from '../middleware/errorHandler'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const msg = {
      to: options.to,
      from: process.env.EMAIL_FROM || 'noreply@talentscope.ai',
      subject: options.subject,
      text: options.text,
      html: options.html,
    }

    await sgMail.send(msg)
  } catch (error) {
    console.error('Email error:', error)
    throw new AppError('Failed to send email', 500)
  }
} 