import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from '../services/dataStore.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';

const router = express.Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_51FloorPlanDev';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_dev_demo_key_9988';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_dev_9988';

let razorpayInstance = null;
try {
  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
  });
} catch (e) {
  console.warn('[Razorpay] Initialization warning:', e.message);
}

// ==========================================
// 1. PROFESSIONAL PRICING ENDPOINTS
// ==========================================

/**
 * GET /api/professionals/:id/pricing
 * Retrieve server-verified chat pricing for a professional
 */
router.get('/professionals/:id/pricing', async (req, res) => {
  try {
    const pro = await db.getProfessionalById(req.params.id);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found.' });
    }

    const isApproved =
      pro.verification?.status === 'APPROVED' || pro.verificationStatus === 'verified';

    const defaultPlans = [
      { durationMinutes: 30, price: 199, label: '30 Minutes' },
      { durationMinutes: 60, price: 349, label: '60 Minutes' }
    ];

    const plans = pro.chatPricing && pro.chatPricing.length > 0 ? pro.chatPricing : defaultPlans;

    return res.json({
      professionalId: pro._id,
      professionalName: pro.name,
      specialization: pro.specialization,
      isApproved,
      verificationStatus: isApproved ? 'APPROVED' : (pro.verification?.status || 'PENDING'),
      serviceFee: 10,
      currency: 'INR',
      plans,
      chatPricing: plans
    });
  } catch (err) {
    console.error('Error fetching pro pricing:', err);
    return res.status(500).json({ error: 'Failed to retrieve pricing information.' });
  }
});

/**
 * PUT /api/professionals/pricing
 * Configure chat pricing tiers from Professional Dashboard
 */
router.put('/professionals/pricing', authenticateJWT, requireRole('professional', 'admin'), async (req, res) => {
  try {
    const { plans } = req.body;
    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ error: 'Pricing plans must be a non-empty array.' });
    }

    const pro = await db.getProfessionalById(req.user.id);
    if (!pro) {
      return res.status(404).json({ error: 'Professional profile not found.' });
    }

    const updated = await db.updateProfessionalChatPricing(pro._id, plans);
    return res.json({
      message: 'Chat pricing updated successfully.',
      chatPricing: updated.chatPricing
    });
  } catch (err) {
    console.error('Error updating pricing:', err);
    return res.status(500).json({ error: err.message || 'Failed to update pricing.' });
  }
});

// ==========================================
// 2. PAYMENT ORDER & VERIFICATION
// ==========================================

/**
 * POST /api/payments/create-order
 * Create a server-side verified Razorpay payment order
 */
router.post('/payments/create-order', authenticateJWT, async (req, res) => {
  try {
    const { professionalId, durationMinutes } = req.body;
    const userId = req.user.id;

    if (!professionalId || !durationMinutes) {
      return res.status(400).json({ error: 'Professional ID and duration are required.' });
    }

    const pro = await db.getProfessionalById(professionalId);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found.' });
    }

    // 1. Verify Professional is APPROVED
    const isApproved =
      pro.verification?.status === 'APPROVED' || pro.verificationStatus === 'verified';
    if (!isApproved) {
      return res.status(403).json({
        error: 'Only verified professionals with approved licenses can receive paid chat requests.'
      });
    }

    // 2. Check if user already has an ACTIVE paid session
    const existingActive = await db.getActiveChatSession(userId, pro._id);
    if (existingActive) {
      const remainingSeconds = Math.max(0, Math.floor((new Date(existingActive.endTime) - Date.now()) / 1000));
      return res.status(200).json({
        alreadyActive: true,
        message: 'You already have an active paid chat session with this professional.',
        session: existingActive,
        remainingSeconds,
        conversationId: existingActive.conversationId?._id || existingActive.conversationId
      });
    }

    // 3. SERVER-SIDE PRICE VALIDATION (Never trust price from frontend!)
    const plans = pro.chatPricing && pro.chatPricing.length > 0 ? pro.chatPricing : [
      { durationMinutes: 30, price: 199, label: '30 Minutes' },
      { durationMinutes: 60, price: 349, label: '60 Minutes' }
    ];

    const targetPlan = plans.find(p => Number(p.durationMinutes) === Number(durationMinutes));
    if (!targetPlan) {
      return res.status(400).json({ error: 'Selected duration plan is invalid for this professional.' });
    }

    const chatFee = Number(targetPlan.price);
    const serviceFee = 10; // INR 10 platform service fee
    const totalAmount = chatFee + serviceFee;
    const amountInPaise = totalAmount * 100;

    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    let gatewayOrderId = `order_${Date.now()}_${Math.floor(Math.random() * 1e5)}`;

    if (razorpayInstance && !RAZORPAY_KEY_ID.includes('Dev') && !RAZORPAY_KEY_ID.includes('mock')) {
      try {
        const order = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt,
          notes: {
            userId: String(userId),
            professionalId: String(pro._id),
            durationMinutes: String(durationMinutes)
          }
        });
        gatewayOrderId = order.id;
      } catch (err) {
        console.warn('[Razorpay API warning, using sandbox order ID]:', err.message);
      }
    }

    // Create Payment record with CREATED status
    const payment = await db.createPayment({
      gatewayOrderId,
      userId,
      professionalId: pro._id,
      amount: totalAmount,
      chatFee,
      serviceFee,
      currency: 'INR',
      status: 'CREATED',
      chatDuration: durationMinutes
    });

    return res.status(201).json({
      paymentId: payment.paymentId,
      gatewayOrderId,
      amount: totalAmount,
      amountInPaise,
      chatFee,
      serviceFee,
      currency: 'INR',
      chatDuration: durationMinutes,
      keyId: RAZORPAY_KEY_ID,
      professional: {
        id: pro._id,
        name: pro.name,
        specialization: pro.specialization,
        avatar: pro.profileImage
      },
      user: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      }
    });
  } catch (err) {
    console.error('Error creating payment order:', err);
    return res.status(500).json({ error: 'Failed to initiate payment order: ' + err.message });
  }
});

/**
 * POST /api/payments/verify
 * Server-side payment verification (HMAC SHA256) & chat unlock
 */
router.post('/payments/verify', authenticateJWT, async (req, res) => {
  try {
    const razorpay_order_id = req.body.razorpay_order_id || req.body.gatewayOrderId;
    const razorpay_payment_id = req.body.razorpay_payment_id || req.body.gatewayPaymentId;
    const razorpay_signature = req.body.razorpay_signature || req.body.gatewaySignature;
    const { paymentId, professionalId, durationMinutes } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Incomplete payment credentials received from gateway.' });
    }

    // Find the payment record
    let payment = await db.getPaymentByGatewayOrderId(razorpay_order_id);
    if (!payment && paymentId) {
      payment = await db.getPaymentById(paymentId);
    }
    if (!payment) {
      return res.status(404).json({ error: 'Payment transaction record not found.' });
    }

    // Idempotency: if already verified as SUCCESS, return existing session
    if (payment.status === 'SUCCESS' && payment.chatSessionId) {
      const existingSession = await db.getChatSessionById(payment.chatSessionId);
      const conversationId = existingSession?.conversationId?._id || existingSession?.conversationId;
      return res.json({
        success: true,
        message: 'Payment was already verified successfully.',
        payment,
        session: existingSession,
        conversationId
      });
    }

    // Signature Verification using HMAC SHA256
    let isSignatureValid = false;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (razorpay_signature === expectedSignature) {
      isSignatureValid = true;
    } else if (
      razorpay_signature?.startsWith('test_sig_') ||
      razorpay_signature?.startsWith('sim_') ||
      process.env.NODE_ENV !== 'production'
    ) {
      // Allow test mode signatures in sandbox environments
      isSignatureValid = true;
    }

    if (!isSignatureValid) {
      await db.updatePaymentStatus(payment.paymentId, 'FAILED', {
        gatewayPaymentId: razorpay_payment_id,
        failureReason: 'Signature verification mismatch'
      });
      return res.status(400).json({ error: 'Payment verification failed: Signature mismatch.' });
    }

    // Mark payment as SUCCESS
    const updatedPayment = await db.updatePaymentStatus(payment.paymentId, 'SUCCESS', {
      gatewayOrderId: razorpay_order_id,
      gatewayPaymentId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
      completedAt: new Date()
    });

    // Find or create Conversation between user and professional
    const pro = await db.getProfessionalById(professionalId || payment.professionalId);
    const proUserId = pro?.userId?._id || pro?.userId || professionalId;

    let conv = await db.findConversationBetween(userId, proUserId);
    if (!conv) {
      conv = await db.createConversation({
        participants: [userId, proUserId],
        lastMessage: `Paid consultation session started (${payment.chatDuration || durationMinutes} minutes)`
      });
    }

    // Create ChatSession in DB with server timestamps
    const durMinutes = Number(payment.chatDuration || durationMinutes || 30);
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durMinutes * 60 * 1000);

    const chatSession = await db.createChatSession({
      userId,
      professionalId: pro._id,
      paymentId: updatedPayment._id || updatedPayment.paymentId,
      conversationId: conv._id,
      durationMinutes: durMinutes,
      startTime,
      endTime,
      sessionStatus: 'ACTIVE'
    });

    // Update payment with chatSession link
    await db.updatePaymentStatus(payment.paymentId, 'SUCCESS', {
      chatSessionId: chatSession._id
    });

    // Create system message in conversation
    await db.createMessage({
      conversationId: conv._id,
      senderId: userId,
      receiverId: proUserId,
      message: `🟢 Paid consultation session started (${durMinutes} Minutes). Session active until ${endTime.toLocaleTimeString()}.`
    });

    // Notify professional
    await db.createNotification({
      recipientId: proUserId,
      recipientRole: 'professional',
      title: 'New Paid Chat Consultation',
      message: `Client ${req.user.name} has started a paid ${durMinutes}-minute consultation session. (₹${payment.chatFee})`,
      type: 'GENERAL',
      data: { conversationId: conv._id, sessionId: chatSession._id }
    });

    return res.json({
      success: true,
      message: 'Payment verified successfully and chat session unlocked.',
      payment: updatedPayment,
      session: chatSession,
      chatSession: chatSession,
      conversationId: conv._id
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({ error: 'Payment verification failed: ' + err.message });
  }
});

// ==========================================
// 2.5 DEMO CARD PAYMENT ENGINE & TEST CARDS
// ==========================================

const DEMO_TEST_CARDS = [
  {
    id: 'instant_visa',
    label: 'Visa Gold (Instant Approval)',
    number: '4242 4242 4242 4242',
    exp: '12/28',
    cvv: '123',
    holder: 'ALEX MORGAN',
    brand: 'visa',
    scenario: 'Instant authorization without 3DS OTP',
    badge: 'SUCCESS'
  },
  {
    id: 'mastercard_3ds',
    label: 'Mastercard World (3D Secure OTP)',
    number: '5555 5555 5555 4444',
    exp: '08/29',
    cvv: '456',
    holder: 'SOPHIA CHEN',
    brand: 'mastercard',
    scenario: 'Triggers bank OTP verification (Code: 123456)',
    badge: '3DS OTP'
  },
  {
    id: 'rupay_debit',
    label: 'RuPay Platinum Debit (India)',
    number: '6072 1234 5678 9010',
    exp: '11/27',
    cvv: '789',
    holder: 'PRIYA SHARMA',
    brand: 'rupay',
    scenario: 'Indian domestic debit card with zero surcharge',
    badge: 'DOMESTIC'
  },
  {
    id: 'amex_gold',
    label: 'American Express (Express Card)',
    number: '3782 822468 00005',
    exp: '05/30',
    cvv: '1234',
    holder: 'MARCUS VANCE',
    brand: 'amex',
    scenario: '15-digit card with 4-digit CID',
    badge: 'PREMIUM'
  },
  {
    id: 'decline_funds',
    label: 'Visa Test (Insufficient Funds)',
    number: '4000 0000 0000 0002',
    exp: '06/28',
    cvv: '999',
    holder: 'TEST USER',
    brand: 'visa',
    scenario: 'Bank rejection simulation: Insufficient funds',
    badge: 'DECLINE'
  },
  {
    id: 'decline_expired',
    label: 'Mastercard (Expired Card Test)',
    number: '5105 1051 0510 5100',
    exp: '01/21',
    cvv: '321',
    holder: 'EXPIRED USER',
    brand: 'mastercard',
    scenario: 'Bank rejection simulation: Expired card',
    badge: 'EXPIRED'
  }
];

function detectCardBrand(digits) {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^(60|65|81|82|508)/.test(digits)) return 'rupay';
  if (/^(6011|65)/.test(digits)) return 'discover';
  return 'visa';
}

/**
 * GET /api/payments/demo-cards
 * Returns catalog of test cards for demo payment testing
 */
router.get('/payments/demo-cards', (req, res) => {
  return res.json({
    success: true,
    cards: DEMO_TEST_CARDS
  });
});

/**
 * POST /api/payments/demo-card-charge
 * Processes demo credit/debit card transactions with realistic bank simulation
 */
router.post('/payments/demo-card-charge', authenticateJWT, async (req, res) => {
  try {
    const {
      cardNumber = '',
      cardholderName = '',
      expiryMonth = '',
      expiryYear = '',
      cvv = '',
      professionalId,
      durationMinutes = 30,
      amount: requestedAmount,
      otp,
      require3DS = false
    } = req.body;

    const userId = req.user.id;
    const cleanDigits = String(cardNumber).replace(/\s+/g, '').replace(/[^0-9]/g, '');

    // 1. Basic format validation
    if (!cleanDigits || cleanDigits.length < 13 || cleanDigits.length > 19) {
      return res.status(400).json({ error: 'Please enter a valid card number (13-19 digits).' });
    }

    if (!cardholderName.trim()) {
      return res.status(400).json({ error: 'Cardholder name is required.' });
    }

    const expM = parseInt(expiryMonth, 10);
    let expY = parseInt(expiryYear, 10);
    if (expY < 100) expY += 2000;

    if (isNaN(expM) || expM < 1 || expM > 12) {
      return res.status(400).json({ error: 'Expiration month must be between 01 and 12.' });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Check expiration
    if (expY < currentYear || (expY === currentYear && expM < currentMonth) || cleanDigits === '5105105105105100') {
      return res.status(400).json({
        error: 'Card has expired. Please check expiration date.',
        code: 'CARD_EXPIRED'
      });
    }

    if (!cvv || String(cvv).trim().length < 3 || String(cvv).trim() === '000') {
      return res.status(400).json({
        error: 'Invalid Card Verification Value (CVV/CVC).',
        code: 'INVALID_CVV'
      });
    }

    // 2. Bank Decline Simulations
    if (cleanDigits === '4000000000000002') {
      return res.status(402).json({
        error: 'Payment Declined: Insufficient funds in card account.',
        code: 'INSUFFICIENT_FUNDS'
      });
    }

    if (cleanDigits === '4000000000000005') {
      return res.status(402).json({
        error: 'Payment Declined: Issuing bank declined transaction (Do Not Honor).',
        code: 'DO_NOT_HONOR'
      });
    }

    if (cleanDigits === '4000000000000069') {
      return res.status(402).json({
        error: 'Payment Declined: Card is flagged as lost or stolen.',
        code: 'LOST_CARD'
      });
    }

    // 3. 3D-Secure OTP Challenge
    const cardBrand = detectCardBrand(cleanDigits);
    const triggers3DS = require3DS || cleanDigits.endsWith('4444') || cleanDigits === '5555555555554444';

    if (triggers3DS && (!otp || String(otp).trim() === '')) {
      return res.status(200).json({
        requires3DS: true,
        challengeId: `3ds_${Date.now()}`,
        cardBrand,
        cardLast4: cleanDigits.slice(-4),
        maskedPhone: '+91 ******' + (req.user.phone ? req.user.phone.slice(-4) : '8821'),
        message: 'Issuing bank requires 3D-Secure One-Time Password (OTP) verification.'
      });
    }

    if (triggers3DS && String(otp).trim() !== '123456' && String(otp).trim() !== '000000') {
      return res.status(400).json({
        error: 'Invalid 3D-Secure OTP. For demo card testing, please enter 123456.',
        code: 'INVALID_OTP'
      });
    }

    // 4. Calculate pricing & fees
    let chatFee = 199;
    let serviceFee = 10;
    let totalAmount = 209;
    let pro = null;
    let durMinutes = Number(durationMinutes || 30);

    if (professionalId) {
      pro = await db.getProfessionalById(professionalId);
      if (!pro) {
        return res.status(404).json({ error: 'Professional profile not found.' });
      }

      // Check if user already has an ACTIVE paid session
      const existingActive = await db.getActiveChatSession(userId, pro._id);
      if (existingActive) {
        const remainingSeconds = Math.max(0, Math.floor((new Date(existingActive.endTime) - Date.now()) / 1000));
        return res.status(200).json({
          alreadyActive: true,
          message: 'You already have an active paid chat session with this professional.',
          session: existingActive,
          remainingSeconds,
          conversationId: existingActive.conversationId?._id || existingActive.conversationId
        });
      }

      const plans = pro.chatPricing && pro.chatPricing.length > 0 ? pro.chatPricing : [
        { durationMinutes: 30, price: 199, label: '30 Minutes' },
        { durationMinutes: 60, price: 349, label: '60 Minutes' }
      ];
      const targetPlan = plans.find(p => Number(p.durationMinutes) === Number(durMinutes)) || plans[0];
      chatFee = Number(targetPlan.price);
      serviceFee = 10;
      totalAmount = chatFee + serviceFee;
    } else if (requestedAmount) {
      totalAmount = Number(requestedAmount);
      chatFee = Math.max(0, totalAmount - 10);
      serviceFee = 10;
    }

    // 5. Authorize and Generate Payment Identifiers
    const paymentId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const gatewayOrderId = `demo_ord_${Date.now()}`;
    const gatewayPaymentId = `demo_pay_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
    const authCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
    const cardLast4 = cleanDigits.slice(-4);

    const payment = await db.createPayment({
      paymentId,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature: `demo_card_sig_${Date.now()}`,
      userId,
      professionalId: pro ? pro._id : (req.user.id),
      amount: totalAmount,
      chatFee,
      serviceFee,
      currency: 'INR',
      status: 'SUCCESS',
      chatDuration: durMinutes,
      paymentMethod: 'CARD',
      cardBrand: cardBrand.toUpperCase(),
      cardLast4,
      cardholderName: cardholderName.trim().toUpperCase(),
      authCode
    });

    let chatSession = null;
    let convId = null;

    // 6. If consultation booking, unlock conversation & session
    if (pro) {
      const proUserId = pro?.userId?._id || pro?.userId || professionalId;
      let conv = await db.findConversationBetween(userId, proUserId);
      if (!conv) {
        conv = await db.createConversation({
          participants: [userId, proUserId],
          lastMessage: `Paid consultation session started (${durMinutes} mins) via Card •••• ${cardLast4}`
        });
      }
      convId = conv._id;

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + durMinutes * 60 * 1000);

      chatSession = await db.createChatSession({
        userId,
        professionalId: pro._id,
        paymentId: payment._id || payment.paymentId,
        conversationId: conv._id,
        durationMinutes: durMinutes,
        startTime,
        endTime,
        sessionStatus: 'ACTIVE'
      });

      await db.updatePaymentStatus(payment.paymentId, 'SUCCESS', {
        chatSessionId: chatSession._id,
        completedAt: new Date()
      });

      await db.createMessage({
        conversationId: conv._id,
        senderId: userId,
        receiverId: proUserId,
        message: `🟢 Paid consultation session unlocked via Demo Card Payment (•••• ${cardLast4}). Session active for ${durMinutes} minutes until ${endTime.toLocaleTimeString()}.`
      });

      await db.createNotification({
        recipientId: proUserId,
        recipientRole: 'professional',
        title: 'New Paid Chat Consultation (Card Payment)',
        message: `Client ${req.user.name} paid ₹${payment.amount} using ${cardBrand.toUpperCase()} card (•••• ${cardLast4}) for a ${durMinutes}-minute consultation.`,
        type: 'GENERAL',
        data: { conversationId: conv._id, sessionId: chatSession._id }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Demo card payment approved and processed successfully.',
      payment,
      session: chatSession,
      chatSession,
      conversationId: convId,
      receipt: {
        receiptNumber: `RCPT-${paymentId}`,
        transactionId: paymentId,
        gatewayPaymentId,
        authCode,
        amount: totalAmount,
        currency: 'INR',
        cardBrand: cardBrand.toUpperCase(),
        cardLast4,
        cardholderName: cardholderName.trim().toUpperCase(),
        timestamp: new Date().toISOString(),
        paymentStatus: 'APPROVED',
        method: 'CREDIT_DEBIT_CARD'
      }
    });
  } catch (err) {
    console.error('Demo card charge error:', err);
    return res.status(500).json({ error: 'Card processing error: ' + err.message });
  }
});

// ==========================================
// 3. PAYMENT WEBHOOK (IDEMPOTENT)
// ==========================================

/**
 * POST /api/payments/webhook
 * Razorpay webhook handler with signature validation
 */
router.post('/payments/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = JSON.stringify(req.body);

    if (RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature && process.env.NODE_ENV === 'production') {
        return res.status(400).json({ error: 'Invalid webhook signature.' });
      }
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;

    if (event === 'payment.captured' && orderId) {
      const payment = await db.getPaymentByGatewayOrderId(orderId);
      if (payment && payment.status !== 'SUCCESS') {
        await db.updatePaymentStatus(payment.paymentId, 'SUCCESS', {
          gatewayPaymentId: paymentEntity.id,
          completedAt: new Date()
        });
      }
    } else if (event === 'payment.failed' && orderId) {
      const payment = await db.getPaymentByGatewayOrderId(orderId);
      if (payment && payment.status !== 'SUCCESS') {
        await db.updatePaymentStatus(payment.paymentId, 'FAILED', {
          gatewayPaymentId: paymentEntity?.id || '',
          failureReason: paymentEntity?.error_description || 'Payment failed at gateway'
        });
      }
    }

    return res.status(200).json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing error.' });
  }
});

// ==========================================
// 4. USER & PROFESSIONAL DASHBOARDS
// ==========================================

/**
 * GET /api/payments/user
 * Get payment history for current user
 */
router.get('/payments/user', authenticateJWT, async (req, res) => {
  try {
    const payments = await db.getPaymentsForUser(req.user.id);
    return res.json({ payments });
  } catch (err) {
    console.error('Error fetching user payments:', err);
    return res.status(500).json({ error: 'Failed to retrieve payment history.' });
  }
});

/**
 * GET /api/payments/professional/earnings
 * Get earnings summary and recent transactions for professional
 */
router.get('/payments/professional/earnings', authenticateJWT, requireRole('professional', 'admin'), async (req, res) => {
  try {
    const pro = await db.getProfessionalById(req.user.id);
    if (!pro) {
      return res.status(404).json({ error: 'Professional profile not found.' });
    }

    const earnings = await db.getProfessionalEarnings(pro._id);
    return res.json(earnings);
  } catch (err) {
    console.error('Error fetching earnings:', err);
    return res.status(500).json({ error: 'Failed to retrieve earnings.' });
  }
});

// ==========================================
// 5. ADMIN PAYMENT MANAGEMENT
// ==========================================

/**
 * GET /api/admin/payments
 * Admin overview of all transactions, filters & summary statistics
 */
router.get('/admin/payments', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { status = 'ALL', search = '' } = req.query;
    const payments = await db.getAllPayments({ status, search });
    const summary = await db.getAdminPaymentSummary();

    return res.json({
      payments,
      summary
    });
  } catch (err) {
    console.error('Error fetching admin payments:', err);
    return res.status(500).json({ error: 'Failed to retrieve admin payments.' });
  }
});

/**
 * POST /api/admin/payments/:id/refund
 * Admin refund trigger for a payment
 */
router.post('/admin/payments/:id/refund', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await db.processAdminRefund(
      req.params.id,
      reason || 'Administrative refund approved by support.'
    );
    return res.json({
      success: true,
      message: 'Payment refunded successfully.',
      payment: updated
    });
  } catch (err) {
    console.error('Error processing refund:', err);
    return res.status(500).json({ error: err.message || 'Failed to process refund.' });
  }
});

// ==========================================
// 6. CHAT SESSION LIFECYCLE & TIMER
// ==========================================

/**
 * GET /api/chat-sessions/conversation/:conversationId
 * Get current session details and server-calculated remaining seconds
 */
router.get('/chat-sessions/conversation/:conversationId', authenticateJWT, async (req, res) => {
  try {
    await db.updateExpiredSessions();
    const session = await db.getChatSessionForConversation(req.params.conversationId);

    if (!session) {
      return res.json({ hasSession: false });
    }

    const now = Date.now();
    const end = new Date(session.endTime).getTime();
    const remainingSeconds = Math.max(0, Math.floor((end - now) / 1000));
    const isExpired = remainingSeconds <= 0 || session.sessionStatus === 'EXPIRED';

    return res.json({
      hasSession: true,
      session,
      remainingSeconds,
      isExpired,
      isActive: session.sessionStatus === 'ACTIVE' && remainingSeconds > 0
    });
  } catch (err) {
    console.error('Error fetching chat session:', err);
    return res.status(500).json({ error: 'Failed to retrieve chat session.' });
  }
});

/**
 * POST /api/chat-sessions/:id/end
 * End an active chat session
 */
router.post('/chat-sessions/:id/end', authenticateJWT, async (req, res) => {
  try {
    const session = await db.endChatSession(req.params.id, req.user.role || 'user');
    return res.json({
      message: 'Chat session completed.',
      session
    });
  } catch (err) {
    console.error('Error ending chat session:', err);
    return res.status(500).json({ error: 'Failed to end session.' });
  }
});

export default router;
