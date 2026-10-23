import { type AppNotification, type PaymentCard } from '../types'

// Client-side data of the mocks: cards and notifications per user.

export type MockCard = PaymentCard & { user_id: number }

export const cards: MockCard[] = [
  {
    id: 1,
    user_id: 101,
    mask: '8600 **** **** 1234',
    expiry: '12/28',
    is_default: true,
    verified: true,
  },
  {
    id: 2,
    user_id: 102,
    mask: '9860 **** **** 5678',
    expiry: '05/27',
    is_default: true,
    verified: true,
  },
]

export type MockNotification = AppNotification & { user_id: number }

export const notifications: MockNotification[] = []

/** SMS codes sent: phone → attempts left. Mock code is always 123456. */
export const otpAttempts = new Map<string, number>()

export const MOCK_OTP = '123456'
