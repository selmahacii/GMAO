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
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Zap,
  RefreshCw,
  Play,
  List,
  LayoutGrid,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertCircle,
  Wrench,
  Edit,
  Trash2,
  DollarSign,
  Package,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

interface PMTemplate {
  id: string;
  name: string;
  description?: string;
  frequencyType: string;
  intervalDays?: number;
  intervalMeterValue?: number;
  estimatedDurationHours?: number;
  checklistItems: string;
  requiredSkillLevel: number;
  regulatoryReference?: string;
}

interface PMSchedule {
  id: string;
  assetId: string;
  templateId: string;
  nextDueDate: string;
  lastCompleted?: string;
  active: boolean;
  status: string;
  diffDays: number;
  asset?: { name: string; assetTag: string; criticality: string };
  template?: PMTemplate;
}

const initialFormData = {
  name: '',
  description: '',
  frequencyType: 'calendar',
  intervalDays: '',
  estimatedDurationHours: '',
  requiredSkillLevel: '1',
  regulatoryReference: '',
};

// Algerian regulatory requirements
const regulatoryRequirements = [
  { code: 'Décret 88-07', name: 'Hygiène, sécurité et médecine du travail', frequency: 'annual' },
  { code: 'Loi 04-18', name: 'Prévention des risques majeurs', frequency: 'annual' },
  { code: 'Décret 91-05', name: 'Prévention des accidents de travail', frequency: 'annual' },
  { code: 'NA 1600', name: 'Sécurité des machines', frequency: 'annual' },
  { code: 'NA 1051', name: 'Appareils à pression', frequency: 'annual' },
  { code: 'NA 1669', name: 'Équipements électriques', frequency: 'annual' },
  { code: 'Protection Civile', name: 'Inspection extincteurs', frequency: 'annual' },
];

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function PreventiveMaintenancePage() {
  const [templates, setTemplates] = useState<PMTemplate[]>([]);
  const [schedules, setSchedules] = useState<PMSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pm');
      const data = await res.json();
      
      let templatesData = Array.isArray(data.templates) ? data.templates : [];
      let schedulesData = Array.isArray(data.schedules) ? data.schedules : [];

      if (!templatesData || templatesData.length === 0) {
        templatesData = [
          {
            id: 'tmpl-1',
            name: 'Inspection Électrique NA 1669',
            description: 'Vérification complète des armoires électriques selon la norme NA 1669',
            frequencyType: 'calendar',
            intervalDays: 365,
            estimatedDurationHours: 8,
            checklistItems: 'Mesure isolement, Contrôle serrage, Thermographie',
            requiredSkillLevel: 3,
            regulatoryReference: 'NA 1669'
          },
          {
            id: 'tmpl-2',
            name: 'Entretien Mensuel Convoyeurs',
            description: 'Graissage et contrôle tension des bandes',
            frequencyType: 'calendar',
            intervalDays: 30,
            estimatedDurationHours: 2,
            checklistItems: 'Vérification roulements, Tension bande, Nettoyage',
            requiredSkillLevel: 1
          }
        ];
      }

      if (!schedulesData || schedulesData.length === 0) {
        schedulesData = [
          {
            id: 'sched-1',
            assetId: '1',
            templateId: 'tmpl-1',
            nextDueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
            lastCompleted: new Date(Date.now() - 86400000 * 360).toISOString(),
            active: true,
            status: 'upcoming',
            diffDays: 5,
            asset: { name: 'Armoire TGBT Section A', assetTag: 'ELE-001', criticality: 'critical' },
            template: templatesData[0]
          },
          {
            id: 'sched-2',
            assetId: '2',
            templateId: 'tmpl-2',
            nextDueDate: new Date(Date.now() + 86400000 * 12).toISOString(),
            lastCompleted: new Date(Date.now() - 86400000 * 18).toISOString(),
            active: true,
            status: 'overdue',
            diffDays: -2,
            asset: { name: 'Convoyeur B-12', assetTag: 'CONV-012', criticality: 'medium' },
            template: templatesData[1]
          }
        ];
      }

      setTemplates(templatesData);
      setSchedules(schedulesData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch PM data:', err);
      // Fallback simple
      setTemplates([{ id: 'mock-tmpl', name: 'Service Demo', frequencyType: 'calendar', checklistItems: 'Demo', requiredSkillLevel: 1 }]);
      setSchedules([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: 'Erreur',
        description: 'Le nom du template est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/pm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          intervalDays: formData.intervalDays ? parseInt(formData.intervalDays) : null,
          estimatedDurationHours: formData.estimatedDurationHours ? parseFloat(formData.estimatedDurationHours) : null,
          requiredSkillLevel: parseInt(formData.requiredSkillLevel),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      toast({
        title: 'Succès',
        description: `Template "${data.name}" créé avec succès`,
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

  const generateWorkOrder = async (scheduleId: string) => {
    try {
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) return;

      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          woType: 'preventive',
          title: `MP: ${schedule.template?.name || 'Maintenance Préventive'}`,
          description: `Maintenance préventive planifiée pour ${schedule.asset?.name}`,
          assetId: schedule.assetId,
          priority: 'P3_normal',
          status: 'planned',
          plannedStartAt: schedule.nextDueDate,
          estimatedDurationHours: schedule.template?.estimatedDurationHours,
          pmTemplateId: schedule.templateId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      toast({
        title: 'Succès',
        description: `OT ${data.woNumber} créé avec succès`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création de l\'OT',
        variant: 'destructive',
      });
    }
  };

  const getFrequencyLabel = (template: PMTemplate) => {
    if (template.frequencyType === 'calendar') {
      if (template.intervalDays === 7) return 'Hebdomadaire';
      if (template.intervalDays === 30) return 'Mensuel';
      if (template.intervalDays === 90) return 'Trimestriel';
      if (template.intervalDays === 365) return 'Annuel';
      return `Tous les ${template.intervalDays} jours`;
    }
    return `Tous les ${template.intervalMeterValue} ${template.frequencyType === 'meter' ? 'unités' : ''}`;
  };

  const getDueStatus = (schedule: PMSchedule) => {
    const diffDays = schedule.diffDays;
    
    if (diffDays < 0) return { label: 'En retard', color: 'bg-red-500', textColor: 'text-red-600' };
    if (diffDays <= 3) return { label: 'Urgent', color: 'bg-orange-500', textColor: 'text-orange-600' };
    if (diffDays <= 7) return { label: 'Cette semaine', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    return { label: 'Planifié', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getSchedulesForDay = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    
    return schedules.filter(s => {
      const scheduleDate = new Date(s.nextDueDate).toISOString().split('T')[0];
      return scheduleDate === dateStr;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  // Calculate compliance
  const completedThisMonth = schedules.filter(s => s.lastCompleted && 
    new Date(s.lastCompleted).getMonth() === new Date().getMonth()).length;
  const overdueCount = schedules.filter(s => s.diffDays < 0).length;
  const scheduledThisMonth = schedules.filter(s => {
    const dueDate = new Date(s.nextDueDate);
    return dueDate.getMonth() === new Date().getMonth() && dueDate.getFullYear() === new Date().getFullYear();
  }).length;
  const complianceRate = scheduledThisMonth > 0 ? (completedThisMonth / Math.max(scheduledThisMonth, 1)) * 100 : 100;

  // Calendar generation
  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const calendarDays: React.ReactNode[] = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50" />);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const daySchedules = getSchedulesForDay(day);
    const isToday = 
      day === new Date().getDate() && 
      currentMonth.getMonth() === new Date().getMonth() && 
      currentMonth.getFullYear() === new Date().getFullYear();
    
    calendarDays.push(
      <div 
        key={day} 
        className={`h-24 border border-gray-100 dark:border-gray-800 p-1 overflow-hidden ${
          isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
        }`}
      >
        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>{day}</div>
        <div className="space-y-0.5">
          {daySchedules.slice(0, 3).map((s, idx) => {
            const status = getDueStatus(s);
            return (
              <div 
                key={idx}
                className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${status.color} text-white`}
                title={`${s.asset?.name} - ${s.template?.name}`}
                onClick={() => generateWorkOrder(s.id)}
              >
                {s.asset?.name?.substring(0, 12) || 'MP'}
              </div>
            );
          })}
          {daySchedules.length > 3 && (
            <div className="text-xs text-gray-500 px-1">+{daySchedules.length - 3} autres</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Préventive</h1>
          <p className="text-gray-500">Planification et suivi des interventions préventives</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un Template MP</DialogTitle>
                <DialogDescription>Définissez un nouveau plan de maintenance préventive</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom du template *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Inspection Mensuelle HVAC"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du plan de maintenance"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="frequencyType">Fréquence</Label>
                    <Select 
                      value={formData.frequencyType} 
                      onValueChange={(v) => setFormData({ ...formData, frequencyType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calendar">Calendrier</SelectItem>
                        <SelectItem value="meter">Compteur</SelectItem>
                        <SelectItem value="condition">Condition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="intervalDays">
                      {formData.frequencyType === 'calendar' ? 'Intervalle (jours)' : 'Valeur compteur'}
                    </Label>
                    <Input
                      id="intervalDays"
                      type="number"
                      value={formData.intervalDays}
                      onChange={(e) => setFormData({ ...formData, intervalDays: e.target.value })}
                      placeholder={formData.frequencyType === 'calendar' ? '30' : '1000'}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="estimatedDurationHours">Durée estimée (h)</Label>
                    <Input
                      id="estimatedDurationHours"
                      type="number"
                      step="0.5"
                      value={formData.estimatedDurationHours}
                      onChange={(e) => setFormData({ ...formData, estimatedDurationHours: e.target.value })}
                      placeholder="2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="requiredSkillLevel">Niveau requis</Label>
                    <Select 
                      value={formData.requiredSkillLevel} 
                      onValueChange={(v) => setFormData({ ...formData, requiredSkillLevel: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Débutant</SelectItem>
                        <SelectItem value="2">2 - Junior</SelectItem>
                        <SelectItem value="3">3 - Intermédiaire</SelectItem>
                        <SelectItem value="4">4 - Senior</SelectItem>
                        <SelectItem value="5">5 - Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="regulatoryReference">Référence réglementaire (Algérie)</Label>
                  <Select 
                    value={formData.regulatoryReference} 
                    onValueChange={(v) => setFormData({ ...formData, regulatoryReference: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une norme..." />
                    </SelectTrigger>
                    <SelectContent>
                      {regulatoryRequirements.map((req) => (
                        <SelectItem key={req.code} value={req.code}>
                          {req.code} - {req.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      'Créer le template'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Charts & Analytical Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Tendance de Conformité Mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { month: 'Jan', rate: 85 },
                  { month: 'Fév', rate: 88 },
                  { month: 'Mar', rate: 92 },
                  { month: 'Avr', rate: 91 },
                  { month: 'Mai', rate: complianceRate },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip labelClassName="text-black" />
                  <Area type="monotone" dataKey="rate" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              Distribution par Type de Fréquence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { type: 'Calendaire', count: schedules.filter(s => s.template?.frequencyType === 'calendar').length },
                  { type: 'Compteur', count: schedules.filter(s => s.template?.frequencyType === 'meter').length },
                  { type: 'Mixte', count: 2 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip labelClassName="text-black" />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Taux de Conformité</p>
                <p className="text-2xl font-bold text-green-600">{complianceRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
            <Progress value={complianceRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Budget Consommé</p>
                <p className="text-2xl font-bold text-blue-600">42,500 DZD</p>
                <p className="text-xs text-blue-400 font-medium">75% du mensuel</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Retard Critique</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                <p className="text-xs text-red-400 font-medium">Équipements Classe A</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Temps Technicien</p>
                <p className="text-2xl font-bold text-indigo-600">142h</p>
                <p className="text-xs text-indigo-400 font-medium">Disponibilité: 88%</p>
              </div>
              <Users className="h-8 w-8 text-indigo-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="schedule">Liste</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
          <TabsTrigger value="regulatory">Réglementation</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg">
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </CardTitle>
                  <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                  Aujourd'hui
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b">
                {DAYS.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays}
              </div>
            </CardContent>
          </Card>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>En retard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span>Urgent (≤3j)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>Cette semaine</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Planifié</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MPs à Venir</CardTitle>
              <CardDescription>Maintenances préventives planifiées</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {schedules.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune maintenance préventive planifiée</p>
                  <p className="text-sm mt-2">Créez des templates et associez-les aux équipements</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Équipement</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Date prévue</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.slice(0, 20).map((schedule) => {
                      const status = getDueStatus(schedule);
                      return (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">
                            <div>
                              {schedule.asset?.name || 'N/A'}
                              {schedule.asset?.criticality === 'A' && (
                                <Badge className="ml-2 bg-red-100 text-red-800 text-xs">Critique</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{schedule.asset?.assetTag}</p>
                          </TableCell>
                          <TableCell>
                            <div>{schedule.template?.name || 'N/A'}</div>
                            {schedule.template?.regulatoryReference && (
                              <p className="text-xs text-purple-600">{schedule.template.regulatoryReference}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(schedule.nextDueDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {schedule.template?.estimatedDurationHours || '-'}h
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => generateWorkOrder(schedule.id)}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Générer OT
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun template de maintenance préventive</p>
                <p className="text-sm mt-2">Créez votre premier template pour commencer</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <Settings className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{getFrequencyLabel(template)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-gray-400" />
                      <span>{template.estimatedDurationHours || '-'}h estimées</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Niveau requis:</span>
                      <Badge variant="outline">{template.requiredSkillLevel}/5</Badge>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50">
                         <div className="flex items-center gap-2 font-medium">
                            <Package className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">Pièces utilisées:</span>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-medium">2x Filtre (12,000 DZD)</p>
                           <p className="text-xs text-gray-500">Total: 24,000 DZD</p>
                         </div>
                      </div>
                    </div>
                    {template.regulatoryReference && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-purple-500" />
                        <span className="text-purple-600">{template.regulatoryReference}</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Voir détails
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Taux de Conformité par Catégorie</CardTitle>
                <CardDescription>Analyse de l'exécution des MPs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['HVAC', 'Électrique', 'Mécanique', 'Sécurité', 'Production'].map((cat, idx) => {
                  const rate = Math.round(75 + Math.random() * 25);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{cat}</span>
                        <span className={`font-medium ${rate >= 95 ? 'text-green-600' : rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {rate}%
                        </span>
                      </div>
                      <Progress value={rate} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Statistiques du Mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{completedThisMonth}</p>
                    <p className="text-sm text-gray-500">Complétées</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{scheduledThisMonth}</p>
                    <p className="text-sm text-gray-500">Planifiées</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                    <p className="text-sm text-gray-500">En retard</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{templates.length}</p>
                    <p className="text-sm text-gray-500">Templates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regulatory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Conformité Réglementaire Algérienne
              </CardTitle>
              <CardDescription>Exigences et inspections obligatoires</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead>Autorité</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regulatoryRequirements.map((req, idx) => (
                    <TableRow key={req.code}>
                      <TableCell className="font-mono font-medium">{req.code}</TableCell>
                      <TableCell>{req.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{req.frequency}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {req.code.includes('Protection') ? 'Protection Civile' : 
                         req.code.includes('NA') ? 'IANOR' : 'Ministère du Travail'}
                      </TableCell>
                      <TableCell>
                        {idx < 3 ? (
                          <Badge className="bg-green-500 text-white">Conforme</Badge>
                        ) : idx < 5 ? (
                          <Badge className="bg-yellow-500 text-white">À vérifier</Badge>
                        ) : (
                          <Badge className="bg-gray-500 text-white">Non applicable</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Inspections à Venir
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Inspection Extincteurs', date: '2025-04-15', authority: 'Protection Civile' },
                  { name: 'Contrôle Appareils à Pression', date: '2025-05-20', authority: 'Direction Industrie' },
                  { name: 'Vérification Électrique', date: '2025-06-10', authority: 'APAVE' },
                ].map((insp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{insp.name}</p>
                      <p className="text-sm text-gray-500">{insp.authority}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{new Date(insp.date).toLocaleDateString('fr-FR')}</p>
                      <Badge variant="outline" className="text-xs">Planifié</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-500" />
                  Actions Requises
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                  <p className="font-medium text-red-800 dark:text-red-200">Renouvellement certification NA 1051</p>
                  <p className="text-sm text-red-600 dark:text-red-400">Échéance: 15 Avril 2025</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Mise à jour registre HSE</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">En attente de validation</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Formation sécurité requise</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">3 techniciens à former</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
