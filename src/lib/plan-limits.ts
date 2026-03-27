// GMAO Pro - Plan Limits Middleware and Utilities
// Usage guard for plan limits enforcement

import { db } from '@/lib/db';
import { PLANS } from '@/lib/pricing.config';

export interface PlanLimitCheck {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  planId: string;
}

// Get the plan for an organization
export async function getOrgPlan(orgId: string) {
  const subscription = await db.subscription.findUnique({
    where: { orgId },
  });

  const planId = subscription?.planId || 'starter';
  return PLANS.find(p => p.id === planId) || PLANS[0];
}

// Check if an organization can create a new site
export async function canCreateSite(orgId: string): Promise<PlanLimitCheck> {
  const plan = await getOrgPlan(orgId);
  const current = await db.site.count({ where: { orgId } });
  const limit = plan.limits.sites;

  if (limit !== -1 && current >= limit) {
    return {
      allowed: false,
      reason: `Plan ${plan.name} limit reached: ${limit} site(s). Upgrade to create more.`,
      current,
      limit,
      planId: plan.id,
    };
  }

  return { allowed: true, current, limit, planId: plan.id };
}

// Check if an organization can create a new asset
export async function canCreateAsset(orgId: string): Promise<PlanLimitCheck> {
  const plan = await getOrgPlan(orgId);
  const current = await db.asset.count({ where: { orgId } });
  const limit = plan.limits.assets;

  if (limit !== -1 && current >= limit) {
    return {
      allowed: false,
      reason: `Plan ${plan.name} limit reached: ${limit} assets. Upgrade to add more.`,
      current,
      limit,
      planId: plan.id,
    };
  }

  return { allowed: true, current, limit, planId: plan.id };
}

// Check if an organization can add a new user
export async function canAddUser(orgId: string): Promise<PlanLimitCheck> {
  const plan = await getOrgPlan(orgId);
  const current = await db.user.count({ where: { orgId } });
  const limit = plan.limits.users;

  if (limit !== -1 && current >= limit) {
    return {
      allowed: false,
      reason: `Plan ${plan.name} limit reached: ${limit} users. Upgrade to add more.`,
      current,
      limit,
      planId: plan.id,
    };
  }

  return { allowed: true, current, limit, planId: plan.id };
}

// Check if an organization can create a work order this month
export async function canCreateWorkOrder(orgId: string): Promise<PlanLimitCheck> {
  const plan = await getOrgPlan(orgId);
  const limit = plan.limits.workOrdersPerMonth;

  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, planId: plan.id };
  }

  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const current = await db.workOrder.count({
    where: {
      orgId,
      createdAt: { gte: periodStart },
    },
  });

  if (current >= limit) {
    return {
      allowed: false,
      reason: `Plan ${plan.name} limit reached: ${limit} work orders/month. Upgrade for unlimited.`,
      current,
      limit,
      planId: plan.id,
    };
  }

  return { allowed: true, current, limit, planId: plan.id };
}

// Check if an organization can add an IoT sensor
export async function canAddSensor(orgId: string): Promise<PlanLimitCheck> {
  const plan = await getOrgPlan(orgId);
  const current = await db.ioTSensor.count({ where: { orgId, active: true } });
  const limit = plan.limits.sensors;

  if (limit === 0) {
    return {
      allowed: false,
      reason: `IoT sensors are not available on ${plan.name} plan. Upgrade to Pro or Enterprise.`,
      current,
      limit,
      planId: plan.id,
    };
  }

  if (limit !== -1 && current >= limit) {
    return {
      allowed: false,
      reason: `Plan ${plan.name} limit reached: ${limit} sensors. Upgrade for more.`,
      current,
      limit,
      planId: plan.id,
    };
  }

  return { allowed: true, current, limit, planId: plan.id };
}

// Check if a feature is available for the organization's plan
export async function hasFeature(orgId: string, feature: string): Promise<boolean> {
  const plan = await getOrgPlan(orgId);
  const featureKey = feature as keyof typeof plan.features;
  return !!plan.features[featureKey];
}

// Get all limits status for an organization
export async function getLimitsStatus(orgId: string) {
  const [sites, assets, users, workOrders, sensors] = await Promise.all([
    canCreateSite(orgId),
    canCreateAsset(orgId),
    canAddUser(orgId),
    canCreateWorkOrder(orgId),
    canAddSensor(orgId),
  ]);

  return {
    sites,
    assets,
    users,
    workOrders,
    sensors,
  };
}

// Get organization plan details
export async function getOrg(orgId: string) {
  return db.organization.findUnique({
    where: { id: orgId },
    include: { subscription: true },
  });
}

// Feature flags based on plan
export const FEATURE_FLAGS = {
  // Starter features
  starter: {
    maxSites: 1,
    maxAssets: 200,
    maxUsers: 5,
    maxWorkOrdersPerMonth: 100,
    maxStorageGb: 5,
    maxSensors: 0,
    hasAnalytics: false,
    hasIoT: false,
    hasAI: false,
    hasAPI: false,
    hasSSO: false,
    hasCustomBranding: false,
    hasSLA: false,
  },
  // Pro features
  pro: {
    maxSites: 5,
    maxAssets: 2000,
    maxUsers: 25,
    maxWorkOrdersPerMonth: -1,
    maxStorageGb: 50,
    maxSensors: 50,
    hasAnalytics: true,
    hasIoT: true,
    hasAI: true,
    hasAPI: true,
    hasSSO: false,
    hasCustomBranding: false,
    hasSLA: true,
  },
  // Enterprise features
  enterprise: {
    maxSites: -1,
    maxAssets: -1,
    maxUsers: -1,
    maxWorkOrdersPerMonth: -1,
    maxStorageGb: -1,
    maxSensors: -1,
    hasAnalytics: true,
    hasIoT: true,
    hasAI: true,
    hasAPI: true,
    hasSSO: true,
    hasCustomBranding: true,
    hasSLA: true,
  },
};

export const planLimitsService = {
  canCreateSite,
  canCreateAsset,
  canAddUser,
  canCreateWorkOrder,
  canAddSensor,
  hasFeature,
  getLimitsStatus,
  getOrgPlan,
  getOrg,
  FEATURE_FLAGS,
};

export default planLimitsService;
