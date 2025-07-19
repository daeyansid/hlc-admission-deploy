const productionPDFService = require('./services/pdfService-production');
const path = require('path');
const fs = require('fs');

// Test with actual images if they exist
async function testWithImages() {
  try {
    // Check if we have any sample images in uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    const imageFiles = files.filter(file => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.jpeg')
    );

    console.log('Found image files:', imageFiles);

    const testAdmission = {
      applicationId: 'HLC20250002',
      candidateName: 'Test With Images',
      surname: 'Test Surname',
      email: 'test@example.com',
      guardianName: 'Test Guardian',
      dateOfBirth: '1990-01-01',
      cnicNumber: '12345-1234567-1',
      domicileDistrict: 'Test District',
      gender: 'Female',
      postalAddress: 'Test Address 123',
      contactNumber: '+92-300-1234567',
      matriculationBoard: 'Test Board',
      matriculationYear: '2010',
      matriculationGrade: 'A',
      matriculationMarks: '950',
      matriculationTotalMarks: '1100',
      intermediateBoard: 'Test Intermediate Board',
      intermediateYear: '2012',
      intermediateGrade: 'A',
      intermediateMarks: '980',
      intermediateTotalMarks: '1100',
      academicQualification: 'Pre-Medical',
      otherQualification: 'None',
      lawTestScore: '85',
      paymentTransaction: 'TXN123456789',
      submissionDate: new Date(),
      // Use actual image files if available
      profileImage: imageFiles.length > 0 ? path.join(uploadsDir, imageFiles[0]) : null,
      lawTestScoreImage: imageFiles.length > 1 ? path.join(uploadsDir, imageFiles[1]) : null,
      paymentTransactionImage: imageFiles.length > 2 ? path.join(uploadsDir, imageFiles[2]) : imageFiles.length > 0 ? path.join(uploadsDir, imageFiles[0]) : null
    };

    console.log('Testing PDF with images...');
    console.log('Profile image:', testAdmission.profileImage);
    console.log('Law test image:', testAdmission.lawTestScoreImage);
    console.log('Payment image:', testAdmission.paymentTransactionImage);
    
    const pdfPath = path.join(__dirname, 'pdfs', 'test_with_images.pdf');
    
    const result = await productionPDFService.generateAndSavePDF(testAdmission, pdfPath);
    console.log('PDF with images generated successfully!');
    
    const stats = fs.statSync(pdfPath);
    console.log(`Generated PDF size: ${stats.size} bytes`);
    
    if (stats.size > 50000) { // Larger size expected with images
      console.log('✓ PDF with images size looks good');
    } else {
      console.log('⚠ PDF size might be too small for images');
    }
    
  } catch (error) {
    console.error('PDF with images test failed:', error);
  }
}

// Also test the HTML generation separately
async function testHTMLGeneration() {
  try {
    console.log('\nTesting HTML template generation...');
    
    const testAdmission = {
      applicationId: 'HLC20250003',
      candidateName: 'HTML Test',
      surname: 'Candidate',
      email: 'html@test.com',
      submissionDate: new Date()
    };
    
    const htmlContent = await productionPDFService.generateHTMLTemplate(testAdmission);
    
    const htmlPath = path.join(__dirname, 'pdfs', 'test_template.html');
    fs.writeFileSync(htmlPath, htmlContent);
    
    console.log(`HTML template saved to: ${htmlPath}`);
    console.log(`HTML content length: ${htmlContent.length} characters`);
    console.log('✓ HTML template generation successful');
    
  } catch (error) {
    console.error('HTML template test failed:', error);
  }
}

// Run both tests
async function runAllTests() {
  await testWithImages();
  await testHTMLGeneration();
  console.log('\nAll tests completed!');
}

runAllTests();
