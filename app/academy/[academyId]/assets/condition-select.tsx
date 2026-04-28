"use client";

import { useTransition } from "react";
import { updateAssetCondition } from "./actions";

export function ConditionSelect({
  academyId, assetId, defaultValue,
}: {
  academyId: string; assetId: string; defaultValue: string;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={defaultValue}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("condition", e.currentTarget.value);
        start(async () => { await updateAssetCondition(academyId, assetId, fd); });
      }}
      className="h-8 rounded-md border border-border bg-card px-2 text-xs"
    >
      <option value="good">جيد</option>
      <option value="maintenance">صيانة</option>
      <option value="damaged">تالف</option>
      <option value="transferred">منقول</option>
    </select>
  );
}
