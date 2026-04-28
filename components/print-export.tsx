"use client";

import { Button } from "@/components/ui/button";

export function PrintExport({ tableId, filename }: { tableId?: string; filename: string }) {
  function exportXlsx() {
    const url = `/api/export?table=${encodeURIComponent(tableId ?? "")}&filename=${encodeURIComponent(filename)}`;
    // Build CSV from the current visible table for simple client-side export.
    const t = tableId ? document.getElementById(tableId) : document.querySelector("table");
    if (!t) return;
    const rows = Array.from(t.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.querySelectorAll("th,td")).map((c) => `"${(c.textContent ?? "").trim().replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob(["﻿" + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    void url;
  }
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => window.print()}>طباعة</Button>
      <Button variant="outline" onClick={exportXlsx}>تصدير CSV</Button>
    </div>
  );
}
