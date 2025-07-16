const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  // Personal Information
  candidateName: {
    type: String,
    required: true,
    trim: true
  },
  surname: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  guardianName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  cnicNumber: {
    type: String,
    required: true,
    trim: true
  },
  domicileDistrict: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female']
  },
  postalAddress: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },

  // Academic Information - Matriculation
  matriculationBoard: {
    type: String,
    required: true,
    trim: true
  },
  matriculationYear: {
    type: Number,
    required: true,
    min: 1990,
    max: 2025
  },
  matriculationGrade: {
    type: String,
    required: true,
    trim: true
  },
  matriculationMarks: {
    type: String,
    required: true,
    trim: true
  },

  // Academic Information - Intermediate
  intermediateBoard: {
    type: String,
    required: true,
    trim: true
  },
  intermediateYear: {
    type: Number,
    required: true,
    min: 1990,
    max: 2025
  },
  intermediateGrade: {
    type: String,
    required: true,
    trim: true
  },
  intermediateMarks: {
    type: String,
    required: true,
    trim: true
  },

  // Academic Qualifications
  academicQualification: {
    type: String,
    required: true,
    enum: ['matriculation', 'intermediate', 'other']
  },
  otherQualification: {
    type: String,
    trim: true
  },

  // Additional Information
  lawTestScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  lawTestScoreImage: {
    type: String, // File path for test score certificate
    required: true
  },
  paymentTransaction: {
    type: String,
    required: true,
    trim: true
  },
  paymentTransactionImage: {
    type: String, // File path for payment receipt
    required: true
  },
  profileImage: {
    type: String, // File path
    required: true
  },

  // System fields
  applicationId: {
    type: String,
    unique: true,
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Generate application ID before saving
admissionSchema.pre('save', function(next) {
  if (!this.applicationId) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.applicationId = `HLC${year}${randomNum}`;
  }
  next();
});

// Virtual for full name
admissionSchema.virtual('fullName').get(function() {
  return `${this.candidateName} ${this.surname}`;
});

module.exports = mongoose.model('Admission', admissionSchema);
