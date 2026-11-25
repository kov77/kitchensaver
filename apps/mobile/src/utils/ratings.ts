import { RATINGS } from '@/core/constants'

export function findRating(value: number) {
  return RATINGS.find((rating) => rating === value)
}
