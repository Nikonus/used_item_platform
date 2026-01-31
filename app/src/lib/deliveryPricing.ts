// Delivery pricing logic

export type DeliveryType = 'standard' | 'express'

export const DELIVERY_OPTIONS = {
  standard: {
    label: 'Standard (6 hours)',
    hours: 6,
    basePrice: 50, // INR
    perKmPrice: 2, // INR per km
  },
  express: {
    label: 'Express (2 hours)',
    hours: 2,
    basePrice: 150, // INR
    perKmPrice: 5, // INR per km
  },
} as const

export function calculateDeliveryFee(deliveryType: DeliveryType, distanceKm: number | null): number {
  const option = DELIVERY_OPTIONS[deliveryType]
  const distance = distanceKm ?? 0
  return Math.round(option.basePrice + distance * option.perKmPrice)
}
