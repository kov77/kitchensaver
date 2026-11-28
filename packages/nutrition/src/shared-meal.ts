import { checkIngredientsForPerson, toVerdict } from './allergens.js'
import { NutritionInputError } from './errors.js'
import type {
  CheckedIngredient,
  CheckReason,
  PersonRestrictions,
  SharedMealParticipant,
  SharedMealParticipantResult,
} from './types.js'

function allergiesOnly({
  allergyStatus,
  allergies,
}: PersonRestrictions): PersonRestrictions {
  return { allergyStatus, allergies, exclusions: [] }
}

function addOnConflicts(
  addOn: CheckedIngredient,
  others: readonly SharedMealParticipant[],
): CheckReason[] {
  return others.flatMap(({ personId, restrictions }) => {
    const { reasons } = checkIngredientsForPerson(
      [addOn],
      allergiesOnly(restrictions),
    )
    return reasons
      .filter(({ ingredientId }) => ingredientId === addOn.id)
      .map((reason) =>
        reason.code === 'UNVERIFIED_INGREDIENT'
          ? { ...reason, otherPersonId: personId }
          : {
              code: 'ADD_ON_CONFLICTS_WITH_PARTICIPANT' as const,
              ingredientId: addOn.id,
              allergenCode: reason.allergenCode,
              otherPersonId: personId,
            },
      )
  })
}

export function checkSharedMeal(
  sharedIngredients: readonly CheckedIngredient[],
  participants: readonly SharedMealParticipant[],
): SharedMealParticipantResult[] {
  if (participants.length === 0) {
    throw new NutritionInputError('PARTICIPANTS_EMPTY')
  }

  const personIds = new Set(participants.map(({ personId }) => personId))
  if (personIds.size !== participants.length) {
    throw new NutritionInputError('PARTICIPANTS_DUPLICATE')
  }

  return participants.map((participant) => {
    const { personId, restrictions, addOns } = participant
    const own = checkIngredientsForPerson(
      [...sharedIngredients, ...addOns],
      restrictions,
    )
    const others = participants.filter((other) => other.personId !== personId)
    const conflicts = addOns.flatMap((addOn) => addOnConflicts(addOn, others))
    const reasons = [...own.reasons, ...conflicts]
    return {
      personId,
      result: { ...own, reasons, verdict: toVerdict(reasons) },
    }
  })
}
