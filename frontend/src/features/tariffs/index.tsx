import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { settingsQuery, tariffsApi, tariffsQuery } from '@/api/setup'
import { type DeliveryMethod } from '@/api/types'
import { useWarehouseScope } from '@/hooks/use-warehouse-scope'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'
import { RangePriceList } from '@/components/range-price-list'
import { SettingsCard } from './settings-card'

const METHODS: DeliveryMethod[] = ['avia', 'auto']

export function Tariffs() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { warehouseId, picker, canEdit } = useWarehouseScope('foreign')
  const id = warehouseId ?? 0
  const settings = useQuery({ ...settingsQuery(id), enabled: !!warehouseId })
  const tariffs = useQuery({ ...tariffsQuery(id), enabled: !!warehouseId })

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: tariffsQuery(id).queryKey })

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.tariffs')}
          description={t('tariffs.description')}
        >
          {picker}
        </PageHeading>
        {settings.data && (
          <SettingsCard settings={settings.data} canEdit={canEdit} />
        )}
        <div className='grid gap-4 lg:grid-cols-2'>
          {METHODS.map((method) => (
            <RangePriceList
              key={method}
              title={t(`method.${method}`)}
              priceLabel={t('tariffs.pricePerKg')}
              canEdit={canEdit}
              items={tariffs.data
                ?.filter((x) => x.method === method)
                .map((x) => ({ ...x, price: x.price_per_kg }))}
              onCreate={({ price, ...range }) =>
                tariffsApi
                  .create({
                    ...range,
                    method,
                    warehouse_id: id,
                    price_per_kg: price,
                  })
                  .then(refresh)
              }
              onUpdate={(tariffId, { price, ...range }) =>
                tariffsApi
                  .update(tariffId, { ...range, price_per_kg: price })
                  .then(refresh)
              }
              onDelete={(tariffId) => tariffsApi.remove(tariffId).then(refresh)}
            />
          ))}
        </div>
      </Main>
    </>
  )
}
