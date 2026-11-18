import { Injectable } from '@nestjs/common'

export interface AccountLimits {
  activeProfiles: number
  totalProfiles: number
}

const FREE_LIMITS: AccountLimits = { activeProfiles: 2, totalProfiles: 20 }

@Injectable()
export class EntitlementsService {
  getLimits(_accountId: string): Promise<AccountLimits> {
    return Promise.resolve(FREE_LIMITS)
  }
}
