import mongoose from 'mongoose';

const professionalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    username: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    companyName: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    specialization: {
      type: String,
      required: true,
      enum: ['Architect', 'Interior Designer', 'Builder', 'Structural Engineer', 'Landscape Designer']
    },
    experience: { type: String, default: '5+ years' },
    yearsOfExperience: { type: Number, default: 0 },
    description: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    portfolioWebsite: { type: String, default: '' },
    availability: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available'
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending', 'unverified'],
      default: 'pending'
    },
    verification: {
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
      },
      rejectionReason: { type: String, default: '' },
      submittedAt: { type: Date, default: Date.now },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    licenseDocument: {
      filename: { type: String, default: '' },
      originalName: { type: String, default: '' },
      path: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      size: { type: Number, default: 0 },
      uploadedAt: { type: Date, default: Date.now }
    },
    qualificationDocument: {
      filename: { type: String, default: '' },
      originalName: { type: String, default: '' },
      path: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      size: { type: Number, default: 0 },
      uploadedAt: { type: Date, default: Date.now }
    },
    rating: { type: Number, default: 4.9 },
    reviewsCount: { type: Number, default: 0 },
    hourlyRate: { type: String, default: '$95/hr' },
    chatPricing: [
      {
        durationMinutes: { type: Number, default: 30 },
        price: { type: Number, default: 199 },
        label: { type: String, default: '30 Minutes' }
      },
      {
        durationMinutes: { type: Number, default: 60 },
        price: { type: Number, default: 349 },
        label: { type: String, default: '60 Minutes' }
      }
    ],
    location: { type: String, default: '' },
    skills: [{ type: String }],
  },
  { timestamps: true }
);

export const ProfessionalModel = mongoose.models.Professional || mongoose.model('Professional', professionalSchema);
export default ProfessionalModel;
