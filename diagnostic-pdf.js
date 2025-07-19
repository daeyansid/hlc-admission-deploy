const pdfService = require('./services/pdfService');
const productionPDFService = require('./services/pdfService-production');
const fallbackPDFService = require('./services/pdfService-fallback');
const path = require('path');
const fs = require('fs');

// Test data
const testAdmission = {
  applicationId: 'HLC20250719999',
  candidateName: 'Diagnostic Test',
  surname: 'User',
  email: 'diagnostic@example.com',
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

async function diagnosticTest() {
  console.log('🔍 PDF SERVICE DIAGNOSTIC TEST');
  console.log('===============================');
  console.log('This test verifies which PDF service is being used and why.\n');

  try {
    // Test 1: Normal operation (should use production service)
    console.log('TEST 1: Normal PDF Generation');
    console.log('------------------------------');
    
    const normalPath = path.join(__dirname, 'pdfs', 'diagnostic_normal.pdf');
    
    // Clean up any existing file
    if (fs.existsSync(normalPath)) {
      fs.unlinkSync(normalPath);
      console.log('🗑️  Cleaned up existing test file');
    }
    
    const result1 = await pdfService.generateAndSavePDF(testAdmission, normalPath);
    
    if (fs.existsSync(normalPath)) {
      const stats = fs.statSync(normalPath);
      const content = fs.readFileSync(normalPath, 'utf8');
      
      console.log(`📊 File size: ${stats.size} bytes`);
      console.log(`📄 File path: ${result1}`);
      
      // Check if it's using the production service (proper PDF) or fallback (text-based)
      if (content.includes('Chromium') || content.includes('Skia') || stats.size > 50000) {
        console.log('✅ USING PRODUCTION SERVICE (html-pdf-node) - CORRECT!');
      } else if (content.includes('%PDF-1.4') && content.includes('/Type /Catalog') && stats.size < 10000) {
        console.log('⚠️  USING FALLBACK SERVICE - This indicates an issue!');
      } else {
        console.log('❓ Unknown PDF format');
      }
    }
    
    console.log('');
    
    // Test 2: Force fallback mode
    console.log('TEST 2: Forced Fallback Mode');
    console.log('-----------------------------');
    
    process.env.FORCE_FALLBACK_PDF = 'true';
    
    const fallbackPath = path.join(__dirname, 'pdfs', 'diagnostic_forced_fallback.pdf');
    
    if (fs.existsSync(fallbackPath)) {
      fs.unlinkSync(fallbackPath);
    }
    
    const result2 = await pdfService.generateAndSavePDF(testAdmission, fallbackPath);
    
    if (fs.existsSync(fallbackPath)) {
      const stats = fs.statSync(fallbackPath);
      console.log(`📊 File size: ${stats.size} bytes`);
      console.log(`📄 File path: ${result2}`);
      console.log('✅ FORCED FALLBACK MODE WORKING');
    }
    
    // Reset environment
    delete process.env.FORCE_FALLBACK_PDF;
    
    console.log('');
    
    // Test 3: Direct production service test
    console.log('TEST 3: Direct Production Service');
    console.log('----------------------------------');
    
    const directPath = path.join(__dirname, 'pdfs', 'diagnostic_direct_production.pdf');
    
    if (fs.existsSync(directPath)) {
      fs.unlinkSync(directPath);
    }
    
    const result3 = await productionPDFService.generateAndSavePDF(testAdmission, directPath);
    
    if (fs.existsSync(directPath)) {
      const stats = fs.statSync(directPath);
      console.log(`📊 File size: ${stats.size} bytes`);
      console.log(`📄 File path: ${result3}`);
      console.log('✅ DIRECT PRODUCTION SERVICE WORKING');
    }
    
    console.log('');
    console.log('🎉 DIAGNOSTIC COMPLETE');
    console.log('======================');
    console.log('Summary:');
    console.log('- Normal operation should use Production Service (html-pdf-node)');
    console.log('- Production Service creates PDFs ~400KB+ in size');
    console.log('- Fallback Service creates small text-based PDFs ~2KB in size');
    console.log('- The system prioritizes Production > Puppeteer > Fallback');
    
  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

diagnosticTest();
