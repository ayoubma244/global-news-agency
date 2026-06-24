/**
 * Email Service — uses Resend (or fallback to nodemailer SMTP).
 * Sends: newsletter, verify email, password reset, welcome.
 */

import { Resend } from 'resend'
import nodemailer from 'nodemailer'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yoursite.com'
const FROM_NAME = process.env.FROM_NAME || 'وكالة الأنباء العالمية'

export interface EmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export interface SendResult {
  ok: boolean
  messageId?: string
  error?: string
  provider: 'resend' | 'smtp' | 'none'
}

/**
 * Send email via Resend (preferred) or SMTP (fallback).
 * Returns immediately if no email service configured.
 */
export async function sendEmail(params: EmailParams): Promise<SendResult> {
  // Try Resend first
  if (RESEND_API_KEY) {
    try {
      const resend = new Resend(RESEND_API_KEY)
      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${params.from || FROM_EMAIL}>`,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      })
      if (error) {
        return { ok: false, error: error.message, provider: 'resend' }
      }
      return { ok: true, messageId: data?.id, provider: 'resend' }
    } catch (e: any) {
      console.error('Resend failed:', e.message)
      // Fall through to SMTP
    }
  }

  // Try SMTP
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
      const info = await transporter.sendMail({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      })
      return { ok: true, messageId: info.messageId, provider: 'smtp' }
    } catch (e: any) {
      console.error('SMTP failed:', e.message)
      return { ok: false, error: e.message, provider: 'smtp' }
    }
  }

  // No email service configured
  console.warn('No email service configured. Email not sent:', params.subject)
  return { ok: false, error: 'No email service configured', provider: 'none' }
}

export function isEmailConfigured(): boolean {
  return !!(RESEND_API_KEY || (SMTP_HOST && SMTP_USER && SMTP_PASS))
}

// ===== Email templates =====

export function welcomeEmail(name: string, verifyUrl?: string): { subject: string; html: string } {
  return {
    subject: 'مرحباً بك في وكالة الأنباء العالمية! 🎉',
    html: `
<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1B2A4A 0%, #2D4A3E 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">مرحباً ${name || 'بك'}! 🎉</h1>
    <p style="color: #D6E4F0; margin: 10px 0 0;">شكراً لاشتراكك في نشرتنا الإخبارية</p>
  </div>
  <div style="background: white; padding: 30px; border: 1px solid #E9E9E8; border-top: none;">
    <p style="color: #37352F; line-height: 1.8; font-size: 16px;">
      أهلاً وسهلاً بك في عائلة <strong>وكالة الأنباء العالمية</strong>! ستصلك آخر الأخبار العالمية مباشرة إلى بريدك الإلكتروني.
    </p>
    ${verifyUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="background: #1B2A4A; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        تأكيد البريد الإلكتروني
      </a>
    </div>
    <p style="color: #8C8A84; font-size: 14px; text-align: center;">أو انسخ هذا الرابط: ${verifyUrl}</p>
    ` : ''}
    <hr style="border: none; border-top: 1px solid #E9E9E8; margin: 30px 0;">
    <p style="color: #8C8A84; font-size: 12px; text-align: center;">
      إذا لم تشترك في هذه النشرة، يمكنك تجاهل هذا البريد.<br>
      © 2026 وكالة الأنباء العالمية
    </p>
  </div>
</div>`,
  }
}

export function newsletterEmail(articles: Array<{ titleAr: string; leadAr: string | null; slug: string; featuredImg: string | null; category?: { nameAr: string; icon: string } }>): { subject: string; html: string } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const articlesHtml = articles.slice(0, 10).map((a, i) => `
    <div style="margin-bottom: 20px; padding: 15px; background: ${i === 0 ? '#F7F7F5' : 'white'}; border-radius: 8px; border: 1px solid #E9E9E8;">
      ${a.featuredImg ? `<img src="${a.featuredImg}" alt="${a.titleAr}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">` : ''}
      ${a.category ? `<span style="color: #8C8A84; font-size: 12px;">${a.category.icon} ${a.category.nameAr}</span>` : ''}
      <h3 style="color: #1B2A4A; margin: 5px 0;"><a href="${siteUrl}/article/${a.slug}" style="color: inherit; text-decoration: none;">${a.titleAr}</a></h3>
      ${a.leadAr ? `<p style="color: #37352F; line-height: 1.6;">${a.leadAr}</p>` : ''}
      <a href="${siteUrl}/article/${a.slug}" style="color: #1B2A4A; font-weight: bold; text-decoration: none;">اقرأ المزيد ←</a>
    </div>
  `).join('')

  return {
    subject: `📰 أخبار اليوم - ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}`,
    html: `
<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1B2A4A; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">📰 أخبار اليوم</h1>
    <p style="color: #D6E4F0; margin: 5px 0 0;">${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <div style="background: white; padding: 20px; border: 1px solid #E9E9E8; border-top: none;">
    ${articlesHtml}
  </div>
  <div style="text-align: center; padding: 20px; color: #8C8A84; font-size: 12px;">
    <p>وكالة الأنباء العالمية - أخبار العالم في الوقت الفعلي</p>
    <p><a href="${siteUrl}/unsubscribe" style="color: #8C8A84;">إلغاء الاشتراك</a> | <a href="${siteUrl}" style="color: #8C8A84;">زيارة الموقع</a></p>
  </div>
</div>`,
  }
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'إعادة تعيين كلمة المرور',
    html: `
<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #C0392B; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">إعادة تعيين كلمة المرور</h1>
  </div>
  <div style="background: white; padding: 30px; border: 1px solid #E9E9E8; border-top: none;">
    <p style="color: #37352F; line-height: 1.8;">لقد طلبت إعادة تعيين كلمة المرور. اضغط على الزر أدناه:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #C0392B; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        إعادة تعيين كلمة المرور
      </a>
    </div>
    <p style="color: #8C8A84; font-size: 14px;">إذا لم تطلب ذلك، تجاهل هذا البريد. الرابط صالح لمدة ساعة واحدة.</p>
    <p style="color: #8C8A84; font-size: 12px;">أو انسخ: ${resetUrl}</p>
  </div>
</div>`,
  }
}
