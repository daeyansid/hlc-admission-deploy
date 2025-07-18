const fs = require('fs');
const path = require('path');

class FallbackPDFService {
  async generateAdmissionPDF(admission) {
    try {
      const htmlContent = this.generateHTMLTemplate(admission);
      // Return HTML as buffer since we can't generate PDF without Puppeteer
      return Buffer.from(htmlContent, 'utf8');
    } catch (error) {
      console.error('Error generating fallback PDF:', error);
      throw error;
    }
  }

  async generateAndSavePDF(admission, filePath) {
    try {
      console.log(`Using fallback PDF service for application: ${admission.applicationId}`);
      const htmlBuffer = await this.generateAdmissionPDF(admission);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save as HTML file with PDF extension (temporary solution)
      const htmlFilePath = filePath.replace('.pdf', '.html');
      fs.writeFileSync(htmlFilePath, htmlBuffer);
      
      // Also create a simple text file with PDF extension for download purposes
      const textContent = this.generateTextTemplate(admission);
      fs.writeFileSync(filePath, textContent);
      
      console.log(`Fallback PDF saved as text file: ${filePath}`);
      console.log(`HTML version saved as: ${htmlFilePath}`);
      
      return filePath;
    } catch (error) {
      console.error('Error saving fallback PDF:', error);
      throw error;
    }
  }

  generateTextTemplate(admission) {
    const submissionDate = new Date(admission.submissionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
HLC LAW COLLEGE
ADMISSION APPLICATION

Application ID: ${admission.applicationId}
Submitted: ${submissionDate}

PERSONAL INFORMATION
====================
Name: ${admission.candidateName} ${admission.surname}
Email: ${admission.email}
Guardian: ${admission.guardianName}
Date of Birth: ${new Date(admission.dateOfBirth).toLocaleDateString()}
CNIC: ${admission.cnicNumber}
Gender: ${admission.gender}
Contact: ${admission.contactNumber}
Address: ${admission.postalAddress}

ACADEMIC INFORMATION
===================
Matriculation: ${admission.matriculationBoard} (${admission.matriculationYear}) - ${admission.matriculationGrade}
${admission.matriculationMarks && admission.matriculationTotalMarks ? `Marks: ${admission.matriculationMarks}/${admission.matriculationTotalMarks}` : ''}

Intermediate: ${admission.intermediateBoard} (${admission.intermediateYear}) - ${admission.intermediateGrade}
${admission.intermediateMarks && admission.intermediateTotalMarks ? `Marks: ${admission.intermediateMarks}/${admission.intermediateTotalMarks}` : ''}

Law Test Score: ${admission.lawTestScore}/100
Payment Transaction: ${admission.paymentTransaction}

Generated on: ${new Date().toLocaleString()}
HLC Admission Portal
    `;
  }

  generateHTMLTemplate(admission) {
    const submissionDate = new Date(admission.submissionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admission Application - ${admission.applicationId}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 20px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            background-color: #4F46E5;
            color: white;
            padding: 10px 15px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .field {
            margin-bottom: 10px;
          }
          .field-label {
            font-weight: bold;
            color: #555;
          }
          .field-value {
            margin-left: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HLC Law College</h1>
          <h2>Admission Application</h2>
          <p><strong>Application ID:</strong> ${admission.applicationId}</p>
          <p><strong>Submitted:</strong> ${submissionDate}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Personal Information</div>
          <div class="field">
            <span class="field-label">Name:</span>
            <span class="field-value">${admission.candidateName} ${admission.surname}</span>
          </div>
          <div class="field">
            <span class="field-label">Email:</span>
            <span class="field-value">${admission.email}</span>
          </div>
          <div class="field">
            <span class="field-label">Guardian:</span>
            <span class="field-value">${admission.guardianName}</span>
          </div>
          <div class="field">
            <span class="field-label">Date of Birth:</span>
            <span class="field-value">${new Date(admission.dateOfBirth).toLocaleDateString()}</span>
          </div>
          <div class="field">
            <span class="field-label">CNIC:</span>
            <span class="field-value">${admission.cnicNumber}</span>
          </div>
          <div class="field">
            <span class="field-label">Gender:</span>
            <span class="field-value">${admission.gender}</span>
          </div>
          <div class="field">
            <span class="field-label">Contact:</span>
            <span class="field-value">${admission.contactNumber}</span>
          </div>
          <div class="field">
            <span class="field-label">Address:</span>
            <span class="field-value">${admission.postalAddress}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Academic Information</div>
          <div class="field">
            <span class="field-label">Matriculation:</span>
            <span class="field-value">${admission.matriculationBoard} (${admission.matriculationYear}) - ${admission.matriculationGrade}${admission.matriculationMarks && admission.matriculationTotalMarks ? ` (${admission.matriculationMarks}/${admission.matriculationTotalMarks})` : ''}</span>
          </div>
          <div class="field">
            <span class="field-label">Intermediate:</span>
            <span class="field-value">${admission.intermediateBoard} (${admission.intermediateYear}) - ${admission.intermediateGrade}${admission.intermediateMarks && admission.intermediateTotalMarks ? ` (${admission.intermediateMarks}/${admission.intermediateTotalMarks})` : ''}</span>
          </div>
          <div class="field">
            <span class="field-label">Law Test Score:</span>
            <span class="field-value">${admission.lawTestScore}/100</span>
          </div>
          <div class="field">
            <span class="field-label">Payment Transaction:</span>
            <span class="field-value">${admission.paymentTransaction}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; color: #666;">
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>HLC Admission Portal</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new FallbackPDFService();
