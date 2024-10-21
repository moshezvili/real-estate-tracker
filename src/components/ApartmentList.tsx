import React, { useState } from "react"
import { Apartment } from "@/types/apartment"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Textarea } from "./ui/textarea"
// import { X } from "lucide-react"


interface ApartmentListProps {
  apartments: Apartment[]
  onRemoveApartment: (id: string) => void
  onAddNote: (id: string, note: string) => void
  onToggleRelevance: (id: string) => void
}

export default function ApartmentList({ apartments, onRemoveApartment, onAddNote, onToggleRelevance }: ApartmentListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [currentApartmentId, setCurrentApartmentId] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const generateWhatsAppLink = (apartment: Apartment) => {
    const message = encodeURIComponent(`היי, אני מתעניין בדירה בכתובת ${apartment.address}. האם אפשר לקבל פרטים נוספים?`)
    return `https://wa.me/+972${apartment.contactPhone}?text=${message}`
  }

  const handleAddNote = () => {
    if (currentApartmentId && note.trim()) {
      onAddNote(currentApartmentId, note.trim())
      setNoteDialogOpen(false)
      setNote("")
    }
  }

  const filteredApartments = apartments.filter(apartment =>
    apartment.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apartment.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="mt-8 rtl" dir="rtl">
      <input
        type="text"
        placeholder="חפש..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <h2 className="text-2xl font-bold mb-4">דירות</h2>
      <ul className="space-y-4">
        {filteredApartments.map(apartment => (
          <li key={apartment.id} className={`border rounded ${apartment.isIrrelevant ? 'bg-red-100' : ''}`}>
              <div className="flex justify-center">
                <Button 
                  onClick={() => onToggleRelevance(apartment.id)} 
                  variant={apartment.isIrrelevant ? "outline" : "secondary"}
                >
                  {apartment.isIrrelevant ? 'סמן כרלוונטי' : 'סמן כלא רלוונטי'}
                </Button>
              </div>
            <p><strong>כתובת:</strong> {apartment.address}</p>
            <p><strong>מחיר:</strong> ₪{apartment.price}</p>
            <p><strong>חדרים:</strong> {apartment.rooms}</p>
            <p><strong>גודל:</strong> {apartment.size} מ"ר</p>
            <p><strong>קומה:</strong> {apartment.floor}</p>
            <p><strong>איש קשר:</strong> {apartment.contactName} ({apartment.contactPhone})</p>
            <p><strong>פרטים נוספים:</strong> {apartment.details}</p>
            <div className="mt-2 space-x-2 space-x-reverse">
              <Button onClick={() => onRemoveApartment(apartment.id)} variant="destructive">
                הסר
              </Button>
              <a href={generateWhatsAppLink(apartment)} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                וואטסאפ
              </a>
              <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} >
                <DialogTrigger asChild dir="rtl">
                  <Button onClick={() => setCurrentApartmentId(apartment.id)} variant="outline" dir="rtl">
                    הוסף הערה
                  </Button>
                </DialogTrigger>
                <DialogContent dir="ltr">
                  <DialogHeader dir="rtl" className="text-right">
                    <DialogTitle dir="rtl" className="text-right">הוסף הערה לדירה</DialogTitle>
                  </DialogHeader>
                  <Textarea
                    dir="rtl"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="הכנס הערה כאן..."
                  />
                  <div className="flex justify-between items-center mt-4">
                    <Button onClick={() => setNoteDialogOpen(false)} variant="outline">ביטול</Button>
                    <Button onClick={handleAddNote}>שמור הערה</Button>
                  </div>
                </DialogContent>
              </Dialog>

            </div>
            {apartment.notes && apartment.notes.length > 0 && (
              <div className="mt-2">
                <strong>הערות:</strong>
                <ul className="list-disc list-inside">
                  {apartment.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
