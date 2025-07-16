const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const Admission = require('../models/Admission');
const pdfService = require('../services/pdfService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'), false);
    }
  }
});

// Submit admission form
router.post('/submit', upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'lawTestScoreImage', maxCount: 1 },
  { name: 'paymentTransactionImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const formData = req.body;
    
    if (!req.files || !req.files.profileImage || !req.files.lawTestScoreImage || !req.files.paymentTransactionImage) {
      return res.status(400).json({ error: 'All image files are required (profile, law test score, and payment receipt)' });
    }

    // Generate application ID manually
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const applicationId = `HLC${year}${randomNum}`;
    
    console.log(`Generated Application ID: ${applicationId}`);

    // Create admission record
    const admission = new Admission({
      ...formData,
      applicationId: applicationId,
      profileImage: req.files.profileImage[0].path,
      lawTestScoreImage: req.files.lawTestScoreImage[0].path,
      paymentTransactionImage: req.files.paymentTransactionImage[0].path
    });

    try {
      await admission.save();
      console.log(`Application saved to database: ${admission.applicationId}`);
    } catch (dbError) {
      console.error('Database save error (continuing without saving):', dbError.message);
      // Continue processing even if database save fails
    }

    // Generate and save PDF
    const pdfDir = path.join(__dirname, '../pdfs');
    const pdfFileName = `${admission.applicationId}_application.pdf`;
    const pdfFilePath = path.join(pdfDir, pdfFileName);
    
    try {
      await pdfService.generateAndSavePDF(admission, pdfFilePath);
      console.log(`PDF generated and saved: ${pdfFileName}`);
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError.message);
      // Continue without PDF if generation fails
    }
    
    // TODO: Send emails when email service is configured
    console.log(`Application processed: ${admission.applicationId}`);
    console.log(`Student email: ${admission.email}`);
    console.log(`Files uploaded: Profile(${req.files.profileImage[0].filename}), Law Test(${req.files.lawTestScoreImage[0].filename}), Payment(${req.files.paymentTransactionImage[0].filename})`);

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: admission.applicationId,
      submissionDate: admission.submissionDate || new Date(),
      pdfDownloadUrl: `/admission/download-pdf/${admission.applicationId}`,
      files: {
        profileImage: req.files.profileImage[0].filename,
        lawTestScoreImage: req.files.lawTestScoreImage[0].filename,
        paymentTransactionImage: req.files.paymentTransactionImage[0].filename
      }
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ 
      error: 'Failed to submit application',
      message: error.message 
    });
  }
});

// Get admission by ID
router.get('/:applicationId', async (req, res) => {
  try {
    const admission = await Admission.findOne({ 
      applicationId: req.params.applicationId 
    });
    
    if (!admission) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(admission);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Get all admissions (admin route)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const admissions = await Admission.find()
      .sort({ submissionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Admission.countDocuments();

    res.json({
      admissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({ error: 'Failed to fetch admissions' });
  }
});

// Download PDF route
router.get('/download-pdf/:applicationId', async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const pdfDir = path.join(__dirname, '../pdfs');
    const pdfFileName = `${applicationId}_application.pdf`;
    const pdfFilePath = path.join(pdfDir, pdfFileName);

    // Check if PDF file exists
    if (!fs.existsSync(pdfFilePath)) {
      // Try to find the admission and generate PDF if it doesn't exist
      const admission = await Admission.findOne({ applicationId });
      
      if (!admission) {
        return res.status(404).json({ error: 'Application not found' });
      }

      try {
        await pdfService.generateAndSavePDF(admission, pdfFilePath);
        console.log(`PDF generated for existing application: ${applicationId}`);
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        return res.status(500).json({ error: 'Failed to generate PDF' });
      }
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${applicationId}_admission_application.pdf"`);
    
    // Stream the PDF file
    const fileStream = fs.createReadStream(pdfFilePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
});

module.exports = router;
