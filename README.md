# GMAO Pro — Système de Gestion de Maintenance

**GMAO Pro** est une solution complète de Gestion de Maintenance Assistée par Ordinateur (GMAO / CMMS) conçue pour les installations industrielles algériennes. Plateforme enterprise avec support IoT, analytique avancée, et gestion multi-sites.

---

## Architecture de la Solution

```mermaid
graph TD
    Client[Client Web] --> Next[Next.js App Router]
    Next --> Components[Composants UI - React/Tailwind]
    Next --> API[API REST]
    API --> Prisma[Prisma ORM]
    Prisma --> DB[(Base de données SQLite/PostgreSQL)]
```

---

## Modèle de Données (ERD)

```mermaid
erDiagram
    ORGANIZATION ||--o{ SITE : "possède"
    ORGANIZATION ||--o{ USER : "comprend"
    ORGANIZATION ||--o{ ASSET : "gère"
    SITE ||--o{ ASSET : "contient"
    ASSET ||--o{ WORK_ORDER : "maintenance"
    USER ||--o{ WORK_ORDER : "demande/effectue"
    ASSET ||--o{ IOT_SENSOR : "monitoré par"
    IOT_SENSOR ||--o{ SENSOR_READING : "produit"
    WORK_ORDER ||--o{ SPARE_PART_USED : "consomme"
    SPARE_PART ||--o{ SPARE_PART_USED : "utilisé dans"
```

---

## Flux de Travail des Interventions (Workflows)

### Cycle de vie d'un Ordre de Travail
```mermaid
stateDiagram-v2
    [*] --> Brouillon: Création OT
    Brouillon --> Planifie: Planification
    Planifie --> Assigne: Assignation Technicien
    Assigne --> En_Cours: Début Intervention
    En_Cours --> En_Attente: Suspension (Pièce manquante)
    En_Attente --> En_Cours: Reprise
    En_Cours --> Termine: Fin Intervention
    Termine --> Valide: Validation Superviseur
    Valide --> [*]
```

### Processus de Création d'OT
```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend (Next.js)
    participant B as Backend (API Route)
    participant D as Base de données (Prisma)
    
    U->>F: Soumet le formulaire d'OT
    F->>B: POST /api/work-orders
    Note over B: Validation (Zod) + Génération No OT
    B->>D: Create WorkOrder
    D-->>B: Retourne l'OT créé
    B-->>F: Response 201 Created
    F-->>U: Affiche succès + Redirection
```

---

## Tableau de Bord Analytique et Indicateurs (KPIs)

| Indicateur    | Objectif | Formule                        |
|---------------|----------|-------------------------------|
| Disponibilité | > 95%    | MTBF / (MTBF + MTTR)         |
| MTBF          | > 2000h  | Temps total / Nombre de pannes |
| MTTR          | < 4h     | Temps total réparation / Pannes|
| Conformité PM | > 95%    | OTs PM à temps / Total OTs PM  |
| OEE           | > 85%    | Dispo × Performance × Qualité |

---

## Spécifications Techniques

| Composant    | Technologie                                      |
|--------------|--------------------------------------------------|
| Framework    | Next.js 16 (App Router)                         |
| Langage      | TypeScript 5                                    |
| Styling      | Tailwind CSS 4 + shadcn/ui                      |
| Base données | SQLite (dev) / PostgreSQL (prod) via Prisma ORM |
| Graphiques   | Recharts                                        |
| Tests        | Vitest + React Testing Library + Playwright     |

---

## Pipeline CI/CD

```mermaid
graph LR
    PR(Pull Request) --> L(Lint)
    L --> T(Tests)
    T --> B(Build)
    B --> E2E(Tests E2E)
    E2E --> M(Merge Main)
    M --> S(Déploiement Staging)
    S --> R(Release Tag)
    R --> |Approbation| P(Production)
```

---

## Licence

© 2024 **Selma Haci**. Tous droits réservés.
