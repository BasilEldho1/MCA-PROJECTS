import mongoose from 'mongoose';

const verificationHistorySchema = new mongoose.Schema(
  {
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'RESUBMITTED'],
      required: true
    },
    previousStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE'
    },
    newStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      required: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adminName: {
      type: String,
      default: 'System Admin'
    },
    reason: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const VerificationHistoryModel =
  mongoose.models.VerificationHistory || mongoose.model('VerificationHistory', verificationHistorySchema);
export default VerificationHistoryModel;
