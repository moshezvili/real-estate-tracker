'use client'

import { useState, useEffect } from 'react'
import ApartmentForm from '../components/ApartmentForm'
import ApartmentList from '../components/ApartmentList'
import { Apartment } from '../types/apartment'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog'
import dynamic from 'next/dynamic'
const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {

  const [apartments, setApartments] = useState<Apartment[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    const savedApartments = localStorage.getItem('apartments')
    if (savedApartments) {
      setApartments(JSON.parse(savedApartments))
    }
  }, [])

  useEffect(() => {
    if (apartments.length > 0) {
      localStorage.setItem('apartments', JSON.stringify(apartments))
    }
  }, [apartments])

  const handleAddApartment = (apartment: Apartment) => {
    setApartments(prevApartments => [...prevApartments, apartment])
    setIsFormOpen(false)
  }

  const handleRemoveApartment = (id: string) => {
    setApartments(prevApartments => prevApartments.filter(apartment => apartment.id !== id))
  }

  const handleAddNote = (id: string, note: string) => {
    setApartments(prevApartments =>
      prevApartments.map(apartment =>
        apartment.id === id
          ? { ...apartment, notes: [...(apartment.notes || []), note] }
          : apartment
      )
    );
  };

  const handleToggleRelevance = (id: string) => {
    setApartments(prevApartments =>
      prevApartments.map(apartment =>
        apartment.id === id
          ? { ...apartment, isIrrelevant: !apartment.isIrrelevant }
          : apartment
      )
    );
  };

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col" dir='rtl'>
      <h1 className="text-3xl font-bold mb-4 text-center">מעקב דירות להשכרה</h1>
      <div className="flex justify-end mb-4" dir='rtl'>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>הוסף דירה חדשה</Button>
          </DialogTrigger>
          <DialogContent>
            <ApartmentForm onAddApartment={handleAddApartment} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col md:flex-row gap-4 flex-grow">
        <div className="w-full md:w-1/4">
          <ApartmentList 
            apartments={apartments} 
            onRemoveApartment={handleRemoveApartment}
            onAddNote={handleAddNote}
            onToggleRelevance={handleToggleRelevance}
          />
        </div>
        <div className="w-full md:w-3/4 h-full flex-grow">
          <Map apartments={apartments} />
        </div>
      </div>
    </div>
  )
}
