const productionPDFService = require('./services/pdfService-production');
const path = require('path');

// Test data
const testAdmission = {
  applicationId: 'HLC20250001',
  candidateName: 'Test Candidate',
  surname: 'Test Surname',
  email: 'test@example.com',
  guardianName: 'Test Guardian',
  dateOfBirth: '1990-01-01',
  cnicNumber: '12345-1234567-1',
  domicileDistrict: 'Test District',
  gender: 'Male',
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
  profileImage: null,
  lawTestScoreImage: null,
  paymentTransactionImage: null
};

async function testPDFGeneration() {
  try {
    console.log('Testing production PDF service...');
    
    const pdfPath = path.join(__dirname, 'pdfs', 'test_application.pdf');
    console.log(`Generating PDF at: ${pdfPath}`);
    
    const result = await productionPDFService.generateAndSavePDF(testAdmission, pdfPath);
    console.log('PDF generation test completed successfully!');
    console.log('Result:', result);
    
    // Check if file exists and its size
    const fs = require('fs');
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      console.log(`Generated PDF size: ${stats.size} bytes`);
      
      if (stats.size > 10000) {
        console.log('✓ PDF size looks good');
      } else {
        console.log('⚠ PDF size seems small, might have issues');
      }
    } else {
      console.log('✗ PDF file was not created');
    }
    
  } catch (error) {
    console.error('PDF generation test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testPDFGeneration();
