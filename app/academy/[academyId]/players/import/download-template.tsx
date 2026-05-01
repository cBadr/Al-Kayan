"use client";

import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };

export function DownloadTemplate({ categories }: { categories: Category[] }) {
  function download() {
    const headers = [
      "full_name",
      "birth_date",
      "phone",
      "email",
      "national_id",
      "guardian_name",
      "guardian_phone",
      "category",
      "position",
      "preferred_jersey",
      "status",
      "notes",
    ];

    const sampleCat1 = categories[0]?.name ?? "براعم 2014";
    const sampleCat2 = categories[1]?.name ?? sampleCat1;

    const rows: string[][] = [
      headers,
      // Sample row 1: complete data
      [
        "محمد أحمد علي حسن",
        "2014-03-12",
        "01000000001",
        "mohamed@example.com",
        "30001012345678",
        "أحمد علي",
        "01200000001",
        sampleCat1,
        "FW",
        "10",
        "active",
        "مهاجم سريع",
      ],
      // Sample row 2: minimal data
      [
        "يوسف مصطفى نصر",
        "2015-08-20",
        "01155555555",
        "",
        "",
        "مصطفى نصر",
        "01100000000",
        sampleCat2,
        "MF",
        "8",
        "active",
        "",
      ],
      // Sample row 3: minimum required only (only full_name)
      [
        "إسلام حمدي حنيش",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "GK",
        "1",
        "active",
        "حارس مرمى",
      ],
    ];

    const csv = rows
      .map((r) => r.map((c) => {
        const s = c ?? "";
        // Escape fields containing comma / quote / newline
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(","))
      .join("\r\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "players-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Button variant="outline" onClick={download} className="w-full">
      ⬇ تحميل قالب CSV (مع أمثلة)
    </Button>
  );
}
