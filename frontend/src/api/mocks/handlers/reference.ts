import { delay, http, HttpResponse } from 'msw'
import { API_URL } from '../../config'
import { type CountryPayload, type WarehousePayload } from '../../reference'
import { countries, nextId, warehouses } from '../db'
import { fieldError, guard, notFound } from '../utils'

const STAFF = ['super_admin', 'admin', 'worker'] as const

export const referenceHandlers = [
  // Every staff member needs the lists (forms, filters); only super_admin edits
  http.get(`${API_URL}/countries/`, async ({ request }) => {
    await delay()
    const { error } = guard(request, [...STAFF])
    return error ?? HttpResponse.json(countries)
  }),

  http.post(`${API_URL}/countries/`, async ({ request }) => {
    await delay()
    const { error } = guard(request, ['super_admin'])
    if (error) return error
    const data = (await request.json()) as CountryPayload
    const code = data.code.toUpperCase()
    if (countries.some((c) => c.code === code)) {
      return fieldError('code', 'Страна с таким кодом уже существует.')
    }
    const country = { ...data, code, id: nextId(countries) }
    countries.push(country)
    return HttpResponse.json(country, { status: 201 })
  }),

  http.patch(`${API_URL}/countries/:id/`, async ({ request, params }) => {
    await delay()
    const { error } = guard(request, ['super_admin'])
    if (error) return error
    const country = countries.find((c) => c.id === Number(params.id))
    if (!country) return notFound()
    const data = (await request.json()) as Partial<CountryPayload>
    if (data.code) {
      data.code = data.code.toUpperCase()
      if (countries.some((c) => c.code === data.code && c.id !== country.id)) {
        return fieldError('code', 'Страна с таким кодом уже существует.')
      }
    }
    Object.assign(country, data)
    return HttpResponse.json(country)
  }),

  http.get(`${API_URL}/warehouses/`, async ({ request }) => {
    await delay()
    const { error } = guard(request, [...STAFF])
    return error ?? HttpResponse.json(warehouses)
  }),

  http.post(`${API_URL}/warehouses/`, async ({ request }) => {
    await delay()
    const { error } = guard(request, ['super_admin'])
    if (error) return error
    const data = (await request.json()) as WarehousePayload
    const warehouse = { ...data, id: nextId(warehouses) }
    warehouses.push(warehouse)
    return HttpResponse.json(warehouse, { status: 201 })
  }),

  http.patch(`${API_URL}/warehouses/:id/`, async ({ request, params }) => {
    await delay()
    const { error } = guard(request, ['super_admin'])
    if (error) return error
    const warehouse = warehouses.find((w) => w.id === Number(params.id))
    if (!warehouse) return notFound()
    Object.assign(
      warehouse,
      (await request.json()) as Partial<WarehousePayload>
    )
    return HttpResponse.json(warehouse)
  }),
]
