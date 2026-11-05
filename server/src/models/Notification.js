import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientRole: {
      type: String,
      enum: ['user', 'professional', 'admin'],
      default: 'user'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: [
        'VERIFICATION_SUBMITTED',
        'VERIFICATION_APPROVED',
        'VERIFICATION_REJECTED',
        'VERIFICATION_RESUBMITTED',
        'GENERAL'
      ],
      default: 'GENERAL'
    },
    data: {
      professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional' },
      rejectionReason: { type: String, default: '' },
      url: { type: String, default: '' }
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export const NotificationModel =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default NotificationModel;
