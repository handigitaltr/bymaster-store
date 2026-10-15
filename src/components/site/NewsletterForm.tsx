"use client";

import Link from "next/link";
import { newsletterAction, type FormState } from "@/app/actions/forms";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { NEWSLETTER_CONSENT_TEXT } from "@/lib/consents";
import { useActionForm } from "@/lib/use-action-form";

export function NewsletterForm({ kvkkHref }: { kvkkHref: string | null }) {
  const { state, formAction: action, onSubmit } = useActionForm<FormState>(newsletterAction, null);

  if (state?.ok) {
    return (
      <p role="status" className="rounded-2xl border border-cream-50/15 bg-cream-50/5 p-5 text-cream-100">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="hidden" name="source" value="footer" />
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          E-posta adresiniz
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="E-posta adresiniz"
          aria-invalid={state?.errors?.email ? true : undefined}
          className="h-12 flex-1 rounded-full border border-cream-50/20 bg-cream-50/5 px-5 text-cream-50 placeholder:text-cream-300/70 focus:border-caramel-300 focus:outline-none"
        />
        <SubmitButton variant="btn-light" pendingLabel="Kaydediliyor…">
          Abone ol
        </SubmitButton>
      </div>
      {state?.errors?.email ? <p className="text-sm font-semibold text-caramel-300">{state.errors.email[0]}</p> : null}
      <div className="flex items-start gap-3">
        <input id="newsletter-consent" name="consent" type="checkbox" className="checkbox mt-0.5 border-cream-300 bg-transparent" />
        <label htmlFor="newsletter-consent" className="text-xs leading-relaxed text-cream-300">
          {NEWSLETTER_CONSENT_TEXT}
          {kvkkHref ? (
            <>
              {" "}
              <Link href={kvkkHref} className="underline hover:text-cream-50">
                Aydınlatma metni
              </Link>
            </>
          ) : null}
        </label>
      </div>
      {state?.errors?.consent ? <p className="text-sm font-semibold text-caramel-300">{state.errors.consent[0]}</p> : null}
      {state?.message && !state.ok ? <p className="text-sm font-semibold text-caramel-300">{state.message}</p> : null}
    </form>
  );
}
