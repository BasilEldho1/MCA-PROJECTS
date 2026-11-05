import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    gatewayOrderId: {
      type: String,
      default: '',
      index: true
    },
    gatewayPaymentId: {
      type: String,
      default: '',
      index: true
    },
    gatewaySignature: {
      type: String,
      default: ''
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
      index: true
    },
    chatSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession'
    },
    amount: {
      type: Number,
      required: true
    },
    chatFee: {
      type: Number,
      required: true
    },
    serviceFee: {
      type: Number,
      default: 10
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'],
      default: 'CREATED',
      index: true
    },
    chatDuration: {
      type: Number,
      required: true // in minutes, e.g. 30, 60
    },
    failureReason: {
      type: String,
      default: ''
    },
    paymentMethod: {
      type: String,
      enum: ['CARD', 'RAZORPAY', 'UPI', 'WALLET', 'SIMULATION'],
      default: 'CARD'
    },
    cardBrand: {
      type: String,
      default: ''
    },
    cardLast4: {
      type: String,
      default: ''
    },
    cardholderName: {
      type: String,
      default: ''
    },
    authCode: {
      type: String,
      default: ''
    },
    refundDetails: {
      refundId: { type: String, default: '' },
      amount: { type: Number, default: 0 },
      reason: { type: String, default: '' },
      refundedAt: { type: Date }
    },
    completedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default PaymentModel;
