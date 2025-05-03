import { Booking } from '@/types/booking';
import nodemailer from 'nodemailer';

// Конфигурация транспорта для nodemailer
// В реальном приложении использовать настоящий SMTP сервер
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Отправляет email с подтверждением бронирования
 */
export async function sendBookingConfirmationEmail(booking: Booking): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://smashandfun.pl';
  const editUrl = `${baseUrl}/rezerwacja/edytuj?token=${booking.editToken}`;
  
  const mailOptions = {
    from: `"Smash&Fun" <${process.env.SMTP_FROM || 'rezerwacja@smashandfun.pl'}>`,
    to: booking.email,
    subject: 'Potwierdzenie rezerwacji - Smash&Fun',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f36e21; color: white; padding: 20px; text-align: center;">
          <h1>Smash&Fun</h1>
          <h2>Potwierdzenie rezerwacji</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Witaj ${booking.name},</p>
          
          <p>Dziękujemy za dokonanie rezerwacji w Smash&Fun - pierwszym Rage Room w Warszawie!</p>
          
          <div style="background-color: white; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #f36e21;">Szczegóły rezerwacji:</h3>
            <p><strong>Pakiet:</strong> ${booking.packageName}</p>
            <p><strong>Data:</strong> ${booking.date}</p>
            <p><strong>Godzina:</strong> ${booking.startTime} - ${booking.endTime}</p>
            <p><strong>Status płatności:</strong> ${
              booking.paymentStatus === 'FULLY_PAID' ? 'Opłacone' : 
              booking.paymentStatus === 'DEPOSIT_PAID' ? 'Wpłacony zadatek' : 
              'Nieopłacone'
            }</p>
          </div>
          
          <p>Możesz edytować lub anulować swoją rezerwację, klikając <a href="${editUrl}" style="color: #f36e21;">tutaj</a>.</p>
          
          <p>W przypadku pytań prosimy o kontakt pod adresem email: kontakt@smashandfun.pl lub telefonicznie: +48 123 456 789.</p>
          
          <p>Do zobaczenia w Smash&Fun!</p>
          
          <p>Pozdrawiamy,<br>Zespół Smash&Fun</p>
        </div>
        
        <div style="background-color: #231f20; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>Smash&Fun - ul. Przykładowa 123, 00-000 Warszawa</p>
          <p>© ${new Date().getFullYear()} Smash&Fun. Wszelkie prawa zastrzeżone.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${booking.email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // В реальном приложении обработать ошибку, например, добавить в очередь для повторной отправки
  }
}

/**
 * Отправляет email с напоминанием о бронировании
 */
export async function sendBookingReminderEmail(booking: Booking): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://smashandfun.pl';
  const editUrl = `${baseUrl}/rezerwacja/edytuj?token=${booking.editToken}`;
  
  const mailOptions = {
    from: `"Smash&Fun" <${process.env.SMTP_FROM || 'rezerwacja@smashandfun.pl'}>`,
    to: booking.email,
    subject: 'Przypomnienie o rezerwacji - Smash&Fun',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f36e21; color: white; padding: 20px; text-align: center;">
          <h1>Smash&Fun</h1>
          <h2>Przypomnienie o rezerwacji</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Witaj ${booking.name},</p>
          
          <p>Przypominamy o twojej nadchodzącej wizycie w Smash&Fun - pierwszym Rage Room w Warszawie!</p>
          
          <div style="background-color: white; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #f36e21;">Szczegóły rezerwacji:</h3>
            <p><strong>Pakiet:</strong> ${booking.packageName}</p>
            <p><strong>Data:</strong> ${booking.date}</p>
            <p><strong>Godzina:</strong> ${booking.startTime} - ${booking.endTime}</p>
            <p><strong>Status płatności:</strong> ${
              booking.paymentStatus === 'FULLY_PAID' ? 'Opłacone' : 
              booking.paymentStatus === 'DEPOSIT_PAID' ? 'Wpłacony zadatek' : 
              'Nieopłacone'
            }</p>
          </div>
          
          <p>Możesz edytować lub anulować swoją rezerwację, klikając <a href="${editUrl}" style="color: #f36e21;">tutaj</a>.</p>
          
          <p>W przypadku pytań prosimy o kontakt pod adresem email: kontakt@smashandfun.pl lub telefonicznie: +48 123 456 789.</p>
          
          <p>Do zobaczenia w Smash&Fun!</p>
          
          <p>Pozdrawiamy,<br>Zespół Smash&Fun</p>
        </div>
        
        <div style="background-color: #231f20; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>Smash&Fun - ul. Przykładowa 123, 00-000 Warszawa</p>
          <p>© ${new Date().getFullYear()} Smash&Fun. Wszelkie prawa zastrzeżone.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${booking.email}`);
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
} 