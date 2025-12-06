// Telephony Transaction Manager
// Provides atomic multi-step operations with rollback

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface TransactionStep {
  step: string;
  data: any;
  rollbackAction?: any;
}

export class TelephonyTransaction {
  private txId: string | null = null;
  private supabase: SupabaseClient;
  private transactionType: string;
  private orgId: string;
  private metadata: any;

  constructor(
    supabase: SupabaseClient,
    transactionType: string,
    orgId: string,
    metadata: any = {}
  ) {
    this.supabase = supabase;
    this.transactionType = transactionType;
    this.orgId = orgId;
    this.metadata = metadata;
  }

  /**
   * Start the transaction
   */
  async start(): Promise<string> {
    const { data, error } = await this.supabase.rpc('start_telephony_transaction', {
      p_transaction_type: this.transactionType,
      p_org_id: this.orgId,
      p_metadata: this.metadata
    });

    if (error) {
      throw new Error(`Failed to start transaction: ${error.message}`);
    }

    this.txId = data as string;
    console.log(`Transaction started: ${this.txId} (${this.transactionType})`);
    return this.txId;
  }

  /**
   * Record a completed step
   */
  async recordStep(stepName: string, stepData: any, rollbackAction?: any): Promise<void> {
    if (!this.txId) {
      throw new Error('Transaction not started');
    }

    const { error } = await this.supabase.rpc('record_transaction_step', {
      p_tx_id: this.txId,
      p_step_name: stepName,
      p_step_data: stepData,
      p_rollback_action: rollbackAction || null
    });

    if (error) {
      console.error(`Failed to record step ${stepName}:`, error);
      // Don't throw - allow operation to continue
    } else {
      console.log(`Transaction step recorded: ${stepName}`);
    }
  }

  /**
   * Complete the transaction
   */
  async complete(): Promise<void> {
    if (!this.txId) {
      throw new Error('Transaction not started');
    }

    const { error } = await this.supabase.rpc('complete_telephony_transaction', {
      p_tx_id: this.txId
    });

    if (error) {
      console.error('Failed to complete transaction:', error);
    } else {
      console.log(`Transaction completed: ${this.txId}`);
    }
  }

  /**
   * Fail the transaction
   */
  async fail(errorMessage: string): Promise<void> {
    if (!this.txId) {
      throw new Error('Transaction not started');
    }

    const { error } = await this.supabase.rpc('fail_telephony_transaction', {
      p_tx_id: this.txId,
      p_error_message: errorMessage
    });

    if (error) {
      console.error('Failed to mark transaction as failed:', error);
    } else {
      console.log(`Transaction failed: ${this.txId} - ${errorMessage}`);
    }
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<any[]> {
    if (!this.txId) {
      throw new Error('Transaction not started');
    }

    const { data, error } = await this.supabase.rpc('rollback_telephony_transaction', {
      p_tx_id: this.txId
    });

    if (error) {
      console.error('Failed to rollback transaction:', error);
      return [];
    }

    console.log(`Transaction rolled back: ${this.txId}`);
    return data as any[];
  }

  /**
   * Execute transaction with automatic rollback on failure
   */
  static async execute<T>(
    supabase: SupabaseClient,
    transactionType: string,
    orgId: string,
    operation: (tx: TelephonyTransaction) => Promise<T>,
    metadata: any = {}
  ): Promise<T> {
    const tx = new TelephonyTransaction(supabase, transactionType, orgId, metadata);

    try {
      await tx.start();
      const result = await operation(tx);
      await tx.complete();
      return result;
    } catch (error) {
      console.error('Transaction operation failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      await tx.fail(errorMsg);

      // Attempt rollback
      try {
        const rollbackActions = await tx.rollback();
        console.log('Rollback actions to execute:', rollbackActions);
        // TODO: Execute rollback actions (delete resources, etc.)
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }

      throw error;
    }
  }
}
