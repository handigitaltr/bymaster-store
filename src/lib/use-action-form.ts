"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * useActionState + sıfırlamasız gönderim.
 *
 * React 19, `action` olarak fonksiyon verilen bir form gönderildiğinde işlem bitince formu sıfırlar:
 * doğrulama hatasında kullanıcının yazdıkları kaybolur; kontrollü <select>, radyo ve onay kutuları ise
 * görsel olarak ilk değerlerine döner (React durumu yeni değeri tutmaya devam eder ve sonraki gönderimde
 * ekrandaki eski değer gider). Bu kanca gönderimi onSubmit'te yakalayıp aynı işlemi aynı olay içinde
 * startTransition ile başlatır; React bu durumda formu sıfırlamaz, useFormStatus bekleme durumu ise çalışır.
 *
 * `formAction` yine forma `action` olarak verilmelidir: JavaScript yüklenmeden önce de form çalışır.
 */
export function useActionForm<State>(
  action: (state: Awaited<State>, formData: FormData) => State | Promise<State>,
  initialState: Awaited<State>,
  options: { prepare?: (formData: FormData) => void } = {},
) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, initialState);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    options.prepare?.(formData);
    startTransition(() => formAction(formData));
  };

  return { state, formAction, onSubmit, pending };
}
