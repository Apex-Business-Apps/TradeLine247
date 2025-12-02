/**
 * Firebase Cloud Messaging (FCM) Client Module
 * 
 * Handles sending push notifications via FCM for both iOS and Android.
 */

import * as admin from 'firebase-admin';

let fcmApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFCM(): void {
  if (fcmApp) {
    return; // Already initialized
  }

  const projectId = process.env.FCM_PROJECT_ID;
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const credentialsJson = process.env.FCM_CREDENTIALS_JSON;

  if (!projectId) {
    throw new Error('FCM_PROJECT_ID environment variable is required');
  }

  let credentials: admin.ServiceAccount | admin.ServiceAccount['projectId'];

  if (credentialsJson) {
    // Use JSON credentials if provided
    try {
      credentials = JSON.parse(credentialsJson) as admin.ServiceAccount;
    } catch (error) {
      throw new Error('Invalid FCM_CREDENTIALS_JSON format');
    }
  } else if (clientEmail && privateKey) {
    // Use individual env vars
    credentials = {
      projectId,
      clientEmail,
      privateKey,
    };
  } else {
    throw new Error(
      'FCM credentials required: Either FCM_CREDENTIALS_JSON or (FCM_CLIENT_EMAIL + FCM_PRIVATE_KEY)'
    );
  }

  try {
    fcmApp = admin.initializeApp({
      credential: admin.credential.cert(credentials as admin.ServiceAccount),
      projectId,
    });
    console.info('[FCM] Initialized successfully');
  } catch (error) {
    console.error('[FCM] Initialization failed:', error);
    throw error;
  }
}

/**
 * Send push notification to a device token
 */
export async function sendPushToDevice(
  deviceToken: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<string> {
  if (!fcmApp) {
    initializeFCM();
  }

  if (!fcmApp) {
    throw new Error('FCM not initialized');
  }

  const message: admin.messaging.Message = {
    token: deviceToken,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data
      ? Object.fromEntries(
          Object.entries(payload.data).map(([key, value]) => [key, String(value)])
        )
      : undefined,
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.info('[FCM] Message sent successfully:', response);
    return response;
  } catch (error: any) {
    console.error('[FCM] Failed to send message:', error);
    
    // Handle specific FCM errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      // Token is invalid, should be removed from database
      throw new Error('INVALID_TOKEN');
    }
    
    throw error;
  }
}

/**
 * Send push notification to multiple device tokens
 */
export async function sendPushToMultipleDevices(
  deviceTokens: string[],
  payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<admin.messaging.BatchResponse> {
  if (!fcmApp) {
    initializeFCM();
  }

  if (!fcmApp) {
    throw new Error('FCM not initialized');
  }

  const message: admin.messaging.MulticastMessage = {
    tokens: deviceTokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data
      ? Object.fromEntries(
          Object.entries(payload.data).map(([key, value]) => [key, String(value)])
        )
      : undefined,
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default',
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.info('[FCM] Batch message sent:', {
      success: response.successCount,
      failure: response.failureCount,
    });
    return response;
  } catch (error) {
    console.error('[FCM] Failed to send batch message:', error);
    throw error;
  }
}

