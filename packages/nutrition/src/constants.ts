export const GOAL_PACES = ['MILD', 'MODERATE'] as const

export const DAILY_KCAL_ISSUES = [
  'BELOW_BLOCKED_MINIMUM',
  'BELOW_ADVISED_MINIMUM',
  'ABOVE_ADVISED_MAXIMUM',
  'DEFICIT_ABOVE_ADVISED_RANGE',
  'SURPLUS_ABOVE_ADVISED_RANGE',
] as const

export const DAILY_KCAL_LIMITS = {
  blockedMinimum: 800,
  advisedMinimum: 1200,
  advisedMaximum: 3200,
  advisedMaximumDeficit: 1000,
  advisedMaximumSurplus: 500,
} as const
