import api from './client'

export interface TerritoryNode {
  id: string
  name: string
  type: string
  states?: string | null
  cities?: string | null
  rmId?: string | null
  coverage: string
  isActive: boolean
  children?: TerritoryNode[]
}

export async function getTerritoryTree(): Promise<TerritoryNode[]> {
  const res = await api.get('/territory-intelligence/tree')
  return res.data
}

export async function getTerritoryCoverage() {
  const res = await api.get('/territory-intelligence/coverage')
  return res.data
}

export async function createTerritory(data: {
  name: string
  type: string
  parentId?: string
  states?: string
  cities?: string
  rmId?: string
}) {
  const res = await api.post('/territory-intelligence', data)
  return res.data
}

export async function updateTerritory(id: string, data: Record<string, unknown>) {
  const res = await api.patch(`/territory-intelligence/${id}`, data)
  return res.data
}
