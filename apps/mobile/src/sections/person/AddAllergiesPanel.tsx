import { useTranslation } from 'react-i18next'

import type { Allergy } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { AddAllergiesForm } from '@/components/organisms/AddAllergiesForm'
import type { AllergenSelection } from '@/components/organisms/allergy/schemas'
import { buildAllergyItems } from '@/components/organisms/allergy/utils'

import { useOpen } from '@/utils/useOpen'

import type { AddAllergies } from './types'

type AddAllergiesPanelProps = {
  allergies: Allergy[]
  addAllergies: AddAllergies
}

export function AddAllergiesPanel({
  allergies,
  addAllergies,
}: AddAllergiesPanelProps) {
  const { t } = useTranslation('person')
  const [isAdding, { open: startAdding, close }] = useOpen()

  const stopAdding = () => {
    addAllergies.reset()
    close()
  }

  const add = (selection: AllergenSelection) => {
    const items = buildAllergyItems(selection)
    if (items.length === 0) {
      stopAdding()
      return
    }
    addAllergies.mutate(items, { onSuccess: stopAdding })
  }

  if (!isAdding) {
    return (
      <Button
        title={t('allergy-add')}
        variant="secondary"
        onPress={startAdding}
      />
    )
  }

  return (
    <>
      <AddAllergiesForm
        listedCodes={allergies.map(({ allergenCode }) => allergenCode)}
        submitLabel={t('save')}
        isSubmitting={addAllergies.isPending}
        onSubmit={add}
      />
      <Button title={t('cancel')} variant="secondary" onPress={stopAdding} />
    </>
  )
}
