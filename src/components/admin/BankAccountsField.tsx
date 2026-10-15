"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Row = { bankName: string; accountHolder: string; iban: string };

/** Havale/EFT hesap listesi; satırlar JSON olarak gizli alanla gönderilir, IBAN sunucuda doğrulanır */
export function BankAccountsField({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial.length ? initial : [{ bankName: "", accountHolder: "", iban: "" }]);
  const update = (index: number, key: keyof Row, value: string) => setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  return (
    <fieldset className="space-y-3">
      <legend className="field-label">Banka hesapları</legend>
      <input type="hidden" name="bankAccounts" value={JSON.stringify(rows)} />
      {rows.map((row, index) => (
        <div key={index} className="grid gap-2 rounded-xl border border-cocoa-800/10 p-3 md:grid-cols-[1fr_1.4fr_1.6fr_auto]">
          <input className="field-input !min-h-10 !py-1.5 text-sm" placeholder="Banka adı" value={row.bankName} onChange={(e) => update(index, "bankName", e.target.value)} aria-label={`${index + 1}. hesap banka adı`} />
          <input className="field-input !min-h-10 !py-1.5 text-sm" placeholder="Alıcı unvanı" value={row.accountHolder} onChange={(e) => update(index, "accountHolder", e.target.value)} aria-label={`${index + 1}. hesap alıcı unvanı`} />
          <input
            className="field-input !min-h-10 !py-1.5 font-mono text-sm"
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            value={row.iban}
            onChange={(e) => update(index, "iban", e.target.value)}
            aria-label={`${index + 1}. hesap IBAN`}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" onClick={() => setRows((current) => current.filter((_, i) => i !== index))} className="grid size-10 place-content-center rounded-full text-bordeaux-600 hover:bg-bordeaux-50" aria-label={`${index + 1}. hesabı kaldır`}>
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      {rows.length < 6 ? (
        <button type="button" onClick={() => setRows((current) => [...current, { bankName: "", accountHolder: "", iban: "" }])} className="inline-flex items-center gap-2 text-sm font-bold text-bordeaux-600">
          <Plus className="size-4" aria-hidden="true" /> Hesap ekle
        </button>
      ) : null}
    </fieldset>
  );
}
