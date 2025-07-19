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
      line-height: 1.5;
      color: #2d3748;
      background: #f7fafc;
      padding: 20px;
      font-size: 12px;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    
    .letterhead {
      background: #121E76;
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    
    .letterhead::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: #E3E3E3;
    }
    
    .college-logo {
      width: 60px;
      height: 60px;
      background: #E3E3E3;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      color: #121E76;
    }
    
    .college-logo img {
      max-width: 100%;
      max-height: 100%;
      border-radius: 50%;
    }
    
    .college-name {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    
    .college-subtitle {
      font-size: 14px;
      margin-bottom: 20px;
      opacity: 0.9;
      font-weight: 400;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    .college-address {
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 25px;
      font-weight: 300;
      line-height: 1.6;
    }
    
    .application-title {
      background: white;
      color: #121E76;
      padding: 12px 30px;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: inline-block;
    }
    
    .app-id-banner {
      background: #E3E3E3;
      color: #2d3748;
      padding: 16px 30px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
    }
    
    .app-id-banner .id {
      font-size: 18px;
      font-weight: 700;
      margin: 0 8px;
    }
    
    .status-badge {
      background: rgba(45, 55, 72, 0.1);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-block;
      margin-left: 10px;
      color: #2d3748;
    }
    
    .main-content {
      padding: 30px;
      display: table;
      width: 100%;
      table-layout: fixed;
    }
    
    .left-column {
      display: table-cell;
      width: 65%;
      vertical-align: top;
      padding-right: 20px;
    }
    
    .right-column {
      display: table-cell;
      width: 35%;
      vertical-align: top;
    }
    
    .section {
      margin-bottom: 25px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    
    .section-header {
      background: #121E76;
      color: white;
      padding: 16px 20px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .section-content {
      padding: 24px 20px;
    }
    
    .field-grid {
      display: table;
      width: 100%;
      margin-bottom: 16px;
    }
    
    .field-grid .field {
      display: table-cell;
      width: 50%;
      padding-right: 20px;
      vertical-align: top;
    }
    
    .field-grid.single .field {
      display: block;
      width: 100%;
      padding-right: 0;
    }
    
    .field {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    
    .field-label {
      font-weight: 500;
      color: #4a5568;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      display: block;
    }
    
    .field-value {
      color: #2d3748;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.4;
    }
    
    .profile-section {
      background: #f8fafc;
      padding: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      text-align: center;
    }
    
    .profile-image {
      width: 140px;
      height: 170px;
      object-fit: cover;
      border: 3px solid #121E76;
      border-radius: 4px;
      margin-bottom: 12px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    
    .candidate-name {
      font-size: 14px;
      font-weight: 600;
      color: #121E76;
      margin-bottom: 4px;
    }
    
    .candidate-id {
      font-size: 11px;
      color: #718096;
      font-weight: 500;
    }
    
    .academic-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .academic-table th {
      background: #121E76;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 500;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .academic-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 400;
      font-size: 13px;
    }
    
    .academic-table tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .score-highlight {
      background: #E3E3E3;
      color: #121E76;
      padding: 16px;
      border-radius: 4px;
      text-align: center;
      margin: 16px 0;
    }
    
    .score-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .score-label {
      font-size: 11px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .documents-section {
      background: #f8fafc;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border: 1px solid #e2e8f0;
    }
    
    .document-grid {
      display: table;
      width: 100%;
      margin-top: 16px;
    }
    
    .document-item {
      display: table-cell;
      width: 50%;
      background: white;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      text-align: center;
      margin-right: 16px;
    }
    
    .document-label {
      font-weight: 500;
      color: #121E76;
      margin-bottom: 10px;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.3px;
    }
    
    .document-image {
      max-width: 100%;
      max-height: 120px;
      object-fit: contain;
      border: 1px solid #e2e8f0;
      border-radius: 2px;
      background: #f9fafb;
    }
    
    .declaration {
      background: #fef9e7;
      border: 1px solid #E3E3E3;
      border-radius: 4px;
      padding: 20px;
      margin: 20px 0;
      position: relative;
    }
    
    .declaration::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: #E3E3E3;
    }
    
    .declaration-title {
      font-weight: 600;
      color: #744210;
      font-size: 13px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .declaration-text {
      color: #744210;
      line-height: 1.5;
      font-weight: 400;
      font-size: 12px;
    }
    
    .signature-section {
      display: table;
      width: 100%;
      margin: 30px 0;
    }
    
    .signature-box {
      display: table-cell;
      width: 50%;
      text-align: center;
      padding: 16px;
      background: #f8fafc;
      border: 1px dashed #cbd5e0;
      border-radius: 4px;
    }
    
    .signature-line {
      border-bottom: 1px solid #121E76;
      margin-bottom: 8px;
      height: 40px;
    }
    
    .signature-label {
      font-weight: 500;
      color: #4a5568;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    
    .footer {
      background: #121E76;
      color: white;
      padding: 24px 30px;
      text-align: center;
      margin-top: 20px;
    }
    
    .footer-content {
      max-width: 500px;
      margin: 0 auto;
    }
    
    .footer h3 {
      font-size: 16px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    .footer p {
      margin-bottom: 4px;
      opacity: 0.9;
      font-size: 11px;
      font-weight: 300;
    }
    
    .footer .highlight {
      background: #E3E3E3;
      color: #121E76;
      padding: 8px 16px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 12px;
      font-weight: 500;
      font-size: 10px;
    }
    
    @media print {
      body { 
        padding: 0; 
        background: white;
        print-color-adjust: exact; 
        -webkit-print-color-adjust: exact;
      }
      .container {
        box-shadow: none;
        border-radius: 0;
        border: none;
      }
      .section { 
        break-inside: avoid; 
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="letterhead">
      <div class="college-logo">
        ${logoBase64 ? 
        `<img src="${logoBase64}" alt="HLC Logo" />` : 
        `<div>HLC</div>`
        }
      </div>
      <div class="college-name">Hyderabad Law College</div>
      <div class="college-subtitle">A Landmark in Legal Education</div>
      <div class="college-address">
        Plot No. A/34, Main Auto Bahn Rd, behind Lal Qila Restaurant, Railway Housing Society Hyderabad, Sindh 71000, Pakistan<br>
        Phone: 022-2674441 0300-4367633 0345-2780060 | Email: hyderabadlawcollege@gmail.com
      </div>
      <div class="application-title">Admission Application Form</div>
    </div>
    
    <div class="app-id-banner">
      Application ID: <span class="id">${admission.applicationId}</span>
      <span style="margin-left: 20px; font-size: 12px; opacity: 0.9;">
        Submitted: ${submissionDate}
        <span class="status-badge">Received</span>
      </span>
    </div>
    
    <div class="main-content">
      <div class="left-column">
        <div class="section">
          <div class="section-header">Personal Information</div>
          <div class="section-content">
            <div class="field-grid">
              <div class="field">
                <label class="field-label">Candidate Name</label>
                <div class="field-value">${admission.candidateName}</div>
              </div>
              <div class="field">
                <label class="field-label">Surname</label>
                <div class="field-value">${admission.surname}</div>
              </div>
            </div>
            <div class="field-grid">
              <div class="field">
                <label class="field-label">Father/Guardian Name</label>
                <div class="field-value">${admission.guardianName}</div>
              </div>
              <div class="field">
                <label class="field-label">Date of Birth</label>
                <div class="field-value">${new Date(admission.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
            <div class="field-grid">
              <div class="field">
                <label class="field-label">CNIC Number</label>
                <div class="field-value">${admission.cnicNumber}</div>
              </div>
              <div class="field">
                <label class="field-label">Gender</label>
                <div class="field-value">${admission.gender.charAt(0).toUpperCase() + admission.gender.slice(1)}</div>
              </div>
            </div>
            <div class="field-grid">
              <div class="field">
                <label class="field-label">Contact Number</label>
                <div class="field-value">${admission.contactNumber}</div>
              </div>
              <div class="field">
                <label class="field-label">Email Address</label>
                <div class="field-value">${admission.email}</div>
              </div>
            </div>
            <div class="field-grid single">
              <div class="field">
                <label class="field-label">Postal Address</label>
                <div class="field-value">${admission.postalAddress}</div>
              </div>
            </div>
            ${admission.domicileDistrict ? `
            <div class="field-grid single">
              <div class="field">
                <label class="field-label">Domicile District</label>
                <div class="field-value">${admission.domicileDistrict}</div>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">Academic Qualifications</div>
          <div class="section-content">
            <table class="academic-table">
              <thead>
                <tr>
                  <th>Qualification</th>
                  <th>Board/University</th>
                  <th>Year</th>
                  <th>Grade/Marks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Matriculation (SSC)</strong></td>
                  <td>${admission.matriculationBoard}</td>
                  <td>${admission.matriculationYear}</td>
                  <td><strong>${admission.matriculationGrade}</strong>${admission.matriculationMarks && admission.matriculationTotalMarks ? ` (${admission.matriculationMarks}/${admission.matriculationTotalMarks})` : ''}</td>
                </tr>
                <tr>
                  <td><strong>Intermediate (HSSC)</strong></td>
                  <td>${admission.intermediateBoard}</td>
                  <td>${admission.intermediateYear}</td>
                  <td><strong>${admission.intermediateGrade}</strong>${admission.intermediateMarks && admission.intermediateTotalMarks ? ` (${admission.intermediateMarks}/${admission.intermediateTotalMarks})` : ''}</td>
                </tr>
                ${admission.otherQualification ? `
                <tr>
                  <td><strong>Other Qualification</strong></td>
                  <td colspan="3">${admission.otherQualification}</td>
                </tr>
                ` : ''}
              </tbody>
            </table>
            
            <div class="score-highlight">
              <div class="score-value">${admission.lawTestScore}/100</div>
              <div class="score-label">Law Admission Test Score</div>
            </div>
            
            <div class="field-grid single">
              <div class="field">
                <label class="field-label">Payment Transaction ID</label>
                <div class="field-value">${admission.paymentTransaction}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="right-column">
        <div class="profile-section">
          <div class="field-label" style="margin-bottom: 15px; font-size: 11px;">Candidate Photograph</div>
          ${profileImageBase64 ? 
            `<img src="${profileImageBase64}" alt="Profile Photo" class="profile-image" />` : 
            `<div class="profile-image" style="display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #718096; font-size: 12px; font-weight: 500; flex-direction: column;">No Photo<br>Available</div>`
          }
          <div class="candidate-name">${admission.candidateName} ${admission.surname}</div>
          <div class="candidate-id">ID: ${admission.applicationId}</div>
        </div>
      </div>
    </div>
    
    <div class="documents-section">
      <div class="section">
        <div class="section-header">Supporting Documents</div>
        <div class="section-content">
          <div class="document-grid">
            <div class="document-item">
              <div class="document-label">Law Test Score Certificate</div>
              ${lawTestImageBase64 ? 
                `<img src="${lawTestImageBase64}" alt="Law Test Certificate" class="document-image" />` : 
                `<div class="document-image" style="display: flex; align-items: center; justify-content: center; background: #f7fafc; color: #a0aec0; height: 100px; border: 1px dashed #cbd5e0; flex-direction: column;">Document<br>Not Available</div>`
              }
            </div>
            <div class="document-item">
              <div class="document-label">Payment Receipt</div>
              ${paymentImageBase64 ? 
                `<img src="${paymentImageBase64}" alt="Payment Receipt" class="document-image" />` : 
                `<div class="document-image" style="display: flex; align-items: center; justify-content: center; background: #f7fafc; color: #a0aec0; height: 100px; border: 1px dashed #cbd5e0; flex-direction: column;">Document<br>Not Available</div>`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="declaration">
      <div class="declaration-title">Declaration</div>
      <div class="declaration-text">
        I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. 
        I understand that any false information or concealment of facts may lead to the cancellation of my admission and 
        legal action against me. I also agree to abide by the rules and regulations of Hyderabad Law College.
      </div>
    </div>
    
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Candidate's Signature</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Date</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-content">
        <h3>Hyderabad Law College - Admission Office</h3>
        <p>Plot No. A/34, Main Auto Bahn Rd, behind Lal Qila Restaurant, Railway Housing Society Hyderabad, Sindh 71000, Pakistan</p>
        <p>Phone: 022-2674441 0300-4367633 0345-2780060 | Email: hyderabadlawcollege@gmail.com</p>
        <p>Website: www.hlc.edu.pk</p>
        <div class="highlight">
          Generated on: ${new Date().toLocaleString('en-GB', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} | Application ID: ${admission.applicationId}
        </div>
        <p style="margin-top: 12px; font-size: 10px; opacity: 0.8;">
          This is a computer-generated document. For verification, please contact the admission office.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}

module.exports = new ProductionPDFService();
