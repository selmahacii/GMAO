// Configuration pour le marché algérien - GMAO Pro
// Étude de marché et besoins spécifiques pour l'Algérie

export const ALGERIAN_CONFIG = {
  // Devise
  currency: {
    code: 'DZD',
    symbol: 'DA',
    name: 'Dinar Algérien',
    locale: 'fr-DZ',
  },

  // Taux de change approximatif (pour affichage)
  exchangeRate: {
    EUR_TO_DZD: 145, // Approximatif
    USD_TO_DZD: 135,
  },

  // Fuseau horaire
  timezone: 'Africa/Algiers',

  // Formats locaux
  formats: {
    currency: (amount: number): string => {
      return new Intl.NumberFormat('fr-DZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + ' DA';
    },
    date: (date: Date): string => {
      return new Intl.DateTimeFormat('fr-DZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    },
    dateTime: (date: Date): string => {
      return new Intl.DateTimeFormat('fr-DZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    },
  },

  // Secteurs industriels principaux en Algérie
  industries: [
    { id: 'oil_gas', name: 'Pétrole et Gaz', icon: '⛽' },
    { id: 'petrochemical', name: 'Pétrochimie', icon: '🧪' },
    { id: 'cement', name: 'Cimenterie', icon: '🏗️' },
    { id: 'steel', name: 'Sidérurgie', icon: '🔩' },
    { id: 'food', name: 'Agroalimentaire', icon: '🌾' },
    { id: 'pharmaceutical', name: 'Pharmaceutique', icon: '💊' },
    { id: 'automotive', name: 'Automobile', icon: '🚗' },
    { id: 'electronics', name: 'Électronique', icon: '📱' },
    { id: 'textile', name: 'Textile', icon: '👕' },
    { id: 'water', name: 'Eau et Assainissement', icon: '💧' },
    { id: 'energy', name: 'Énergie Électrique', icon: '⚡' },
    { id: 'mining', name: 'Mines et Carrières', icon: '⛏️' },
  ],

  // Wilayas (provinces) d'Algérie
  wilayas: [
    { code: '01', name: 'Adrar' },
    { code: '02', name: 'Chlef' },
    { code: '03', name: 'Laghouat' },
    { code: '04', name: 'Oum El Bouaghi' },
    { code: '05', name: 'Batna' },
    { code: '06', name: 'Béjaïa' },
    { code: '07', name: 'Biskra' },
    { code: '08', name: 'Béchar' },
    { code: '09', name: 'Blida' },
    { code: '10', name: 'Bouira' },
    { code: '11', name: 'Tamanrasset' },
    { code: '12', name: 'Tébessa' },
    { code: '13', name: 'Tlemcen' },
    { code: '14', name: 'Tiaret' },
    { code: '15', name: 'Tizi Ouzou' },
    { code: '16', name: 'Alger' },
    { code: '17', name: 'Djelfa' },
    { code: '18', name: 'Jijel' },
    { code: '19', name: 'Sétif' },
    { code: '20', name: 'Saïda' },
    { code: '21', name: 'Skikda' },
    { code: '22', name: 'Sidi Bel Abbès' },
    { code: '23', name: 'Annaba' },
    { code: '24', name: 'Guelma' },
    { code: '25', name: 'Constantine' },
    { code: '26', name: 'Médéa' },
    { code: '27', name: 'Mostaganem' },
    { code: '28', name: 'M\'Sila' },
    { code: '29', name: 'Mascara' },
    { code: '30', name: 'Ouargla' },
    { code: '31', name: 'Oran' },
    { code: '32', name: 'El Bayadh' },
    { code: '33', name: 'Illizi' },
    { code: '34', name: 'Bordj Bou Arréridj' },
    { code: '35', name: 'Boumerdès' },
    { code: '36', name: 'El Tarf' },
    { code: '37', name: 'Tindouf' },
    { code: '38', name: 'Tissemsilt' },
    { code: '39', name: 'El Oued' },
    { code: '40', name: 'Khenchela' },
    { code: '41', name: 'Souk Ahras' },
    { code: '42', name: 'Tipaza' },
    { code: '43', name: 'Mila' },
    { code: '44', name: 'Aïn Defla' },
    { code: '45', name: 'Naâma' },
    { code: '46', name: 'Aïn Témouchent' },
    { code: '47', name: 'Ghardaïa' },
    { code: '48', name: 'Relizane' },
    { code: '49', name: 'Timimoun' },
    { code: '50', name: 'Bordj Badji Mokhtar' },
    { code: '51', name: 'Ouled Djellal' },
    { code: '52', name: 'Béni Abbès' },
    { code: '53', name: 'In Salah' },
    { code: '54', name: 'In Guezzam' },
    { code: '55', name: 'Touggourt' },
    { code: '56', name: 'Djanet' },
    { code: '57', name: 'El M\'Ghair' },
    { code: '58', name: 'El Meniaa' },
  ],

  // Conformité réglementaire algérienne
  regulations: {
    // Normes HSE
    hse: [
      {
        id: 'decret_88_07',
        name: 'Décret 88-07',
        description: 'Hygiène, sécurité et médecine du travail',
        mandatory: true,
      },
      {
        id: 'loi_04_18',
        name: 'Loi 04-18',
        description: 'Prévention des risques majeurs',
        mandatory: true,
      },
      {
        id: 'decret_91_05',
        name: 'Décret 91-05',
        description: 'Prévention des accidents de travail',
        mandatory: true,
      },
    ],
    // Normes d'équipements
    equipment: [
      {
        id: 'na_1600',
        name: 'NA 1600',
        description: 'Sécurité des machines',
        mandatory: true,
      },
      {
        id: 'na_1051',
        name: 'NA 1051',
        description: 'Appareils à pression',
        mandatory: true,
      },
      {
        id: 'na_1669',
        name: 'NA 1669',
        description: 'Équipements électriques',
        mandatory: true,
      },
    ],
    // Inspections obligatoires
    inspections: [
      {
        type: 'extincteurs',
        frequency: 'annual',
        authority: 'Protection Civile',
      },
      {
        type: 'appareils_pression',
        frequency: 'annual',
        authority: 'Direction de l\'Industrie',
      },
      {
        type: 'ascenseurs',
        frequency: 'semiannual',
        authority: 'Direction de l\'Industrie',
      },
      {
        type: 'electrique',
        frequency: 'annual',
        authority: 'SONELGAZ / APAVE',
      },
    ],
  },

  // Fournisseurs locaux types
  localSuppliers: [
    { name: 'SONAREM', sector: 'Équipements industriels', type: 'national' },
    { name: 'ENIE', sector: 'Électronique', type: 'national' },
    { name: 'SOMIPHOS', sector: 'Pétrochimie', type: 'national' },
    { name: 'SOTRAFER', sector: 'Matériaux ferreux', type: 'national' },
    { name: 'ENAC', sector: 'Construction', type: 'national' },
    { name: 'SAIDAL', sector: 'Pharmaceutique', type: 'national' },
    { name: 'COSIDER', sector: 'Travaux publics', type: 'national' },
    { name: 'GICA', sector: 'Ciment', type: 'national' },
  ],

  // Jours fériés en Algérie
  holidays: [
    { date: '01-01', name: 'Jour de l\'An' },
    { date: '01-12', name: 'Jour de l\'An Amazigh' },
    { date: '02-18', name: 'Anniversaire de la grève des étudiants' },
    { date: '03-08', name: 'Journée de la femme' },
    { date: '05-01', name: 'Fête du travail' },
    { date: '07-05', name: 'Fête de l\'indépendance des jeunes' },
    { date: '07-05', name: 'Journée du scout' },
    { date: '11-01', name: 'Anniversaire de la Révolution' },
    { date: '02-??', name: 'Aïd El Fitr' }, // Variable
    { date: '??-??', name: 'Aïd El Adha' }, // Variable
    { date: '??-??', name: 'Mouloud' }, // Variable
    { date: '07-05', name: 'Fête de l\'Indépendance' },
    { date: '11-01', name: 'Fête de la Révolution' },
  ],

  // Horaires de travail typiques
  workSchedules: {
    standard: {
      start: '08:00',
      end: '16:30',
      daysPerWeek: 5,
      hoursPerWeek: 40,
    },
    shift: {
      morning: { start: '06:00', end: '14:00' },
      afternoon: { start: '14:00', end: '22:00' },
      night: { start: '22:00', end: '06:00' },
    },
  },

  // Conventions collectives par secteur
  collectiveAgreements: [
    { sector: 'oil_gas', name: 'Convention pétrole et gaz', minimumWage: 45000 },
    { sector: 'cement', name: 'Convention ciment', minimumWage: 35000 },
    { sector: 'steel', name: 'Convention sidérurgie', minimumWage: 38000 },
    { sector: 'food', name: 'Convention agroalimentaire', minimumWage: 30000 },
    { sector: 'general', name: 'Convention générale', minimumWage: 20000 },
  ],
};

// Besoins spécifiques du marché algérien pour une GMAO
export const ALGERIAN_GMAO_NEEDS = {
  // Fonctionnalités critiques
  criticalFeatures: [
    {
      feature: 'Gestion multilingue',
      description: 'Interface en français et arabe',
      priority: 'high',
    },
    {
      feature: 'Conformité réglementaire',
      description: 'Suivi des inspections obligatoires et certifications',
      priority: 'high',
    },
    {
      feature: 'Gestion des équipes postées',
      description: 'Planification des équipes 3x8 pour les usines continues',
      priority: 'high',
    },
    {
      feature: 'Intégration douanière',
      description: 'Suivi des importations de pièces de rechange',
      priority: 'medium',
    },
    {
      feature: 'Gestion des fournisseurs locaux',
      description: 'Base de données des fournisseurs algériens',
      priority: 'medium',
    },
    {
      feature: 'Rapports SONATRACH',
      description: 'Formats de rapports conformes aux exigences SONATRACH',
      priority: 'medium',
    },
    {
      feature: 'Budget en devises',
      description: 'Gestion multi-devises (DZD, EUR, USD)',
      priority: 'medium',
    },
  ],

  // Défis spécifiques
  challenges: [
    {
      challenge: 'Disponibilité des pièces',
      description: 'Délais d\'importation longs (2-6 mois)',
      solution: 'Stocks de sécurité élevés, prévision améliorée',
    },
    {
      challenge: 'Formation technique',
      description: 'Manque de techniciens spécialisés',
      solution: 'Module de formation intégré, guides pas-à-pas',
    },
    {
      challenge: 'Infrastructure électrique',
      description: 'Coupures fréquentes dans certaines régions',
      solution: 'Mode hors-ligne, synchronisation automatique',
    },
    {
      challenge: 'Réglementation changeante',
      description: 'Évolution fréquente des normes',
      solution: 'Mises à jour réglementaires automatiques',
    },
  ],

  // KPIs spécifiques au contexte algérien
  specificKPIs: [
    {
      name: 'Taux de conformité réglementaire',
      description: 'Pourcentage d\'équipements conformes aux normes NA',
      target: 100,
    },
    {
      name: 'Délai d\'approvisionnement moyen',
      description: 'Temps moyen de réception des pièces importées',
      target: '< 30 jours',
    },
    {
      name: 'Taux de localisation',
      description: 'Pourcentage de pièces achetées localement',
      target: '> 40%',
    },
    {
      name: 'Coût de maintenance par heure',
      description: 'Coût moyen en DA par heure de maintenance',
      target: '< 5000 DA',
    },
    {
      name: 'Disponibilité des équipements critiques',
      description: 'Disponibilité des équipements de classe A',
      target: '> 98%',
    },
  ],
};

export default ALGERIAN_CONFIG;
