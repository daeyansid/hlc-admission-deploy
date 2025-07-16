const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendAdmissionNotification(admission, pdfBuffer) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `New Admission Application - ${admission.applicationId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">New Admission Application Received</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Application Details:</h3>
              <p><strong>Application ID:</strong> ${admission.applicationId}</p>
              <p><strong>Candidate Name:</strong> ${admission.candidateName} ${admission.surname}</p>
              <p><strong>Email:</strong> ${admission.email}</p>
              <p><strong>Contact:</strong> ${admission.contactNumber}</p>
              <p><strong>CNIC:</strong> ${admission.cnicNumber}</p>
              <p><strong>Submission Date:</strong> ${new Date(admission.submissionDate).toLocaleString()}</p>
            </div>

            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Academic Information:</h4>
              <p><strong>Matriculation:</strong> ${admission.matriculationBoard} (${admission.matriculationYear}) - ${admission.matriculationGrade}</p>
              <p><strong>Intermediate:</strong> ${admission.intermediateBoard} (${admission.intermediateYear}) - ${admission.intermediateGrade}</p>
              <p><strong>Law Test Score:</strong> ${admission.lawTestScore}/100</p>
            </div>

            <p>Please find the complete application details in the attached PDF.</p>
            
            <div style="margin-top: 30px; text-align: center;">
              <p style="color: #666;">HLC Admission Portal - Admin Notification</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `admission-${admission.applicationId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Admin notification sent for application ${admission.applicationId}`);
    } catch (error) {
      console.error('Error sending admin notification:', error);
      throw error;
    }
  }

  async sendConfirmationEmail(admission, pdfBuffer) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: admission.email,
        subject: `Application Confirmation - ${admission.applicationId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">HLC Admission Portal</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Application Confirmation</p>
            </div>
            
            <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1f2937;">Dear ${admission.candidateName} ${admission.surname},</h2>
              
              <p style="color: #4b5563; line-height: 1.6;">
                Thank you for submitting your admission application to HLC. We have successfully received your application and it is now under review.
              </p>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin-top: 0;">Application Summary:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;"><strong>Application ID:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;">${admission.applicationId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;"><strong>Submission Date:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;">${new Date(admission.submissionDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;"><strong>Status:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #d1d5db;">Under Review</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Contact Number:</strong></td>
                    <td style="padding: 8px 0;">${admission.contactNumber}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Important:</strong> Please keep your Application ID (${admission.applicationId}) safe for future reference. 
                  You may need it to check your application status.
                </p>
              </div>

              <p style="color: #4b5563; line-height: 1.6;">
                Your complete application details are attached as a PDF for your records. Our admissions team will review your application and contact you within 7-10 business days.
              </p>

              <div style="margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-radius: 8px;">
                <h4 style="color: #065f46; margin-top: 0;">Next Steps:</h4>
                <ul style="color: #047857; line-height: 1.8;">
                  <li>Keep checking your email for updates</li>
                  <li>Prepare for the interview process if selected</li>
                  <li>Contact us if you have any questions</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280;">
                  If you have any questions, please contact us at:<br>
                  <strong>Email:</strong> admissions@hlc.edu<br>
                  <strong>Phone:</strong> +92-XXX-XXXXXXX
                </p>
              </div>

              <p style="color: #4b5563;">
                Best regards,<br>
                <strong>HLC Admissions Team</strong>
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 14px;">
              <p>© 2025 HLC Admission Portal. All rights reserved.</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `your-application-${admission.applicationId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Confirmation email sent to ${admission.email}`);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
