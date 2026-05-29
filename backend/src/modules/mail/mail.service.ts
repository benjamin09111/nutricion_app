import { Injectable } from '@nestjs/common';

type SupportEmailRequestData = {
  fullName?: string;
  email?: string;
  phone?: string;
  professionalId?: string;
  specialty?: string;
  message?: string;
};

@Injectable()
export class MailService {
  constructor() {}

  async sendWelcomeEmail(
    email: string,
    fullName: string,
    password: string,
    validAdminMessage?: string,
  ): Promise<void> {
    console.log(`ℹ️ [MailService] EMAIL_DISABLED: Welcome to ${email}. Password: ${password}`);
  }

  async sendRegistrationConfirmation(
    email: string,
    fullName: string,
  ): Promise<void> {
    console.log(`ℹ️ [MailService] EMAIL_DISABLED: Registration Confirmation for ${email}`);
  }

  async sendAdminNotification(
    requestData: SupportEmailRequestData,
  ): Promise<void> {
    console.log(`ℹ️ [MailService] EMAIL_DISABLED: Admin Notification for new request from ${requestData.email}`);
  }

  async sendFeedback(data: {
    type: string;
    subject: string;
    message: string;
    fromEmail: string;
  }): Promise<void> {
    console.log(`ℹ️ [MailService] EMAIL_DISABLED: Feedback from ${data.fromEmail}`);
  }

  async sendFeedbackConfirmation(email: string): Promise<void> {
    console.log(`ℹ️ [MailService] EMAIL_DISABLED: Feedback Confirmation for ${email}`);
  }

  async sendRejectionEmail(
    email: string,
    fullName: string,
    adminMessage?: string,
  ) {
    console.log(`ℹ️ [MailService] EMAIL_DISABLED: Rejection for ${email}`);
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    password: string,
  ) {
    console.log(`ℹ️ [MailService] EMAIL_DISABLED: Password Reset for ${email}. New Pass: ${password}`);
  }

  async sendPatientPortalInvitationEmail(data: {
    email: string;
    patientName: string;
    nutritionistName: string;
    shareUrl: string;
    expiresAt: Date;
    accessCode: string;
  }) {
    console.log(`ℹ️ [MailService] EMAIL_DISABLED: Portal Invitation for ${data.email}. Link: ${data.shareUrl}`);
  }

  async sendPatientPortalNotificationEmail(data: {
    email: string;
    patientName: string;
    nutritionistName: string;
    title: string;
    message: string;
  }) {
    console.log(`ℹ️ [MailService] EMAIL_DISABLED: Portal Notification for ${data.email}`);
  }

  async sendBookingLinkEmail(data: {
    email: string;
    nutritionistName: string;
    bookingUrl: string;
  }) {
    console.log(`ℹ️ [MailService] EMAIL_DISABLED: Booking Link for ${data.email}`);
  }
}
