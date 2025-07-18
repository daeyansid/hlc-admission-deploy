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
      
      // Create a proper text-based content that can be served as PDF
      const textContent = this.generatePDFCompatibleContent(admission);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save as text file but with proper PDF headers to make it downloadable
      const pdfCompatibleContent = this.addPDFHeaders(textContent);
      fs.writeFileSync(filePath, pdfCompatibleContent);
      
      // Also create an HTML version for reference
      const htmlContent = this.generateHTMLTemplate(admission);
      const htmlFilePath = filePath.replace('.pdf', '.html');
      fs.writeFileSync(htmlFilePath, htmlContent);
      
      console.log(`Fallback content saved as: ${filePath}`);
      console.log(`HTML reference saved as: ${htmlFilePath}`);
      
      return filePath;
    } catch (error) {
      console.error('Error saving fallback PDF:', error);
      throw error;
    }
  }

  addPDFHeaders(textContent) {
    // Create a simple PDF-like structure that browsers can handle
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${textContent.length + 100}
>>
stream
BT
/F1 12 Tf
50 750 Td
${textContent.split('\n').map(line => `(${line.replace(/[()\\]/g, '\\$&')}) Tj 0 -15 Td`).join('\n')}
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000400 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
477
%%EOF`;
  }

  generatePDFCompatibleContent(admission) {
    const submissionDate = new Date(admission.submissionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `Hyderabad Law College - Admission Application

Application ID: ${admission.applicationId}
Submitted: ${submissionDate}

PERSONAL INFORMATION
Name: ${admission.candidateName || 'N/A'}
Surname: ${admission.surname || 'N/A'}
Email: ${admission.email || 'N/A'}
Guardian: ${admission.guardianName || 'N/A'}
Date of Birth: ${admission.dateOfBirth || 'N/A'}
CNIC: ${admission.cnicNumber || 'N/A'}
Gender: ${admission.gender || 'N/A'}
Domicile: ${admission.domicileDistrict || 'N/A'}
Contact: ${admission.contactNumber || 'N/A'}
Address: ${admission.postalAddress || 'N/A'}

ACADEMIC INFORMATION
Matriculation: ${admission.matriculationBoard || 'N/A'} (${admission.matriculationYear || 'N/A'})
Matriculation Grade: ${admission.matriculationGrade || 'N/A'}
Matriculation Marks: ${admission.matriculationMarks || 'N/A'}/${admission.matriculationTotalMarks || 'N/A'}

Intermediate: ${admission.intermediateBoard || 'N/A'} (${admission.intermediateYear || 'N/A'})
Intermediate Grade: ${admission.intermediateGrade || 'N/A'}
Intermediate Marks: ${admission.intermediateMarks || 'N/A'}/${admission.intermediateTotalMarks || 'N/A'}

Academic Qualification: ${admission.academicQualification || 'N/A'}
Other Qualification: ${admission.otherQualification || 'N/A'}
Law Test Score: ${admission.lawTestScore || 'N/A'}/100

PAYMENT INFORMATION
Payment Transaction: ${admission.paymentTransaction || 'N/A'}

Generated on: ${new Date().toLocaleString()}
HLC Admission Portal`;
  }

  generateTextTemplate(admission) {
    const submissionDate = new Date(admission.submissionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
Hyderabad Law College
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
          <h1>Hyderabad Law College</h1>
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
