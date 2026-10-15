"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FFFDF9", color: "#2B1611", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28 }}>Beklenmeyen bir hata oluştu</h1>
          <p>Lütfen sayfayı yenileyin.</p>
          {error.digest ? <p style={{ fontSize: 12, opacity: 0.6 }}>Referans: {error.digest}</p> : null}
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 999, border: 0, background: "#351C16", color: "#FFFDF9", cursor: "pointer" }}>
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
