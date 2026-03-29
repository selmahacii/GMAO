// GMAO Pro - Pricing Configuration
// Source of truth for all plan definitions and limits

export interface PlanLimits {
  sites: number;           // -1 = unlimited
  assets: number;
  users: number;
  workOrdersPerMonth: number;
  storageGb: number;
  sensors: number;
}

export interface PlanFeatures {
  workOrders: boolean;
  preventiveMaintenance: boolean;
  spareParts: boolean;
  analyticsBasic: boolean;
  analyticsAdvanced: boolean;
  iotSensors: boolean;
  apiAccess: boolean;
  sso: boolean;
  customBranding: boolean;
  slaManagement: boolean;
  mobileApp: boolean;
  multiSite: boolean;
  inventoryManagement: boolean;
  technicianManagement: boolean;
  customReports: boolean;
  dataExport: boolean;
  support: 'email' | 'priority_email' | 'dedicated_csm';
  onboarding: 'self-service' | 'guided' | 'white_glove';
}

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number | null;   // null = "Sur devis"
  priceAnnual: number | null;
  currency: string;
  highlighted: boolean;
  cta: string;
  trialDays: number;
  limits: PlanLimits;
  features: PlanFeatures;
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Pour les petites structures',
    priceMonthly: 24900,
    priceAnnual: 19900,      // per month, billed annually
    currency: 'DZD',
    highlighted: false,
    cta: 'Démarrer gratuitement',
    trialDays: 14,
    limits: {
      sites: 1,
      assets: 200,
      users: 5,
      workOrdersPerMonth: 100,
      storageGb: 5,
      sensors: 0,
    },
    features: {
      workOrders: true,
      preventiveMaintenance: true,
      spareParts: true,
      analyticsBasic: true,
      analyticsAdvanced: false,
      iotSensors: false,
      apiAccess: false,
      sso: false,
      customBranding: false,
      slaManagement: false,
      mobileApp: true,
      multiSite: false,
      inventoryManagement: true,
      technicianManagement: false,
      customReports: false,
      dataExport: true,
      support: 'email',
      onboarding: 'self-service',
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Pour les équipes en croissance',
    priceMonthly: 59900,
    priceAnnual: 47900,
    currency: 'DZD',
    highlighted: true,       // → "Most Popular" badge
    cta: 'Essayer 14 jours gratuits',
    trialDays: 14,
    limits: {
      sites: 5,
      assets: 2000,
      users: 25,
      workOrdersPerMonth: -1,    // unlimited
      storageGb: 50,
      sensors: 50,
    },
    features: {
      workOrders: true,
      preventiveMaintenance: true,
      spareParts: true,
      analyticsBasic: true,
      analyticsAdvanced: true,
      iotSensors: true,
      apiAccess: true,
      sso: false,
      customBranding: false,
      slaManagement: true,
      mobileApp: true,
      multiSite: true,
      inventoryManagement: true,
      technicianManagement: true,
      customReports: true,
      dataExport: true,
      support: 'priority_email',
      onboarding: 'guided',
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Pour les grands comptes industriels',
    priceMonthly: null,     // → "Sur devis" display
    priceAnnual: null,
    currency: 'DZD',
    highlighted: false,
    cta: 'Contacter les ventes',
    trialDays: 30,
    limits: {
      sites: -1,             // unlimited
      assets: -1,
      users: -1,
      workOrdersPerMonth: -1,
      storageGb: -1,
      sensors: -1,
    },
    features: {
      workOrders: true,
      preventiveMaintenance: true,
      spareParts: true,
      analyticsBasic: true,
      analyticsAdvanced: true,
      iotSensors: true,
      apiAccess: true,
      sso: true,
      customBranding: true,
      slaManagement: true,
      mobileApp: true,
      multiSite: true,
      inventoryManagement: true,
      technicianManagement: true,
      customReports: true,
      dataExport: true,
      support: 'dedicated_csm',
      onboarding: 'white_glove',
    }
  }
];

// Feature labels for comparison table
export const FEATURE_LABELS: Record<keyof PlanFeatures, { label: string; description?: string }> = {
  workOrders: { label: 'Ordres de travail', description: 'Création et suivi des OTs' },
  preventiveMaintenance: { label: 'Maintenance préventive', description: 'Planification des MP' },
  spareParts: { label: 'Pièces de rechange', description: 'Gestion des stocks' },
  analyticsBasic: { label: 'Analytics basiques', description: 'Tableaux de bord KPIs' },
  analyticsAdvanced: { label: 'Analytics avancées', description: 'Pareto, OEE, tendances' },
  iotSensors: { label: 'Capteurs IoT', description: 'Supervision temps réel' },
  apiAccess: { label: 'Accès API', description: 'Intégration tierce' },
  sso: { label: 'SSO / SAML', description: 'Authentification unifiée' },
  customBranding: { label: 'Marque personnalisée', description: 'Logo et couleurs' },
  slaManagement: { label: 'Gestion SLA', description: 'Contrats de service' },
  mobileApp: { label: 'Application mobile', description: 'iOS et Android' },
  multiSite: { label: 'Multi-sites', description: 'Gestion plusieurs sites' },
  inventoryManagement: { label: 'Gestion inventaire', description: 'Stocks et mouvements' },
  technicianManagement: { label: 'Gestion techniciens', description: 'Planning et compétences' },
  customReports: { label: 'Rapports personnalisés', description: 'Exports sur mesure' },
  dataExport: { label: 'Export données', description: 'CSV, Excel, PDF' },
  support: { label: 'Support', description: 'Niveau d\'assistance' },
  onboarding: { label: 'Onboarding', description: 'Accompagnement initial' },
};

// Support level labels
export const SUPPORT_LABELS: Record<PlanFeatures['support'], string> = {
  email: 'Email',
  priority_email: 'Email prioritaire',
  dedicated_csm: 'CSM dédié',
};

// Onboarding labels
export const ONBOARDING_LABELS: Record<PlanFeatures['onboarding'], string> = {
  'self-service': 'Self-service',
  guided: 'Guidé',
  white_glove: 'Sur-mesure',
};

// ROI Calculator constants
export const ROI_CONSTANTS = {
  avgDowntimeCostPerHour: 450000,        // DZD
  downtimeReductionPercent: 35,         // %
  mtbfImprovementPercent: 25,           // %
  pmComplianceTarget: 95,               // %
  avgRepairTimeReduction: 20,           // %
};

// Customer testimonials
export const TESTIMONIALS = [
  {
    quote: "Depuis l'implémentation de GMAO Pro, nos arrêts non planifiés ont diminué de 42%. Le ROI a été atteint en seulement 4 mois.",
    author: "Karim Benali",
    role: "Directeur Technique",
    company: "Lafarge Algérie - Cimenterie d'Oued Righ",
    avatar: "KB",
  },
  {
    quote: "La conformité de nos maintenances préventives est passée de 67% à 94% en 6 mois.",
    author: "Fatima Zohra Hamidi",
    role: "Responsable Maintenance",
    company: "CHU Mustapha Alger",
    avatar: "FH",
  },
  {
    quote: "La supervision IoT en temps réel nous permet d'anticiper les pannes critiques. Nous avons évité 3 arrêts majeurs cette année.",
    author: "Mohamed Saidi",
    role: "DSI",
    company: "Sonelgaz Distribution Est",
    avatar: "MS",
  },
];

// Platform statistics
export const PLATFORM_STATS = {
  activeSites: 127,
  managedAssets: 45000,
  uptime: 98.2,
  countries: 3,
};

// FAQ items
export const FAQ_ITEMS = [
  {
    question: "Est-ce que mes données sont sécurisées ?",
    answer: "Absolument. Vos données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Nos serveurs sont hébergés en Europe et nous sommes conformes au RGPD. Nous effectuons des sauvegardes quotidiennes avec une rétention de 30 jours.",
  },
  {
    question: "Puis-je changer de plan en cours d'abonnement ?",
    answer: "Oui, vous pouvez upgrader à tout moment. La différence sera calculée au prorata. Pour un downgrade, le changement prendra effet à la prochaine période de facturation.",
  },
  {
    question: "Comment fonctionne la période d'essai ?",
    answer: "L'essai gratuit de 14 jours vous donne accès à toutes les fonctionnalités du plan choisi, sans engagement et sans carte bancaire. À la fin de l'essai, vous pouvez souscrire ou vos données seront conservées pendant 30 jours.",
  },
  {
    question: "Proposez-vous une installation on-premise ?",
    answer: "Oui, pour les plans Enterprise, nous proposons un déploiement on-premise ou sur votre cloud privé (AWS, Azure, GCP). Contactez notre équipe commerciale pour discuter de vos besoins spécifiques.",
  },
  {
    question: "Quel format d'export des données ?",
    answer: "Vous pouvez exporter vos données en CSV, Excel, PDF et via notre API REST. Les rapports personnalisés peuvent être programmés et envoyés automatiquement par email.",
  },
  {
    question: "Y a-t-il un engagement minimum ?",
    answer: "Non, nos abonnements mensuels sont sans engagement. Pour les facturations annuelles, vous bénéficiez d'une réduction de 20% et pouvez résilier à tout moment pour la fin de la période en cours.",
  },
  {
    question: "Comment se passe l'intégration avec nos systèmes existants ?",
    answer: "GMAO Pro propose une API REST documentée (OpenAPI) et des connecteurs pour les ERP courants (SAP, Oracle). Notre équipe d'intégration peut vous accompagner pour les projets complexes.",
  },
  {
    question: "Quelles sont les langues supportées ?",
    answer: "L'interface est disponible en français, anglais et arabe. La documentation technique est en français et anglais.",
  },
];

export default PLANS;
