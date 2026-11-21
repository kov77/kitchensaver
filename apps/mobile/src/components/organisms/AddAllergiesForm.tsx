import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button'
import type { AllergenCode } from '@/core/types'

import { AllergenFields } from './allergy/AllergenFields'
import {
  allergenSelectionSchema,
  type AllergenSelection,
} from './allergy/schemas'
import { getAddableCodes } from './allergy/utils'

type AddAllergiesFormProps = {
  listedCodes: readonly AllergenCode[]
  submitLabel: string
  isSubmitting: boolean
  onSubmit: (selection: AllergenSelection) => void
}

export function AddAllergiesForm({
  listedCodes,
  submitLabel,
  isSubmitting,
  onSubmit,
}: AddAllergiesFormProps) {
  const addableCodes = getAddableCodes(listedCodes)
  const form = useForm<AllergenSelection>({
    resolver: zodResolver(allergenSelectionSchema),
    defaultValues: { allergens: [], otherLabel: '' },
  })

  const submit = form.handleSubmit(({ allergens, otherLabel }) =>
    onSubmit({
      allergens: allergens.filter((code) => addableCodes.includes(code)),
      otherLabel,
    }),
  )

  return (
    <FormProvider {...form}>
      <AllergenFields codes={addableCodes} />
      <Button
        title={submitLabel}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
    </FormProvider>
  )
}
