import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import config from '../config';
import * as schema from '@shared/schema';
import { storage } from '../storage';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);

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
        console.error('Error generating magic link:', error);
        return false;
      }

      if (!process.env.SENDGRID_API_KEY) {
        console.log('SendGrid not configured, magic link would be sent to:', email);
        console.log('Magic link URL:', data.properties.action_link);
        return true;
      }

      // Send email via SendGrid
      const msg = {
        to: email,
        from: 'help@realignapp.com', // Verified sender
        subject: 'Your ReAlign Sign-In Link',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Sign in to ReAlign</h2>
            <p>Click the button below to sign in to your ReAlign account:</p>
            <a href="${data.properties.action_link}" 
               style="display: inline-block; background-color: #007bff; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 4px; 
                      margin: 20px 0;">
              Sign In to ReAlign
            </a>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      };

      const result = await sgMail.send(msg);
      console.log('Magic link email sent successfully to:', email);
      console.log('SendGrid response:', result[0].statusCode, result[0].headers);
      return true;
    } catch (error) {
      console.error('Failed to send magic link:', error);
      console.error('SendGrid error details:', error.response ? error.response.body : 'No response body');
      return false;
    }
  }

  /**
   * Sends a tracker magic link to a party for public access
   */
  async sendTrackerMagicLink(
    email: string,
    name: string,
    role: string,
    transactionTitle: string,
    propertyAddress: string,
    negotiatorName: string,
    magicLinkToken: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('SendGrid not configured, tracker magic link would be sent to:', email);
        console.log('Tracker URL:', `${process.env.APP_URL || 'http://localhost:5000'}/tracker/${transactionId}?token=${magicLinkToken}`);
        return true;
      }

      const trackerUrl = `${process.env.APP_URL || 'http://localhost:5000'}/tracker/${transactionId}?token=${magicLinkToken}`;

      // Send email via SendGrid
      const msg = {
        to: email,
        from: 'help@realignapp.com', // Verified sender
        subject: `Track Your Transaction: ${transactionTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Track Your Transaction Progress</h2>
            <p>Hello ${name},</p>
            <p>${negotiatorName} has invited you to track the progress of your ${role} role in the transaction for <strong>${propertyAddress}</strong>.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Transaction: ${transactionTitle}</h3>
              <p style="margin-bottom: 0; color: #666;">Property: ${propertyAddress}</p>
            </div>
            
            <p>Click the button below to view your transaction tracker:</p>
            <a href="${trackerUrl}" 
               style="display: inline-block; background-color: #007bff; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 4px; 
                      margin: 20px 0;">
              View Transaction Tracker
            </a>
            
            <p style="color: #666; font-size: 14px;">
              This link will remain active for the duration of your transaction. You can bookmark this page to easily check progress updates.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The ReAlign Team
            </p>
          </div>
        `,
      };

      const result = await sgMail.send(msg);
      console.log('Tracker magic link email sent successfully to:', email);
      console.log('SendGrid response:', result[0].statusCode, result[0].headers);
      return true;
    } catch (error) {
      console.error('Failed to send tracker magic link:', error);
      console.error('SendGrid error details:', error.response ? error.response.body : 'No response body');
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
   * Sends weekly digest emails to subscribed parties
   */
  async sendWeeklyDigest(): Promise<boolean> {
    try {
      console.log('Starting weekly digest email job...');
      
      if (!process.env.SENDGRID_API_KEY) {
        console.log('SendGrid not configured, skipping weekly digest emails');
        return true;
      }

      // Get all active email subscriptions
      const subscriptions = await storage.getEmailSubscriptionsByTransactionId(''); // Get all subscriptions
      
      for (const subscription of subscriptions) {
        try {
          // Get transaction details
          const transaction = await storage.getTransactionById(subscription.transaction_id);
          if (!transaction) continue;

          // Get recent tracker notes (last 7 days)
          const recentNotes = await storage.getTrackerNotesByTransactionId(subscription.transaction_id);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const recentNotesFiltered = recentNotes.filter(note => 
            new Date(note.created_at) >= weekAgo
          );

          // Get document requests for this party's role
          const docRequests = await storage.getDocumentRequestsByTransactionId(subscription.transaction_id, 1, 100);
          const partyDocRequests = docRequests.data.filter(req => 
            req.assigned_party_role === subscription.party_role
          );
          
          const completedDocs = partyDocRequests.filter(req => req.status === 'complete').length;
          const overdueDocs = partyDocRequests.filter(req => req.status === 'overdue').length;
          const pendingDocs = partyDocRequests.filter(req => req.status === 'pending').length;

          // Create tracker URL with magic link token
          const trackerUrl = `${process.env.APP_URL || 'http://localhost:5000'}/tracker/${subscription.transaction_id}?token=${subscription.magic_link_token}`;
          const unsubscribeUrl = `${process.env.APP_URL || 'http://localhost:5000'}/tracker/unsubscribe?token=${subscription.magic_link_token}`;

          // Send weekly digest email
          const msg = {
            to: subscription.party_email,
            from: 'help@realignapp.com',
            subject: `[Tracker Update] Your Short Sale Status - ${transaction.property_address}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                  Weekly Transaction Update
                </h2>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #333;">Transaction: ${transaction.title}</h3>
                  <p style="margin-bottom: 5px; color: #666;"><strong>Property:</strong> ${transaction.property_address}</p>
                  <p style="margin-bottom: 0; color: #666;"><strong>Current Phase:</strong> ${transaction.current_phase}</p>
                </div>

                <h3 style="color: #333;">Your Document Status Summary</h3>
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                  <div style="background-color: #d4edda; padding: 10px; border-radius: 5px; text-align: center; flex: 1;">
                    <div style="font-size: 24px; font-weight: bold; color: #155724;">${completedDocs}</div>
                    <div style="color: #155724; font-size: 12px;">Completed</div>
                  </div>
                  <div style="background-color: #fff3cd; padding: 10px; border-radius: 5px; text-align: center; flex: 1;">
                    <div style="font-size: 24px; font-weight: bold; color: #856404;">${pendingDocs}</div>
                    <div style="color: #856404; font-size: 12px;">Pending</div>
                  </div>
                  <div style="background-color: #f8d7da; padding: 10px; border-radius: 5px; text-align: center; flex: 1;">
                    <div style="font-size: 24px; font-weight: bold; color: #721c24;">${overdueDocs}</div>
                    <div style="color: #721c24; font-size: 12px;">Overdue</div>
                  </div>
                </div>

                ${recentNotesFiltered.length > 0 ? `
                  <h3 style="color: #333;">Recent Activity</h3>
                  <div style="margin-bottom: 20px;">
                    ${recentNotesFiltered.slice(0, 3).map(note => `
                      <div style="border-left: 3px solid #007bff; padding-left: 10px; margin-bottom: 10px;">
                        <div style="font-size: 12px; color: #666;">${new Date(note.created_at).toLocaleDateString()}</div>
                        <div style="color: #333;">${note.note_text}</div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${trackerUrl}" 
                     style="display: inline-block; background-color: #007bff; color: white; 
                            padding: 12px 24px; text-decoration: none; border-radius: 4px; 
                            margin: 10px;">
                    View Full Tracker
                  </a>
                </div>

                <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
                  <p>You're receiving this weekly update because you're subscribed to transaction notifications.</p>
                  <p><a href="${unsubscribeUrl}" style="color: #007bff;">Unsubscribe from these updates</a></p>
                </div>
              </div>
            `,
          };

          await sgMail.send(msg);
          console.log(`Weekly digest sent to: ${subscription.party_email}`);
          
        } catch (error) {
          console.error(`Failed to send weekly digest to ${subscription.party_email}:`, error);
        }
      }

      console.log('Weekly digest job completed');
      return true;
    } catch (error) {
      console.error('Weekly digest job failed:', error);
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
      
      // If the user has provided a phone number and opted in for SMS,
      // also send an SMS notification (not implemented in MVP)
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
