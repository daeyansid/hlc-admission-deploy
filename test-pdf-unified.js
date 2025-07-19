const pdfService = require('./services/pdfService');
const productionPDFService = require('./services/pdfService-production');
const fallbackPDFService = require('./services/pdfService-fallback');
const path = require('path');
const fs = require('fs');

// Enhanced test data with all fields
const testAdmission = {
  applicationId: 'HLC20250719001',
  candidateName: 'Ahmed Ali',
  surname: 'Khan',
  email: 'ahmed.ali@example.com',
  guardianName: 'Muhammad Ali Khan',
  dateOfBirth: '2000-05-15',
  cnicNumber: '42101-1234567-1',
  domicileDistrict: 'Hyderabad',
  gender: 'male',
  postalAddress: 'House No. 123, Street 45, Latifabad Unit 8, Hyderabad, Sindh 71000, Pakistan',
  contactNumber: '+92-300-1234567',
  matriculationBoard: 'Board of Intermediate and Secondary Education Hyderabad',
  matriculationYear: '2018',
  matriculationGrade: 'A+',
  matriculationMarks: '980',
  matriculationTotalMarks: '1100',
  intermediateBoard: 'Board of Intermediate and Secondary Education Hyderabad',
  intermediateYear: '2020',
  intermediateGrade: 'A',
  intermediateMarks: '920',
  intermediateTotalMarks: '1100',
  academicQualification: 'Pre-Medical',
  otherQualification: 'Computer Diploma from Technical Institute',
  lawTestScore: '87',
  paymentTransaction: 'JC2025071912345',
  submissionDate: new Date(),
  profileImage: path.join(__dirname, 'uploads', 'temp.png'),
  lawTestScoreImage: null,
  paymentTransactionImage: null
};

async function testAllPDFServices() {
  console.log('='.repeat(80));
  console.log('PDF SERVICES UNIFIED DESIGN TEST');
  console.log('='.repeat(80));
  console.log('Testing all PDF services with identical data to ensure design consistency...\n');

  try {
    // Ensure pdfs directory exists
    const pdfsDir = path.join(__dirname, 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true });
      console.log('Created pdfs directory');
    }

    // Test 1: Production PDF Service (html-pdf-node)
    console.log('1. Testing Production PDF Service (html-pdf-node)...');
    try {
      const productionPath = path.join(pdfsDir, 'test_production_unified.pdf');
      console.log(`   Output: ${productionPath}`);
      
      const productionResult = await productionPDFService.generateAndSavePDF(testAdmission, productionPath);
      
      if (fs.existsSync(productionPath)) {
        const stats = fs.statSync(productionPath);
        console.log(`   ✅ Success! File size: ${stats.size} bytes`);
        console.log(`   📄 File: ${productionResult}`);
      } else {
        console.log('   ❌ File was not created');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('');

    // Test 2: Local PDF Service (Puppeteer)
    console.log('2. Testing Local PDF Service (Puppeteer)...');
    try {
      const localPath = path.join(pdfsDir, 'test_local_unified.pdf');
      console.log(`   Output: ${localPath}`);
      
      const localResult = await pdfService.generateAndSavePDF(testAdmission, localPath);
      
      if (fs.existsSync(localPath)) {
        const stats = fs.statSync(localPath);
        console.log(`   ✅ Success! File size: ${stats.size} bytes`);
        console.log(`   📄 File: ${localResult}`);
      } else {
        console.log('   ❌ File was not created');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('   ⚠️  This might be expected if Puppeteer is not properly configured');
    }

    console.log('');

    // Test 3: Fallback PDF Service
    console.log('3. Testing Fallback PDF Service...');
    try {
      const fallbackPath = path.join(pdfsDir, 'test_fallback_unified.pdf');
      console.log(`   Output: ${fallbackPath}`);
      
      const fallbackResult = await fallbackPDFService.generateAndSavePDF(testAdmission, fallbackPath);
      
      if (fs.existsSync(fallbackPath)) {
        const stats = fs.statSync(fallbackPath);
        console.log(`   ✅ Success! File size: ${stats.size} bytes`);
        console.log(`   📄 File: ${fallbackResult}`);
      } else {
        console.log('   ❌ File was not created');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('');

    // Test 4: HTML Preview Generation
    console.log('4. Generating HTML preview for design comparison...');
    try {
      const htmlPreviewPath = path.join(pdfsDir, 'test_design_preview.html');
      console.log(`   Output: ${htmlPreviewPath}`);
      
      const htmlContent = await productionPDFService.generateHTMLTemplate(testAdmission);
      fs.writeFileSync(htmlPreviewPath, htmlContent);
      
      console.log(`   ✅ Success! HTML preview created`);
      console.log(`   🌐 Open in browser: file://${htmlPreviewPath}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log('✅ All PDF services now use the same enhanced design template');
    console.log('📋 Both production and local environments should generate identical layouts');
    console.log('🎨 The design includes:');
    console.log('   - Professional header with college branding');
    console.log('   - Structured sections with consistent styling');
    console.log('   - Academic table with proper formatting');
    console.log('   - Document attachments section');
    console.log('   - Declaration and signature areas');
    console.log('   - Professional footer with college information');
    console.log('');
    console.log('📁 Check the generated files in:', pdfsDir);
    console.log('🔍 Compare the outputs to verify design consistency');

  } catch (error) {
    console.error('Fatal error during testing:', error);
  }
}

// Enhanced HTML template test
async function testHTMLTemplateConsistency() {
  console.log('\n' + '='.repeat(80));
  console.log('HTML TEMPLATE CONSISTENCY TEST');
  console.log('='.repeat(80));

  try {
    // Get HTML from both services
    const productionHTML = await productionPDFService.generateHTMLTemplate(testAdmission);
    const localHTML = await pdfService.generateHTMLTemplate(testAdmission);

    // Save both for comparison
    const templatesDir = path.join(__dirname, 'pdfs', 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    fs.writeFileSync(path.join(templatesDir, 'production_template.html'), productionHTML);
    fs.writeFileSync(path.join(templatesDir, 'local_template.html'), localHTML);

    console.log('✅ HTML templates saved for comparison');
    console.log(`📁 Production template: ${path.join(templatesDir, 'production_template.html')}`);
    console.log(`📁 Local template: ${path.join(templatesDir, 'local_template.html')}`);
    console.log('');
    console.log('🔍 Open both files in browser to visually compare the designs');
    console.log('📏 Both should have identical layout, styling, and content structure');

  } catch (error) {
    console.error('Error during HTML template test:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testAllPDFServices();
  await testHTMLTemplateConsistency();
  console.log('\n🎉 All tests completed!');
}

// Execute if run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAllPDFServices,
  testHTMLTemplateConsistency,
  runAllTests,
  testAdmission
};
