// TODO: mock-данные лендинга — заменить реальными
//
// Every number on the landing page that the backend cannot give yet lives
// here (statistics, delivery times, FAQ figures). Texts are in the i18n
// files and take these values as interpolation parameters.

/** "C-Trans в цифрах": circular gauges, percent 0–100. */
export const LANDING_GAUGES = {
  onTime: 98,
  happyClients: 95,
  undamaged: 99,
} as const

/** "C-Trans в цифрах": count-up numbers. */
export const LANDING_COUNTERS = {
  delivered: 12480, // shipments delivered
  clients: 3200,
  kgPerMonth: 85000,
} as const

/** Transit time in days from departure (stats card and FAQ). */
export const LANDING_TRANSIT_DAYS = {
  avia: { min: 5, max: 9 },
  auto: { min: 14, max: 21 },
} as const

/** Typical (middle) transit days shown as the "days: avia / truck" counter. */
export const LANDING_TRANSIT_TYPICAL = { avia: 7, auto: 18 } as const

/** FAQ figures. Real ones come from warehouse settings / payment config. */
export const LANDING_FAQ = {
  minWeightKg: 1,
  volumeDivisor: { avia: 6000, auto: 5000 },
  autoChargeMinutes: 5,
} as const
