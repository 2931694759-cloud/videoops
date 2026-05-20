import { ProjectStatusType, RequestStatusType, ReviewStatusType } from "../data/enums";

// Route path constants
export const ROUTES = {
  WORKBENCH: "/workbench",
  REQUESTS: "/requests",
  PROJECTS: "/projects",
  TASKS: "/tasks",
  REVIEWS: "/reviews",
  TEAM: "/team",
  OPERATIONS_DATA: "/operations/data",
  OPERATIONS_PORTFOLIO: "/operations/portfolio",
  NOTIFICATIONS: "/notifications",
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

// Helper to construct query strings
function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const queryParts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
}

// Route Builders

export function buildProjectDetailRoute(projectId: string): string {
  return `${ROUTES.PROJECTS}/${encodeURIComponent(projectId)}`;
}

export function buildProjectListRoute(params?: { status?: ProjectStatusType; search?: string }): string {
  return `${ROUTES.PROJECTS}${buildQueryString(params || {})}`;
}

export function buildRequestDetailRoute(requestId: string): string {
  return `${ROUTES.REQUESTS}/${encodeURIComponent(requestId)}`;
}

export function buildRequestListRoute(params?: { status?: RequestStatusType; search?: string }): string {
  return `${ROUTES.REQUESTS}${buildQueryString(params || {})}`;
}

export function buildReviewQueueRoute(params?: { projectId?: string; deliverableId?: string; status?: ReviewStatusType }): string {
  return `${ROUTES.REVIEWS}${buildQueryString(params || {})}`;
}

export function buildTeamRoute(params?: { memberId?: string }): string {
  return `${ROUTES.TEAM}${buildQueryString(params || {})}`;
}

export function buildPortfolioRoute(params?: { projectId?: string }): string {
  return `${ROUTES.OPERATIONS_PORTFOLIO}${buildQueryString(params || {})}`;
}

export function buildNotificationTargetRoute(entityType: string, entityId: string, extraParams?: Record<string, string>): string {
  // Map notification entity references to actual routes
  let basePath: RoutePath = ROUTES.WORKBENCH; // Fallback
  let idPath = "";

  switch (entityType) {
    case "project":
    case "task": // Keep task for backward compatibility during migration
      basePath = ROUTES.PROJECTS;
      idPath = `/${encodeURIComponent(entityId)}`;
      break;
    case "request":
    case "questionnaire": // Backward compatibility
      basePath = ROUTES.REQUESTS;
      idPath = `/${encodeURIComponent(entityId)}`;
      break;
    case "review":
      basePath = ROUTES.REVIEWS;
      // Depending on how review deep links are structured, might be ?reviewId=... or just open the queue with project
      break;
    // Add other entity mappings as needed
  }

  const queryStr = buildQueryString(extraParams || {});
  return `${basePath}${idPath}${queryStr}`;
}
