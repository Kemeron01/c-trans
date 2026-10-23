import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { settingsQuery, tariffsQuery } from '@/api/setup'
import { useWarehouseScope } from '@/hooks/use-warehouse-scope'
import { DeliveryCalculator } from '@/components/delivery-calculator'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'

/** Admin calculator: tariffs of the user's warehouse (super-admin picks). */
export function Calculator() {
  const { t } = useTranslation()
  const { warehouseId, picker } = useWarehouseScope('foreign')
  const id = warehouseId ?? 0
  const settings = useQuery({ ...settingsQuery(id), enabled: !!warehouseId })
  const tariffs = useQuery({ ...tariffsQuery(id), enabled: !!warehouseId })

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.calculator')}
          description={t('calculator.description')}
        >
          {picker}
        </PageHeading>
        <DeliveryCalculator
          key={warehouseId}
          settings={settings.data}
          tariffs={tariffs.data}
        />
      </Main>
    </>
  )
}
