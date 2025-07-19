const pdfService = require('./services/pdfService');
const path = require('path');

// Test data
const testAdmission = {
  applicationId: 'HLC20250002',
  candidateName: 'Test Candidate 2',
  surname: 'Test Surname 2',
  email: 'test2@example.com',
  guardianName: 'Test Guardian 2',
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

async function testMainPDFService() {
  try {
    console.log('Testing main PDF service (with production priority)...');
    
    const pdfPath = path.join(__dirname, 'pdfs', 'test_main_service.pdf');
    console.log(`Generating PDF at: ${pdfPath}`);
    
    const result = await pdfService.generateAndSavePDF(testAdmission, pdfPath);
    console.log('Main PDF service test completed successfully!');
    console.log('Result:', result);
    
    // Check if file exists and its size
    const fs = require('fs');
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      console.log(`Generated PDF size: ${stats.size} bytes`);
      
      if (stats.size > 10000) {
        console.log('✓ PDF size looks good');
      } else {
        console.log('⚠ PDF size seems too small');
      }
    } else {
      console.log('❌ PDF file was not created');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testMainPDFService();
