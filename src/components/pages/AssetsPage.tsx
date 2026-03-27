'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import {
  Plus,
  Search,
  TreeDeciduous,
  Map,
  List,
  Settings,
  AlertTriangle,
  Activity,
  Clock,
  Battery,
  Thermometer,
  Zap,
  Gauge,
  Building2,
  Factory,
  Warehouse,
  Edit,
  Eye,
  Wrench,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Droplets,
  Volume2,
  RotateCw,
  Loader2,
  History,
  Sensor,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  description?: string;
  status: string;
  criticality: string;
  assetType: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  yearManufactured?: number;
  yearInstalled?: number;
  locationZone?: string;
  locationFloor?: string;
  locationRoom?: string;
  gpsLat?: number;
  gpsLng?: number;
  purchasePriceDzd?: number;
  replacementCostDzd?: number;
  warrantyExpiryDate?: string;
  expectedLifespanYears?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceCountTotal: number;
  operatingHoursTotal: number;
  operatingHoursSinceLastPm: number;
  mtbfHours?: number;
  mttrHours?: number;
  availabilityPct?: number;
  oeeScore?: number;
  healthScore?: number;
  category?: { name: string };
  site?: { name: string };
  sensors?: Array<{ 
    id: string; 
    sensorName: string;
    sensorType: string; 
    lastValue: number | null; 
    unit: string;
    status: string;
  }>;
  workOrders?: Array<{
    id: string;
    woNumber: string;
    title: string;
    status: string;
    priority: string;
    woType: string;
    createdAt: string;
    completedAt?: string;
    actualDurationHours?: number;
  }>;
  _count?: { workOrders: number; sensors: number };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  operational: { label: 'Opérationnel', color: 'bg-green-500' },
  degraded: { label: 'Dégradé', color: 'bg-yellow-500' },
  under_maintenance: { label: 'En maintenance', color: 'bg-blue-500' },
  out_of_service: { label: 'Hors service', color: 'bg-red-500' },
  decommissioned: { label: 'Déclassé', color: 'bg-gray-500' },
};

const criticalityConfig: Record<string, { label: string; color: string }> = {
  A: { label: 'Critique', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  B: { label: 'Important', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  C: { label: 'Standard', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

const assetTypes: Record<string, { label: string; icon: React.ElementType }> = {
  rotating: { label: 'Tournant', icon: RotateCw },
  static: { label: 'Statique', icon: Settings },
  electrical: { label: 'Électrique', icon: Zap },
  hvac: { label: 'HVAC', icon: Thermometer },
  fluid: { label: 'Fluides', icon: Droplets },
};

const initialFormData = {
  name: '',
  assetTag: '',
  description: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  criticality: 'C',
  assetType: 'static',
  status: 'operational',
  locationZone: '',
  locationFloor: '',
  locationRoom: '',
  purchasePriceDzd: '',
  expectedLifespanYears: '',
  yearInstalled: '',
};

export function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [view, setView] = useState<'grid' | 'tree' | 'topology'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (criticalityFilter !== 'all') params.append('criticality', criticalityFilter);
      
      const res = await fetch(`/api/assets?${params.toString()}`);
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : (data.assets || []));
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
      setAssets([]);
      setLoading(false);
    }
  };

  const fetchAssetDetails = async (assetId: string) => {
    try {
      const res = await fetch(`/api/assets?id=${assetId}`);
      const data = await res.json();
      setSelectedAsset(data);
    } catch (err) {
      console.error('Failed to fetch asset details:', err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [statusFilter, criticalityFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.assetTag) {
      toast({
        title: 'Erreur',
        description: 'Le nom et le tag sont obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      toast({
        title: 'Succès',
        description: `Équipement "${data.name}" créé avec succès`,
      });

      setCreateDialogOpen(false);
      setFormData(initialFormData);
      fetchAssets();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getHealthColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.operational;
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const getCriticalityBadge = (criticality: string) => {
    const config = criticalityConfig[criticality] || criticalityConfig.C;
    return <Badge className={config.color}>{criticality}</Badge>;
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="h-4 w-4 text-red-500" />;
      case 'vibration': return <Activity className="h-4 w-4 text-purple-500" />;
      case 'pressure': return <Gauge className="h-4 w-4 text-blue-500" />;
      case 'current': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'humidity': return <Droplets className="h-4 w-4 text-cyan-500" />;
      case 'noise_db': return <Volume2 className="h-4 w-4 text-orange-500" />;
      case 'rpm': return <RotateCw className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSensorStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  const assetList = Array.isArray(assets) ? assets : [];
  const filteredAssets = assetList.filter(a => 
    search === '' || 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.assetTag.toLowerCase().includes(search.toLowerCase())
  );

  // Mock health trend data
  const healthTrendData = [
    { date: 'J-7', health: 85 },
    { date: 'J-6', health: 82 },
    { date: 'J-5', health: 78 },
    { date: 'J-4', health: 75 },
    { date: 'J-3', health: 72 },
    { date: 'J-2', health: 68 },
    { date: 'J-1', health: 72 },
    { date: 'J0', health: selectedAsset?.healthScore || 75 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Registre des Équipements</h1>
          <p className="text-gray-500">{assetList.length} actifs au total</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel Équipement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un Équipement</DialogTitle>
              <DialogDescription>
                Enregistrez un nouvel équipement dans le système
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assetTag">Tag Équipement *</Label>
                  <Input
                    id="assetTag"
                    value={formData.assetTag}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    placeholder="EQ-001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Pompe Centrifuge P12"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'équipement..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="manufacturer">Fabricant</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Grundfos"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Modèle</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="CR 45-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Catégorie</Label>
                  <Select value={formData.criticality} onValueChange={(v) => setFormData({ ...formData, criticality: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Criticalité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Critique</SelectItem>
                      <SelectItem value="B">B - Important</SelectItem>
                      <SelectItem value="C">C - Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={formData.assetType} onValueChange={(v) => setFormData({ ...formData, assetType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rotating">Tournant</SelectItem>
                      <SelectItem value="static">Statique</SelectItem>
                      <SelectItem value="electrical">Électrique</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="fluid">Fluides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Statut</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Opérationnel</SelectItem>
                      <SelectItem value="degraded">Dégradé</SelectItem>
                      <SelectItem value="under_maintenance">En maintenance</SelectItem>
                      <SelectItem value="out_of_service">Hors service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="locationZone">Zone</Label>
                  <Input
                    id="locationZone"
                    value={formData.locationZone}
                    onChange={(e) => setFormData({ ...formData, locationZone: e.target.value })}
                    placeholder="Zone A"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="locationFloor">Étage</Label>
                  <Input
                    id="locationFloor"
                    value={formData.locationFloor}
                    onChange={(e) => setFormData({ ...formData, locationFloor: e.target.value })}
                    placeholder="RDC"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="locationRoom">Local</Label>
                  <Input
                    id="locationRoom"
                    value={formData.locationRoom}
                    onChange={(e) => setFormData({ ...formData, locationRoom: e.target.value })}
                    placeholder="Local 12"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="purchasePriceDzd">Prix d'achat (DA)</Label>
                  <Input
                    id="purchasePriceDzd"
                    type="number"
                    value={formData.purchasePriceDzd}
                    onChange={(e) => setFormData({ ...formData, purchasePriceDzd: e.target.value })}
                    placeholder="15000000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="yearInstalled">Année installation</Label>
                  <Input
                    id="yearInstalled"
                    type="number"
                    value={formData.yearInstalled}
                    onChange={(e) => setFormData({ ...formData, yearInstalled: e.target.value })}
                    placeholder="2020"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expectedLifespanYears">Durée vie (ans)</Label>
                  <Input
                    id="expectedLifespanYears"
                    type="number"
                    value={formData.expectedLifespanYears}
                    onChange={(e) => setFormData({ ...formData, expectedLifespanYears: e.target.value })}
                    placeholder="15"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Annuler</Button>
                </DialogClose>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer l\'équipement'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher équipements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.entries(statusConfig).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Criticalité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="A">A - Critique</SelectItem>
            <SelectItem value="B">B - Important</SelectItem>
            <SelectItem value="C">C - Standard</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-lg">
          <Button variant={view === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setView('grid')} className="rounded-r-none">
            <List className="h-4 w-4" />
          </Button>
          <Button variant={view === 'tree' ? 'default' : 'ghost'} size="sm" onClick={() => setView('tree')} className="rounded-none border-x">
            <TreeDeciduous className="h-4 w-4" />
          </Button>
          <Button variant={view === 'topology' ? 'default' : 'ghost'} size="sm" onClick={() => setView('topology')} className="rounded-l-none">
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <Card 
              key={asset.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow" 
              onClick={() => {
                setSelectedAsset(asset);
                fetchAssetDetails(asset.id);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-mono">{asset.assetTag}</p>
                      <CardTitle className="text-sm">{asset.name}</CardTitle>
                    </div>
                  </div>
                  {getCriticalityBadge(asset.criticality)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  {getStatusBadge(asset.status)}
                  <span className="text-xs text-gray-500">{asset.category?.name || 'N/A'}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Santé</span>
                    <span className={getHealthColor(asset.healthScore)}>{asset.healthScore?.toFixed(0) || 0}%</span>
                  </div>
                  <Progress value={asset.healthScore || 0} className="h-1.5" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>MTBF: {asset.mtbfHours?.toFixed(0) || '-'}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>Disp: {asset.availabilityPct?.toFixed(1) || '-'}%</span>
                  </div>
                </div>

                {asset.sensors && asset.sensors.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {asset.sensors.slice(0, 3).map((s) => (
                      <Badge key={s.id} variant="outline" className="text-xs">
                        {getSensorIcon(s.sensorType)}
                        <span className="ml-1">{s.lastValue?.toFixed(1) || '-'}{s.unit}</span>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-between text-xs text-gray-400 pt-2 border-t">
                  <span>{asset._count?.workOrders || 0} OTs</span>
                  <span>{asset._count?.sensors || 0} capteurs</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tree View */}
      {view === 'tree' && (
        <Card>
          <CardHeader>
            <CardTitle>Arborescence des Équipements</CardTitle>
            <CardDescription>Hiérarchie Site → Zone → Équipement</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="text-center py-12 text-gray-500">
                <TreeDeciduous className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Vue arborescente</p>
                <p className="text-sm">Organisation hiérarchique des équipements</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Topology View */}
      {view === 'topology' && (
        <Card>
          <CardHeader>
            <CardTitle>Carte Topologique</CardTitle>
            <CardDescription>Visualisation des connexions entre équipements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Carte topologique D3.js</p>
                <p className="text-sm">Graphe de dépendances des équipements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asset Detail Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Détails Équipement
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Settings className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">{selectedAsset.name}</h3>
                    {getCriticalityBadge(selectedAsset.criticality)}
                    {getStatusBadge(selectedAsset.status)}
                  </div>
                  <p className="text-sm text-gray-500 font-mono">{selectedAsset.assetTag}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAsset.manufacturer} {selectedAsset.model}
                  </p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedAsset.availabilityPct?.toFixed(1) || '-'}%
                    </p>
                    <p className="text-xs text-gray-500">Disponibilité</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedAsset.mtbfHours?.toFixed(0) || '-'}h
                    </p>
                    <p className="text-xs text-gray-500">MTBF</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {selectedAsset.mttrHours?.toFixed(1) || '-'}h
                    </p>
                    <p className="text-xs text-gray-500">MTTR</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className={`text-2xl font-bold ${getHealthColor(selectedAsset.healthScore)}`}>
                      {selectedAsset.healthScore?.toFixed(0) || '-'}%
                    </p>
                    <p className="text-xs text-gray-500">Santé</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="sensors">Capteurs</TabsTrigger>
                  <TabsTrigger value="history">Historique OTs</TabsTrigger>
                  <TabsTrigger value="health">Santé</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Informations Générales
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fabricant:</span>
                          <span>{selectedAsset.manufacturer || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Modèle:</span>
                          <span>{selectedAsset.model || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">N° Série:</span>
                          <span>{selectedAsset.serialNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type:</span>
                          <span className="capitalize">{selectedAsset.assetType || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Année fabrication:</span>
                          <span>{selectedAsset.yearManufactured || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Année installation:</span>
                          <span>{selectedAsset.yearInstalled || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Localisation
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Site:</span>
                          <span>{selectedAsset.site?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Zone:</span>
                          <span>{selectedAsset.locationZone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Étage:</span>
                          <span>{selectedAsset.locationFloor || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Local:</span>
                          <span>{selectedAsset.locationRoom || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Valeurs
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Prix d'achat:</span>
                          <span>{selectedAsset.purchasePriceDzd?.toLocaleString() || '-'} DA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Coût remplacement:</span>
                          <span>{selectedAsset.replacementCostDzd?.toLocaleString() || '-'} DA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Durée de vie estimée:</span>
                          <span>{selectedAsset.expectedLifespanYears || '-'} ans</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Garantie jusqu'au:</span>
                          <span>{selectedAsset.warrantyExpiryDate ? new Date(selectedAsset.warrantyExpiryDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Maintenance
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dernière maintenance:</span>
                          <span>{selectedAsset.lastMaintenanceDate ? new Date(selectedAsset.lastMaintenanceDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Prochaine maintenance:</span>
                          <span>{selectedAsset.nextMaintenanceDate ? new Date(selectedAsset.nextMaintenanceDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total maintenances:</span>
                          <span>{selectedAsset.maintenanceCountTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Heures fonctionnement:</span>
                          <span>{selectedAsset.operatingHoursTotal?.toLocaleString()}h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sensors" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Capteurs IoT Connectés</h4>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter Capteur
                    </Button>
                  </div>
                  {selectedAsset.sensors && selectedAsset.sensors.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedAsset.sensors.map((sensor) => (
                        <Card key={sensor.id} className={`border-l-4 ${getSensorStatusColor(sensor.status)}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {getSensorIcon(sensor.sensorType)}
                              <span className="text-sm font-medium">{sensor.sensorName}</span>
                            </div>
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-2xl font-bold">
                                  {sensor.lastValue?.toFixed(1) || '--'}
                                  <span className="text-sm text-gray-500 ml-1">{sensor.unit}</span>
                                </p>
                              </div>
                              <Badge variant={sensor.status === 'normal' ? 'default' : 'destructive'} className="text-xs">
                                {sensor.status === 'normal' ? 'OK' : sensor.status === 'warning' ? 'ALERTE' : 'CRITIQUE'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun capteur connecté</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Historique des Ordres de Travail</h4>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Créer OT
                    </Button>
                  </div>
                  {selectedAsset.workOrders && selectedAsset.workOrders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° OT</TableHead>
                          <TableHead>Titre</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Priorité</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAsset.workOrders.slice(0, 10).map((wo) => (
                          <TableRow key={wo.id}>
                            <TableCell className="font-mono text-sm">{wo.woNumber}</TableCell>
                            <TableCell className="max-w-xs truncate">{wo.title}</TableCell>
                            <TableCell className="capitalize">{wo.woType}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{wo.priority}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${statusConfig[wo.status as keyof typeof statusConfig]?.color || 'bg-gray-500'} text-white text-xs`}>
                                {wo.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(wo.createdAt).toLocaleDateString('fr-FR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun historique d'OT</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="health" className="space-y-4">
                  <h4 className="font-medium">Tendance Santé (7 derniers jours)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={healthTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="health" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.3} 
                          name="Santé (%)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
