import { useTranslation } from 'react-i18next'

import { useAddPreference } from '@/api/queries/useAddPreference'
import { Button } from '@/components/atoms/Button'
import { BottomSheet } from '@/components/molecules/BottomSheet'
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
    <>
      <Button
        title={t('preference-add')}
        variant="secondary"
        onPress={startAdding}
      />
      {isAdding ? (
        <BottomSheet
          title={t('preference-add')}
          closeLabel={t('close')}
          onClose={stopAdding}
        >
          <PreferenceForm
            submitLabel={t('add')}
            isSubmitting={isPending}
            errorMessage={error ? getErrorMessage(error) : null}
            onSubmit={(preference) =>
              addPreference(preference, { onSuccess: stopAdding })
            }
          />
        </BottomSheet>
      ) : null}
    </>
  )
}
