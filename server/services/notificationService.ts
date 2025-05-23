import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import config from '../config';
import * as schema from '@shared/schema';
import { storage } from '../storage';

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Initialize Firebase Admin SDK with environment variables
if (admin.apps.length === 0 && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.warn('Firebase Admin SDK initialization failed:', error);
  }
}

/**
 * Notification service for sending various types of notifications
 */
export class NotificationService {
  /**
   * Send a push notification via Firebase Cloud Messaging
   */
  async sendPushNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<boolean> {
    try {
      if (admin.apps.length === 0) {
        console.warn('Firebase Admin SDK not initialized, skipping push notification');
        return false;
      }

      // Get FCM tokens for the specified users
      const tokens: string[] = [];
      for (const userId of userIds) {
        const userTokens = await storage.getUserDeviceTokens(userId);
        const fcmTokens = userTokens
          .filter(token => token.token_type === 'fcm')
          .map(token => token.device_token);
        tokens.push(...fcmTokens);
      }

      if (tokens.length === 0) {
        console.log('No FCM tokens found for users:', userIds);
        return true; // Not an error, just no tokens to send to
      }

      // Prepare the message
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body
        },
        data: data || {},
        tokens: tokens
      };

      // Send the notification
      const response = await admin.messaging().sendEachForMulticast(message);
      
      console.log(`Push notification sent: ${response.successCount}/${tokens.length} successful`);
      
      // Log any failures
      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
          }
        });
      }

      return response.successCount > 0;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }
  /**
   * Sends a magic link for authentication
   */
  async sendMagicLink(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.APP_URL || 'http://localhost:5000'}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error sending magic link:', error);
        return false;
      }

      // In a real implementation, this might involve customizing the email template
      // or sending through a different service
      console.log('Magic link sent to:', email);
      return true;
    } catch (error) {
      console.error('Failed to send magic link:', error);
      return false;
    }
  }

  /**
   * Sends a transaction invitation to a party
   */
  async sendTransactionInvitation(
    email: string,
    name: string,
    role: string,
    transactionTitle: string,
    propertyAddress: string,
    negotiatorName: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      // Generate magic link for this user with transaction ID
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.APP_URL || 'http://localhost:5000'}/auth/callback?transaction_id=${transactionId}`,
        },
      });

      if (error) {
        console.error('Error generating magic link for invitation:', error);
        return false;
      }

      // Prepare email content
      const subject = `You've been invited to a transaction: ${transactionTitle}`;
      const content = `
        Hello ${name},
        
        ${negotiatorName} has invited you to join a real estate transaction for ${propertyAddress} as the ${role}.
        
        Click the link below to access the transaction:
        ${data.properties.action_link}
        
        This link will expire in 24 hours.
        
        Thank you,
        ReAlign Team
      `;

      // In a real implementation, this would use a proper email service
      console.log(`Transaction invitation email to ${email}:\n${content}`);
      return true;
    } catch (error) {
      console.error('Failed to send transaction invitation:', error);
      return false;
    }
  }

  /**
   * Sends a document request notification
   */
  async sendDocumentRequest(
    userId: string,
    documentType: string,
    transactionTitle: string,
    transactionId: string,
    negotiatorName: string,
    dueDate?: string
  ): Promise<boolean> {
    try {
      // Get user details
      const user = await supabase
        .from('users')
        .select('email, name, role')
        .eq('id', userId)
        .single();

      if (!user.data) {
        console.error('User not found for document request notification');
        return false;
      }

      // Generate magic link for this user with transaction ID
      const { data: magicLink, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.data.email,
        options: {
          redirectTo: `${process.env.APP_URL || 'http://localhost:5000'}/auth/callback?transaction_id=${transactionId}`,
        },
      });

      if (magicLinkError) {
        console.error('Error generating magic link for document request:', magicLinkError);
        return false;
      }

      // Prepare email content
      const subject = `Document Request: ${documentType} for ${transactionTitle}`;
      const dueDateText = dueDate ? `Please upload this document by ${dueDate}.` : '';
      const content = `
        Hello ${user.data.name},
        
        ${negotiatorName} has requested you to upload the following document:
        
        Document: ${documentType}
        Transaction: ${transactionTitle}
        ${dueDateText}
        
        Click the link below to access the transaction and upload this document:
        ${magicLink.properties.action_link}
        
        This link will expire in 24 hours.
        
        Thank you,
        ReAlign Team
      `;

      // In a real implementation, this would use a proper email service
      console.log(`Document request email to ${user.data.email}:\n${content}`);
      
      // Send push notification as well
      await this.sendPushNotification(
        [userId],
        `Document Request: ${documentType}`,
        `${negotiatorName} has requested you to upload: ${documentType}`,
        {
          type: 'document_request',
          transactionId: transactionId,
          documentType: documentType
        }
      );
      
      // Check SMS opt-in and send SMS if enabled
      const user = await storage.getUserById(userId);
      if (user && user.phone && user.sms_opt_in) {
        // SMS notification would be implemented here with a service like Twilio
        console.log(`SMS notification would be sent to ${user.phone}: Document request for ${documentType}`);
      }
      return true;
    } catch (error) {
      console.error('Failed to send document request notification:', error);
      return false;
    }
  }

  /**
   * Sends a document request reminder
   */
  async sendDocumentRequestReminder(
    documentRequestId: string
  ): Promise<boolean> {
    try {
      // Get document request details with related information
      const { data: request, error } = await supabase
        .from('document_requests')
        .select(`
          id,
          doc_type,
          assigned_to_user_id,
          due_date,
          transactions!inner(
            id,
            title,
            created_by
          )
        `)
        .eq('id', documentRequestId)
        .single();

      if (error || !request) {
        console.error('Document request not found for reminder:', error);
        return false;
      }

      // Get assigned user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, name, phone')
        .eq('id', request.assigned_to_user_id)
        .single();

      if (userError || !user) {
        console.error('User not found for document request reminder:', userError);
        return false;
      }

      // Get negotiator details
      const { data: negotiator, error: negotiatorError } = await supabase
        .from('users')
        .select('name')
        .eq('id', request.transactions.created_by)
        .single();

      if (negotiatorError || !negotiator) {
        console.error('Negotiator not found for document request reminder:', negotiatorError);
        return false;
      }

      // Generate magic link for this user with transaction ID
      const { data: magicLink, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email,
        options: {
          redirectTo: `${process.env.APP_URL || 'http://localhost:5000'}/auth/callback?transaction_id=${request.transactions.id}`,
        },
      });

      if (magicLinkError) {
        console.error('Error generating magic link for document request reminder:', magicLinkError);
        return false;
      }
      
      // Prepare email content
      const subject = `REMINDER: ${request.doc_type} still needed for ${request.transactions.title}`;
      const content = `
        Hello ${user.name},
        
        This is a reminder that your document "${request.doc_type}" is still needed for the transaction "${request.transactions.title}".
        
        ${request.due_date ? `The due date is ${request.due_date}.` : ''}
        
        Click the link below to access the transaction and upload this document:
        ${magicLink.properties.action_link}
        
        This link will expire in 24 hours.
        
        Thank you,
        ReAlign Team
      `;

      // In a real implementation, this would use a proper email service
      console.log(`Document reminder email to ${user.email}:\n${content}`);
      
      // If the user has provided a phone number and opted in for SMS,
      // also send an SMS reminder (not implemented in MVP)
      
      return true;
    } catch (error) {
      console.error('Failed to send document request reminder:', error);
      return false;
    }
  }

  /**
   * Sends a message notification
   */
  async sendMessageNotification(
    messageId: string
  ): Promise<boolean> {
    try {
      // Get message details with related information
      const { data: message, error } = await supabase
        .from('messages')
        .select(`
          id,
          text,
          sender_id,
          transaction_id,
          reply_to,
          transactions!inner(
            id,
            title
          )
        `)
        .eq('id', messageId)
        .single();

      if (error || !message) {
        console.error('Message not found for notification:', error);
        return false;
      }

      // Get sender details
      const { data: sender, error: senderError } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', message.sender_id)
        .single();

      if (senderError || !sender) {
        console.error('Sender not found for message notification:', senderError);
        return false;
      }

      // Get participants to notify (excluding sender)
      const { data: participants, error: participantsError } = await supabase
        .from('transaction_participants')
        .select('user_id, users!inner(email, name)')
        .eq('transaction_id', message.transaction_id)
        .neq('user_id', message.sender_id);

      if (participantsError) {
        console.error('Error getting participants for message notification:', participantsError);
        return false;
      }

      // Prepare email content
      const subject = `New Message in ${message.transactions.title}`;
      const textPreview = message.text.length > 100 
        ? `${message.text.substring(0, 97)}...` 
        : message.text;
      
      for (const participant of participants) {
        // Generate magic link for each participant with transaction ID
        const { data: magicLink, error: magicLinkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: participant.users.email,
          options: {
            redirectTo: `${process.env.APP_URL || 'http://localhost:5000'}/auth/callback?transaction_id=${message.transaction_id}`,
          },
        });

        if (magicLinkError) {
          console.error('Error generating magic link for message notification:', magicLinkError);
          continue; // Skip this participant but continue with others
        }
        
        const content = `
          Hello ${participant.users.name},
          
          ${sender.name} (${sender.role}) has posted a new message in the transaction "${message.transactions.title}":
          
          "${textPreview}"
          
          Click the link below to view the full message and reply:
          ${magicLink.properties.action_link}
          
          This link will expire in 24 hours.
          
          Thank you,
          ReAlign Team
        `;

        // In a real implementation, this would use a proper email service
        console.log(`Message notification email to ${participant.users.email}:\n${content}`);
      }
      
      // Send push notifications to all participants
      const participantIds = participants.map(p => p.user_id);
      await this.sendPushNotification(
        participantIds,
        `New Message in ${message.transactions.title}`,
        `${sender.name}: ${textPreview}`,
        {
          type: 'message',
          transactionId: message.transaction_id,
          messageId: messageId
        }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to send message notification:', error);
      return false;
    }
  }

  /**
   * Sends a phase update notification
   */
  async sendPhaseUpdateNotification(
    transactionId: string,
    newPhase: string,
    updatedByUserId: string
  ): Promise<boolean> {
    try {
      // Get transaction details
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('id, title, property_address')
        .eq('id', transactionId)
        .single();

      if (error || !transaction) {
        console.error('Transaction not found for phase update notification:', error);
        return false;
      }

      // Get updater details
      const { data: updater, error: updaterError } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', updatedByUserId)
        .single();

      if (updaterError || !updater) {
        console.error('Updater not found for phase update notification:', updaterError);
        return false;
      }

      // Get participants to notify
      const { data: participants, error: participantsError } = await supabase
        .from('transaction_participants')
        .select('user_id, users!inner(email, name)')
        .eq('transaction_id', transactionId);

      if (participantsError) {
        console.error('Error getting participants for phase update notification:', participantsError);
        return false;
      }

      // Prepare email content
      const subject = `Transaction Phase Updated: ${transaction.title}`;
      
      for (const participant of participants) {
        // Generate magic link for each participant with transaction ID
        const { data: magicLink, error: magicLinkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: participant.users.email,
          options: {
            redirectTo: `${process.env.APP_URL || 'http://localhost:5000'}/auth/callback?transaction_id=${transactionId}`,
          },
        });

        if (magicLinkError) {
          console.error('Error generating magic link for phase update notification:', magicLinkError);
          continue; // Skip this participant but continue with others
        }
        
        const content = `
          Hello ${participant.users.name},
          
          ${updater.name} has updated the transaction phase for "${transaction.title}" (${transaction.property_address}):
          
          New Phase: ${newPhase}
          
          Click the link below to view the transaction details and any new requirements for this phase:
          ${magicLink.properties.action_link}
          
          This link will expire in 24 hours.
          
          Thank you,
          ReAlign Team
        `;

        // In a real implementation, this would use a proper email service
        console.log(`Phase update notification email to ${participant.users.email}:\n${content}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send phase update notification:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
