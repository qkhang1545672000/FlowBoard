import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(
    private configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmailService.name);
    // Khởi tạo Resend với API Key từ biến môi trường
    const apiKey = this.configService.get<string>('RESEND_API_KEY') || '';
    this.resend = new Resend(apiKey);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Khi test, Resend cho phép gửi từ 'onboarding@resend.dev' nếu chưa cấu hình Domain riêng
      const from =
        options.from ||
        this.configService.get<string>('EMAIL_FROM') ||
        'Acme <onboarding@resend.dev>';

      const data = await this.resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html || options.text || '',
      });

      this.logger.info({
        msg: 'email.sent',
        data,
        subject: options.subject,
      });
      return true;
    } catch (error) {
      this.logger.error({
        msg: 'email.sendFailed',
        subject: options.subject,
        error: (error as Error).message,
      });
      return false;
    }
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    url: string,
  ): Promise<boolean> {
    const subject = 'Xác thực email';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Xác thực email</h2>
        <p>Xin chào ${name},</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản! Vui lòng xác thực email để hoàn tất quá trình đăng ký.</p>

        <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center;">
          <a href="${url}"
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Xác thực email
          </a>
        </div>

        <p>Если bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ Ecommerce Store</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    url: string,
  ): Promise<boolean> {
    const subject = 'Đặt lại mật khẩu';
    const html = `<p>Xin chào ${name}, bấm vào đây để đổi mật khẩu: <a href="${url}">Đổi mật khẩu</a></p>`;
    return this.sendEmail({ to, subject, html });
  }

  async sendWorkspaceInvitationEmail(
    to: string,
    inviterName: string,
    workspaceName: string,
    acceptUrl: string,
  ): Promise<boolean> {
    const subject = `Lời mời tham gia ${workspaceName}`;
    const html = `<p>${inviterName} mời bạn tham gia workspace. <a href="${acceptUrl}">Chấp nhận</a></p>`;
    return this.sendEmail({ to, subject, html });
  }
}
