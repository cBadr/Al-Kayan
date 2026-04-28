import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined, currency = "EGP") {
  const n = typeof amount === "string" ? Number(amount) : amount ?? 0;
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(date: string | Date | null | undefined, withTime = false) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function padCode(n: number, width = 6) {
  return String(n).padStart(width, "0");
}

export function arabicNumerals(input: string | number) {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(input).replace(/\d/g, (d) => map[Number(d)]);
}
