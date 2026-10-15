"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { contactAction, type FormState } from "@/app/actions/forms";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { CONTACT_SUBJECTS } from "@/lib/constants";
import { useActionForm } from "@/lib/use-action-form";

export function ContactForm({ kvkkHref }: { kvkkHref: string | null }) {
  const { state, formAction: action, onSubmit } = useActionForm<FormState>(contactAction, null);
  if (state?.ok) {
    return (
      <div className="rounded-[1.4rem] bg-[#eaf3ec] p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
        <p className="mt-4 font-display text-2xl text-cocoa-900">{state.message}</p>
      </div>
    );
  }
  const error = (field: string) => state?.errors?.[field]?.[0];
  return (
    <form action={action} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      {state?.message ? <Alert tone="error" className="sm:col-span-2">{state.message}</Alert> : null}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="c-website">Web sitesi</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {[
        { name: "name", label: "Ad soyad", autoComplete: "name" },
        { name: "email", label: "E-posta", autoComplete: "email", type: "email" },
        { name: "phone", label: "Telefon (isteğe bağlı)", autoComplete: "tel", type: "tel" },
      ].map((field) => (
        <div key={field.name}>
          <label htmlFor={`c-${field.name}`} className="field-label">
            {field.label}
          </label>
          <input
            id={`c-${field.name}`}
            name={field.name}
            type={field.type ?? "text"}
            autoComplete={field.autoComplete}
            defaultValue={state?.values?.[field.name]}
            className="field-input"
            aria-invalid={error(field.name) ? true : undefined}
          />
          {error(field.name) ? <p className="field-error">{error(field.name)}</p> : null}
        </div>
      ))}
      <div>
        <label htmlFor="c-subject" className="field-label">
          Konu
        </label>
        <select id="c-subject" name="subject" defaultValue={state?.values?.subject ?? ""} className="field-input">
          <option value="" disabled>
            Seçin
          </option>
          {CONTACT_SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        {error("subject") ? <p className="field-error">{error("subject")}</p> : null}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-message" className="field-label">
          Mesajınız
        </label>
        <textarea id="c-message" name="message" rows={6} maxLength={3000} defaultValue={state?.values?.message} className="field-input" />
        {error("message") ? <p className="field-error">{error("message")}</p> : null}
      </div>
      <div className="sm:col-span-2">
        <div className="flex items-start gap-3">
          <input id="c-kvkk" name="kvkk" type="checkbox" className="checkbox" />
          <label htmlFor="c-kvkk" className="text-sm leading-relaxed text-cocoa-700">
            Mesajımın yanıtlanması için iletişim bilgilerimin işlenmesine ilişkin{" "}
            {kvkkHref ? (
              <Link href={kvkkHref} target="_blank" className="font-semibold text-bordeaux-600 underline">
                aydınlatma metnini
              </Link>
            ) : (
              "aydınlatma metnini"
            )}{" "}
            okudum.
          </label>
        </div>
        {error("kvkk") ? <p className="field-error pl-8">{error("kvkk")}</p> : null}
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Gönderiliyor…">Mesajı gönder</SubmitButton>
      </div>
    </form>
  );
}
