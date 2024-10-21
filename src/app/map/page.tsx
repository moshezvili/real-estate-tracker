'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import dynamic from 'next/dynamic'
import { UploadIcon } from 'lucide-react'
import { parse } from 'papaparse'

const Map = dynamic(() => import('./map'), { ssr: false })

interface AlertData {
  date: Date;
  title: string;
  location: string;
  category: string;
  lat: number;
  lon: number;
}

export default function MissileAlertApp() {
  const [alertData, setAlertData] = useState<AlertData[]>([])
  const [filteredAlertData, setFilteredAlertData] = useState<AlertData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coordData, setCoordData] = useState<Record<string, [number, number]>>({})
  const [showMarkers, setShowMarkers] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const today = new Date();
  const [fromDate, setFromDate] = useState(today.toLocaleDateString('en-GB').split('/').reverse().join('.'));
  const [toDate, setToDate] = useState(today.toLocaleDateString('en-GB').split('/').reverse().join('.'));

  const fetchAlertData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/alerts?fromDate=${fromDate}&toDate=${toDate}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      const processedData = processAlertData(json);
      setAlertData(processedData);
    } catch (err) {
      console.error("Failed to fetch alert data:", err);
      setError("Failed to fetch alert data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadCoordData();
  }, []);

  const filteredData = useMemo(() => {
    return selectedCategory === 'all'
      ? alertData
      : alertData.filter(alert => alert.category === selectedCategory);
  }, [alertData, selectedCategory]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLoading(true)
      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string)
          const processedData = processAlertData(json)
          setAlertData(processedData)
        } catch (err) {
          console.error("Failed to parse JSON:", err)
          setError("Failed to parse the uploaded file. Please ensure it's a valid JSON file.")
        } finally {
          setLoading(false)
        }
      }
      reader.onerror = () => {
        setError("An error occurred while reading the file.")
        setLoading(false)
      }
      reader.readAsText(file)
    }
  }

  const loadCoordData = async () => {
    try {
      const response = await fetch('/coord.csv')
      const csvText = await response.text()
      const { data } = parse(csvText, { header: true })
      const coordMap: Record<string, [number, number]> = {}
      data.forEach((row: any) => {
        coordMap[row.loc] = [parseFloat(row.lat), parseFloat(row.long)]
      })
      setCoordData(coordMap)
    } catch (error) {
      console.error('Error loading coord.csv:', error)
      setError('Failed to load coordinate data.')
    }
  }

  const processAlertData = (data: any[]): AlertData[] => {
    return data.map(alert => {
      try {
        const [lat, lon] = coordData[alert.data] || [null, null];
        return {
          date: new Date(alert.alertDate),
          title: alert.title,
          location: alert.data,
          category: getCategoryName(alert.category),
          lat: lat,
          lon: lon
        };
      } catch (error) {
        console.error(`Error processing alert: ${error}`);
        return null;
      }
    }).filter(alert => alert !== null) as AlertData[];
  }

  const getCategoryName = (category: number): string => {
    switch (category) {
      case 1:
        return "Rocket/Missile Fire"
      case 2:
        return "Hostile Aircraft Intrusion"
      default:
        return "Unknown"
    }
  }

  const renderList = useCallback(() => {
    return filteredData.slice(0, 100).map((alert, index) => (
      <Card key={index} className="mb-4">
        <CardHeader>
          <CardTitle>{alert.title}</CardTitle>
          <CardDescription>{alert.date.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</CardDescription>
        </CardHeader>
        <CardContent>
          <p><strong>Location:</strong> {alert.location}</p>
          <p><strong>Category:</strong> {alert.category}</p>
          <p><strong>Latitude:</strong> {alert.lat}</p>
          <p><strong>Longitude:</strong> {alert.lon}</p>
        </CardContent>
      </Card>
    ));
  }, [filteredData]);

  const renderContent = useCallback(() => {
    if (loading) {
      return <div className="text-center p-4">Loading...</div>
    }
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    }
    if (filteredData.length === 0) {
      return <div className="text-center p-4">No data available. Please fetch data or adjust filters.</div>
    }
    return (
      <div className="flex space-x-4">
        <div className="w-1/2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {renderList()}
        </div>
        <div className="w-1/2">
          <Map 
            alertData={filteredData} 
            showMarkers={showMarkers} 
            showHeatmap={showHeatmap} 
          />
        </div>
      </div>
    )
  }, [loading, error, filteredData, showMarkers, showHeatmap]);

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(formatDate(e.target.value));
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(formatDate(e.target.value));
  };

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Israel Missile Alert History</CardTitle>
          <CardDescription>View recent alert data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                type="date"
                id="fromDate"
                onChange={handleFromDateChange}
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                type="date"
                id="toDate"
                onChange={handleToDateChange}
                defaultValue={new Date().toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex flex-col space-y-2">
            <Label htmlFor="fileUpload">Upload:</Label>

            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <UploadIcon className="mr-2 h-4 w-4" /> Upload JSON
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              style={{ display: 'none' }}
            />
            </div>
            <div className="flex flex-col space-y-2">
            <Label htmlFor="toDate">Filter:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Rocket/Missile Fire">Rocket/Missile Fire</SelectItem>
                <SelectItem value="Hostile Aircraft Intrusion">Hostile Aircraft Intrusion</SelectItem>
                <SelectItem value="Unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>
          <div className="flex items-center space-x-4 mb-4">
            <Button onClick={fetchAlertData} variant="outline">
              Fetch Data
            </Button>
            <Button onClick={() => setAlertData([])} variant="outline">
              Clear Data
            </Button>
            </div>
            <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-markers" 
                checked={showMarkers} 
                onCheckedChange={(checked) => setShowMarkers(checked as boolean)}
              />
              <Label htmlFor="show-markers">Show Markers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-heatmap" 
                checked={showHeatmap} 
                onCheckedChange={(checked) => setShowHeatmap(checked as boolean)}
              />
              <Label htmlFor="show-heatmap">Show Heatmap</Label>
            </div>
          </div>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}
