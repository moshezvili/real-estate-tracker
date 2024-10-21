import React, { useState } from 'react'
import { Apartment } from '../types/apartment'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface ApartmentFormProps {
  onAddApartment: (apartment: Apartment) => void
}

export default function ApartmentForm({ onAddApartment }: ApartmentFormProps) {
  const [apartment, setApartment] = useState<Omit<Apartment, 'id' | 'lat' | 'lng'>>({
    address: '',
    contactName: '',
    contactPhone: '',
    price: 0,
    rooms: 0,
    size: 0,
    floor: 0,
    details: '',
  })
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Geocode the address using Nominatim API
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(apartment.address)}`)
    const data = await response.json()
    
    if (data && data[0]) {
      const newApartment: Apartment = {
        ...apartment,
        id: Date.now().toString(),
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
      onAddApartment(newApartment)
      setApartment({
        address: '',
        contactName: '',
        contactPhone: '',
        price: 0,
        rooms: 0,
        size: 0,
        floor: 0,
        details: '',
      })
    } else {
      alert('Could not find coordinates for the given address')
    }
  }

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setApartment(prev => ({ ...prev, address: value }))

    if (value.length > 3) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&accept-language=he`
        )
        const data = await response.json()
        const suggestions = data.map((item: any) => item.display_name)
        setAddressSuggestions(suggestions.slice(0, 5))
      } catch (error) {
        console.error('Error fetching address suggestions:', error)
      }
    } else {
      setAddressSuggestions([])
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setApartment(prev => ({ ...prev, address: suggestion }))
    setAddressSuggestions([])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setApartment(prev => ({ ...prev, [name]: name === 'price' || name === 'rooms' || name === 'size' || name === 'floor' ? Number(value) : value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir='rtl'>
      <div className="relative">
        <Label htmlFor="address">כתובת</Label>
        <Input
          id="address"
          name="address"
          value={apartment.address}
          onChange={handleAddressChange}
          required
        />
        {addressSuggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border rounded shadow-md max-h-60 overflow-y-auto">
            {addressSuggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <Label htmlFor="contactName">שם איש קשר</Label>
        <Input
          id="contactName"
          name="contactName"
          value={apartment.contactName}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="contactPhone">טלפון איש קשר</Label>
        <Input
          id="contactPhone"
          name="contactPhone"
          value={apartment.contactPhone}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="price">מחיר</Label>
        <Input
          id="price"
          name="price"
          type="number"
          value={apartment.price}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="rooms">מספר חדרים</Label>
        <Input
          id="rooms"
          name="rooms"
          type="number"
          value={apartment.rooms}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="size">גודל במ"ר</Label>
        <Input
          id="size"
          name="size"
          type="number"
          value={apartment.size}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="floor">קומ��</Label>
        <Input
          id="floor"
          name="floor"
          type="number"
          value={apartment.floor}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="details">פרטים נוספים</Label>
        <textarea
          id="details"
          name="details"
          value={apartment.details}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <Button type="submit">הוסף דירה</Button>
    </form>
  )
}
