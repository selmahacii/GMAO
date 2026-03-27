'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Thermometer,
  Activity,
  Gauge,
  Zap,
  Droplets,
  RotateCw,
  Volume2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Radio,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface Sensor {
  id: string;
  sensorName: string;
  sensorType: string;
  unit: string;
  lastValue: number | null;
  minNormal: number | null;
  maxNormal: number | null;
  warningThresholdLow: number | null;
  warningThresholdHigh: number | null;
  criticalThresholdLow: number | null;
  criticalThresholdHigh: number | null;
  lastReadingAt: string | null;
  active: boolean;
  status: string;
  asset?: { name: string; assetTag: string; criticality: string };
}

const sensorIcons: Record<string, React.ElementType> = {
  temperature: Thermometer,
  vibration: Activity,
  pressure: Gauge,
  current: Zap,
  voltage: Zap,
  rpm: RotateCw,
  humidity: Droplets,
  noise_db: Volume2,
};

const sensorColors: Record<string, string> = {
  temperature: 'text-red-500',
  vibration: 'text-purple-500',
  pressure: 'text-blue-500',
  current: 'text-yellow-500',
  voltage: 'text-orange-500',
  rpm: 'text-green-500',
  humidity: 'text-cyan-500',
  noise_db: 'text-pink-500',
};

export function IoTSupervisionPage() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchSensors = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const res = await fetch(`/api/sensors?${params.toString()}`);
      const data = await res.json();
      // Handle both array and object responses
      if (Array.isArray(data)) {
        setSensors(data);
      } else if (data.error) {
        console.error('API error:', data.error);
        setSensors([]);
      } else {
        setSensors([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch sensors:', err);
      setSensors([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 30000); // Refresh every 30s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchReadings = async (sensorId: string) => {
    try {
      const res = await fetch(`/api/sensors?readings=true&sensorId=${sensorId}`);
      const data = await res.json();
      // Handle both array and object responses
      if (Array.isArray(data)) {
        setReadings(data);
      } else {
        setReadings([]);
      }
    } catch (err) {
      console.error('Failed to fetch readings:', err);
      setReadings([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">CRITIQUE</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">ALERTE</Badge>;
      default: return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">NORMAL</Badge>;
    }
  };

  const getTrendIcon = () => {
    const rand = Math.random();
    if (rand > 0.6) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (rand > 0.3) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  // Ensure sensors is an array before filtering
  const sensorList = Array.isArray(sensors) ? sensors : [];
  const normalSensors = sensorList.filter(s => s.status === 'normal').length;
  const warningSensors = sensorList.filter(s => s.status === 'warning').length;
  const criticalSensors = sensorList.filter(s => s.status === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Supervision IoT</h1>
          <p className="text-gray-500">{sensorList.length} capteurs actifs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSensors}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{normalSensors}</p>
                <p className="text-sm text-gray-500">Normal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warningSensors}</p>
                <p className="text-sm text-gray-500">Alerte</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <WifiOff className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalSensors}</p>
                <p className="text-sm text-gray-500">Critique</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Radio className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sensorList.length}</p>
                <p className="text-sm text-gray-500">Total Capteurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="warning">Alerte</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sensorList.map((sensor) => {
              const Icon = sensorIcons[sensor.sensorType] || Activity;
              const colorClass = sensorColors[sensor.sensorType] || 'text-gray-500';
              
              return (
                <Card 
                  key={sensor.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedSensor?.id === sensor.id ? 'ring-2 ring-green-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedSensor(sensor);
                    fetchReadings(sensor.id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${colorClass}`} />
                        <div>
                          <p className="font-medium text-sm">{sensor.sensorName}</p>
                          <p className="text-xs text-gray-500">{sensor.asset?.name || 'N/A'}</p>
                        </div>
                      </div>
                      {getStatusBadge(sensor.status)}
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold">
                          {sensor.lastValue?.toFixed(1) || '--'}
                          <span className="text-sm text-gray-500 ml-1">{sensor.unit}</span>
                        </p>
                      </div>
                      {getTrendIcon()}
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Min: {sensor.minNormal || '--'}</span>
                        <span>Max: {sensor.maxNormal || '--'}</span>
                      </div>
                      <Progress 
                        value={sensor.lastValue && sensor.maxNormal 
                          ? (sensor.lastValue / sensor.maxNormal) * 100 
                          : 0
                        } 
                        className={`h-1.5 mt-1 ${
                          sensor.status === 'critical' ? 'bg-red-200' : 
                          sensor.status === 'warning' ? 'bg-yellow-200' : 'bg-green-200'
                        }`}
                      />
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Dernière lecture: {sensor.lastReadingAt 
                        ? new Date(sensor.lastReadingAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : 'N/A'
                      }
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Sensor Detail / Chart */}
        <div className="space-y-4">
          {selectedSensor ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedSensor.sensorName}</CardTitle>
                  <CardDescription>{selectedSensor.asset?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={readings.slice(0, 20).reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tick={{ fontSize: 10 }} 
                          tickFormatter={(v) => new Date(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip 
                          labelFormatter={(v) => new Date(v).toLocaleString('fr-FR')}
                          formatter={(v: number) => [`${v.toFixed(2)} ${selectedSensor.unit}`, 'Valeur']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Seuils</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500">Critique haut:</span>
                    <span>{selectedSensor.criticalThresholdHigh || '--'} {selectedSensor.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-500">Alerte haut:</span>
                    <span>{selectedSensor.warningThresholdHigh || '--'} {selectedSensor.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500">Normal:</span>
                    <span>{selectedSensor.minNormal || '--'} - {selectedSensor.maxNormal || '--'} {selectedSensor.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-500">Alerte bas:</span>
                    <span>{selectedSensor.warningThresholdLow || '--'} {selectedSensor.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500">Critique bas:</span>
                    <span>{selectedSensor.criticalThresholdLow || '--'} {selectedSensor.unit}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez un capteur pour voir les détails</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
