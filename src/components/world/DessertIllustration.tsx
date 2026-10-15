// Sunum laboratuvarı için stilize tatlı illüstrasyonları (fotoğraf değildir)

export type DessertKind = "waffle" | "pankek" | "krep" | "churros" | "dondurma";

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function Toppings({ colors, styles, area }: { colors: string[]; styles: string[]; area: { cx: number; cy: number; r: number } }) {
  if (colors.length === 0) return null;
  const random = rand(colors.join("").length * 97 + styles.length * 13 + 7);
  const items: React.ReactNode[] = [];
  colors.forEach((color, groupIndex) => {
    const style = styles[groupIndex] ?? "bead";
    const count = style === "candy" ? 14 : style === "flake" ? 22 : 34;
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * area.r;
      // Sunucu/tarayıcı trigonometri farklarından doğabilecek hydration uyumsuzluğuna karşı yuvarlanır
      const x = Math.round((area.cx + Math.cos(angle) * distance) * 100) / 100;
      const y = Math.round((area.cy + Math.sin(angle) * distance * 0.85) * 100) / 100;
      const key = `${groupIndex}-${i}`;
      if (style === "flake") {
        const s = 4 + random() * 5;
        const rot = random() * 180;
        items.push(
          <polygon
            key={key}
            points={`${x - s},${y - s * 0.4} ${x + s * 0.6},${y - s} ${x + s},${y + s * 0.5} ${x - s * 0.3},${y + s}`}
            fill={color}
            opacity={0.95}
            transform={`rotate(${rot} ${x} ${y})`}
          />,
        );
      } else if (style === "candy") {
        items.push(<ellipse key={key} cx={x} cy={y} rx={6.5} ry={5} fill={color} stroke="rgba(0,0,0,.12)" strokeWidth={0.8} />);
      } else {
        items.push(
          <g key={key}>
            <circle cx={x} cy={y} r={3.6} fill={color} />
            <circle cx={x - 1.1} cy={y - 1.2} r={1.1} fill="#fff" opacity={0.7} />
          </g>,
        );
      }
    }
  });
  return <g>{items}</g>;
}

function Drizzle({ color, path }: { color: string | null; path: string }) {
  if (!color) return null;
  return (
    <g>
      <path d={path} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.96} />
      <path d={path} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" opacity={0.28} transform="translate(-2 -2)" />
    </g>
  );
}

export function DessertIllustration({
  kind,
  sauceColor,
  toppingColors,
  toppingStyles,
}: {
  kind: DessertKind;
  sauceColor: string | null;
  toppingColors: string[];
  toppingStyles: string[];
}) {
  const plate = (
    <g>
      <ellipse cx="200" cy="168" rx="168" ry="128" fill="#2b1611" opacity="0.08" />
      <ellipse cx="200" cy="158" rx="165" ry="125" fill="#FFFDF9" stroke="#E4D5C0" strokeWidth="2" />
      <ellipse cx="200" cy="158" rx="132" ry="98" fill="none" stroke="#EFE4D4" strokeWidth="2" />
    </g>
  );

  let dessert: React.ReactNode = null;
  let drizzle = "";
  let area = { cx: 200, cy: 155, r: 70 };

  if (kind === "waffle") {
    const cells: React.ReactNode[] = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        cells.push(<rect key={`${r}-${c}`} x={128 + c * 36} y={86 + r * 34} width={28} height={26} rx={5} fill="#C98F45" opacity={0.55} />);
    dessert = (
      <g transform="rotate(-7 200 155)">
        <rect x="118" y="76" width="164" height="158" rx="20" fill="#E3B064" />
        <rect x="118" y="76" width="164" height="158" rx="20" fill="url(#wafShade)" />
        {cells}
      </g>
    );
    drizzle = "M118 120 C150 100 165 150 195 128 S240 105 270 132 M126 178 C160 158 180 205 215 182 S250 160 278 186";
  } else if (kind === "pankek") {
    dessert = (
      <g>
        <ellipse cx="208" cy="165" rx="98" ry="74" fill="#D9A15A" />
        <ellipse cx="200" cy="156" rx="98" ry="74" fill="#E9B871" />
        <ellipse cx="200" cy="152" rx="86" ry="63" fill="#F0C887" />
        <ellipse cx="190" cy="140" rx="40" ry="22" fill="#fff" opacity="0.18" />
      </g>
    );
    drizzle = "M130 150 C150 120 175 175 200 140 S240 120 262 150 M150 185 C175 165 200 200 230 175";
    area = { cx: 200, cy: 152, r: 62 };
  } else if (kind === "krep") {
    dessert = (
      <g>
        <path d="M95 200 Q200 40 305 200 Q200 230 95 200Z" fill="#F0CF94" />
        <path d="M95 200 Q200 40 305 200" fill="none" stroke="#DDB06A" strokeWidth="3" />
        <path d="M140 196 Q200 95 262 196" fill="none" stroke="#E2BC7C" strokeWidth="2.5" />
        <path d="M110 196 Q200 214 292 196" fill="none" stroke="#D8A85E" strokeWidth="2" opacity="0.6" />
      </g>
    );
    drizzle = "M120 180 C150 150 170 190 200 160 S245 140 280 178";
    area = { cx: 200, cy: 160, r: 60 };
  } else if (kind === "churros") {
    const sticks = [
      { x: 95, y: 92, r: -18 },
      { x: 108, y: 128, r: -10 },
      { x: 104, y: 166, r: -2 },
      { x: 112, y: 202, r: 6 },
    ];
    dessert = (
      <g>
        {sticks.map((s, i) => (
          <g key={i} transform={`rotate(${s.r} ${s.x + 85} ${s.y + 12})`}>
            <rect x={s.x} y={s.y} width="170" height="26" rx="13" fill="#D9984D" />
            {Array.from({ length: 4 }, (_, k) => (
              <line key={k} x1={s.x + 8} y1={s.y + 6 + k * 5} x2={s.x + 162} y2={s.y + 6 + k * 5} stroke="#B97935" strokeWidth="1.4" opacity="0.7" />
            ))}
          </g>
        ))}
        <circle cx="300" cy="110" r="42" fill="#FFFDF9" stroke="#E4D5C0" strokeWidth="2" />
        <circle cx="300" cy="110" r="33" fill={sauceColor ?? "#efe4d4"} />
        <circle cx="290" cy="100" r="8" fill="#fff" opacity="0.25" />
      </g>
    );
    drizzle = "";
    area = { cx: 185, cy: 150, r: 70 };
  } else {
    dessert = (
      <g>
        <ellipse cx="200" cy="160" rx="112" ry="84" fill="#FBF6EF" stroke="#E4D5C0" strokeWidth="3" />
        <circle cx="168" cy="150" r="44" fill="#F6E8CF" />
        <circle cx="228" cy="140" r="42" fill="#EED7B2" />
        <circle cx="205" cy="190" r="40" fill="#F3E2C3" />
        <circle cx="155" cy="135" r="12" fill="#fff" opacity="0.35" />
      </g>
    );
    drizzle = "M135 140 C160 115 180 170 205 135 S245 120 265 150 M160 190 C185 170 205 210 240 185";
    area = { cx: 200, cy: 158, r: 64 };
  }

  return (
    <svg viewBox="0 0 400 310" className="h-auto w-full" role="img" aria-label="Seçtiğiniz kombinasyonun temsili illüstrasyonu">
      <defs>
        <linearGradient id="wafShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#8a5a2b" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      {plate}
      {dessert}
      {drizzle ? <Drizzle color={sauceColor} path={drizzle} /> : null}
      <Toppings colors={toppingColors} styles={toppingStyles} area={area} />
    </svg>
  );
}
