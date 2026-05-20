import type { MutableRefObject, RefObject } from "react";

export function nowIso() {
  return new Date().toISOString();
}

export function nowMs() {
  return Date.now();
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function toIsoDate(dateStr: string) {
  return new Date(dateStr).toISOString();
}

export function toMs(dateStr: string | null | undefined) {
  if (!dateStr) return NaN;
  const t = Date.parse(dateStr);
  return Number.isNaN(t) ? NaN : t;
}

export function ymdSlash(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export function ymdHmSlash(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

export function addDaysIso(dateStr: string, days: number) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function daysBetweenMs(aMs: number, bMs: number) {
  const ms = bMs - aMs;
  return Math.floor(ms / 86400000);
}

export function yearMonthFromMs(ms: number) {
  const d = new Date(ms);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function clearTimeoutRef(ref: MutableRefObject<number | null>) {
  if (ref.current) window.clearTimeout(ref.current);
  ref.current = null;
}

export function setTimeoutRef(ref: MutableRefObject<number | null>, fn: () => void, ms: number) {
  clearTimeoutRef(ref);
  ref.current = window.setTimeout(fn, ms);
  return ref.current;
}

export function refContains<T extends HTMLElement>(ref: RefObject<T>, node: Node) {
  return !!ref.current && ref.current.contains(node);
}
