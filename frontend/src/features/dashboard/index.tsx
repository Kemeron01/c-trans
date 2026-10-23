import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dashboardQuery } from '@/api/analytics'
import { warehousesQuery } from '@/api/reference'
import { type DashboardStats, type OrderStatus } from '@/api/types'
import {
  formatDate,
  formatNumber,
  formatUsd,
  formatUzs,
  todayLocal,
} from '@/lib/format'
import { ORDER_STATUSES } from '@/lib/order-flow'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'

type Period = 'day' | 'week' | 'month' | 'custom'

function shift(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

/** Section 12: active orders and orders / revenue for a period. */
export function Dashboard() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const isSuper = user.role === 'super_admin'
  const today = todayLocal()
  const [period, setPeriod] = useState<Period>('month')
  const [custom, setCustom] = useState({ from: shift(today, -6), to: today })
  const [warehouse, setWarehouse] = useState('all')
  const warehouses = useQuery({ ...warehousesQuery(), enabled: isSuper })

  const range =
    period === 'day'
      ? { from: today, to: today }
      : period === 'week'
        ? { from: shift(today, -6), to: today }
        : period === 'month'
          ? { from: shift(today, -29), to: today }
          : custom
  const params = {
    ...range,
    ...(isSuper && warehouse !== 'all' ? { warehouse: Number(warehouse) } : {}),
  }
  const { data, isLoading } = useQuery({
    ...dashboardQuery(params),
    enabled: range.from <= range.to,
  })

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.dashboard')}
          description={
            isSuper
              ? t('dashboard.descriptionAll')
              : t('dashboard.description', {
                  warehouse: user.warehouse?.name ?? '',
                })
          }
        />
        {/* Filters: one row above the charts */}
        <div className='flex flex-wrap items-center gap-2'>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              {(['day', 'week', 'month', 'custom'] as const).map((p) => (
                <TabsTrigger key={p} value={p}>
                  {t(`dashboard.period.${p}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {period === 'custom' && (
            <div className='flex items-center gap-2'>
              <Input
                type='date'
                aria-label={t('dashboard.from')}
                value={custom.from}
                max={custom.to}
                onChange={(e) =>
                  setCustom((c) => ({ ...c, from: e.target.value }))
                }
                className='w-40'
              />
              <span className='text-muted-foreground'>—</span>
              <Input
                type='date'
                aria-label={t('dashboard.to')}
                value={custom.to}
                min={custom.from}
                onChange={(e) =>
                  setCustom((c) => ({ ...c, to: e.target.value }))
                }
                className='w-40'
              />
            </div>
          )}
          {isSuper && (
            <Select value={warehouse} onValueChange={setWarehouse}>
              <SelectTrigger className='w-48' aria-label={t('staff.warehouse')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('common.allWarehouses')}</SelectItem>
                {warehouses.data?.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading || !data ? (
          <Skeleton className='h-96 w-full' />
        ) : (
          <DashboardView data={data} />
        )}
      </Main>
    </>
  )
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card className='gap-1 py-4'>
      <CardContent className='px-4'>
        <div className='text-sm text-muted-foreground'>{label}</div>
        <div className='text-2xl font-bold tabular-nums'>{value}</div>
        {hint && <div className='text-xs text-muted-foreground'>{hint}</div>}
      </CardContent>
    </Card>
  )
}

function DashboardView({ data }: { data: DashboardStats }) {
  const { t } = useTranslation()
  const active = ORDER_STATUSES.filter((s) => data.active_by_status[s])
  const activeTotal = active.reduce(
    (sum, s) => sum + (data.active_by_status[s] ?? 0),
    0
  )
  const max = Math.max(1, ...active.map((s) => data.active_by_status[s] ?? 0))
  const chartData = data.series.map((p) => ({
    ...p,
    label: formatDate(p.date),
  }))

  return (
    <>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatTile
          label={t('dashboard.ordersCount')}
          value={formatNumber(data.orders_count)}
        />
        <StatTile
          label={t('dashboard.revenueUsd')}
          value={formatUsd(data.revenue_usd)}
        />
        <StatTile
          label={t('dashboard.revenueUzs')}
          value={formatUzs(data.revenue_uzs)}
        />
        <StatTile
          label={t('dashboard.active')}
          value={formatNumber(activeTotal)}
          hint={t('dashboard.activeHint')}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <SeriesChart
          title={t('dashboard.revenueByDay')}
          data={chartData}
          dataKey='revenue_usd'
          format={(v) => formatUsd(v)}
          axisFormat={(v) => formatUsd(v).replace(/[.,]00(?=\D*$)/, '')}
        />
        <SeriesChart
          title={t('dashboard.ordersByDay')}
          data={chartData}
          dataKey='orders'
          format={(v) => formatNumber(v)}
          axisFormat={(v) => formatNumber(v)}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.activeByStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            {active.length ? (
              <ul className='grid gap-2'>
                {active.map((s: OrderStatus) => {
                  const n = data.active_by_status[s] ?? 0
                  return (
                    <li
                      key={s}
                      className='grid grid-cols-[minmax(8rem,12rem)_1fr_auto] items-center gap-3 text-sm'
                    >
                      <span className='truncate'>{t(`orderStatus.${s}`)}</span>
                      <span className='h-2 rounded-full bg-muted'>
                        <span
                          className='block h-2 rounded-full'
                          style={{
                            width: `${(n / max) * 100}%`,
                            background: 'var(--chart-series)',
                          }}
                        />
                      </span>
                      <span className='w-8 text-end tabular-nums'>{n}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {t('dashboard.noActive')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Table view of the charts (accessibility, exact numbers) */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.table')}</CardTitle>
          </CardHeader>
          <CardContent className='max-h-72 overflow-y-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('catalog.date')}</TableHead>
                  <TableHead className='text-end'>
                    {t('dashboard.ordersCount')}
                  </TableHead>
                  <TableHead className='text-end'>
                    {t('dashboard.revenueUsd')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...data.series].reverse().map((p) => (
                  <TableRow key={p.date}>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell className='text-end tabular-nums'>
                      {p.orders}
                    </TableCell>
                    <TableCell className='text-end tabular-nums'>
                      {formatUsd(p.revenue_usd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function SeriesChart({
  title,
  data,
  dataKey,
  format,
  axisFormat,
}: {
  title: string
  data: (DashboardStats['series'][number] & { label: string })[]
  dataKey: 'orders' | 'revenue_usd'
  format: (value: number) => string
  /** Shorter tick labels (no cents). */
  axisFormat: (value: number) => string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='h-64'>
        <ResponsiveContainer
          width='100%'
          height='100%'
          // Avoids the -1×-1 measurement warning before layout
          initialDimension={{ width: 480, height: 256 }}
        >
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke='var(--border)' />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              fontSize={12}
              minTickGap={24}
              stroke='var(--muted-foreground)'
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={64}
              allowDecimals={false}
              tickFormatter={(v: number) => axisFormat(v)}
              stroke='var(--muted-foreground)'
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
              formatter={(v) => [format(Number(v)), title]}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--popover-foreground)',
              }}
              // Text wears text tokens, not the series color
              itemStyle={{ color: 'var(--popover-foreground)' }}
            />
            <Bar
              dataKey={dataKey}
              fill='var(--chart-series)'
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
