import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock crypto.randomUUID
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => '00000000-0000-0000-0000-000000000000',
  } as Crypto
}
