import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GeographicalData {
  state: string;
  lat: number;
  lng: number;
  riskLevel: number;
  fraudCount: number;
}

interface GeographicalHeatMapProps {
  data: GeographicalData[];
}

const GeographicalHeatMap: React.FC<GeographicalHeatMapProps> = ({ data }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isTokenSet, setIsTokenSet] = useState(false);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setIsTokenSet(true);
      initializeMap();
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 3.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // Add fraud data points
      data.forEach((point) => {
        const el = document.createElement('div');
        el.className = 'fraud-marker';
        el.style.backgroundColor = getRiskColor(point.riskLevel);
        el.style.width = `${Math.max(10, point.fraudCount / 5)}px`;
        el.style.height = `${Math.max(10, point.fraudCount / 5)}px`;
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <h3 class="font-semibold">${point.state}</h3>
            <p>Risk Level: ${point.riskLevel}/10</p>
            <p>Fraud Cases: ${point.fraudCount}</p>
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([point.lng, point.lat])
          .setPopup(popup)
          .addTo(map.current!);
      });
    });
  };

  const getRiskColor = (riskLevel: number): string => {
    if (riskLevel >= 8) return '#dc2626'; // High risk - red
    if (riskLevel >= 6) return '#ea580c'; // Medium-high risk - orange
    if (riskLevel >= 4) return '#ca8a04'; // Medium risk - yellow
    return '#16a34a'; // Low risk - green
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isTokenSet) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Mapbox Configuration Required</CardTitle>
          <CardDescription>
            Please enter your Mapbox public token to view the geographical heat map.
            Get your token from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <Input
              id="mapbox-token"
              type="password"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
          </div>
          <Button onClick={handleTokenSubmit} disabled={!mapboxToken.trim()}>
            Initialize Map
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm">Low Risk (0-4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm">Medium Risk (4-6)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-sm">High Risk (6-8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm">Critical Risk (8+)</span>
          </div>
        </div>
      </div>
      
      <div ref={mapContainer} className="w-full h-96 rounded-lg border" />
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        {data.map((point, index) => (
          <div key={index} className="p-3 border rounded-lg space-y-1">
            <div className="font-semibold">{point.state}</div>
            <div className="text-muted-foreground">Risk: {point.riskLevel}/10</div>
            <div className="text-muted-foreground">Cases: {point.fraudCount}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeographicalHeatMap;