import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { courierTariffsApi, courierTariffsQuery } from '@/api/setup'
import { useWarehouseScope } from '@/hooks/use-warehouse-scope'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'
import { RangePriceList } from '@/components/range-price-list'

/** Courier delivery prices of an Uzbek warehouse, by order weight. */
export function CourierTariffs() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { warehouseId, picker, canEdit } = useWarehouseScope('local')
  const id = warehouseId ?? 0
  const tariffs = useQuery({
    ...courierTariffsQuery(id),
    enabled: !!warehouseId,
  })
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: courierTariffsQuery(id).queryKey,
    })

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.courier_tariffs')}
          description={t('courierTariffs.description')}
        >
          {picker}
        </PageHeading>
        <div className='max-w-2xl'>
          <RangePriceList
            title={t('courierTariffs.title')}
            priceLabel={t('courierTariffs.price')}
            canEdit={canEdit}
            items={tariffs.data}
            onCreate={(v) =>
              courierTariffsApi.create({ ...v, warehouse_id: id }).then(refresh)
            }
            onUpdate={(tariffId, v) =>
              courierTariffsApi.update(tariffId, v).then(refresh)
            }
            onDelete={(tariffId) =>
              courierTariffsApi.remove(tariffId).then(refresh)
            }
          />
        </div>
      </Main>
    </>
  )
}
