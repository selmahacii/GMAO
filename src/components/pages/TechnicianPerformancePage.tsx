'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import {
  Plus,
  Search,
  Users,
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  Calendar,
  Briefcase,
  Mail,
  Phone,
  Building,
  Edit,
  Eye,
  Loader2,
  Trophy,
  Target,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface Technician {
  id: string;
  fullName: string;
  email: string;
  role: string;
  position?: string;
  department?: string;
  section?: string;
  shift?: string;
  skillLevel: number;
  points: number;
  active: boolean;
  employeeId?: string;
  phone?: string;
  hourlyRateEur?: number;
  workOrdersCount: number;
  performance?: {
    period: string;
    totalWOsCompleted: number;
    totalHoursWorked: number;
    avgInterventionTime: number;
    onTimeRate: number;
    urgentWOsCompleted: number;
    points: number;
    efficiency: number;
  };
}

const initialFormData = {
  fullName: '',
  email: '',
  phone: '',
  employeeId: '',
  position: '',
  department: '',
  section: '',
  shift: '',
  role: 'technician',
  skillLevel: '1',
  hourlyRateDzd: '',
  specializations: [] as string[],
  certifications: [] as string[],
};

const positions = [
  'Technicien de Maintenance',
  'Technicien Senior',
  'Chef d\'Équipe',
  'Superviseur Maintenance',
  'Ingénieur Maintenance',
  'Technicien Électromécanicien',
  'Technicien Instrumentiste',
];

const departments = [
  'Maintenance',
  'Production',
  'Qualité',
  'HSE',
  'Logistique',
  'Services Généraux',
];

const shifts = ['Matin', 'Après-midi', 'Nuit', 'Rotation'];

const skillLevels = [
  { value: 1, label: 'Débutant', color: 'bg-gray-500' },
  { value: 2, label: 'Junior', color: 'bg-green-500' },
  { value: 3, label: 'Intermédiaire', color: 'bg-blue-500' },
  { value: 4, label: 'Senior', color: 'bg-purple-500' },
  { value: 5, label: 'Expert', color: 'bg-yellow-500' },
];

export function TechnicianPerformancePage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/technicians?performance=true&period=${periodFilter}`);
      const data = await res.json();

      if (data.error) {
        console.error('API error:', data.error);
        setTechnicians([]);
      } else {
        setTechnicians(Array.isArray(data.technicians) ? data.technicians : []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
      setTechnicians([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast({
        title: 'Erreur',
        description: 'Le nom et l\'email sont obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/technicians', {
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
        description: `Technicien "${data.fullName}" créé avec succès`,
      });

      setDialogOpen(false);
      setFormData(initialFormData);
      fetchData();
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

  const getSkillBadge = (level: number) => {
    const skill = skillLevels.find(s => s.value === level) || skillLevels[0];
    return (
      <Badge className={`${skill.color} text-white`}>
        Niveau {level} - {skill.label}
      </Badge>
    );
  };

  const getPointsDisplay = (points: number) => {
    if (points >= 500) return { color: 'text-yellow-500', icon: Trophy };
    if (points >= 200) return { color: 'text-purple-500', icon: Award };
    if (points >= 100) return { color: 'text-blue-500', icon: Star };
    return { color: 'text-gray-500', icon: Target };
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  const techList = Array.isArray(technicians) ? technicians : [];
  const filteredTechs = techList.filter(t => 
    (departmentFilter === 'all' || t.department === departmentFilter) &&
    (search === '' || t.fullName.toLowerCase().includes(search.toLowerCase()) || 
     t.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Summary KPIs
  const totalWOsCompleted = techList.reduce((sum, t) => sum + (t.performance?.totalWOsCompleted || 0), 0);
  const avgInterventionTime = techList.length > 0 
    ? techList.reduce((sum, t) => sum + (t.performance?.avgInterventionTime || 0), 0) / techList.length 
    : 0;
  const avgOnTimeRate = techList.length > 0 
    ? techList.reduce((sum, t) => sum + (t.performance?.onTimeRate || 0), 0) / techList.length 
    : 0;
  const totalHoursWorked = techList.reduce((sum, t) => sum + (t.performance?.totalHoursWorked || 0), 0);

  // Top performers
  const topPerformers = [...techList]
    .sort((a, b) => (b.performance?.points || 0) - (a.performance?.points || 0))
    .slice(0, 5);

  // Performance distribution for chart
  const performanceDistribution = [
    { name: 'Excellents', count: techList.filter(t => (t.performance?.points || 0) >= 200).length, fill: '#10b981' },
    { name: 'Bons', count: techList.filter(t => (t.performance?.points || 0) >= 100 && (t.performance?.points || 0) < 200).length, fill: '#3b82f6' },
    { name: 'Moyens', count: techList.filter(t => (t.performance?.points || 0) >= 50 && (t.performance?.points || 0) < 100).length, fill: '#f59e0b' },
    { name: 'À améliorer', count: techList.filter(t => (t.performance?.points || 0) < 50).length, fill: '#ef4444' },
  ];

  // Weekly trend data (mock for demo)
  const weeklyTrend = [
    { week: 'S1', completed: 45, hours: 180 },
    { week: 'S2', completed: 52, hours: 195 },
    { week: 'S3', completed: 48, hours: 175 },
    { week: 'S4', completed: 60, hours: 210 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Performance des Techniciens</h1>
          <p className="text-gray-500">Suivi des KPIs et gestion des équipes maintenance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Technicien
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un Technicien</DialogTitle>
              <DialogDescription>Créez un nouveau profil technicien</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Nom complet *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean.dupont@company.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="employeeId">Matricule</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="EMP-001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="position">Poste</Label>
                  <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Département</Label>
                  <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="Section A"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shift">Équipe</Label>
                  <Select value={formData.shift} onValueChange={(v) => setFormData({ ...formData, shift: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="skillLevel">Niveau</Label>
                  <Select value={formData.skillLevel} onValueChange={(v) => setFormData({ ...formData, skillLevel: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map((s) => (
                        <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technician">Technicien</SelectItem>
                      <SelectItem value="technician_lead">Chef d'Équipe</SelectItem>
                      <SelectItem value="supervisor">Superviseur</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hourlyRateDzd">Taux horaire (DA)</Label>
                  <Input
                    id="hourlyRateDzd"
                    type="number"
                    step="100"
                    value={formData.hourlyRateDzd}
                    onChange={(e) => setFormData({ ...formData, hourlyRateDzd: e.target.value })}
                    placeholder="2500"
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
                    'Créer le technicien'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Techniciens actifs</p>
                <p className="text-2xl font-bold">{techList.filter(t => t.active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">OTs clôturés</p>
                <p className="text-2xl font-bold">{totalWOsCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Temps moyen</p>
                <p className="text-2xl font-bold">{avgInterventionTime.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ponctualité</p>
                <p className="text-2xl font-bold">{avgOnTimeRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Heures totales</p>
                <p className="text-2xl font-bold">{totalHoursWorked.toFixed(0)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribution Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Techniciens">
                    {performanceDistribution.map((entry, index) => (
                      <rect key={`rect-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance Hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="completed" stroke="#10b981" name="OTs clôturés" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="hours" stroke="#3b82f6" name="Heures" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.map((tech, index) => {
              const pointsInfo = getPointsDisplay(tech.performance?.points || 0);
              const Icon = pointsInfo.icon;
              return (
                <div key={tech.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {tech.fullName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tech.fullName}</p>
                    <p className="text-xs text-gray-500">{tech.position || tech.role}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon className={`h-4 w-4 ${pointsInfo.color}`} />
                    <span className="text-sm font-bold">{tech.performance?.points || 0}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher techniciens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Département" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Technicians Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technicien</TableHead>
                <TableHead>Poste / Département</TableHead>
                <TableHead>Équipe</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead className="text-center">OTs Clôturés</TableHead>
                <TableHead className="text-center">Temps Moyen</TableHead>
                <TableHead className="text-center">Ponctualité</TableHead>
                <TableHead className="text-center">Points</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTechs.slice(0, 15).map((tech) => {
                const pointsInfo = getPointsDisplay(tech.performance?.points || tech.points || 0);
                const Icon = pointsInfo.icon;
                return (
                  <TableRow key={tech.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {tech.fullName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{tech.fullName}</p>
                          <p className="text-xs text-gray-500">{tech.employeeId || tech.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{tech.position || tech.role}</p>
                      <p className="text-xs text-gray-500">{tech.department || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tech.shift || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{getSkillBadge(tech.skillLevel)}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-lg font-bold text-green-600">
                        {tech.performance?.totalWOsCompleted || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${
                        (tech.performance?.avgInterventionTime || 0) < 3 ? 'text-green-600' :
                        (tech.performance?.avgInterventionTime || 0) < 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {tech.performance?.avgInterventionTime?.toFixed(1) || '-'}h
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{tech.performance?.onTimeRate || 0}%</span>
                        <Progress value={tech.performance?.onTimeRate || 0} className="h-1 w-16 mt-1" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Icon className={`h-4 w-4 ${pointsInfo.color}`} />
                        <span className="font-bold">{tech.performance?.points || tech.points || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedTech(tech)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Technician Detail Dialog */}
      <Dialog open={!!selectedTech} onOpenChange={() => setSelectedTech(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails Technicien</DialogTitle>
          </DialogHeader>
          {selectedTech && (
            <div className="grid gap-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {selectedTech.fullName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedTech.fullName}</h3>
                  <p className="text-gray-500">{selectedTech.position || selectedTech.role}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getSkillBadge(selectedTech.skillLevel)}
                    <Badge variant="outline">{selectedTech.department || 'N/A'}</Badge>
                    <Badge variant="outline">{selectedTech.shift || 'N/A'}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    {(() => {
                      const pointsInfo = getPointsDisplay(selectedTech.performance?.points || selectedTech.points || 0);
                      const Icon = pointsInfo.icon;
                      return (
                        <>
                          <Icon className={`h-5 w-5 ${pointsInfo.color}`} />
                          <span className="text-2xl font-bold">{selectedTech.performance?.points || selectedTech.points || 0}</span>
                          <span className="text-sm text-gray-500">pts</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {selectedTech.performance?.totalWOsCompleted || 0}
                    </p>
                    <p className="text-sm text-gray-500">OTs clôturés</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {selectedTech.performance?.totalHoursWorked?.toFixed(0) || 0}h
                    </p>
                    <p className="text-sm text-gray-500">Heures travaillées</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {selectedTech.performance?.avgInterventionTime?.toFixed(1) || '-'}h
                    </p>
                    <p className="text-sm text-gray-500">Temps moyen</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-orange-600">
                      {selectedTech.performance?.onTimeRate || 0}%
                    </p>
                    <p className="text-sm text-gray-500">Ponctualité</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact
                  </h4>
                  <p className="text-sm text-gray-600">{selectedTech.email}</p>
                  <p className="text-sm text-gray-600">{selectedTech.phone || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Organisation
                  </h4>
                  <p className="text-sm text-gray-600">Section: {selectedTech.section || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Matricule: {selectedTech.employeeId || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
