const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PDFService {
  async generateAdmissionPDF(admission) {
    let browser;
    try {
      const htmlContent = await this.generateHTMLTemplate(admission);
      
      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set content and wait for it to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10px',
          right: '15px',
          bottom: '15px',
          left: '15px'
        }
      });
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async generateAndSavePDF(admission, filePath) {
    try {
      const pdfBuffer = await this.generateAdmissionPDF(admission);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save PDF to file
      fs.writeFileSync(filePath, pdfBuffer);
      
      return filePath;
    } catch (error) {
      console.error('Error saving PDF:', error);
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
        console.error('Error converting image to base64:', error);
        return null;
      }
    };

    const profileImageBase64 = getImageBase64(admission.profileImage);
    const lawTestImageBase64 = getImageBase64(admission.lawTestScoreImage);
    const paymentImageBase64 = getImageBase64(admission.paymentTransactionImage);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admission Application - ${admission.applicationId}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1a202c;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 15px;
          }
          
          .container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
          }
          
          .letterhead {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 25%, #7c3aed  50%, #db2777 75%, #dc2626 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .letterhead::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          
          .letterhead-content {
            position: relative;
            z-index: 2;
          }
          
          .college-logo {
            width: 70px;
            height: 70px;
            background: rgba(255,255,255,0.2);
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          
          .college-name {
            font-family: 'Crimson Text', serif;
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            letter-spacing: 1px;
          }
          
          .college-subtitle {
            font-size: 16px;
            margin-bottom: 15px;
            opacity: 0.9;
            font-weight: 300;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          
          .college-address {
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 20px;
            font-weight: 300;
          }
          
          .application-title {
            background: rgba(255,255,255,0.95);
            color: #1e3a8a;
            padding: 12px 25px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
          }
          
          .app-id-banner {
            background: linear-gradient(45deg, #059669, #10b981);
            color: white;
            padding: 15px;
            text-align: center;
            font-size: 16px;
            font-weight: 600;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .app-id-banner .id {
            font-size: 20px;
            font-weight: 700;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
          }
          
          .status-badge {
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
          }
          
          .main-content {
            padding: 30px;
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
          }
          
          .left-column {
            flex: 1;
          }
          
          .right-column {
            position: relative;
          }
          
          .profile-section {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 25px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border: 3px solid #e2e8f0;
            position: sticky;
            top: 20px;
          }
          
          .profile-image {
            width: 160px;
            height: 200px;
            object-fit: cover;
            border: 4px solid #1e3a8a;
            border-radius: 12px;
            margin-bottom: 15px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          
          .candidate-name {
            font-size: 16px;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 5px;
          }
          
          .candidate-id {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }
          
          .section {
            margin-bottom: 25px;
            background: white;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0,0,0,0.08);
            border: 1px solid #f1f5f9;
          }
          
          .section-header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 15px 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            position: relative;
            overflow: hidden;
          }
          
          .section-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
            animation: shine 3s infinite;
          }
          
          @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .section-content {
            padding: 20px;
          }
          
          .field-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .field-grid.single {
            grid-template-columns: 1fr;
          }
          
          .field {
            background: #f8fafc;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            transition: all 0.3s ease;
          }
          
          .field:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .field-label {
            font-weight: 600;
            color: #374151;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 6px;
            display: block;
            opacity: 0.8;
          }
          
          .field-value {
            color: #1f2937;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.4;
          }
          
          .academic-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          
          .academic-table th {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          
          .academic-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 500;
            font-size: 13px;
          }
          
          .academic-table tr:nth-child(even) {
            background: #f8fafc;
          }
          
          .academic-table tr:hover {
            background: #e0f2fe;
            transform: scale(1.005);
            transition: all 0.2s ease;
          }
          
          .score-highlight {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            padding: 16px;
            border-radius: 10px;
            text-align: center;
            margin: 15px 0;
            box-shadow: 0 6px 20px rgba(5, 150, 105, 0.3);
          }
          
          .score-value {
            font-size: 26px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          
          .score-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
          
          .documents-section {
            background: #f8fafc;
            padding: 25px;
            border-radius: 14px;
            margin: 25px 0;
          }
          
          .document-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
          }
          
          .document-item {
            background: white;
            padding: 16px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
          }
          
          .document-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.15);
            border-color: #3b82f6;
          }
          
          .document-label {
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 12px;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.6px;
          }
          
          .document-image {
            max-width: 100%;
            max-height: 140px;
            object-fit: contain;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            background: #f9fafb;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          }
          
          .declaration {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            border-radius: 14px;
            padding: 20px;
            margin: 25px 0;
            position: relative;
            overflow: hidden;
          }
          
          .declaration::before {
            content: '⚖️';
            position: absolute;
            top: 12px;
            right: 15px;
            font-size: 20px;
            opacity: 0.7;
          }
          
          .declaration-title {
            font-weight: 700;
            color: #92400e;
            font-size: 14px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          
          .declaration-text {
            color: #92400e;
            font-style: italic;
            line-height: 1.5;
            font-weight: 500;
            font-size: 13px;
          }
          
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin: 30px 0;
          }
          
          .signature-box {
            text-align: center;
            padding: 16px;
            background: #f8fafc;
            border-radius: 10px;
            border: 2px dashed #cbd5e1;
          }
          
          .signature-line {
            border-bottom: 2px solid #1e40af;
            margin-bottom: 12px;
            height: 50px;
            border-radius: 2px;
          }
          
          .signature-label {
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.8px;
          }
          
          .footer {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
            color: white;
            padding: 25px;
            text-align: center;
            margin-top: 30px;
          }
          
          .footer-content {
            max-width: 500px;
            margin: 0 auto;
          }
          
          .footer h3 {
            font-size: 18px;
            margin-bottom: 12px;
            font-weight: 600;
          }
          
          .footer p {
            margin-bottom: 6px;
            opacity: 0.9;
            font-size: 12px;
          }
          
          .footer .highlight {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 12px;
            font-weight: 600;
            font-size: 11px;
          }
          
          @media print {
            body { 
              padding: 0; 
              background: white;
            }
            .container {
              box-shadow: none;
              border-radius: 0;
            }
            .section { 
              break-inside: avoid; 
              page-break-inside: avoid;
            }
            .profile-section {
              position: static;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="letterhead">
            <div class="letterhead-content">
              <div class="college-logo">HLC</div>
              <div class="college-name">Higher Law College</div>
              <div class="college-subtitle">Excellence in Legal Education Since 1995</div>
              <div class="college-address">
                📍 Constitutional Avenue, Legal District, Islamabad<br>
                📞 +92 51 123 4567 | 📧 admissions@hlc.edu.pk
              </div>
              <div class="application-title">Admission Application Form</div>
            </div>
          </div>
          
          <div class="app-id-banner">
            <div>Application ID: <span class="id">${admission.applicationId}</span></div>
            <div style="margin-top: 5px; font-size: 13px; opacity: 0.9;">
              📅 Submitted: ${submissionDate} | 
              <span class="status-badge">✓ Received</span>
            </div>
          </div>
          
          <div class="main-content">
            <div class="left-column">
              <div class="section">
                <div class="section-header">
                  👤 Personal Information
                </div>
                <div class="section-content">
                  <div class="field-grid">
                    <div class="field">
                      <label class="field-label">👨‍🎓 Candidate Name</label>
                      <div class="field-value">${admission.candidateName}</div>
                    </div>
                    <div class="field">
                      <label class="field-label">📛 Surname</label>
                      <div class="field-value">${admission.surname}</div>
                    </div>
                  </div>
                  <div class="field-grid">
                    <div class="field">
                      <label class="field-label">👨‍👩‍👧 Father/Guardian Name</label>
                      <div class="field-value">${admission.guardianName}</div>
                    </div>
                    <div class="field">
                      <label class="field-label">🎂 Date of Birth</label>
                      <div class="field-value">${new Date(admission.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div class="field-grid">
                    <div class="field">
                      <label class="field-label">🆔 CNIC Number</label>
                      <div class="field-value">${admission.cnicNumber}</div>
                    </div>
                    <div class="field">
                      <label class="field-label">⚥ Gender</label>
                      <div class="field-value">${admission.gender.charAt(0).toUpperCase() + admission.gender.slice(1)}</div>
                    </div>
                  </div>
                  <div class="field-grid">
                    <div class="field">
                      <label class="field-label">📞 Contact Number</label>
                      <div class="field-value">${admission.contactNumber}</div>
                    </div>
                    <div class="field">
                      <label class="field-label">📧 Email Address</label>
                      <div class="field-value">${admission.email}</div>
                    </div>
                  </div>
                  <div class="field-grid single">
                    <div class="field">
                      <label class="field-label">🏠 Postal Address</label>
                      <div class="field-value">${admission.postalAddress}</div>
                    </div>
                  </div>
                  ${admission.domicileDistrict ? `
                  <div class="field-grid single">
                    <div class="field">
                      <label class="field-label">🏛️ Domicile District</label>
                      <div class="field-value">${admission.domicileDistrict}</div>
                    </div>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <div class="section">
                <div class="section-header">
                  📚 Academic Qualifications
                </div>
                <div class="section-content">
                  <table class="academic-table">
                    <thead>
                      <tr>
                        <th>🎓 Qualification</th>
                        <th>🏫 Board/University</th>
                        <th>📅 Year</th>
                        <th>📊 Grade/Marks</th>
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
                    <div class="score-label">⚖️ Law Admission Test Score</div>
                  </div>
                  
                  <div class="field-grid single">
                    <div class="field">
                      <label class="field-label">💳 Payment Transaction ID</label>
                      <div class="field-value">${admission.paymentTransaction}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="right-column">
              <div class="profile-section">
                <div class="field-label" style="margin-bottom: 15px; font-size: 12px;">📷 CANDIDATE PHOTOGRAPH</div>
                ${profileImageBase64 ? 
                  `<img src="${profileImageBase64}" alt="Profile Photo" class="profile-image" />` : 
                  `<div class="profile-image" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%); color: #6b7280; font-size: 14px; font-weight: 600; flex-direction: column;">📷<br>No Photo<br>Available</div>`
                }
                <div class="candidate-name">${admission.candidateName} ${admission.surname}</div>
                <div class="candidate-id">ID: ${admission.applicationId}</div>
              </div>
            </div>
          </div>
          
          <div class="documents-section">
            <div class="section">
              <div class="section-header">
                📎 Supporting Documents
              </div>
              <div class="section-content">
                <div class="document-grid">
                  <div class="document-item">
                    <div class="document-label">⚖️ Law Test Score Certificate</div>
                    ${lawTestImageBase64 ? 
                      `<img src="${lawTestImageBase64}" alt="Law Test Certificate" class="document-image" />` : 
                      `<div class="document-image" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #d97706; height: 120px; border: 2px dashed #f59e0b; flex-direction: column;">📄<br>Document<br>Not Available</div>`
                    }
                  </div>
                  <div class="document-item">
                    <div class="document-label">💳 Payment Receipt</div>
                    ${paymentImageBase64 ? 
                      `<img src="${paymentImageBase64}" alt="Payment Receipt" class="document-image" />` : 
                      `<div class="document-image" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #d97706; height: 120px; border: 2px dashed #f59e0b; flex-direction: column;">🧾<br>Document<br>Not Available</div>`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="declaration">
            <div class="declaration-title">📋 Declaration</div>
            <div class="declaration-text">
              I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. 
              I understand that any false information or concealment of facts may lead to the cancellation of my admission and 
              legal action against me. I also agree to abide by the rules and regulations of Hyderabad Law College.
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">✍️ Candidate's Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">📅 Date</div>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-content">
              <h3>🏛️ Hyderabad Law College - Admission Office</h3>
              <p>📍 Constitutional Avenue, Legal District, Islamabad, Pakistan</p>
              <p>📞 Phone: +92 51 123 4567 | 📧 Email: admissions@hlc.edu.pk</p>
              <p>🌐 Website: www.hlc.edu.pk | 📱 WhatsApp: +92 300 123 4567</p>
              <div class="highlight">
                Generated on: ${new Date().toLocaleString('en-GB', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} | Application ID: ${admission.applicationId}
              </div>
              <p style="margin-top: 12px; font-size: 11px; opacity: 0.8;">
                This is a computer-generated document. For verification, please contact the admission office.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new PDFService();
