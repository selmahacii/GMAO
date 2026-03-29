'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Check,
  X,
  Zap,
  Building2,
  Users,
  Settings,
  BarChart3,
  Shield,
  Clock,
  Globe,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Calculator,
  Star,
  Quote,
  ChevronRight,
} from 'lucide-react';
import {
  PLANS,
  FEATURE_LABELS,
  SUPPORT_LABELS,
  ONBOARDING_LABELS,
  ROI_CONSTANTS,
  TESTIMONIALS,
  PLATFORM_STATS,
  FAQ_ITEMS,
  type Plan,
} from '@/lib/pricing.config';

interface PricingCardProps {
  plan: Plan;
  isAnnual: boolean;
  onSelect: (planId: string) => void;
}

function PricingCard({ plan, isAnnual, onSelect }: PricingCardProps) {
  const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
  const savings = plan.priceMonthly && plan.priceAnnual
    ? (plan.priceMonthly - plan.priceAnnual) * 12
    : 0;

  return (
    <Card
      className={`relative flex flex-col transition-all duration-300 ${
        plan.highlighted
          ? 'border-2 border-blue-500 shadow-xl scale-105 z-10 bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/30 dark:to-gray-900'
          : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1">
            <Star className="h-3 w-3 mr-1" />
            Recommandé
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {plan.tagline}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Price */}
        <div className="text-center mb-6">
          {price !== null ? (
            <>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {price.toLocaleString()} DZD
                </span>
                <span className="text-gray-500 dark:text-gray-400">/mois</span>
              </div>
              {isAnnual && savings > 0 && (
                <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Économisez {savings.toLocaleString()} DZD/an
                </Badge>
              )}
            </>
          ) : (
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              Sur devis
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {plan.trialDays} jours gratuits, sans carte bancaire
          </p>
        </div>

        {/* CTA */}
        <Button
          className={`w-full mb-6 ${
            plan.highlighted
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          onClick={() => onSelect(plan.id)}
        >
          {plan.cta}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>

        <Separator className="mb-6" />

        {/* Limits */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Limites</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span>
                {plan.limits.sites === -1 ? 'Illimité' : plan.limits.sites} site{plan.limits.sites > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <span>
                {plan.limits.assets === -1 ? 'Illimité' : plan.limits.assets.toLocaleString()} équip.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span>
                {plan.limits.users === -1 ? 'Illimité' : plan.limits.users} utilisateurs
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <span>
                {plan.limits.storageGb === -1 ? 'Illimité' : plan.limits.storageGb} Go
              </span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fonctionnalités</p>
          <ul className="space-y-2 text-sm">
            {Object.entries(plan.features)
              .filter(([key, value]) => key !== 'support' && key !== 'onboarding')
              .slice(0, 8)
              .map(([key, value]) => (
                <li key={key} className="flex items-center gap-2">
                  {value ? (
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  )}
                  <span className={value ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                    {FEATURE_LABELS[key as keyof typeof FEATURE_LABELS]?.label || key}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureComparisonTable({ isAnnual }: { isAnnual: boolean }) {
  const featureKeys = Object.keys(FEATURE_LABELS) as (keyof typeof FEATURE_LABELS)[];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardTitle className="text-center">Comparatif des fonctionnalités</CardTitle>
        <CardDescription className="text-center">
          Choisissez le plan adapté à vos besoins
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300 w-1/3">
                  Fonctionnalité
                </th>
                {PLANS.map((plan) => (
                  <th
                    key={plan.id}
                    className={`text-center p-4 font-medium ${
                      plan.highlighted
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureKeys.map((key, index) => (
                <tr
                  key={key}
                  className={`border-b border-gray-100 dark:border-gray-800 ${
                    index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-900/50' : ''
                  }`}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {FEATURE_LABELS[key].label}
                      </p>
                      {FEATURE_LABELS[key].description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {FEATURE_LABELS[key].description}
                        </p>
                      )}
                    </div>
                  </td>
                  {PLANS.map((plan) => {
                    const value = plan.features[key];
                    let displayValue: React.ReactNode;

                    if (key === 'support') {
                      displayValue = SUPPORT_LABELS[value as Plan['features']['support']];
                    } else if (key === 'onboarding') {
                      displayValue = ONBOARDING_LABELS[value as Plan['features']['onboarding']];
                    } else if (typeof value === 'boolean') {
                      displayValue = value ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 dark:text-gray-600 mx-auto" />
                      );
                    } else {
                      displayValue = value;
                    }

                    return (
                      <td
                        key={plan.id}
                        className={`text-center p-4 ${
                          plan.highlighted
                            ? 'bg-blue-50/30 dark:bg-blue-950/10'
                            : ''
                        }`}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Limits rows */}
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50">
                <td className="p-4 font-medium text-gray-800 dark:text-gray-200">Sites</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="text-center p-4 font-medium">
                    {plan.limits.sites === -1 ? 'Illimité' : plan.limits.sites}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 font-medium text-gray-800 dark:text-gray-200">Équipements</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="text-center p-4">
                    {plan.limits.assets === -1 ? 'Illimité' : plan.limits.assets.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50">
                <td className="p-4 font-medium text-gray-800 dark:text-gray-200">Utilisateurs</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="text-center p-4">
                    {plan.limits.users === -1 ? 'Illimité' : plan.limits.users}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 font-medium text-gray-800 dark:text-gray-200">Capteurs IoT</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="text-center p-4">
                    {plan.limits.sensors === -1 ? 'Illimité' : plan.limits.sensors === 0 ? '-' : plan.limits.sensors}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50">
                <td className="p-4 font-medium text-gray-800 dark:text-gray-200">Stockage</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="text-center p-4">
                    {plan.limits.storageGb === -1 ? 'Illimité' : `${plan.limits.storageGb} Go`}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ROICalculator() {
  const [assets, setAssets] = useState(500);
  const [downtimeCost, setDowntimeCost] = useState(ROI_CONSTANTS.avgDowntimeCostPerHour);
  const [monthlyFailures, setMonthlyFailures] = useState(8);

  const calculations = useMemo(() => {
    const annualDowntime = monthlyFailures * 4 * downtimeCost * 12;
    const downtimeReduction = (annualDowntime * ROI_CONSTANTS.downtimeReductionPercent) / 100;
    const monthlySavings = downtimeReduction / 12;
    const annualCost = 399 * 12;
    const roi = (downtimeReduction / annualCost) * 100;
    const breakEvenMonths = annualCost / monthlySavings;

    return {
      annualDowntime,
      downtimeReduction,
      monthlySavings,
      annualCost,
      roi,
      breakEvenMonths: Math.max(1, Math.round(breakEvenMonths)),
    };
  }, [assets, downtimeCost, monthlyFailures]);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          Calculateur ROI
        </CardTitle>
        <CardDescription>
          Estimez vos économies potentielles avec GMAO Pro
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <Label>Nombre d'équipements: {assets}</Label>
            <Slider
              value={[assets]}
              onValueChange={([v]) => setAssets(v)}
              min={50}
              max={5000}
              step={50}
            />
          </div>
          <div className="space-y-3">
            <Label>Coût d'une panne (DZD/heure)</Label>
            <Input
              type="number"
              value={downtimeCost}
              onChange={(e) => setDowntimeCost(Number(e.target.value))}
              className="bg-white dark:bg-gray-800"
            />
          </div>
          <div className="space-y-3">
            <Label>Pannes non planifiées/mois</Label>
            <Input
              type="number"
              value={monthlyFailures}
              onChange={(e) => setMonthlyFailures(Number(e.target.value))}
              className="bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Coût actuel/an</p>
            <p className="text-2xl font-bold text-red-600">
              {Math.round(calculations.annualDowntime).toLocaleString()} DA
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Économies estimées/an</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(calculations.downtimeReduction).toLocaleString()} DA
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">ROI</p>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(calculations.roi)}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Seuil de rentabilité</p>
            <p className="text-2xl font-bold text-purple-600">
              {calculations.breakEvenMonths} mois
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Investissement: <span className="font-bold">59,900 DZD/mois</span>
            {' → '}
            Économies estimées: <span className="font-bold text-green-600">{Math.round(calculations.monthlySavings).toLocaleString()} DA/mois</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TestimonialsSection() {
  return (
    <div className="py-12">
      <h2 className="text-2xl font-bold text-center mb-8">
        Ils nous font confiance
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <Card key={index} className="relative">
            <CardContent className="pt-6">
              <Quote className="h-8 w-8 text-blue-200 dark:text-blue-800 absolute top-4 right-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4 relative z-10">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="py-6 text-center">
            <p className="text-3xl font-bold">{PLATFORM_STATS.activeSites}</p>
            <p className="text-blue-100">Sites actifs</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="py-6 text-center">
            <p className="text-3xl font-bold">{PLATFORM_STATS.managedAssets.toLocaleString()}</p>
            <p className="text-green-100">Équipements gérés</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="py-6 text-center">
            <p className="text-3xl font-bold">{PLATFORM_STATS.uptime}%</p>
            <p className="text-purple-100">Uptime</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="py-6 text-center">
            <p className="text-3xl font-bold">{PLATFORM_STATS.countries}</p>
            <p className="text-orange-100">Pays</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FAQSection() {
  return (
    <div className="py-12">
      <h2 className="text-2xl font-bold text-center mb-8">
        Questions fréquentes
      </h2>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

interface PricingPageProps {
  onSelectPlan?: (planId: string) => void;
}

export function PricingPage({ onSelectPlan }: PricingPageProps) {
  const [isAnnual, setIsAnnual] = useState(true);

  const handleSelectPlan = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else {
      // Default behavior - could redirect to signup
      console.log('Selected plan:', planId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-950 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Maintenance intelligente.
            <br />
            Prix transparent.
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à votre infrastructure.
            Aucune surprise, aucun frais caché.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Label htmlFor="billing-toggle" className={!isAnnual ? 'text-white' : 'text-blue-200'}>
              Mensuel
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-green-500"
            />
            <Label htmlFor="billing-toggle" className={isAnnual ? 'text-white' : 'text-blue-200'}>
              Annuel
              <Badge className="ml-2 bg-green-500 text-white text-xs">
                -20%
              </Badge>
            </Label>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isAnnual={isAnnual}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="container mx-auto px-4 py-16">
        <FeatureComparisonTable isAnnual={isAnnual} />
      </div>

      {/* ROI Calculator */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ROICalculator />
      </div>

      {/* Testimonials */}
      <div className="container mx-auto px-4">
        <TestimonialsSection />
      </div>

      {/* FAQ */}
      <div className="container mx-auto px-4">
        <FAQSection />
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-950 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à éliminer vos pannes non planifiées ?
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Commencez votre essai de 14 jours — aucune carte bancaire requise.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              <Sparkles className="mr-2 h-5 w-5" />
              Créer un compte gratuit
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <MessageSquare className="mr-2 h-5 w-5" />
              Demander une démo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
