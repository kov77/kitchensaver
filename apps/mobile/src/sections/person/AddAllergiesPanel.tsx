import { useTranslation } from 'react-i18next'

import type { Allergy } from '@/api/types'
import { FormPanel } from '@/components/molecules/FormPanel'
import { AddAllergiesForm } from '@/components/organisms/AddAllergiesForm'
import type { AllergenSelection } from '@/components/organisms/allergy/schemas'
import { buildAllergyItems } from '@/components/organisms/allergy/utils'
import { useOpen } from '@/utils/useOpen'

import type { AddAllergies } from './types'
import { getNewAllergyItems } from './utils'

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
    const items = getNewAllergyItems(buildAllergyItems(selection), allergies)
    if (items.length === 0) {
      stopAdding()
      return
    }
    addAllergies.mutate(items, { onSuccess: stopAdding })
  }

  return (
    <FormPanel
      isOpen={isAdding}
      openLabel={t('allergy-add')}
      cancelLabel={t('cancel')}
      onOpen={startAdding}
      onCancel={stopAdding}
    >
      <AddAllergiesForm
        listedCodes={allergies.map(({ allergenCode }) => allergenCode)}
        submitLabel={t('save')}
        isSubmitting={addAllergies.isPending}
        onSubmit={add}
      />
    </FormPanel>
  )
}
