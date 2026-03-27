// GMAO Pro - Seed Data Generator
// Generates realistic industrial data for the CMMS system

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { addDays, addHours, subDays, subHours, subMonths, subYears } from 'date-fns';

const prisma = new PrismaClient();

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Organizations
const organizations = [
  {
    id: 'org_cimenterie',
    name: 'Cimenterie Aurès SA',
    industry: 'manufacturing',
    plan: 'Enterprise',
    sitesCount: 2,
    timezone: "Africa/Algiers",
    currency: "DZD",
  },
  {
    id: 'org_chu',
    name: 'CHU Alger Centre',
    industry: 'healthcare',
    plan: 'Pro',
    sitesCount: 2,
    timezone: 'Africa/Algiers',
    currency: "DZD",
  },
  {
    id: 'org_sonelgaz',
    name: 'Sonelgaz Distribution Est',
    industry: 'utilities',
    plan: 'Enterprise',
    sitesCount: 1,
    timezone: 'Africa/Algiers',
    currency: "DZD",
  },
];

// Sites per organization
const sites = [
  { id: 'site_cimenterie_main', orgId: 'org_cimenterie', name: 'Usine Principale Batna', address: 'Zone Industrielle, Batna 05000', country: 'Algeria', type: 'factory', surfaceM2: 45000 },
  { id: 'site_cimenterie_quarry', orgId: 'org_cimenterie', name: 'Carrière Ain Touta', address: 'Ain Touta, Batna 05100', country: 'Algeria', type: 'infrastructure', surfaceM2: 120000 },
  { id: 'site_chu_main', orgId: 'org_chu', name: 'Hôpital Central Mustapha', address: 'Place du 1er Mai, Alger 16000', country: 'Algeria', type: 'hospital', surfaceM2: 35000 },
  { id: 'site_chu_annex', orgId: 'org_chu', name: 'Centre de Santé Bir Mourad', address: 'Bir Mourad Rais, Alger 16000', country: 'Algeria', type: 'hospital', surfaceM2: 8000 },
  { id: 'site_sonelgaz', orgId: 'org_sonelgaz', name: 'Poste Distribution Constantine', address: 'Zone Industrielle, Constantine 25000', country: 'Algeria', type: 'infrastructure', surfaceM2: 15000 },
];

// Asset categories
const assetCategories = [
  { id: 'cat_hvac', name: 'HVAC', defaultPmIntervalDays: 90, criticalityDefault: 'B' },
  { id: 'cat_electrical', name: 'Électrique', defaultPmIntervalDays: 180, criticalityDefault: 'A' },
  { id: 'cat_mechanical', name: 'Mécanique', defaultPmIntervalDays: 60, criticalityDefault: 'B' },
  { id: 'cat_civil', name: 'Génie Civil', defaultPmIntervalDays: 365, criticalityDefault: 'C' },
  { id: 'cat_it', name: 'IT & Télécoms', defaultPmIntervalDays: 30, criticalityDefault: 'B' },
  { id: 'cat_safety', name: 'Sécurité Incendie', defaultPmIntervalDays: 30, criticalityDefault: 'A' },
  { id: 'cat_utilities', name: 'Utilités', defaultPmIntervalDays: 90, criticalityDefault: 'B' },
  { id: 'cat_production', name: 'Production', defaultPmIntervalDays: 45, criticalityDefault: 'A' },
];

// Asset templates per category
const assetTemplates: Record<string, Array<{ name: string; type: string; criticality: string; mtbfBase: number; cost: number }>> = {
  'cat_hvac': [
    { name: 'Centrale de Traitement d\'Air', type: 'static', criticality: 'B', mtbfBase: 4380, cost: 85000 },
    { name: 'Groupe Froid Chiller', type: 'rotating', criticality: 'A', mtbfBase: 2200, cost: 250000 },
    { name: 'Ventilateur Extraction', type: 'rotating', criticality: 'C', mtbfBase: 8760, cost: 12000 },
    { name: 'Pompe à Chaleur', type: 'rotating', criticality: 'B', mtbfBase: 3500, cost: 45000 },
    { name: 'Tour de Refroidissement', type: 'static', criticality: 'B', mtbfBase: 6000, cost: 75000 },
    { name: 'Climatiseur Industriel', type: 'static', criticality: 'B', mtbfBase: 4380, cost: 35000 },
    { name: 'VRF System', type: 'static', criticality: 'C', mtbfBase: 5000, cost: 55000 },
  ],
  'cat_electrical': [
    { name: 'Transformateur HTA/BT', type: 'electrical', criticality: 'A', mtbfBase: 15000, cost: 180000 },
    { name: 'Groupe Électrogène', type: 'rotating', criticality: 'A', mtbfBase: 4500, cost: 320000 },
    { name: 'TGBT', type: 'electrical', criticality: 'A', mtbfBase: 20000, cost: 85000 },
    { name: 'Onduleur UPS', type: 'electrical', criticality: 'A', mtbfBase: 8000, cost: 95000 },
    { name: 'Armoire Électrique', type: 'electrical', criticality: 'B', mtbfBase: 15000, cost: 25000 },
    { name: 'Câblage HTA', type: 'electrical', criticality: 'A', mtbfBase: 25000, cost: 150000 },
    { name: 'Parafoudre', type: 'electrical', criticality: 'B', mtbfBase: 20000, cost: 8000 },
  ],
  'cat_mechanical': [
    { name: 'Pompe Centrifuge', type: 'rotating', criticality: 'B', mtbfBase: 3000, cost: 18000 },
    { name: 'Compresseur Industriel', type: 'rotating', criticality: 'A', mtbfBase: 2500, cost: 125000 },
    { name: 'Convoyeur à Bande', type: 'rotating', criticality: 'B', mtbfBase: 4000, cost: 45000 },
    { name: 'Broyeur à Marteaux', type: 'rotating', criticality: 'A', mtbfBase: 1800, cost: 280000 },
    { name: 'Broyeur Vertical', type: 'rotating', criticality: 'A', mtbfBase: 2200, cost: 450000 },
    { name: 'Élévateur à Godets', type: 'rotating', criticality: 'B', mtbfBase: 3500, cost: 65000 },
    { name: 'Silo Stockage', type: 'static', criticality: 'C', mtbfBase: 15000, cost: 120000 },
  ],
  'cat_civil': [
    { name: 'Bâtiment Principal', type: 'building', criticality: 'C', mtbfBase: 50000, cost: 2500000 },
    { name: 'Parking', type: 'building', criticality: 'C', mtbfBase: 50000, cost: 500000 },
    { name: 'Route Interne', type: 'building', criticality: 'C', mtbfBase: 30000, cost: 200000 },
    { name: 'Clôture Périphérique', type: 'building', criticality: 'C', mtbfBase: 40000, cost: 150000 },
  ],
  'cat_it': [
    { name: 'Serveur Principal', type: 'instrumentation', criticality: 'A', mtbfBase: 8760, cost: 45000 },
    { name: 'Baie de Serveurs', type: 'instrumentation', criticality: 'A', mtbfBase: 10000, cost: 85000 },
    { name: 'Switch Réseau', type: 'instrumentation', criticality: 'B', mtbfBase: 15000, cost: 5500 },
    { name: 'Caméra Surveillance', type: 'instrumentation', criticality: 'C', mtbfBase: 20000, cost: 1200 },
    { name: 'Système Contrôle Accès', type: 'instrumentation', criticality: 'B', mtbfBase: 12000, cost: 8500 },
  ],
  'cat_safety': [
    { name: 'Extincteur', type: 'static', criticality: 'C', mtbfBase: 30000, cost: 250 },
    { name: 'Ria Extincteur', type: 'static', criticality: 'B', mtbfBase: 20000, cost: 45000 },
    { name: 'Système Détection Incendie', type: 'instrumentation', criticality: 'A', mtbfBase: 8760, cost: 125000 },
    { name: 'Porte Coupe-Feu', type: 'static', criticality: 'B', mtbfBase: 15000, cost: 8500 },
    { name: 'Éclairage Sécurité', type: 'electrical', criticality: 'B', mtbfBase: 10000, cost: 3500 },
  ],
  'cat_utilities': [
    { name: 'Station de Traitement Eau', type: 'static', criticality: 'B', mtbfBase: 6000, cost: 185000 },
    { name: 'Chaudière Industrielle', type: 'static', criticality: 'A', mtbfBase: 3500, cost: 350000 },
    { name: 'Compresseur Air', type: 'rotating', criticality: 'A', mtbfBase: 2800, cost: 95000 },
    { name: 'Groupe Hydrophore', type: 'rotating', criticality: 'B', mtbfBase: 4000, cost: 28000 },
    { name: 'Réservoir Fuel', type: 'static', criticality: 'B', mtbfBase: 20000, cost: 65000 },
  ],
  'cat_production': [
    { name: 'Four Rotatif', type: 'rotating', criticality: 'A', mtbfBase: 3000, cost: 850000 },
    { name: 'Broyeur à Boulets', type: 'rotating', criticality: 'A', mtbfBase: 2200, cost: 650000 },
    { name: 'Séparateur Dynamique', type: 'rotating', criticality: 'A', mtbfBase: 4000, cost: 180000 },
    { name: 'Filtre à Manches', type: 'static', criticality: 'B', mtbfBase: 5000, cost: 125000 },
    { name: 'Silo à Ciment', type: 'static', criticality: 'B', mtbfBase: 12000, cost: 280000 },
    { name: 'Ensacheuse', type: 'rotating', criticality: 'A', mtbfBase: 3500, cost: 220000 },
    { name: 'Chargeur Frontal', type: 'vehicle', criticality: 'C', mtbfBase: 2000, cost: 180000 },
  ],
};

// Locations
const locations = {
  zones: ['Zone A', 'Zone B', 'Zone C', 'Zone Production', 'Zone Utilités', 'Zone Stockage', 'Zone Administrative'],
  floors: ['RDJ', 'RDC', 'N+1', 'N+2', 'N+3', 'Sous-sol 1', 'Sous-sol 2', 'Extérieur'],
  rooms: ['Local Technique 1', 'Local Technique 2', 'Salle des Machines', 'Salle Électrique', 'Salle Contrôle', 'Atelier', 'Extérieur', 'Toiture'],
};

// Failure categories
const failureCategories = ['mechanical', 'electrical', 'wear', 'human_error', 'external'];
const failureModes = [
  'FMEA-001: Usure prématurée',
  'FMEA-002: Surcharge électrique',
  'FMEA-003: Défaut de lubrification',
  'FMEA-004: Vibrations excessives',
  'FMEA-005: Surchauffe',
  'FMEA-006: Fuite hydraulique',
  'FMEA-007: Court-circuit',
  'FMEA-008: Défaillance capteur',
  'FMEA-009: Corrosion',
  'FMEA-010: Erreur opérateur',
];

// Spare part categories
const sparePartCategories = ['mechanical', 'electrical', 'consumable', 'lubricant', 'filter', 'seal', 'bearing'];
const sparePartTemplates = [
  { category: 'mechanical', name: 'Roulement SKF 6205', partNumber: 'ROU-6205-SKF', unit: 'pcs', cost: 45, minStock: 10, isCritical: true },
  { category: 'mechanical', name: 'Joint Torique Kit', partNumber: 'JOR-KIT-01', unit: 'kit', cost: 25, minStock: 5, isCritical: false },
  { category: 'mechanical', name: 'Courroie Trapézoïdale', partNumber: 'COU-TRAP-A', unit: 'm', cost: 15, minStock: 20, isCritical: false },
  { category: 'mechanical', name: 'Arbre de Transmission', partNumber: 'ARB-TRANS-01', unit: 'pcs', cost: 850, minStock: 2, isCritical: true },
  { category: 'electrical', name: 'Contacteur 25A', partNumber: 'CON-25A-SCH', unit: 'pcs', cost: 120, minStock: 5, isCritical: true },
  { category: 'electrical', name: 'Disjoncteur 63A', partNumber: 'DIS-63A-ABB', unit: 'pcs', cost: 85, minStock: 4, isCritical: true },
  { category: 'electrical', name: 'Fusible gG 100A', partNumber: 'FUS-GG-100', unit: 'pcs', cost: 12, minStock: 20, isCritical: false },
  { category: 'electrical', name: 'Variateur de Vitesse 7.5kW', partNumber: 'VAR-7.5-ABB', unit: 'pcs', cost: 2500, minStock: 1, isCritical: true },
  { category: 'consumable', name: 'Boulonnerie Inox M12', partNumber: 'BOU-INOX-M12', unit: 'kg', cost: 18, minStock: 15, isCritical: false },
  { category: 'consumable', name: 'Feutre Joint', partNumber: 'FEL-JOINT-01', unit: 'm2', cost: 35, minStock: 5, isCritical: false },
  { category: 'lubricant', name: 'Huile Hydraulique ISO 46', partNumber: 'HUI-HYD-46', unit: 'L', cost: 8, minStock: 200, isCritical: true },
  { category: 'lubricant', name: 'Graisse Multipurpose', partNumber: 'GRA-MULTI-01', unit: 'kg', cost: 12, minStock: 50, isCritical: false },
  { category: 'filter', name: 'Filtre à Air Compresseur', partNumber: 'FIL-AIR-COMP', unit: 'pcs', cost: 65, minStock: 8, isCritical: true },
  { category: 'filter', name: 'Filtre à Huile', partNumber: 'FIL-HUI-01', unit: 'pcs', cost: 35, minStock: 15, isCritical: true },
  { category: 'seal', name: 'Joint Mécanique', partNumber: 'JNT-MEC-25', unit: 'pcs', cost: 280, minStock: 3, isCritical: true },
  { category: 'bearing', name: 'Roulement à Rouleaux', partNumber: 'ROU-ROUL-01', unit: 'pcs', cost: 320, minStock: 4, isCritical: true },
];

// Suppliers
const suppliers = [
  { id: 'sup_schneider', name: 'Schneider Electric Algérie', contactName: 'Ahmed Benali', email: 'abenali@schneider.dz', phone: '+213 21 45 67 89', country: 'Algeria', rating: 5, preferred: true },
  { id: 'sup_abb', name: 'ABB Algeria', contactName: 'Karim Hadj', email: 'khadj@abb.com', phone: '+213 21 34 56 78', country: 'Algeria', rating: 4, preferred: true },
  { id: 'sup_skf', name: 'SKF Maghreb', contactName: 'Mohamed Saidi', email: 'msaidi@skf.com', phone: '+213 21 23 45 67', country: 'Algeria', rating: 5, preferred: true },
  { id: 'sup_locaux', name: 'Fournitures Industrielles Locales', contactName: 'Youcef Hamidi', email: 'yhamidi@fil.dz', phone: '+213 21 12 34 56', country: 'Algeria', rating: 3, preferred: false },
  { id: 'sup_cat', name: 'Caterpillar Algeria', contactName: 'Rachid Bouzid', email: 'rbouzid@cat.com', phone: '+213 21 98 76 54', country: 'Algeria', rating: 4, preferred: true },
];

async function main() {
  console.log('🌱 Starting GMAO Pro seed data generation...');

  // Clear existing data
  await prisma.sensorReading.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.sparePartMovement.deleteMany();
  await prisma.woPartUsed.deleteMany();
  await prisma.woLaborEntry.deleteMany();
  await prisma.woChecklistCompletion.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.pmSchedule.deleteMany();
  await prisma.pmTemplate.deleteMany();
  await prisma.assetMeter.deleteMany();
  await prisma.assetCompatiblePart.deleteMany();
  await prisma.ioTSensor.deleteMany();
  await prisma.sparePart.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.site.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.maintenanceContract.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.userPreference.deleteMany();

  // Create organizations
  console.log('Creating organizations...');
  for (const org of organizations) {
    await prisma.organization.create({ data: org });
  }

  // Create sites
  console.log('Creating sites...');
  for (const site of sites) {
    await prisma.site.create({ data: site });
  }

  // Create users
  console.log('Creating users...');
  const hashedPassword = await hash('password123', 10);
  const users: Array<{ id: string; orgId: string; siteId: string | null; email: string; fullName: string; role: string; specializations: string }> = [];
  
  for (const org of organizations) {
    const orgSites = sites.filter(s => s.orgId === org.id);
    
    // Admin
    users.push({
      id: `user_admin_${org.id}`,
      orgId: org.id,
      siteId: null,
      email: `admin@${org.name.toLowerCase().replace(/\s+/g, '').substring(0, 10)}.dz`,
      fullName: `Admin ${org.name.split(' ')[0]}`,
      role: 'admin',
      specializations: JSON.stringify(['electrical', 'mechanical']),
    });

    // Managers per site
    for (const site of orgSites) {
      users.push({
        id: `user_mgr_${site.id}`,
        orgId: org.id,
        siteId: site.id,
        email: `manager@${site.name.toLowerCase().replace(/\s+/g, '').substring(0, 10)}.dz`,
        fullName: `Gestionnaire ${site.name.split(' ')[0]}`,
        role: 'manager',
        specializations: JSON.stringify(['electrical', 'mechanical', 'HVAC']),
      });

      // Technicians per site
      const techCount = randomInt(5, 10);
      const allSpecs = ['electrical', 'mechanical', 'HVAC', 'plumbing', 'IT'];
      for (let i = 0; i < techCount; i++) {
        const specs = JSON.stringify([randomElement(allSpecs), randomElement(allSpecs)].filter((v, i, a) => a.indexOf(v) === i));
        users.push({
          id: `user_tech_${site.id}_${i}`,
          orgId: org.id,
          siteId: site.id,
          email: `technicien${i + 1}@${site.name.toLowerCase().replace(/\s+/g, '').substring(0, 10)}.dz`,
          fullName: `Technicien ${site.name.split(' ')[0]} ${i + 1}`,
          role: 'technician',
          specializations: specs,
        });
      }

      // Planners
      users.push({
        id: `user_plan_${site.id}`,
        orgId: org.id,
        siteId: site.id,
        email: `planificateur@${site.name.toLowerCase().replace(/\s+/g, '').substring(0, 10)}.dz`,
        fullName: `Planificateur ${site.name.split(' ')[0]}`,
        role: 'planner',
        specializations: JSON.stringify([]),
      });
    }
  }

  for (const user of users) {
    await prisma.user.create({
      data: {
        ...user,
        password: hashedPassword,
        phone: `+213 5 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
        hourlyRateDzd: user.role === 'technician' ? randomFloat(25, 45) : null,
        active: true,
      },
    });
  }

  // Create asset categories
  console.log('Creating asset categories...');
  for (const cat of assetCategories) {
    await prisma.assetCategory.create({ data: cat });
  }

  // Create suppliers
  console.log('Creating suppliers...');
  for (const sup of suppliers) {
    await prisma.supplier.create({
      data: {
        id: sup.id,
        orgId: organizations[0].id, // Primary org
        name: sup.name,
        contactName: sup.contactName,
        email: sup.email,
        phone: sup.phone,
        country: sup.country,
        rating: sup.rating,
        preferred: sup.preferred,
        paymentTerms: 'Net 30',
      },
    });
  }

  // Create assets
  console.log('Creating assets...');
  const allAssets: Array<{
    id: string;
    orgId: string;
    siteId: string;
    assetTag: string;
    name: string;
    categoryId: string | null;
    assetType: string;
    criticality: string;
    status: string;
    mtbfHours: number;
    mttrHours: number;
    availabilityPct: number;
    healthScore: number;
    purchasePriceDzd: number;
  }> = [];
  
  let assetCounter = 1;
  for (const site of sites) {
    const org = organizations.find(o => o.id === site.orgId)!;
    
    // Create assets per category based on site type
    const relevantCategories = org.industry === 'manufacturing' 
      ? ['cat_production', 'cat_mechanical', 'cat_electrical', 'cat_utilities', 'cat_hvac', 'cat_safety']
      : org.industry === 'healthcare'
      ? ['cat_hvac', 'cat_electrical', 'cat_mechanical', 'cat_it', 'cat_safety', 'cat_utilities']
      : ['cat_electrical', 'cat_mechanical', 'cat_utilities', 'cat_hvac', 'cat_safety', 'cat_civil'];

    for (const catId of relevantCategories) {
      const cat = assetCategories.find(c => c.id === catId)!;
      const templates = assetTemplates[catId] || [];
      
      const assetCount = randomInt(8, 20);
      for (let i = 0; i < assetCount; i++) {
        const template = templates.length > 0 ? randomElement(templates) : null;
        const tagNumber = String(assetCounter).padStart(5, '0');
        
        const mtbfBase = template?.mtbfBase || 5000;
        const mtbf = mtbfBase * randomFloat(0.8, 1.2);
        const mttr = randomFloat(2, 12);
        const availability = (mtbf / (mtbf + mttr)) * 100;
        const healthScore = randomFloat(60, 100);

        allAssets.push({
          id: `asset_${tagNumber}`,
          orgId: org.id,
          siteId: site.id,
          assetTag: `EQ-${site.type.substring(0, 3).toUpperCase()}-${tagNumber}`,
          name: template?.name || `${cat.name} Equipment ${i + 1}`,
          categoryId: catId,
          assetType: template?.type || 'static',
          criticality: template?.criticality || cat.criticalityDefault,
          status: randomElement(['operational', 'operational', 'operational', 'operational', 'degraded', 'under_maintenance']),
          mtbfHours: mtbf,
          mttrHours: mttr,
          availabilityPct: availability,
          healthScore: healthScore,
          purchasePriceDzd: template?.cost || randomFloat(5000, 50000),
        });
        
        assetCounter++;
      }
    }
  }

  for (const asset of allAssets) {
    await prisma.asset.create({
      data: {
        ...asset,
        description: `Equipment: ${asset.name}`,
        manufacturer: randomElement(['Siemens', 'ABB', 'Schneider', 'SKF', 'Caterpillar', 'Atlas Copco', 'Local Supplier']),
        model: `Model-${randomInt(100, 999)}`,
        serialNumber: `SN-${generateId().toUpperCase()}`,
        yearManufactured: randomInt(2015, 2023),
        yearInstalled: randomInt(2016, 2024),
        locationZone: randomElement(locations.zones),
        locationFloor: randomElement(locations.floors),
        locationRoom: randomElement(locations.rooms),
        replacementCostDzd: asset.purchasePriceDzd * 1.15,
        warrantyExpiryDate: randomInt(0, 1) ? addDays(new Date(), randomInt(-365, 365)) : null,
        expectedLifespanYears: randomInt(15, 25),
        lastMaintenanceDate: subDays(new Date(), randomInt(1, 90)),
        nextMaintenanceDate: addDays(new Date(), randomInt(1, 180)),
        maintenanceCountTotal: randomInt(5, 50),
        operatingHoursTotal: randomFloat(10000, 100000),
        operatingHoursSinceLastPm: randomFloat(100, 2000),
        oeeScore: asset.assetType === 'rotating' ? randomFloat(70, 95) : null,
      },
    });
  }

  // Create spare parts
  console.log('Creating spare parts...');
  const allParts: Array<{ id: string; orgId: string; partNumber: string; name: string; category: string; stockQty: number }> = [];
  
  for (const org of organizations) {
    for (const template of sparePartTemplates) {
      const partId = `part_${org.id}_${template.partNumber.replace(/-/g, '_')}`;
      const stockQty = randomFloat(0, 100);
      
      allParts.push({
        id: partId,
        orgId: org.id,
        partNumber: `${org.id.substring(0, 3).toUpperCase()}-${template.partNumber}`,
        name: template.name,
        category: template.category,
        stockQty: stockQty,
      });

      await prisma.sparePart.create({
        data: {
          id: partId,
          orgId: org.id,
          siteId: null,
          partNumber: `${org.id.substring(0, 3).toUpperCase()}-${template.partNumber}`,
          name: template.name,
          category: template.category,
          unit: template.unit,
          unitCostDzd: template.cost,
          lastPurchasePriceDzd: template.cost * randomFloat(0.95, 1.1),
          stockQty: stockQty,
          minStockQty: template.minStock,
          maxStockQty: template.minStock * 3,
          reorderQty: template.minStock * 2,
          stockLocation: `Magasin-${randomElement(['A', 'B', 'C'])}-${randomInt(1, 20)}`,
          leadTimeDays: randomInt(7, 45),
          isCritical: template.isCritical,
          preferredSupplierId: randomElement(suppliers).id,
        },
      });
    }
  }

  // Create PM Templates
  console.log('Creating PM templates...');
  const pmTemplates = [
    { name: 'Inspection Mensuelle HVAC', frequencyType: 'calendar', intervalDays: 30, estimatedDurationHours: 2 },
    { name: 'Maintenance Trimestrielle Électrique', frequencyType: 'calendar', intervalDays: 90, estimatedDurationHours: 4 },
    { name: 'Vidange Annuelle Groupe Électrogène', frequencyType: 'calendar', intervalDays: 365, estimatedDurationHours: 8 },
    { name: 'Inspection Hebdomadaire Sécurité', frequencyType: 'calendar', intervalDays: 7, estimatedDurationHours: 1 },
    { name: 'Calibration Capteurs', frequencyType: 'calendar', intervalDays: 180, estimatedDurationHours: 3 },
    { name: 'Graissage Roulements', frequencyType: 'meter', intervalMeterValue: 500, estimatedDurationHours: 1 },
    { name: 'Remplacement Filtres', frequencyType: 'calendar', intervalDays: 90, estimatedDurationHours: 2 },
  ];

  for (const org of organizations) {
    for (let i = 0; i < pmTemplates.length; i++) {
      const template = pmTemplates[i];
      await prisma.pmTemplate.create({
        data: {
          id: `pmtpl_${org.id}_${i}`,
          orgId: org.id,
          name: template.name,
          frequencyType: template.frequencyType,
          intervalDays: template.intervalDays,
          intervalMeterValue: template.intervalMeterValue || null,
          estimatedDurationHours: template.estimatedDurationHours,
          checklistItems: JSON.stringify([
            'Vérification visuelle générale',
            'Contrôle des niveaux',
            'Test des sécurités',
            'Nettoyage',
            'Rapport d\'intervention',
          ]),
          requiredParts: JSON.stringify([]),
          requiredTools: JSON.stringify(['Outillage standard', 'Multimètre', 'Thermomètre infrarouge']),
        },
      });
    }
  }

  // Create work orders
  console.log('Creating work orders...');
  const woStatuses = ['draft', 'planned', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled', 'validated'];
  const woTypes = ['corrective', 'preventive', 'predictive', 'inspection', 'emergency'];
  const priorities = ['P1_emergency', 'P2_urgent', 'P3_normal', 'P4_low'];

  let woCounter = 1;
  const workOrders: Array<{ id: string; woNumber: string; orgId: string; siteId: string; status: string }> = [];

  for (const org of organizations) {
    const orgSites = sites.filter(s => s.orgId === org.id);
    const orgUsers = users.filter(u => u.orgId === org.id);
    const orgAssets = allAssets.filter(a => a.orgId === org.id);
    
    const woCount = randomInt(400, 600);
    for (let i = 0; i < woCount; i++) {
      const site = randomElement(orgSites);
      const woId = `wo_${org.id}_${i}`;
      const woNumber = `WO-${new Date().getFullYear()}-${String(woCounter).padStart(5, '0')}`;
      
      const woType = Math.random() < 0.6 ? 'corrective' : Math.random() < 0.3 ? 'preventive' : randomElement(woTypes);
      const createdDaysAgo = randomInt(1, 730);
      const createdAt = subDays(new Date(), createdDaysAgo);
      
      let status = randomElement(woStatuses);
      if (createdDaysAgo < 30) {
        status = Math.random() < 0.4 ? 'in_progress' : Math.random() < 0.6 ? 'completed' : status;
      } else if (createdDaysAgo < 90) {
        status = Math.random() < 0.8 ? 'completed' : Math.random() < 0.9 ? 'validated' : status;
      } else {
        status = Math.random() < 0.9 ? 'validated' : 'completed';
      }

      const asset = Math.random() < 0.85 ? randomElement(orgAssets.filter(a => a.siteId === site.id)) : null;
      const requester = randomElement(orgUsers.filter(u => u.role !== 'viewer'));
      const assignee = Math.random() < 0.7 ? randomElement(orgUsers.filter(u => u.role === 'technician')) : null;

      const estimatedHours = randomFloat(1, 16);
      const actualHours = status === 'completed' || status === 'validated' 
        ? estimatedHours * randomFloat(0.7, 1.5) 
        : null;
      const downtimeHours = woType === 'corrective' ? actualHours ? actualHours * randomFloat(0.5, 1) : null : null;

      workOrders.push({ id: woId, woNumber, orgId: org.id, siteId: site.id, status });

      await prisma.workOrder.create({
        data: {
          id: woId,
          orgId: org.id,
          siteId: site.id,
          woNumber,
          woType,
          title: woType === 'corrective' 
            ? `Dépannage ${asset?.name || 'Équipement'} - ${randomElement(['Panne', 'Bruit anormal', 'Fuite', 'Défaillance', 'Alerte'])}`
            : woType === 'preventive'
            ? `Maintenance Préventive ${asset?.name || 'Équipement'}`
            : `${woType.charAt(0).toUpperCase() + woType.slice(1)} ${asset?.name || 'Équipement'}`,
          description: `Description détaillée de l\'ordre de travail ${woNumber}`,
          symptomDescription: woType === 'corrective' ? randomElement(['Bruit anormal détecté', 'Vibrations excessives', 'Surchauffe', 'Fuite d\'huile', 'Arrêt inopiné']) : null,
          assetId: asset?.id || null,
          priority: woType === 'emergency' ? 'P1_emergency' : woType === 'corrective' ? randomElement(priorities) : 'P3_normal',
          status,
          requestedById: requester.id,
          assignedToId: assignee?.id || null,
          createdAt,
          plannedStartAt: addDays(createdAt, randomInt(0, 7)),
          plannedEndAt: addDays(createdAt, randomInt(7, 21)),
          actualStartAt: status !== 'draft' && status !== 'planned' ? addDays(createdAt, randomInt(0, 10)) : null,
          actualEndAt: status === 'completed' || status === 'validated' ? addDays(createdAt, randomInt(10, 20)) : null,
          completedAt: status === 'completed' || status === 'validated' ? addDays(createdAt, randomInt(10, 20)) : null,
          validatedAt: status === 'validated' ? addDays(createdAt, randomInt(20, 25)) : null,
          estimatedDurationHours: estimatedHours,
          actualDurationHours: actualHours,
          estimatedCostDzd: estimatedHours * 35 + randomFloat(100, 2000),
          actualCostDzd: actualHours ? actualHours * 35 + randomFloat(100, 2000) : null,
          downtimeHours,
          rootCause: status === 'completed' || status === 'validated' ? randomElement(failureModes) : null,
          failureCategory: status === 'completed' || status === 'validated' ? randomElement(failureCategories) : null,
          resolutionType: status === 'completed' || status === 'validated' ? randomElement(['repaired', 'replaced', 'adjusted', 'inspected']) : null,
          technicianNotes: status === 'completed' || status === 'validated' ? 'Intervention réalisée selon procédure standard.' : null,
          slaDeadline: addDays(createdAt, woType === 'emergency' ? 4 : woType === 'corrective' ? 7 : 14),
          slaBreached: Math.random() < 0.1,
          checklistItems: JSON.stringify([
            { item: 'Diagnostic initial', done: status !== 'draft' && status !== 'planned' },
            { item: 'Intervention', done: status === 'completed' || status === 'validated' },
            { item: 'Test de fonctionnement', done: status === 'completed' || status === 'validated' },
            { item: 'Nettoyage zone', done: status === 'completed' || status === 'validated' },
          ]),
        },
      });

      woCounter++;
    }
  }

  // Create IoT sensors
  console.log('Creating IoT sensors...');
  const sensorTypes = ['temperature', 'vibration', 'pressure', 'current', 'voltage', 'rpm', 'humidity'];
  
  for (const asset of allAssets.filter(a => a.criticality === 'A' || Math.random() < 0.3)) {
    const sensorCount = randomInt(1, 3);
    for (let i = 0; i < sensorCount; i++) {
      const sensorType = randomElement(sensorTypes);
      const units: Record<string, string> = {
        temperature: '°C',
        vibration: 'mm/s',
        pressure: 'bar',
        current: 'A',
        voltage: 'V',
        rpm: 'tr/min',
        humidity: '%',
      };

      const minNormal = sensorType === 'temperature' ? 20 : sensorType === 'vibration' ? 0 : sensorType === 'pressure' ? 1 : 0;
      const maxNormal = sensorType === 'temperature' ? 60 : sensorType === 'vibration' ? 5 : sensorType === 'pressure' ? 10 : 100;

      await prisma.ioTSensor.create({
        data: {
          id: `sensor_${asset.id}_${i}`,
          orgId: asset.orgId,
          assetId: asset.id,
          sensorType,
          sensorName: `${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)} Sensor ${i + 1}`,
          unit: units[sensorType],
          minNormal,
          maxNormal,
          warningThresholdLow: minNormal - (maxNormal - minNormal) * 0.1,
          warningThresholdHigh: maxNormal + (maxNormal - minNormal) * 0.2,
          criticalThresholdLow: minNormal - (maxNormal - minNormal) * 0.2,
          criticalThresholdHigh: maxNormal + (maxNormal - minNormal) * 0.4,
          lastReadingAt: subHours(new Date(), randomInt(0, 2)),
          lastValue: randomFloat(minNormal, maxNormal),
        },
      });
    }
  }

  // Create sensor readings
  console.log('Creating sensor readings...');
  const sensors = await prisma.ioTSensor.findMany();
  const readingsPerSensor = 100; // Reduced for performance

  for (const sensor of sensors) {
    const readings = [];
    for (let i = 0; i < readingsPerSensor; i++) {
      const value = randomFloat(sensor.minNormal || 0, sensor.maxNormal || 100);
      const isAnomaly = Math.random() < 0.03;
      readings.push({
        id: `reading_${sensor.id}_${i}`,
        sensorId: sensor.id,
        assetId: sensor.assetId,
        value: isAnomaly ? value * randomFloat(1.5, 2) : value,
        unit: sensor.unit,
        timestamp: subHours(new Date(), readingsPerSensor - i),
        anomalyScore: isAnomaly ? randomFloat(0.7, 1) : randomFloat(0, 0.3),
        isAnomaly,
      });
    }
    
    await prisma.sensorReading.createMany({ data: readings });
  }

  // Create alerts
  console.log('Creating alerts...');
  const alertTypes = ['sensor_threshold', 'pm_overdue', 'sla_breach', 'stock_critical', 'anomaly_detected'];
  const severities = ['info', 'warning', 'critical'];

  for (const org of organizations) {
    const orgSites = sites.filter(s => s.orgId === org.id);
    const orgAssets = allAssets.filter(a => a.orgId === org.id);
    const orgSensors = sensors.filter(s => s.orgId === org.id);

    for (let i = 0; i < 30; i++) {
      const alertType = randomElement(alertTypes);
      const severity = alertType === 'sensor_threshold' || alertType === 'anomaly_detected' 
        ? randomElement(severities) 
        : alertType === 'sla_breach' 
        ? 'critical' 
        : randomElement(['warning', 'critical']);

      await prisma.alert.create({
        data: {
          id: `alert_${org.id}_${i}`,
          orgId: org.id,
          siteId: randomElement(orgSites).id,
          assetId: alertType === 'sensor_threshold' || alertType === 'anomaly_detected' ? randomElement(orgAssets).id : null,
          sensorId: alertType === 'sensor_threshold' || alertType === 'anomaly_detected' ? randomElement(orgSensors).id : null,
          alertType,
          severity,
          title: alertType === 'sensor_threshold' 
            ? 'Seuil capteur dépassé' 
            : alertType === 'pm_overdue' 
            ? 'Maintenance préventive en retard'
            : alertType === 'sla_breach'
            ? 'SLA dépassé'
            : alertType === 'stock_critical'
            ? 'Stock critique'
            : 'Anomalie détectée',
          message: `Alerte ${alertType} détectée sur le site.`,
          triggeredAt: subDays(new Date(), randomInt(0, 30)),
          acknowledgedAt: Math.random() < 0.6 ? subDays(new Date(), randomInt(0, 15)) : null,
          resolvedAt: Math.random() < 0.4 ? subDays(new Date(), randomInt(0, 10)) : null,
        },
      });
    }
  }

  // Create spare part movements
  console.log('Creating spare part movements...');
  for (const part of allParts) {
    const movementCount = randomInt(5, 20);
    for (let i = 0; i < movementCount; i++) {
      const type = randomElement(['in', 'out', 'adjustment']);
      const qty = randomFloat(1, 50);
      
      await prisma.sparePartMovement.create({
        data: {
          id: `mvmt_${part.id}_${i}`,
          partId: part.id,
          type,
          qty: type === 'out' ? -qty : qty,
          unitCost: randomFloat(10, 500),
          movedAt: subDays(new Date(), randomInt(1, 730)),
          notes: type === 'in' ? 'Réception commande' : type === 'out' ? 'Utilisation OT' : 'Inventaire',
        },
      });
    }
  }

  console.log('✅ Seed data generation completed!');
  console.log(`  - ${organizations.length} organizations`);
  console.log(`  - ${sites.length} sites`);
  console.log(`  - ${users.length} users`);
  console.log(`  - ${allAssets.length} assets`);
  console.log(`  - ${allParts.length} spare parts`);
  console.log(`  - ${workOrders.length} work orders`);
  console.log(`  - ${sensors.length} IoT sensors`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
