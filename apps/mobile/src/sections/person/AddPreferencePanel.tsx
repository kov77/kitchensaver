import { useTranslation } from 'react-i18next'

import { useAddPreference } from '@/api/queries/useAddPreference'
import { FormPanel } from '@/components/molecules/FormPanel'
import { PreferenceForm } from '@/components/organisms/PreferenceForm'
import { getErrorMessage } from '@/utils/errors'
import { useOpen } from '@/utils/useOpen'

type AddPreferencePanelProps = {
  personId: string
}

export function AddPreferencePanel({ personId }: AddPreferencePanelProps) {
  const { t } = useTranslation('person')
  const [isAdding, { open: startAdding, close }] = useOpen()
  const {
    mutate: addPreference,
    error,
    isPending,
    reset,
  } = useAddPreference(personId)

  const stopAdding = () => {
    reset()
    close()
  }

  return (
    <FormPanel
      isOpen={isAdding}
      openLabel={t('preference-add')}
      cancelLabel={t('cancel')}
      onOpen={startAdding}
      onCancel={stopAdding}
    >
      <PreferenceForm
        submitLabel={t('save')}
        isSubmitting={isPending}
        errorMessage={error ? getErrorMessage(error) : null}
        onSubmit={(preference) =>
          addPreference(preference, { onSuccess: stopAdding })
        }
      />
    </FormPanel>
  )
}
