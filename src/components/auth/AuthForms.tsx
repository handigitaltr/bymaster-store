"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  type AuthState,
} from "@/app/actions/auth";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useActionForm } from "@/lib/use-action-form";

function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  error,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  error?: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className="field-input pr-12"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-1 grid w-10 place-content-center text-cocoa-500 hover:text-cocoa-800"
          aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: string | null }) {
  const { state, formAction: action, onSubmit } = useActionForm<AuthState>(loginAction, null);
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {state?.message ? <Alert tone="error">{state.message}</Alert> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div>
        <label htmlFor="login-email" className="field-label">
          E-posta
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          className="field-input"
          aria-invalid={state?.errors?.email ? true : undefined}
        />
        {state?.errors?.email ? <p className="field-error">{state.errors.email[0]}</p> : null}
      </div>
      <PasswordInput id="login-password" name="password" label="Şifre" autoComplete="current-password" error={state?.errors?.password?.[0]} />
      <div className="flex justify-end">
        <Link href="/sifremi-unuttum" className="text-sm font-semibold text-bordeaux-600 hover:underline">
          Şifremi unuttum
        </Link>
      </div>
      <SubmitButton className="btn-lg btn-block" pendingLabel="Giriş yapılıyor…">
        Giriş yap
      </SubmitButton>
    </form>
  );
}

export function RegisterForm({ next, kvkkHref }: { next?: string; kvkkHref: string | null }) {
  const { state, formAction: action, onSubmit } = useActionForm<AuthState>(registerAction, null);
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      {state?.message ? <Alert tone="error">{state.message}</Alert> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div>
        <label htmlFor="register-name" className="field-label">
          Ad soyad
        </label>
        <input id="register-name" name="name" autoComplete="name" defaultValue={state?.values?.name} className="field-input" aria-invalid={state?.errors?.name ? true : undefined} />
        {state?.errors?.name ? <p className="field-error">{state.errors.name[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="register-email" className="field-label">
          E-posta
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          className="field-input"
          aria-invalid={state?.errors?.email ? true : undefined}
        />
        {state?.errors?.email ? <p className="field-error">{state.errors.email[0]}</p> : null}
      </div>
      <PasswordInput
        id="register-password"
        name="password"
        label="Şifre"
        autoComplete="new-password"
        error={state?.errors?.password?.[0]}
        hint="En az 10 karakter; en az bir harf ve bir rakam."
      />
      <PasswordInput id="register-password2" name="passwordConfirm" label="Şifre (tekrar)" autoComplete="new-password" error={state?.errors?.passwordConfirm?.[0]} />
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <input id="register-kvkk" name="kvkk" type="checkbox" className="checkbox" />
          <label htmlFor="register-kvkk" className="text-sm leading-relaxed text-cocoa-700">
            {kvkkHref ? (
              <Link href={kvkkHref} className="font-semibold text-bordeaux-600 underline" target="_blank">
                KVKK Aydınlatma Metni
              </Link>
            ) : (
              "KVKK Aydınlatma Metni"
            )}
            &apos;ni okudum.
          </label>
        </div>
        {state?.errors?.kvkk ? <p className="field-error">{state.errors.kvkk[0]}</p> : null}
        <div className="flex items-start gap-3">
          <input id="register-marketing" name="marketing" type="checkbox" className="checkbox" />
          <label htmlFor="register-marketing" className="text-sm leading-relaxed text-cocoa-600">
            Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum (isteğe bağlı).
          </label>
        </div>
      </div>
      <SubmitButton className="btn-lg btn-block" pendingLabel="Hesap oluşturuluyor…">
        Hesap oluştur
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { state, formAction: action, onSubmit } = useActionForm<AuthState>(requestPasswordResetAction, null);
  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="forgot-email" className="field-label">
          E-posta
        </label>
        <input id="forgot-email" name="email" type="email" autoComplete="email" className="field-input" aria-invalid={state?.errors?.email ? true : undefined} />
        {state?.errors?.email ? <p className="field-error">{state.errors.email[0]}</p> : null}
      </div>
      <SubmitButton className="btn-lg btn-block" pendingLabel="Gönderiliyor…">
        Sıfırlama bağlantısı gönder
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { state, formAction: action, onSubmit } = useActionForm<AuthState>(resetPasswordAction, null);
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      {state?.message ? <Alert tone="error">{state.message}</Alert> : null}
      <input type="hidden" name="token" value={token} />
      <PasswordInput
        id="reset-password"
        name="password"
        label="Yeni şifre"
        autoComplete="new-password"
        error={state?.errors?.password?.[0]}
        hint="En az 10 karakter; en az bir harf ve bir rakam."
      />
      <PasswordInput id="reset-password2" name="passwordConfirm" label="Yeni şifre (tekrar)" autoComplete="new-password" error={state?.errors?.passwordConfirm?.[0]} />
      <SubmitButton className="btn-lg btn-block" pendingLabel="Kaydediliyor…">
        Şifreyi güncelle
      </SubmitButton>
    </form>
  );
}
