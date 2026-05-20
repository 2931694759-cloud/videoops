"use client";

import type { Notification } from "./mock-data";

function normalizeSignoffPath(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/signoff/")) return raw;
  if (raw.startsWith("signoff/")) return `/${raw}`;
  return null;
}

export function getNotificationSignoffTarget(notification: Notification) {
  const directTarget = normalizeSignoffPath(notification.secondaryActionTarget);
  if (directTarget) return directTarget;

  const signoffUrl = normalizeSignoffPath(notification.signoffUrl);
  if (signoffUrl) return signoffUrl;

  const signoffLink = normalizeSignoffPath(notification.signOffLink);
  if (signoffLink) return signoffLink;

  if (notification.signoffToken) {
    return `/signoff/${String(notification.signoffToken).trim()}`;
  }

  const actionTarget = normalizeSignoffPath(notification.actionTarget);
  if (actionTarget) return actionTarget;

  return null;
}

export function isSignoffTarget(target: string | null | undefined) {
  return Boolean(normalizeSignoffPath(target));
}

export function getNotificationAppTarget(notification: Notification) {
  const actionTarget = String(notification.actionTarget || "").trim();
  if (actionTarget && !isSignoffTarget(actionTarget)) return actionTarget;

  const linkTo = String(notification.linkTo || "").trim();
  if (!linkTo) return null;

  const map: Record<string, string> = {
    "/tasks": "tasks",
    "/my-tasks": "my-tasks",
    "/questionnaire": "questionnaire",
    "/dashboard": "dashboard",
    "/analytics": "analytics",
    "/portfolio": "portfolio",
    "/team": "team",
    "/notifications": "notifications",
    "/settings": "settings",
  };

  return map[linkTo] || null;
}
