const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    // Common fields for all form types
    type: {
      type: String,
      enum: ['enquiry', 'contact', 'career_application', 'other'],
      default: 'enquiry',
    },

    // Sender details
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },

    // Message / content
    subject: { type: String, default: '' },
    message: { type: String, required: true },

    // Career application extras
    jobTitle: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },

    // Admin management
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    adminNote: { type: String, default: '' },

    // Source page on the website
    source: { type: String, default: 'website' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Response', responseSchema);
