import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Initialize ZAI instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, input, messages, context } = body;

    const zai = await getZAI();

    if (action === 'chat') {
      // General chat with context
      return await handleChat(zai, messages, context);
    }

    if (action === 'create-wo') {
      // Parse natural language to create work order using AI
      return await handleCreateWO(zai, input);
    }

    if (action === 'root-cause') {
      // Analyze root cause using AI
      return await handleRootCause(zai, input);
    }

    if (action === 'report') {
      // Generate maintenance report
      return await handleReport(zai, input);
    }

    if (action === 'checklist-suggest') {
      // Suggest checklist items for asset
      return await handleChecklistSuggest(zai, input);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleChat(zai: NonNullable<typeof zaiInstance>, messages: any[], context?: any) {
  const systemPrompt = `Tu es un assistant expert en gestion de maintenance industrielle (GMAO). 
Tu aides les techniciens et gestionnaires à:
- Créer et gérer des ordres de travail
- Analyser les pannes et suggérer des causes racines
- Optimiser les plannings de maintenance préventive
- Interpréter les données IoT et alertes
- Générer des rapports de maintenance

Réponds toujours en français de manière professionnelle et concise.
Si l'utilisateur demande de créer un OT, propose une structure JSON appropriée.`;

  const formattedMessages = [
    { role: 'assistant' as const, content: systemPrompt },
    ...(messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content
    }))
  ];

  const completion = await zai.chat.completions.create({
    messages: formattedMessages,
    thinking: { type: 'disabled' }
  });

  const response = completion.choices[0]?.message?.content || '';

  return NextResponse.json({ 
    success: true, 
    response,
    timestamp: new Date().toISOString()
  });
}

async function handleCreateWO(zai: NonNullable<typeof zaiInstance>, input: string) {
  const systemPrompt = `Tu es un expert GMAO. Convertis la description en langage naturel en un ordre de travail structuré.
Retourne UNIQUEMENT un JSON valide avec les champs suivants:
{
  "title": "Titre concis de l'OT",
  "description": "Description détaillée",
  "symptomDescription": "Description du symptôme",
  "assetHint": "Type d'équipement suggéré",
  "priority": "P1_emergency|P2_urgent|P3_normal|P4_low",
  "woType": "corrective|preventive|inspection|emergency",
  "estimatedDurationHours": nombre,
  "requiredSkills": ["electrical", "mechanical", "HVAC", "plumbing"],
  "checklistItems": ["item1", "item2"],
  "confidence": 0.0-1.0
}`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: `Crée un OT à partir de: "${input}"` }
    ],
    thinking: { type: 'disabled' }
  });

  const responseText = completion.choices[0]?.message?.content || '{}';
  
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const woData = jsonMatch ? JSON.parse(jsonMatch[0]) : parseWorkOrderFallback(input);
    return NextResponse.json({ success: true, workOrder: woData });
  } catch {
    const woData = parseWorkOrderFallback(input);
    return NextResponse.json({ success: true, workOrder: woData });
  }
}

async function handleRootCause(zai: NonNullable<typeof zaiInstance>, input: { assetHistory: any[]; currentFailure: string }) {
  const systemPrompt = `Tu es un expert en analyse de défaillance (AMDEC). Analyse l'historique et la panne actuelle.
Retourne UNIQUEMENT un JSON valide:
{
  "probableCauses": [
    {"rank": 1, "cause": "description", "likelihood": 0-100, "correctiveAction": "action"}
  ],
  "recommendations": ["recommandation1", "recommandation2"],
  "historicalPattern": "pattern détecté",
  "fmeaCode": "code AMDEC suggéré"
}`;

  const historySummary = input.assetHistory.slice(0, 5).map((wo: any) => 
    `- ${wo.title}: ${wo.failureCategory || 'N/A'} (${wo.completedAt?.split('T')[0] || 'N/A'})`
  ).join('\n');

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: `Historique des pannes:\n${historySummary}\n\nPanne actuelle: ${input.currentFailure}\n\nAnalyse les causes probables.` }
    ],
    thinking: { type: 'disabled' }
  });

  const responseText = completion.choices[0]?.message?.content || '{}';
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : analyzeRootCauseFallback(input);
    return NextResponse.json({ success: true, analysis });
  } catch {
    const analysis = analyzeRootCauseFallback(input);
    return NextResponse.json({ success: true, analysis });
  }
}

async function handleReport(zai: NonNullable<typeof zaiInstance>, input: { site: string; period: string; data: any }) {
  const systemPrompt = `Tu es un expert en reporting de maintenance industrielle.
Génère un rapport narratif professionnel en français pour les gestionnaires.
Le rapport doit inclure:
1. Résumé exécutif
2. Analyse des KPIs
3. Points d'attention
4. Recommandations`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: `Génère un rapport pour ${input.site} - ${input.period}\nDonnées: ${JSON.stringify(input.data).substring(0, 2000)}` }
    ],
    thinking: { type: 'disabled' }
  });

  const report = completion.choices[0]?.message?.content || 'Rapport non disponible';

  return NextResponse.json({ success: true, report });
}

async function handleChecklistSuggest(zai: NonNullable<typeof zaiInstance>, input: { assetType: string; assetName: string }) {
  const systemPrompt = `Tu es un expert en maintenance préventive.
Suggère une liste de contrôle pour l'équipement donné.
Retourne UNIQUEMENT un JSON: {"checklist": ["item1", "item2", ...], "estimatedDuration": heures}`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: `Génère une checklist pour: ${input.assetType} - ${input.assetName}` }
    ],
    thinking: { type: 'disabled' }
  });

  const responseText = completion.choices[0]?.message?.content || '{"checklist": [], "estimatedDuration": 1}';
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const checklist = jsonMatch ? JSON.parse(jsonMatch[0]) : { checklist: ['Inspection visuelle', 'Test de fonctionnement'], estimatedDuration: 1 };
    return NextResponse.json({ success: true, ...checklist });
  } catch {
    return NextResponse.json({ 
      success: true, 
      checklist: ['Inspection visuelle', 'Test de fonctionnement'], 
      estimatedDuration: 1 
    });
  }
}

// Fallback functions for when AI parsing fails
function parseWorkOrderFallback(input: string) {
  const lowerInput = input.toLowerCase();
  
  let priority = 'P3_normal';
  if (lowerInput.includes('urgent') || lowerInput.includes('critique') || lowerInput.includes('arrêt')) {
    priority = 'P1_emergency';
  } else if (lowerInput.includes('important') || lowerInput.includes('rapide')) {
    priority = 'P2_urgent';
  } else if (lowerInput.includes('faible') || lowerInput.includes('quand possible')) {
    priority = 'P4_low';
  }

  let woType = 'corrective';
  if (lowerInput.includes('inspection') || lowerInput.includes('vérifier')) {
    woType = 'inspection';
  } else if (lowerInput.includes('maintenance préventive') || lowerInput.includes('mp')) {
    woType = 'preventive';
  }

  const assetKeywords = ['pompe', 'moteur', 'compresseur', 'convoyeur', 'chaudière', 'ventilateur', 'transformateur', 'groupe', 'broyeur', 'four', 'chiller'];
  let assetHint = '';
  for (const keyword of assetKeywords) {
    if (lowerInput.includes(keyword)) {
      assetHint = keyword;
      break;
    }
  }

  const symptoms: string[] = [];
  if (lowerInput.includes('bruit')) symptoms.push('Bruit anormal');
  if (lowerInput.includes('vibration')) symptoms.push('Vibrations excessives');
  if (lowerInput.includes('chaud') || lowerInput.includes('surchauffe')) symptoms.push('Surchauffe');
  if (lowerInput.includes('fuite')) symptoms.push('Fuite');

  const skills: string[] = [];
  if (lowerInput.includes('électrique') || lowerInput.includes('moteur')) skills.push('electrical');
  if (lowerInput.includes('mécanique') || lowerInput.includes('roulement')) skills.push('mechanical');
  if (lowerInput.includes('climatisation') || lowerInput.includes('hvac')) skills.push('HVAC');
  if (skills.length === 0) skills.push('mechanical');

  return {
    title: assetHint ? `Intervention ${assetHint} - ${symptoms[0] || 'Dépannage'}` : 'Nouvel ordre de travail',
    description: input,
    symptomDescription: symptoms.join(', '),
    assetHint,
    priority,
    woType,
    estimatedDurationHours: 2,
    requiredSkills: skills,
    checklistItems: ['Diagnostic initial', 'Identification de la cause', 'Intervention corrective', 'Test de fonctionnement'],
    confidence: 0.75,
  };
}

function analyzeRootCauseFallback(input: { assetHistory: any[]; currentFailure: string }) {
  return {
    probableCauses: [
      { rank: 1, cause: 'Usure des composants due à un manque de lubrification', likelihood: 85, correctiveAction: 'Mettre en place un programme de graissage préventif' },
      { rank: 2, cause: 'Désalignement de l\'arbre', likelihood: 65, correctiveAction: 'Réaliser un alignement laser' },
      { rank: 3, cause: 'Vibrations excessives', likelihood: 45, correctiveAction: 'Analyse vibratoire' },
    ],
    recommendations: [
      'Augmenter la fréquence des inspections',
      'Former les opérateurs à la détection précoce',
    ],
    historicalPattern: 'Pattern détecté: pannes mécaniques récurrentes',
  };
}
