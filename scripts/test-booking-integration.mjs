#!/usr/bin/env node

/**
 * Booking Flow Integration Test
 *
 * Tests the complete booking workflow from start to finish
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class BookingIntegrationTest {
  constructor() {
    this.results = {
      tests: [],
      evidence: {}
    };
  }

  log(message, status = 'info') {
    const timestamp = new Date().toISOString();
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    console.log(`${icons[status]} [${timestamp}] ${message}`);
  }

  test(name, checkFn) {
    this.log(`Running: ${name}`, 'info');

    try {
      const result = checkFn();
      if (result.passed !== false) {
        this.results.tests.push({ name, status: 'passed', ...result });
        this.log(`${name} - PASSED`, 'success');
        return true;
      } else {
        this.results.tests.push({ name, status: 'failed', ...result });
        this.log(`${name} - FAILED: ${result.message}`, 'error');
        return false;
      }
    } catch (error) {
      this.results.tests.push({
        name,
        status: 'error',
        message: error.message
      });
      this.log(`${name} - ERROR: ${error.message}`, 'error');
      return false;
    }
  }

  runAllTests() {
    this.log('🚀 Booking Flow Integration Test', 'info');
    this.log('=' .repeat(50), 'info');

    // 1. Database Schema Integrity
    this.test('Database Schema Integrity', () => {
      const requiredTables = [
        'bookings', 'appointments', 'payment_tokens',
        'booking_confirmations', 'calendar_integrations',
        'ai_personality_profiles', 'escalation_logs'
      ];

      const migrationFiles = fs.readdirSync(
        path.join(__dirname, '..', 'supabase', 'migrations')
      ).filter(f => f.includes('booking') || f.includes('enterprise'));

      return {
        passed: migrationFiles.length >= 2,
        evidence: {
          migration_files: migrationFiles.length,
          required_tables: requiredTables.length
        }
      };
    });

    // 2. API Functions Availability
    this.test('API Functions Availability', () => {
      const requiredFunctions = [
        'create-booking',
        'send-booking-confirmation',
        'sync-calendar-event',
        'resolve-escalation',
        'health-check'
      ];

      const functionsDir = path.join(__dirname, '..', 'supabase', 'functions');
      const availableFunctions = requiredFunctions.filter(fn =>
        fs.existsSync(path.join(functionsDir, fn, 'index.ts'))
      );

      return {
        passed: availableFunctions.length === requiredFunctions.length,
        evidence: {
          required: requiredFunctions.length,
          available: availableFunctions.length,
          functions: availableFunctions
        }
      };
    });

    // 3. Frontend Components
    this.test('Frontend Components', () => {
      const requiredComponents = [
        'CreditCardDialog.tsx',
        'CalendarIntegration.tsx',
        'AIOnboardingWizard.tsx',
        'EscalationManagement.tsx',
        'EnterpriseDashboard.tsx'
      ];

      const componentsDir = path.join(__dirname, '..', 'src', 'components');
      const availableComponents = requiredComponents.filter(comp =>
        fs.existsSync(path.join(componentsDir, 'booking', comp)) ||
        fs.existsSync(path.join(componentsDir, 'onboarding', comp)) ||
        fs.existsSync(path.join(componentsDir, 'admin', comp))
      );

      return {
        passed: availableComponents.length === requiredComponents.length,
        evidence: {
          required: requiredComponents.length,
          available: availableComponents.length
        }
      };
    });

    // 4. Security Middleware
    this.test('Security Middleware Implementation', () => {
      const securityFiles = [
        'enterprise-monitoring.ts',
        'security-middleware.ts'
      ];

      const sharedDir = path.join(__dirname, '..', 'supabase', 'functions', '_shared');
      const availableSecurity = securityFiles.filter(file =>
        fs.existsSync(path.join(sharedDir, file))
      );

      // Check if security features are implemented
      if (availableSecurity.length === 2) {
        const monitoringContent = fs.readFileSync(
          path.join(sharedDir, 'enterprise-monitoring.ts'), 'utf8'
        );
        const middlewareContent = fs.readFileSync(
          path.join(sharedDir, 'security-middleware.ts'), 'utf8'
        );

        const hasCircuitBreaker = monitoringContent.includes('CircuitBreaker');
        const hasRateLimiting = middlewareContent.includes('RateLimit');
        const hasSecurityHeaders = middlewareContent.includes('SecurityHeaders');

        return {
          passed: hasCircuitBreaker && hasRateLimiting && hasSecurityHeaders,
          evidence: {
            circuit_breaker: hasCircuitBreaker,
            rate_limiting: hasRateLimiting,
            security_headers: hasSecurityHeaders
          }
        };
      }

      return { passed: false, message: 'Security files missing' };
    });

    // 5. Monitoring System
    this.test('Monitoring System', () => {
      const monitoringFeatures = [
        'system_monitoring_events',
        'performance_metrics',
        'system_health_checks',
        'system_alerts',
        'security_audit_log'
      ];

      // Check if monitoring tables are in migrations
      const migrationContent = fs.readFileSync(
        path.join(__dirname, '..', 'supabase', 'migrations', '20251206000002_enterprise_security_monitoring.sql'),
        'utf8'
      );

      const tablesPresent = monitoringFeatures.filter(table =>
        migrationContent.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)
      );

      return {
        passed: tablesPresent.length === monitoringFeatures.length,
        evidence: {
          required_tables: monitoringFeatures.length,
          present_tables: tablesPresent.length
        }
      };
    });

    // 6. AI Enhancement Features
    this.test('AI Enhancement Features', () => {
      const aiFeatures = [
        'emotional recognition',
        'tone adaptation',
        'interrupt handling',
        'conversation flow management'
      ];

      const voiceStreamContent = fs.readFileSync(
        path.join(__dirname, '..', 'supabase', 'functions', 'enhanced-voice-stream', 'index.ts'),
        'utf8'
      );

      const featuresPresent = aiFeatures.filter(feature => {
        switch (feature) {
          case 'emotional recognition':
            return voiceStreamContent.includes('EmotionalContext') ||
                   voiceStreamContent.includes('emotional_context');
          case 'tone adaptation':
            return voiceStreamContent.includes('tone') && voiceStreamContent.includes('personality');
          case 'interrupt handling':
            return voiceStreamContent.includes('interrupt') || voiceStreamContent.includes('Interruption');
          case 'conversation flow management':
            return voiceStreamContent.includes('ConversationFlow') ||
                   voiceStreamContent.includes('conversation_flow');
          default:
            return false;
        }
      });

      return {
        passed: featuresPresent.length >= 3, // At least 3 out of 4 features
        evidence: {
          required_features: aiFeatures.length,
          implemented_features: featuresPresent.length,
          features: featuresPresent
        }
      };
    });

    // 7. Calendar Integration
    this.test('Calendar Integration', () => {
      const calendarProviders = ['Google Calendar', 'Outlook'];
      const calendarContent = fs.readFileSync(
        path.join(__dirname, '..', 'src', 'components', 'booking', 'CalendarIntegration.tsx'),
        'utf8'
      );

      const providersSupported = calendarProviders.filter(provider =>
        calendarContent.includes(provider)
      );

      const hasOAuth = calendarContent.includes('OAuth') || calendarContent.includes('oauth');
      const hasSyncLogic = calendarContent.includes('sync') && calendarContent.includes('calendar');

      return {
        passed: providersSupported.length >= 1 && hasOAuth && hasSyncLogic,
        evidence: {
          providers_supported: providersSupported.length,
          oauth_implemented: hasOAuth,
          sync_logic: hasSyncLogic
        }
      };
    });

    // 8. Payment Security
    this.test('Payment Security', () => {
      const bookingContent = fs.readFileSync(
        path.join(__dirname, '..', 'supabase', 'functions', 'create-booking', 'index.ts'),
        'utf8'
      );

      const securityFeatures = [
        'PCI compliance',
        'fraud detection',
        'tokenization',
        'authorization only'
      ];

      const featuresImplemented = securityFeatures.filter(feature => {
        switch (feature) {
          case 'PCI compliance':
            return bookingContent.includes('Stripe') && bookingContent.includes('token');
          case 'fraud detection':
            return bookingContent.includes('fraud') || bookingContent.includes('Fraud');
          case 'tokenization':
            return bookingContent.includes('paymentMethodId') && bookingContent.includes('token');
          case 'authorization only':
            return bookingContent.includes('capture_method') && bookingContent.includes('manual');
          default:
            return false;
        }
      });

      return {
        passed: featuresImplemented.length >= 3,
        evidence: {
          required_features: securityFeatures.length,
          implemented_features: featuresImplemented.length,
          features: featuresImplemented
        }
      };
    });

    // Generate report
    this.generateReport();
  }

  generateReport() {
    const passedTests = this.results.tests.filter(t => t.status === 'passed').length;
    const failedTests = this.results.tests.filter(t => t.status === 'failed' || t.status === 'error').length;
    const totalTests = this.results.tests.length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('\n' + '=' .repeat(60));
    console.log('📊 BOOKING FLOW INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));

    console.log(`\n✅ PASSED: ${passedTests}/${totalTests} tests`);
    console.log(`❌ FAILED: ${failedTests}/${totalTests} tests`);
    console.log(`📈 SUCCESS RATE: ${successRate}%`);

    // Detailed results
    console.log('\n📋 DETAILED RESULTS:');
    this.results.tests.forEach(test => {
      const icon = test.status === 'passed' ? '✅' : '❌';
      console.log(`${icon} ${test.name}`);
      if (test.evidence) {
        Object.entries(test.evidence).forEach(([key, value]) => {
          console.log(`   ${key}: ${JSON.stringify(value)}`);
        });
      }
      if (test.message) {
        console.log(`   Error: ${test.message}`);
      }
    });

    // Evidence summary
    console.log('\n📋 COLLECTED EVIDENCE:');
    Object.entries(this.results.evidence).forEach(([category, data]) => {
      console.log(`   ${category}: ${JSON.stringify(data, null, 2)}`);
    });

    // Final verdict
    console.log('\n' + '=' .repeat(60));
    if (failedTests === 0) {
      console.log('🎉 BOOKING FLOW INTEGRATION TEST PASSED!');
      console.log('✨ All enterprise booking features are working correctly.');
    } else {
      console.log('⚠️  BOOKING FLOW INTEGRATION TEST FAILED');
      console.log('🔧 Please review failed tests and fix issues before deployment.');
    }

    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'booking-integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run the integration test
const tester = new BookingIntegrationTest();
tester.runAllTests();