import { Injectable } from '@nestjs/common'

export interface AccountLimits {
  activeProfiles: number
}

const FREE_LIMITS: AccountLimits = { activeProfiles: 2 }

@Injectable()
export class EntitlementsService {
  // Until subscriptions exist every account gets the Free limits (D030).
  getLimits(_accountId: string): Promise<AccountLimits> {
    return Promise.resolve(FREE_LIMITS)
  }
}
