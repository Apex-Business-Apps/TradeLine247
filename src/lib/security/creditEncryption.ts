/**
 * Credit Application Data Encryption
 * 
 * Encrypts sensitive PII fields before database storage
 * Keys are stored in Supabase Vault, not in database
 */

import { encryptText, decryptText } from '@/lib/crypto';
import { supabase } from '@/integrations/supabase/client';

export interface SensitiveFields {
  ssn?: string;
  creditScore?: number;
  monthlyIncome?: number;
  bankAccountNumber?: string;
  routingNumber?: string;
  driverLicense?: string;
}

export interface EncryptedCreditData {
  applicant_data: Record<string, unknown>;
  encrypted_fields: string[];
  encryption_key_id: string;
}

/**
 * Encrypt sensitive fields in credit application
 */
export async function encryptCreditApplication(
  applicantData: any,
  sensitiveFields: string[] = ['ssn', 'creditScore', 'monthlyIncome', 'bankAccountNumber', 'routingNumber', 'driverLicense']
): Promise<EncryptedCreditData> {
  const encryptedData = { ...applicantData };
  const encryptedFieldNames: string[] = [];
  const fieldEncryptionData: Record<string, { iv: string; key: string }> = {};

  // Encrypt each sensitive field with its own key and IV
  for (const field of sensitiveFields) {
    if (applicantData[field]) {
      const { data: encrypted, key, iv } = await encryptText(
        String(applicantData[field])
      );

      encryptedData[field] = encrypted;
      encryptedFieldNames.push(field);
      fieldEncryptionData[field] = { key, iv };
    }
  }

  if (encryptedFieldNames.length === 0) {
    return {
      applicant_data: applicantData,
      encrypted_fields: [],
      encryption_key_id: '',
    };
  }

  // Store all encryption keys and IVs
  const keyId = await storeEncryptionKey(fieldEncryptionData);

  return {
    applicant_data: encryptedData,
    encrypted_fields: encryptedFieldNames,
    encryption_key_id: keyId,
  };
}

/**
 * Decrypt credit application sensitive fields
 */
export async function decryptCreditApplication(
  encryptedData: any,
  encryptedFields: string[],
  keyId: string
): Promise<any> {
  if (!encryptedFields.length || !keyId) {
    return encryptedData;
  }

  // Retrieve field-specific keys and IVs from storage
  const fieldEncryptionData = await retrieveEncryptionKey(keyId);

  const decryptedData = { ...encryptedData };

  for (const field of encryptedFields) {
    if (encryptedData[field] && fieldEncryptionData[field]) {
      try {
        const decrypted = await decryptText(
          encryptedData[field], 
          fieldEncryptionData[field].key, 
          fieldEncryptionData[field].iv
        );
        decryptedData[field] = decrypted;
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        decryptedData[field] = '[DECRYPTION FAILED]';
      }
    }
  }

  return decryptedData;
}

/**
 * Store encryption key in custom encryption_keys table
 */
async function storeEncryptionKey(
  fieldEncryptionData: Record<string, { key: string; iv: string }>
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('store-encryption-key', {
      body: { fieldEncryptionData },
    });

    if (error) throw error;
    return data.keyId;
  } catch (error) {
    console.error('Failed to store encryption key:', error);
    throw new Error('Encryption key storage failed');
  }
}

/**
 * Retrieve encryption key from custom encryption_keys table
 */
async function retrieveEncryptionKey(keyId: string): Promise<Record<string, { key: string; iv: string }>> {
  try {
    const { data, error } = await supabase.functions.invoke('retrieve-encryption-key', {
      body: { keyId },
    });

    if (error) throw error;
    return data.fieldEncryptionData;
  } catch (error) {
    console.error('Failed to retrieve encryption key:', error);
    throw new Error('Encryption key retrieval failed');
  }
}

/**
 * Hash sensitive data for search/comparison without decryption
 */
export async function hashSensitiveField(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Redact sensitive fields for logging
 */
export function redactSensitiveData(data: any, fields: string[]): any {
  const redacted = { ...data };
  for (const field of fields) {
    if (redacted[field]) {
      redacted[field] = '[REDACTED]';
    }
  }
  return redacted;
}
