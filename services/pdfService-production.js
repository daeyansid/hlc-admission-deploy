const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

class ProductionPDFService {
  async generateAdmissionPDF(admission) {
    try {
      console.log('Starting PDF generation with html-pdf-node...');
      
      const htmlContent = await this.generateHTMLTemplate(admission);
      
      // Configure html-pdf-node options
      const options = {
        format: 'A4',
        border: {
          top: '10px',
          right: '15px',
          bottom: '15px',
          left: '15px'
        },
        type: 'pdf',
        quality: '75',
        timeout: 30000
      };

      const file = { content: htmlContent };
      
      console.log('Converting HTML to PDF...');
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      
      console.log('PDF generated successfully with html-pdf-node');
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF with html-pdf-node:', error);
      throw new Error(`Production PDF generation failed: ${error.message}`);
    }
  }

  async generateAndSavePDF(admission, filePath) {
    try {
      console.log(`Starting production PDF generation for application: ${admission.applicationId}`);
      console.log(`Target file path: ${filePath}`);
      
      const pdfBuffer = await this.generateAdmissionPDF(admission);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      console.log(`Ensuring directory exists: ${dir}`);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
      
      // Save PDF to file
      console.log(`Writing PDF buffer to file: ${filePath}`);
      fs.writeFileSync(filePath, pdfBuffer);
      
      // Verify file was created and check size
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`PDF saved successfully. File size: ${stats.size} bytes`);
        
        // Check if file size is reasonable (should be more than 1KB for a real PDF)
        if (stats.size < 1000) {
          throw new Error('Generated PDF file is too small, likely corrupted');
        }
      } else {
        throw new Error('PDF file was not created successfully');
      }
      
      return filePath;
    } catch (error) {
      console.error('Error saving production PDF:', error);
      throw error;
    }
  }

  async generateHTMLTemplate(admission) {
    const submissionDate = new Date(admission.submissionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Convert images to base64 for embedding
    const getImageBase64 = (imagePath) => {
      try {
        if (imagePath && fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const ext = path.extname(imagePath).toLowerCase();
          let mimeType = 'image/jpeg';
          
          if (ext === '.png') mimeType = 'image/png';
          else if (ext === '.gif') mimeType = 'image/gif';
          else if (ext === '.webp') mimeType = 'image/webp';
          
          return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        }
        return null;
      } catch (error) {
        console.error(`Error converting image to base64: ${imagePath}`, error);
        return null;
      }
    };

    console.log('Converting images to base64...');
    const profileImageBase64 = getImageBase64(admission.profileImage);
    const lawTestImageBase64 = getImageBase64(admission.lawTestScoreImage);
    const paymentImageBase64 = getImageBase64(admission.paymentTransactionImage);

    // Try to get logo
    let logoBase64 = null;
    const possibleLogoPaths = [
      path.join(__dirname, '../public/hlc-logo.png'),
      path.join(__dirname, '../../public/hlc-logo.png'),
      path.join(process.cwd(), 'public/hlc-logo.png'),
      path.join(process.cwd(), 'server/public/hlc-logo.png')
    ];
    
    for (const logoPath of possibleLogoPaths) {
      if (fs.existsSync(logoPath)) {
        logoBase64 = getImageBase64(logoPath);
        console.log(`Logo found at: ${logoPath}`);
        break;
      }
    }
    
    if (!logoBase64) {
      console.warn('Logo not found, proceeding without logo');
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admission Application - ${admission.applicationId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #fff;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 20px;
    }
    
    .logo {
      max-width: 80px;
      height: auto;
      margin-bottom: 10px;
    }
    
    .header h1 {
      color: #4F46E5;
      font-size: 28px;
      margin-bottom: 5px;
    }
    
    .header h2 {
      color: #666;
      font-size: 20px;
      margin-bottom: 15px;
    }
    
    .application-info {
      background-color: #f8f9ff;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 10px;
    }
    
    .application-info p {
      margin: 5px 0;
      font-weight: bold;
    }
    
    .section {
      margin-bottom: 25px;
      break-inside: avoid;
    }
    
    .section-title {
      background-color: #4F46E5;
      color: white;
      padding: 12px 15px;
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    
    .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .field {
      margin-bottom: 12px;
    }
    
    .field-label {
      font-weight: bold;
      color: #555;
      display: block;
      margin-bottom: 3px;
    }
    
    .field-value {
      color: #333;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    
    .image-section {
      margin-top: 20px;
    }
    
    .image-container {
      text-align: center;
      margin: 10px 0;
    }
    
    .uploaded-image {
      max-width: 150px;
      max-height: 150px;
      border: 1px solid #ddd;
      border-radius: 5px;
      margin: 5px;
    }
    
    .image-label {
      font-weight: bold;
      margin-bottom: 10px;
      display: block;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
    
    @media print {
      body { print-color-adjust: exact; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoBase64 ? `<img src="${logoBase64}" alt="HLC Logo" class="logo">` : ''}
      <h1>Hyderabad Law College</h1>
      <h2>Admission Application</h2>
      <div class="application-info">
        <p>Application ID: ${admission.applicationId}</p>
        <p>Submitted: ${submissionDate}</p>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Personal Information</div>
      <div class="field-grid">
        <div class="field">
          <span class="field-label">Full Name:</span>
          <div class="field-value">${admission.candidateName || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Surname:</span>
          <div class="field-value">${admission.surname || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Email:</span>
          <div class="field-value">${admission.email || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Guardian Name:</span>
          <div class="field-value">${admission.guardianName || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Date of Birth:</span>
          <div class="field-value">${admission.dateOfBirth || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">CNIC Number:</span>
          <div class="field-value">${admission.cnicNumber || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Gender:</span>
          <div class="field-value">${admission.gender || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Domicile District:</span>
          <div class="field-value">${admission.domicileDistrict || 'N/A'}</div>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Contact Number:</span>
        <div class="field-value">${admission.contactNumber || 'N/A'}</div>
      </div>
      <div class="field">
        <span class="field-label">Postal Address:</span>
        <div class="field-value">${admission.postalAddress || 'N/A'}</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Academic Information</div>
      <div class="field-grid">
        <div class="field">
          <span class="field-label">Matriculation Board:</span>
          <div class="field-value">${admission.matriculationBoard || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Matriculation Year:</span>
          <div class="field-value">${admission.matriculationYear || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Matriculation Grade:</span>
          <div class="field-value">${admission.matriculationGrade || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Matriculation Marks:</span>
          <div class="field-value">${admission.matriculationMarks || 'N/A'}/${admission.matriculationTotalMarks || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Intermediate Board:</span>
          <div class="field-value">${admission.intermediateBoard || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Intermediate Year:</span>
          <div class="field-value">${admission.intermediateYear || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Intermediate Grade:</span>
          <div class="field-value">${admission.intermediateGrade || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Intermediate Marks:</span>
          <div class="field-value">${admission.intermediateMarks || 'N/A'}/${admission.intermediateTotalMarks || 'N/A'}</div>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Academic Qualification:</span>
        <div class="field-value">${admission.academicQualification || 'N/A'}</div>
      </div>
      <div class="field">
        <span class="field-label">Other Qualification:</span>
        <div class="field-value">${admission.otherQualification || 'N/A'}</div>
      </div>
      <div class="field">
        <span class="field-label">Law Test Score:</span>
        <div class="field-value">${admission.lawTestScore || 'N/A'}/100</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Payment Information</div>
      <div class="field">
        <span class="field-label">Payment Transaction:</span>
        <div class="field-value">${admission.paymentTransaction || 'N/A'}</div>
      </div>
    </div>
    
    ${profileImageBase64 || lawTestImageBase64 || paymentImageBase64 ? `
    <div class="section">
      <div class="section-title">Uploaded Documents</div>
      <div class="image-section">
        ${profileImageBase64 ? `
        <div class="image-container">
          <span class="image-label">Profile Image</span>
          <img src="${profileImageBase64}" alt="Profile Image" class="uploaded-image">
        </div>
        ` : ''}
        ${lawTestImageBase64 ? `
        <div class="image-container">
          <span class="image-label">Law Test Score</span>
          <img src="${lawTestImageBase64}" alt="Law Test Score" class="uploaded-image">
        </div>
        ` : ''}
        ${paymentImageBase64 ? `
        <div class="image-container">
          <span class="image-label">Payment Transaction</span>
          <img src="${paymentImageBase64}" alt="Payment Transaction" class="uploaded-image">
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <p>HLC Admission Portal</p>
      <p>This is a computer-generated document and does not require a signature.</p>
    </div>
  </div>
</body>
</html>`;
  }
}

module.exports = new ProductionPDFService();
