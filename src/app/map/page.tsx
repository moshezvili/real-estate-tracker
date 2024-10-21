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
import { UploadIcon, DownloadIcon } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coordData, setCoordData] = useState<Record<string, [number, number]>>({})
  const [showMarkers, setShowMarkers] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const [fromDate, setFromDate] = useState(yesterday.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.'));
  const [toDate, setToDate] = useState(today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('.'));
  const [rawData, setRawData] = useState<any[]>([])
  const [coordDataLoaded, setCoordDataLoaded] = useState(false);

  useEffect(() => {
    loadCoordData();
  }, []);

  useEffect(() => {
    if (coordDataLoaded) {
      fetchAlertData();
    }
  }, [coordDataLoaded]);

  const fetchAlertData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/alerts?fromDate=${fromDate}&toDate=${toDate}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      setRawData(json);
      const processedData = processAlertData(json);
      setAlertData(processedData);
    } catch (err) {
      console.error("Failed to fetch alert data:", err);
      setError("Failed to fetch alert data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, coordData]);

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
      setCoordDataLoaded(true)
    } catch (error) {
      console.error('Error loading coord.csv:', error)
      setError('Failed to load coordinate data.')
    }
  }

  const processAlertData = useCallback((data: any[]): AlertData[] => {
    return data.flatMap(alert => {
      try {
        const processLocation = (location: string): AlertData | null => {
          const [lat, lon] = coordData[location] || [null, null];
          if (lat === null || lon === null) {
            return null;
          }
          return {
            date: new Date(alert.alertDate),
            title: alert.title,
            location: location,
            category: getCategoryName(alert.category),
            lat: lat,
            lon: lon
          };
        };

        // First, try processing the entire location string
        const fullLocationResult = processLocation(alert.data.trim());
        if (fullLocationResult) {
          return [fullLocationResult];
        }

        // If that fails, split the string and try individual locations
        const locations = alert.data.split(',').map((loc: string) => loc.trim());
        const results = locations.map(processLocation).filter(Boolean);

        if (results.length === 0) {
          console.warn(`No coordinates found for any location in: ${alert.data}`);
        }

        return results;
      } catch (error) {
        console.error(`Error processing alert: ${error}`);
        return null;
      }
    }).filter(alert => alert !== null) as AlertData[];
  }, [coordData]);

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

  const renderStats = useMemo(() => {
    if (filteredData.length === 0) {
      return <p>No data available</p>;
    }

    const totalAlerts = filteredData.length;
    const categoryCounts = filteredData.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationCounts = filteredData.reduce((acc, alert) => {
      acc[alert.location] = (acc[alert.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const dateRange = {
      start: new Date(Math.min(...filteredData.map(a => a.date.getTime()))),
      end: new Date(Math.max(...filteredData.map(a => a.date.getTime())))
    };

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Alert Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Total Alerts:</strong> {totalAlerts}</p>
          <p><strong>Date Range:</strong> {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}</p>
          <div className="mt-4">
            <strong>Alerts by Category:</strong>
            <ul>
              {Object.entries(categoryCounts).map(([category, count]) => (
                <li key={category}>{category}: {count}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <strong>Top 5 Locations:</strong>
            <ul>
              {topLocations.map(([location, count]) => (
                <li key={location}>{location}: {count}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }, [filteredData]);

  const renderContent = () => {
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
        <div className="w-1/4">
          {renderStats}
        </div>
        <div className="w-3/4">
          <Map 
            alertData={filteredData} 
            showMarkers={showMarkers} 
            showHeatmap={showHeatmap} 
          />
        </div>
      </div>
    )
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(formatDate(e.target.value));
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(formatDate(e.target.value));
  };

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(rawData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'raw_alert_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

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
                defaultValue={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
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
            <Button onClick={() => {setAlertData([]); setRawData([]);}} variant="outline">
              Clear Data
            </Button>
            <Button onClick={handleDownloadJSON} variant="outline" disabled={rawData.length === 0}>
              <DownloadIcon className="mr-2 h-4 w-4" /> Download JSON
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
