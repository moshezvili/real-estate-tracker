export interface Apartment {
  id: string
  address: string
  contactName: string
  contactPhone: string
  price: number
  rooms: number
  size: number
  floor: number
  details: string
  lat: number
  lng: number
  notes?: string[]
  isIrrelevant?: boolean
}
