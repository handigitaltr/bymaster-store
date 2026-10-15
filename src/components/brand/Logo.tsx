import { cx } from "@/lib/utils";

/**
 * ByMaster logosu — kampanya görsellerindeki yerleşimin (şef şapkası, BYMASTER, alt satır)
 * tipografik yeniden çizimi. Resmi vektör logo dosyası temin edildiğinde bu bileşen
 * public/brand altındaki dosyayı gösterecek şekilde güncellenmelidir.
 */
export function Logo({
  className,
  showDescriptor = true,
  title = "ByMaster — Professional Pastry Products",
}: {
  className?: string;
  showDescriptor?: boolean;
  title?: string;
}) {
  const height = showDescriptor ? 74 : 62;
  return (
    <svg
      viewBox={`0 0 236 ${height}`}
      className={cx("block h-auto", className)}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g transform="translate(101 1) scale(1.05)" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M12 17.92A6 6 0 1 1 12.99 6.34A7.5 7.5 0 0 1 27.01 6.34A6 6 0 1 1 28 17.92V26H12Z" />
        <path d="M12 20.2H28M17.4 20.2V26M22.6 20.2V26" strokeWidth="1.8" />
      </g>
      <text
        x="118"
        y="56"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: "var(--font-manrope), Arial, sans-serif", fontWeight: 800, fontSize: 31, letterSpacing: "0.035em" }}
      >
        BYMASTER
      </text>
      <text x="221" y="37" fill="currentColor" style={{ fontFamily: "Arial, sans-serif", fontSize: 8, fontWeight: 700 }}>
        ®
      </text>
      {showDescriptor ? (
        <text
          x="118"
          y="71"
          textAnchor="middle"
          fill="currentColor"
          style={{ fontFamily: "var(--font-manrope), Arial, sans-serif", fontWeight: 600, fontSize: 7.6, letterSpacing: "0.26em" }}
        >
          PROFESSIONAL PASTRY PRODUCTS
        </text>
      ) : null}
    </svg>
  );
}
