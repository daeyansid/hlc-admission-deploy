const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

class ProductionPDFService {
  async generateAdmissionPDF(admission) {
    try {
      console.log('Starting PDF generation with html-pdf-node...');
      
      const htmlContent = await this.generateHTMLTemplate(admission);
      
      // Configure html-pdf-node options with enhanced settings for production
      const options = {
        format: 'A4',
        border: {
          top: '10mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        },
        type: 'pdf',
        quality: '75',
        timeout: 60000, // Increased timeout
        printBackground: true, // Ensure background colors/images are printed
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      };

      const file = { content: htmlContent };
      
      console.log('Converting HTML to PDF with enhanced options...');
      console.log('HTML content length:', htmlContent.length);
      
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      
      console.log('PDF generated successfully with html-pdf-node');
      console.log('PDF buffer size:', pdfBuffer.length);
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF with html-pdf-node:', error);
      console.error('Error details:', error.stack);
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

    // Convert images to base64 for embedding - Enhanced for production
    const getImageBase64 = (imagePath) => {
      try {
        console.log(`Attempting to convert image to base64: ${imagePath}`);
        
        if (!imagePath) {
          console.log('No image path provided');
          return null;
        }
        
        // Handle different path formats
        let fullPath = imagePath;
        if (!path.isAbsolute(imagePath)) {
          fullPath = path.resolve(process.cwd(), imagePath);
        }
        
        console.log(`Full image path: ${fullPath}`);
        
        if (!fs.existsSync(fullPath)) {
          console.warn(`Image file not found: ${fullPath}`);
          return null;
        }
        
        const stats = fs.statSync(fullPath);
        console.log(`Image file size: ${stats.size} bytes`);
        
        if (stats.size === 0) {
          console.warn(`Image file is empty: ${fullPath}`);
          return null;
        }
        
        if (stats.size > 10 * 1024 * 1024) { // 10MB limit
          console.warn(`Image file too large: ${fullPath} (${stats.size} bytes)`);
          return null;
        }
        
        const imageBuffer = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        let mimeType = 'image/jpeg';
        
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.svg') mimeType = 'image/svg+xml';
        
        const base64String = imageBuffer.toString('base64');
        console.log(`Successfully converted image to base64. Size: ${base64String.length} characters`);
        
        return `data:${mimeType};base64,${base64String}`;
      } catch (error) {
        console.error(`Error converting image to base64: ${imagePath}`, error);
        return null;
      }
    };

    console.log('Converting images to base64...');
    const profileImageBase64 = getImageBase64(admission.profileImage);
    const lawTestImageBase64 = getImageBase64(admission.lawTestScoreImage);
    const paymentImageBase64 = getImageBase64(admission.paymentTransactionImage);

    // Try to get logo - Enhanced path resolution for production
    let logoBase64 = null;
    const possibleLogoPaths = [
      // Relative to server directory
      path.join(__dirname, '../public/hlc-logo.png'),
      path.join(__dirname, '../../public/hlc-logo.png'),
      // Relative to project root
      path.join(process.cwd(), 'public/hlc-logo.png'),
      path.join(process.cwd(), 'server/public/hlc-logo.png'),
      // Absolute paths for different deployment scenarios
      path.resolve(process.cwd(), '../public/hlc-logo.png'),
      path.resolve(process.cwd(), './public/hlc-logo.png'),
      // Alternative extensions
      path.join(__dirname, '../public/hlc-logo.jpg'),
      path.join(__dirname, '../../public/hlc-logo.jpg'),
      path.join(process.cwd(), 'public/hlc-logo.jpg'),
      // Check in uploads directory as fallback
      path.join(process.cwd(), 'server/uploads/hlc-logo.png'),
      path.join(process.cwd(), 'uploads/hlc-logo.png')
    ];
    
    console.log('Searching for logo in multiple locations...');
    for (const logoPath of possibleLogoPaths) {
      console.log(`Checking logo path: ${logoPath}`);
      if (fs.existsSync(logoPath)) {
        logoBase64 = getImageBase64(logoPath);
        if (logoBase64) {
          console.log(`Logo found and converted successfully at: ${logoPath}`);
          break;
        } else {
          console.log(`Logo found but conversion failed at: ${logoPath}`);
        }
      }
    }
    
    if (!logoBase64) {
      console.warn('Logo not found in any location, proceeding without logo');
      console.log('Current working directory:', process.cwd());
      console.log('__dirname:', __dirname);
      
      // List contents of possible directories for debugging
      try {
        const publicDir = path.join(process.cwd(), 'public');
        if (fs.existsSync(publicDir)) {
          const publicContents = fs.readdirSync(publicDir);
          console.log('Contents of public directory:', publicContents);
        }
      } catch (err) {
        console.log('Could not read public directory');
      }
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
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #ffffff;
      padding: 20px;
      font-size: 12px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
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
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    
    .header h1 {
      color: #4F46E5;
      font-size: 24px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .header h2 {
      color: #666666;
      font-size: 18px;
      margin-bottom: 15px;
      font-weight: normal;
    }
    
    .application-info {
      background-color: #f8f9ff;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 10px;
      border: 1px solid #e0e7ff;
    }
    
    .application-info p {
      margin: 5px 0;
      font-weight: bold;
      color: #4F46E5;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .section-title {
      background-color: #4F46E5;
      color: #ffffff;
      padding: 12px 15px;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 15px;
      border-radius: 3px;
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
      color: #555555;
      display: block;
      margin-bottom: 3px;
      font-size: 11px;
    }
    
    .field-value {
      color: #333333;
      padding: 5px 0;
      border-bottom: 1px solid #eeeeee;
      font-size: 12px;
      min-height: 20px;
    }
    
    .image-section {
      margin-top: 20px;
    }
    
    .image-container {
      text-align: center;
      margin: 15px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .uploaded-image {
      max-width: 150px;
      max-height: 150px;
      border: 1px solid #dddddd;
      border-radius: 5px;
      margin: 5px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    
    .image-label {
      font-weight: bold;
      margin-bottom: 10px;
      display: block;
      color: #4F46E5;
      font-size: 12px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #dddddd;
      color: #666666;
      font-size: 10px;
    }
    
    /* Ensure print compatibility */
    @media print {
      body { 
        print-color-adjust: exact; 
        -webkit-print-color-adjust: exact;
      }
      .section { 
        page-break-inside: avoid; 
        break-inside: avoid;
      }
      .image-container {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
    
    /* Grid fallback for older PDF generators */
    @supports not (display: grid) {
      .field-grid {
        display: table;
        width: 100%;
      }
      .field-grid .field {
        display: table-cell;
        width: 50%;
        padding-right: 15px;
      }
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
