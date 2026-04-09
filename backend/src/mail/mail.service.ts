import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST'),
      port: Number(this.config.get('MAIL_PORT')),
      secure: false,
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASS'),
      },
    });
  }

  async sendPasswordReset(to: string, firstName: string, resetToken: string) {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%); padding: 36px 40px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: -0.5px; }
          .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
          .body { padding: 36px 40px; }
          .body p { color: #475569; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
          .name { color: #1e293b; font-weight: 600; }
          .btn { display: inline-block; margin: 8px 0 24px; padding: 14px 32px; background: #1d4ed8; color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
          .note { font-size: 13px !important; color: #94a3b8 !important; }
          .link { word-break: break-all; color: #64748b; font-size: 13px; }
          .footer { padding: 20px 40px; border-top: 1px solid #f1f5f9; text-align: center; }
          .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚛 TMS Pro</h1>
            <p>Transport Management System</p>
          </div>
          <div class="body">
            <p>Bonjour <span class="name">${firstName}</span>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en créer un nouveau :</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetLink}" class="btn">Réinitialiser mon mot de passe</a>
            </div>
            <p class="note">Ce lien est valable pendant <strong>15 minutes</strong>. Après ce délai, vous devrez faire une nouvelle demande.</p>
            <p class="note">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe ne sera pas modifié.</p>
            <p class="note">Lien direct :</p>
            <p class="link">${resetLink}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TMS Pro — Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM') || 'TMS Pro <noreply@tmspro.com>',
        to,
        subject: 'Réinitialisation de votre mot de passe — TMS Pro',
        html,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}:`, error.message);
      throw error;
    }
  }

  async sendOtpVerification(to: string, firstName: string, otp: string) {
    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; }
        .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
        .body { padding: 36px 40px; }
        .body p { color: #475569; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
        .otp-box { background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #1d4ed8; font-family: monospace; }
        .note { font-size: 13px !important; color: #94a3b8 !important; }
        .footer { padding: 20px 40px; border-top: 1px solid #f1f5f9; text-align: center; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
      </style></head>
      <body><div class="container">
        <div class="header"><h1>🚛 TMS Pro</h1><p>Transport Management System</p></div>
        <div class="body">
          <p>Bonjour <strong>${firstName}</strong>,</p>
          <p>Voici votre code de vérification pour activer votre compte :</p>
          <div class="otp-box"><div class="otp-code">${otp}</div></div>
          <p class="note">Ce code est valable pendant <strong>10 minutes</strong>.</p>
          <p class="note">Si vous n'avez pas créé de compte sur TMS Pro, ignorez cet email.</p>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} TMS Pro — Tous droits réservés</p></div>
      </div></body></html>
    `;
    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM') || 'TMS Pro <noreply@tmspro.com>',
        to,
        subject: `${otp} — Votre code de vérification TMS Pro`,
        html,
      });
      this.logger.log(`OTP sent to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send OTP to ${to}:`, error.message);
      throw error;
    }
  }

  async sendCompanyRequestReceived(to: string, adminFirstName: string, companyNom: string) {
    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; } .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
        .body { padding: 36px 40px; } .body p { color: #475569; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
        .badge { display: inline-block; background: #fef9c3; color: #854d0e; border: 1px solid #fde68a; border-radius: 8px; padding: 6px 16px; font-weight: 600; font-size: 14px; }
        .footer { padding: 20px 40px; border-top: 1px solid #f1f5f9; text-align: center; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
      </style></head>
      <body><div class="container">
        <div class="header"><h1>🚛 TMS Pro</h1><p>Transport Management System</p></div>
        <div class="body">
          <p>Bonjour <strong>${adminFirstName}</strong>,</p>
          <p>Votre demande d'inscription pour l'entreprise <strong>${companyNom}</strong> a bien été reçue et est en cours d'examen.</p>
          <p style="text-align:center; margin: 20px 0;"><span class="badge">⏳ En attente d'approbation</span></p>
          <p>Notre équipe examinera votre demande dans les plus brefs délais. Vous recevrez un email de confirmation dès que votre demande sera traitée.</p>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} TMS Pro — Tous droits réservés</p></div>
      </div></body></html>
    `;
    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM') || 'TMS Pro <noreply@tmspro.com>',
        to, subject: `Demande reçue — TMS Pro`, html,
      });
    } catch (e: any) { this.logger.error(`Failed to send request received email:`, e.message); }
  }

  async sendCompanyRequestApproved(to: string, adminFirstName: string, companyNom: string, tempPassword: string) {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';
    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
        .header { background: linear-gradient(135deg, #065f46 0%, #059669 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; } .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
        .body { padding: 36px 40px; } .body p { color: #475569; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
        .creds { background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
        .creds p { margin: 6px 0; font-size: 14px; color: #166534; }
        .creds strong { font-family: monospace; font-size: 16px; }
        .btn { display: inline-block; margin: 8px 0 24px; padding: 14px 32px; background: #059669; color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
        .note { font-size: 13px !important; color: #94a3b8 !important; }
        .footer { padding: 20px 40px; border-top: 1px solid #f1f5f9; text-align: center; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
      </style></head>
      <body><div class="container">
        <div class="header"><h1>🚛 TMS Pro</h1><p>Demande approuvée !</p></div>
        <div class="body">
          <p>Bonjour <strong>${adminFirstName}</strong>,</p>
          <p>Félicitations ! Votre demande d'inscription pour l'entreprise <strong>${companyNom}</strong> a été <strong style="color:#059669">approuvée</strong>.</p>
          <p>Voici vos identifiants de connexion :</p>
          <div class="creds">
            <p>Email : <strong>${to}</strong></p>
            <p>Mot de passe temporaire : <strong>${tempPassword}</strong></p>
          </div>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${frontendUrl}/login" class="btn">Accéder à ma plateforme</a>
          </div>
          <p class="note">Pour votre sécurité, veuillez changer votre mot de passe dès votre première connexion.</p>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} TMS Pro — Tous droits réservés</p></div>
      </div></body></html>
    `;
    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM') || 'TMS Pro <noreply@tmspro.com>',
        to, subject: `✅ Votre compte TMS Pro est prêt — ${companyNom}`, html,
      });
    } catch (e: any) { this.logger.error(`Failed to send approval email:`, e.message); }
  }

  async sendCompanyRequestRejected(to: string, adminFirstName: string, companyNom: string, reason: string) {
    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
        .header { background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; } .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
        .body { padding: 36px 40px; } .body p { color: #475569; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
        .reason { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 16px 20px; margin: 16px 0; color: #991b1b; font-size: 14px; }
        .footer { padding: 20px 40px; border-top: 1px solid #f1f5f9; text-align: center; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
      </style></head>
      <body><div class="container">
        <div class="header"><h1>🚛 TMS Pro</h1><p>Demande non approuvée</p></div>
        <div class="body">
          <p>Bonjour <strong>${adminFirstName}</strong>,</p>
          <p>Nous avons examiné votre demande d'inscription pour l'entreprise <strong>${companyNom}</strong> et nous ne pouvons pas y donner suite pour le motif suivant :</p>
          <div class="reason">${reason}</div>
          <p>Si vous pensez qu'il s'agit d'une erreur, vous pouvez soumettre une nouvelle demande ou nous contacter directement.</p>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} TMS Pro — Tous droits réservés</p></div>
      </div></body></html>
    `;
    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM') || 'TMS Pro <noreply@tmspro.com>',
        to, subject: `Demande TMS Pro — ${companyNom}`, html,
      });
    } catch (e: any) { this.logger.error(`Failed to send rejection email:`, e.message); }
  }

  async sendInvitation(to: string, role: string, inviteToken: string) {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/register?invite=${inviteToken}`;

    const roleLabels: Record<string, string> = {
      ADMIN: 'Administrateur',
      DISPATCHER: 'Dispatcher',
      ACCOUNTANT: 'Comptable',
      DRIVER: 'Chauffeur',
      CLIENT: 'Client',
    };
    const roleLabel = roleLabels[role] || role;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%); padding: 36px 40px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: -0.5px; }
          .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
          .body { padding: 36px 40px; }
          .body p { color: #475569; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
          .role-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 8px; padding: 4px 14px; font-weight: 600; font-size: 14px; }
          .btn { display: inline-block; margin: 8px 0 24px; padding: 14px 32px; background: #1d4ed8; color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
          .note { font-size: 13px !important; color: #94a3b8 !important; }
          .link { word-break: break-all; color: #64748b; font-size: 13px; }
          .footer { padding: 20px 40px; border-top: 1px solid #f1f5f9; text-align: center; }
          .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚛 TMS Pro</h1>
            <p>Transport Management System</p>
          </div>
          <div class="body">
            <p>Bonjour,</p>
            <p>Vous avez été invité(e) à rejoindre la plateforme <strong>TMS Pro</strong> en tant que :</p>
            <p style="text-align:center; margin: 20px 0;">
              <span class="role-badge">${roleLabel}</span>
            </p>
            <p>Cliquez sur le bouton ci-dessous pour créer votre compte. Votre adresse email (<strong>${to}</strong>) et votre rôle seront automatiquement configurés.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${inviteLink}" class="btn">Créer mon compte</a>
            </div>
            <p class="note">Ce lien est valable pendant <strong>24 heures</strong>.</p>
            <p class="note">Si vous n'êtes pas concerné(e) par cette invitation, ignorez cet email.</p>
            <p class="note">Lien direct :</p>
            <p class="link">${inviteLink}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TMS Pro — Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM') || 'TMS Pro <noreply@tmspro.com>',
        to,
        subject: `Invitation à rejoindre TMS Pro — ${roleLabel}`,
        html,
      });
      this.logger.log(`Invitation email sent to ${to} (role: ${role})`);
    } catch (error: any) {
      this.logger.error(`Failed to send invitation to ${to}:`, error.message);
      throw error;
    }
  }
}
