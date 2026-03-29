'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Warehouse,
  BarChart3,
  Filter,
  Edit,
  Eye,
  Loader2,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Settings,
  Clock,
  Wrench,
} from 'lucide-react';

interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  unitCostDzd: number | null;
  lastPurchasePriceDzd: number | null;
  stockQty: number;
  minStockQty: number;
  maxStockQty: number | null;
  reorderQty: number | null;
  stockLocation: string | null;
  leadTimeDays: number | null;
  isCritical: boolean;
  stockStatus: string;
  stockValue: number;
  totalConsumedYtd: number;
  supplier?: { name: string; phone?: string; email?: string };
  _count?: { movements: number };
}

interface StockMovement {
  id: string;
  type: string;
  qty: number;
  unitCost: number | null;
  totalCost: number | null;
  movedAt: string;
  notes: string | null;
  referenceDoc: string | null;
  workOrder?: { woNumber: string; title: string };
  movedBy?: { fullName: string };
}

const initialFormData = {
  partNumber: '',
  name: '',
  description: '',
  category: 'mechanical',
  unit: 'pcs',
  stockQty: '',
  minStockQty: '',
  maxStockQty: '',
  unitCostDzd: '',
  stockLocation: '',
  isCritical: false,
};

const initialMovementData = {
  type: 'in',
  qty: '',
  notes: '',
  referenceDoc: '',
};

export function SparePartsPage() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [totalValue, setTotalValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementData, setMovementData] = useState(initialMovementData);
  const { toast } = useToast();

  const fetchParts = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter === 'low') params.append('lowStock', 'true');
      if (statusFilter === 'critical') params.append('critical', 'true');

      const res = await fetch(`/api/parts?${params.toString()}`);
      const data = await res.json();
      setParts(Array.isArray(data.parts) ? data.parts : []);
      setTotalValue(data.totalValue || 0);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch parts:', err);
      setParts([]);
      setLoading(false);
    }
  };

  const fetchPartMovements = async (partId: string) => {
    setMovementsLoading(true);
    try {
      const res = await fetch(`/api/parts/${partId}/movements`);
      const data = await res.json();
      setMovements(Array.isArray(data.movements) ? data.movements : []);
    } catch (err) {
      console.error('Failed to fetch movements:', err);
      setMovements([]);
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [categoryFilter, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partNumber || !formData.name) {
      toast({
        title: 'Erreur',
        description: 'Le numéro de pièce et le nom sont obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/parts', {
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
        description: `Pièce "${data.name}" créée avec succès`,
      });

      setDialogOpen(false);
      setFormData(initialFormData);
      fetchParts();
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

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || !movementData.qty) {
      toast({
        title: 'Erreur',
        description: 'La quantité est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/parts/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: selectedPart.id,
          ...movementData,
          qty: parseFloat(movementData.qty),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du mouvement');
      }

      toast({
        title: 'Succès',
        description: `Mouvement enregistré avec succès`,
      });

      setMovementDialogOpen(false);
      setMovementData(initialMovementData);
      fetchParts();
      fetchPartMovements(selectedPart.id);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du mouvement',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'out':
        return <Badge className="bg-black text-white">Rupture</Badge>;
      case 'critical':
        return <Badge className="bg-red-500 text-white">Critique</Badge>;
      case 'low':
        return <Badge className="bg-yellow-500 text-white">Bas</Badge>;
      default:
        return <Badge className="bg-green-500 text-white">OK</Badge>;
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case 'out':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      mechanical: 'Mécanique',
      electrical: 'Électrique',
      consumable: 'Consommable',
      lubricant: 'Lubrifiant',
      filter: 'Filtre',
      seal: 'Joint',
      bearing: 'Roulement',
    };
    return labels[category] || category;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  const partsList = Array.isArray(parts) ? parts : [];
  const lowStockCount = partsList.filter(p => p.stockStatus === 'low' || p.stockStatus === 'critical' || p.stockStatus === 'out').length;
  const criticalParts = partsList.filter(p => p.isCritical);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pièces de Rechange</h1>
          <p className="text-gray-500">{partsList.length} références en stock</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Pièce
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter une Pièce</DialogTitle>
              <DialogDescription>Enregistrez une nouvelle pièce de rechange</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="partNumber">N° de pièce *</Label>
                <Input
                  id="partNumber"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  placeholder="ex: SKF-6205-2RS"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Roulement à billes"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mechanical">Mécanique</SelectItem>
                    <SelectItem value="electrical">Électrique</SelectItem>
                    <SelectItem value="consumable">Consommable</SelectItem>
                    <SelectItem value="lubricant">Lubrifiant</SelectItem>
                    <SelectItem value="filter">Filtre</SelectItem>
                    <SelectItem value="seal">Joint</SelectItem>
                    <SelectItem value="bearing">Roulement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stockQty">Quantité</Label>
                  <Input
                    id="stockQty"
                    type="number"
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minStockQty">Stock min</Label>
                  <Input
                    id="minStockQty"
                    type="number"
                    value={formData.minStockQty}
                    onChange={(e) => setFormData({ ...formData, minStockQty: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="unitCostDzd">Coût unitaire (DA)</Label>
                  <Input
                    id="unitCostDzd"
                    type="number"
                    step="100"
                    value={formData.unitCostDzd}
                    onChange={(e) => setFormData({ ...formData, unitCostDzd: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stockLocation">Emplacement</Label>
                  <Input
                    id="stockLocation"
                    value={formData.stockLocation}
                    onChange={(e) => setFormData({ ...formData, stockLocation: e.target.value })}
                    placeholder="A1-B2"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCritical"
                  checked={formData.isCritical}
                  onCheckedChange={(checked) => setFormData({ ...formData, isCritical: checked as boolean })}
                />
                <Label htmlFor="isCritical" className="text-sm font-normal">
                  Pièce critique (rupture bloquante)
                </Label>
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
                    'Créer'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Valeur totale</p>
                <p className="text-xl font-bold">{((totalValue * 145) / 1000000).toFixed(1)}M DA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock bas</p>
                <p className="text-xl font-bold">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pièces critiques</p>
                <p className="text-xl font-bold">{criticalParts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Warehouse className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Références</p>
                <p className="text-xl font-bold">{partsList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher pièces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="mechanical">Mécanique</SelectItem>
            <SelectItem value="electrical">Électrique</SelectItem>
            <SelectItem value="consumable">Consommable</SelectItem>
            <SelectItem value="filter">Filtre</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="low">Stock bas</SelectItem>
            <SelectItem value="critical">Critiques</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Commande auto
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Pièce</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Emplacement</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partsList.filter(p =>
                search === '' ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.partNumber.toLowerCase().includes(search.toLowerCase())
              ).slice(0, 30).map((part) => (
                <TableRow 
                  key={part.id} 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => {
                    setSelectedPart(part);
                    fetchPartMovements(part.id);
                  }}
                >
                  <TableCell className="font-mono text-sm">{part.partNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{part.name}</span>
                      {part.isCritical && <Badge variant="destructive" className="text-xs">Critique</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{getCategoryLabel(part.category)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{part.stockQty}</span>
                      <span className="text-gray-500">{part.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>{part.minStockQty}</TableCell>
                  <TableCell>{getStockStatusBadge(part.stockStatus)}</TableCell>
                  <TableCell>{(part.stockValue * 145).toFixed(0)} DA</TableCell>
                  <TableCell className="text-sm text-gray-500">{part.stockLocation || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedPart(part); fetchPartMovements(part.id); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Part Detail Dialog */}
      <Dialog open={!!selectedPart} onOpenChange={() => setSelectedPart(null)}>
        <DialogContent className="w-[95vw] md:max-w-4xl max-h-[95vh] overflow-y-auto p-0 gap-0 border-none">
          {selectedPart && (
            <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
              {/* Premium Header */}
              <div className="p-6 border-b bg-gray-50/50 dark:bg-zinc-900/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">{selectedPart.name}</h3>
                      <p className="text-sm text-gray-500 font-mono uppercase">{selectedPart.partNumber}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getStockStatusBadge(selectedPart.stockStatus)}
                    {selectedPart.isCritical && <Badge variant="destructive" className="animate-pulse">CRITIQUE</Badge>}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                  {selectedPart.description || "Aucune description technique détaillée disponible pour cette référence."}
                </p>
              </div>

              <div className="p-6 space-y-8">
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-none bg-blue-50/50 dark:bg-blue-950/20 shadow-none">
                    <CardContent className="p-4 text-center">
                      <Package className="h-4 w-4 mx-auto text-blue-500 mb-2" />
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{selectedPart.stockQty}</p>
                      <p className="text-[10px] uppercase font-bold text-blue-600 opacity-70">Stock Actuel</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-orange-50/50 dark:bg-orange-950/20 shadow-none">
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="h-4 w-4 mx-auto text-orange-500 mb-2" />
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{selectedPart.minStockQty}</p>
                      <p className="text-[10px] uppercase font-bold text-orange-600 opacity-70">Seuil Alerte</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-emerald-50/50 dark:bg-emerald-950/20 shadow-none">
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-4 w-4 mx-auto text-emerald-500 mb-2" />
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{(selectedPart.unitCostDzd || 0).toLocaleString()}</p>
                      <p className="text-[10px] uppercase font-bold text-emerald-600 opacity-70">Prix Unitaire (DA)</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-purple-50/50 dark:bg-purple-950/20 shadow-none">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-4 w-4 mx-auto text-purple-500 mb-2" />
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{selectedPart.leadTimeDays || '-'}</p>
                      <p className="text-[10px] uppercase font-bold text-purple-600 opacity-70">Délai (Jours)</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Technical Info */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <Settings className="h-3 w-3" />
                        Spécifications Techniques
                      </h4>
                      <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800">
                        <div className="p-4 bg-white dark:bg-zinc-900">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Catégorie</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{getCategoryLabel(selectedPart.category)}</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-zinc-900">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Unité de mesure</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{selectedPart.unit}</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-zinc-900">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Emplacement Stock</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">{selectedPart.stockLocation || 'NON DÉFINI'}</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-zinc-900">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Consommation YTD</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{selectedPart.totalConsumedYtd} {selectedPart.unit}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stock Meter */}
                    <div className="p-5 bg-zinc-900 dark:bg-white/5 rounded-xl text-white">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">État des réserves</p>
                          <p className="text-lg font-bold">Niveau: {((selectedPart.stockQty / (selectedPart.maxStockQty || selectedPart.minStockQty * 3)) * 100).toFixed(0)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">{selectedPart.stockQty} <span className="text-sm font-normal text-zinc-400">{selectedPart.unit}</span></p>
                        </div>
                      </div>
                      <Progress 
                        value={(selectedPart.stockQty / (selectedPart.maxStockQty || selectedPart.minStockQty * 3)) * 100} 
                        className="h-2 bg-zinc-800"
                      />
                      <div className="flex justify-between text-[10px] font-bold mt-2 text-zinc-500">
                        <span>MIN: {selectedPart.minStockQty}</span>
                        <span>MAX: {selectedPart.maxStockQty || '---'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Info (History/Supplier) */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <History className="h-3 w-3" />
                          Mouvements
                        </h4>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold" onClick={() => setMovementDialogOpen(true)}>
                          AJOUTER
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {movements.length === 0 ? (
                          <p className="text-xs text-center py-8 text-gray-400 bg-gray-50 dark:bg-zinc-900 rounded-lg italic">Aucun mouvement</p>
                        ) : (
                          movements.map((m) => (
                            <div key={m.id} className="p-2 bg-gray-50 dark:bg-zinc-900 rounded border border-gray-100 dark:border-zinc-800 flex items-center gap-2">
                              {getMovementIcon(m.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold leading-none">{m.type === 'in' ? '+' : '-'}{Math.abs(m.qty)}</p>
                                <p className="text-[9px] text-gray-400 truncate">{new Date(m.movedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {selectedPart.supplier && (
                      <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                        <p className="text-[10px] font-bold text-zinc-400 mb-2 uppercase">Fournisseur Principal</p>
                        <p className="font-bold text-sm">{selectedPart.supplier.name}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{selectedPart.supplier.phone || "---"}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-6 bg-gray-50 dark:bg-zinc-900/50 border-t flex flex-wrap gap-2">
                <Button className="flex-1 md:flex-none" onClick={() => setMovementDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Mouvement Stock
                </Button>
                <Button variant="outline" className="flex-1 md:flex-none">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Réapprovisionner
                </Button>
                <Button variant="outline" className="flex-1 md:flex-none">
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button variant="secondary" className="w-full md:w-auto ml-auto" onClick={() => setSelectedPart(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mouvement de Stock</DialogTitle>
            <DialogDescription>
              Enregistrez un mouvement pour {selectedPart?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovementSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="moveType">Type de mouvement</Label>
              <Select 
                value={movementData.type} 
                onValueChange={(v) => setMovementData({ ...movementData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrée (réception)</SelectItem>
                  <SelectItem value="out">Sortie (utilisation)</SelectItem>
                  <SelectItem value="adjustment">Ajustement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="moveQty">Quantité *</Label>
              <Input
                id="moveQty"
                type="number"
                value={movementData.qty}
                onChange={(e) => setMovementData({ ...movementData, qty: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="moveRef">Référence document</Label>
              <Input
                id="moveRef"
                value={movementData.referenceDoc}
                onChange={(e) => setMovementData({ ...movementData, referenceDoc: e.target.value })}
                placeholder="ex: BC-2024-001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="moveNotes">Notes</Label>
              <Input
                id="moveNotes"
                value={movementData.notes}
                onChange={(e) => setMovementData({ ...movementData, notes: e.target.value })}
                placeholder="Commentaire..."
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Annuler</Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
