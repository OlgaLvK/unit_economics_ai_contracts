import { useState, useMemo } from "react";

const DEFAULT = {
  price: 15,
  fixedCosts: 3000,
  cac: 0,
  cr1: 30,
  cr2: 60,
  cr3: 50,
  cr4: 60,
  cr5: 38,
  leads: 704,
};

const fmt = (n, dec = 1) => {
  if (!isFinite(n)) return "—";
  return n % 1 === 0 ? n.toLocaleString("ru") : n.toLocaleString("ru", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const fmtEur = (n) => {
  if (!isFinite(n)) return "—";
  return (n >= 0 ? "+" : "") + fmt(n, 0) + " €";
};

const SCENARIOS = [
  { label: "Текущий", color: "#6366f1", mods: {} },
  { label: "Оптимистичный", color: "#10b981", mods: { cr1: 40, cr2: 70, cr3: 60, cr4: 70, cr5: 50, leads: 1500 } },
  { label: "Консервативный", color: "#f59e0b", mods: { cr1: 20, cr2: 50, cr3: 40, cr4: 50, cr5: 25, leads: 400 } },
];

function calcFunnel(p) {
  const signups = p.leads * (p.cr1 / 100);
  const cm = signups * (p.cr2 / 100);
  const doc = cm * (p.cr3 / 100);
  const plan = doc * (p.cr4 / 100);
  const paid = plan * (p.cr5 / 100);
  const revenue = paid * p.price;
  const totalCac = p.leads * p.cac;
  const profit = revenue - p.fixedCosts - totalCac;
  const breakEven = Math.ceil((p.fixedCosts + totalCac) / p.price);
  const leadsNeeded = breakEven / ((p.cr1 / 100) * (p.cr2 / 100) * (p.cr3 / 100) * (p.cr4 / 100) * (p.cr5 / 100));
  return { signups, cm, doc, plan, paid: Math.round(paid * 10) / 10, revenue, profit, breakEven, leadsNeeded: Math.ceil(leadsNeeded) };
}

const SliderRow = ({ label, value, onChange, min = 1, max = 100, step = 1, suffix = "%", hint }) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm text-gray-300">{label}</span>
      <span className="text-sm font-bold text-white">{value}{suffix}</span>
    </div>
    {hint && <div className="text-xs text-gray-500 mb-1">{hint}</div>}
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{ background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)` }}
    />
  </div>
);

export default function App() {
  const [p, setP] = useState(DEFAULT);
  const [tab, setTab] = useState(0);

  const set = (k) => (v) => setP(prev => ({ ...prev, [k]: v }));

  const res = useMemo(() => calcFunnel(p), [p]);

  const scenarioResults = useMemo(() =>
    SCENARIOS.map(s => ({ ...s, res: calcFunnel({ ...p, ...s.mods }) })),
    [p]
  );

  const funnelSteps = [
    { label: "Лендинг просмотрен", value: p.leads, cr: null },
    { label: "Зарегистрировался", value: res.signups, cr: p.cr1, crLabel: "CR1" },
    { label: "Просмотрел CM", value: res.cm, cr: p.cr2, crLabel: "CR2" },
    { label: "Создал AI doc", value: res.doc, cr: p.cr3, crLabel: "CR3" },
    { label: "Просмотрел план", value: res.plan, cr: p.cr4, crLabel: "CR4" },
    { label: "Оплатил тариф", value: res.paid, cr: p.cr5, crLabel: "CR5" },
  ];

  const profitColor = res.profit >= 0 ? "#10b981" : "#ef4444";

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#0f172a", minHeight: "100vh", color: "#f1f5f9", padding: "24px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>📊 Юнит-экономика</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Подписка · 15 €/мес · Фикс. расходы 3 000 €/мес</p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["Калькулятор", "Сценарии", "Точка безубыточности"].map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: tab === i ? "#6366f1" : "#1e293b", color: tab === i ? "#fff" : "#94a3b8" }}>
              {t}
            </button>
          ))}
        </div>

        {/* TAB 0: Calculator */}
        {tab === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Left: sliders */}
            <div style={{ background: "#1e293b", borderRadius: 12, padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#c7d2fe" }}>⚙️ Параметры воронки</h2>

              <div style={{ marginBottom: 16 }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize: 14, color: "#d1d5db" }}>Лидов на лендинг</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{fmt(p.leads)}</span>
                </div>
                <input type="range" min={100} max={10000} step={50} value={p.leads}
                  onChange={e => set("leads")(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#6366f1" }} />
              </div>

              {[
                { key: "cr1", label: "CR1 — Лендинг → Регистрация", hint: "Просмотрел лендинг → зарегистрировался" },
                { key: "cr2", label: "CR2 — Регистрация → CM", hint: "Зарегистрировался → просмотрел CM" },
                { key: "cr3", label: "CR3 — CM → AI Doc", hint: "Просмотрел CM → создал AI документ" },
                { key: "cr4", label: "CR4 — AI Doc → Plan", hint: "Создал AI doc → просмотрел план" },
                { key: "cr5", label: "CR5 — Plan → Оплата", hint: "Просмотрел план → оплатил" },
              ].map(({ key, label, hint }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#d1d5db" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>{p[key]}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{hint}</div>
                  <input type="range" min={1} max={100} value={p[key]}
                    onChange={e => set(key)(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#6366f1" }} />
                </div>
              ))}
            </div>

            {/* Right: funnel + result */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Funnel */}
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#c7d2fe" }}>🔽 Воронка</h2>
                {funnelSteps.map((step, i) => {
                  const maxVal = p.leads;
                  const w = Math.max(8, (step.value / maxVal) * 100);
                  const isLast = i === funnelSteps.length - 1;
                  return (
                    <div key={i} style={{ marginBottom: 8 }}>
                      {step.cr !== null && (
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2, paddingLeft: 4 }}>
                          ↓ {step.crLabel}: {step.cr}%
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, background: "#0f172a", borderRadius: 6, height: 28, overflow: "hidden" }}>
                          <div style={{
                            width: `${w}%`, height: "100%", borderRadius: 6,
                            background: isLast ? (res.profit >= 0 ? "#10b981" : "#ef4444") : "#6366f1",
                            display: "flex", alignItems: "center", paddingLeft: 8,
                            fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap"
                          }}>
                            {fmt(step.value)}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: "#94a3b8", width: 130, flexShrink: 0 }}>{step.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* KPIs */}
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#c7d2fe" }}>💰 Результат</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Платящих", value: fmt(res.paid), sub: "пользователей" },
                    { label: "Выручка", value: fmt(res.revenue, 0) + " €", sub: "в месяц" },
                    { label: "Расходы", value: fmt(p.fixedCosts) + " €", sub: "фикс. в месяц" },
                    { label: "Прибыль", value: fmtEur(res.profit), sub: "в месяц", highlight: true, color: profitColor },
                  ].map((kpi, i) => (
                    <div key={i} style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{kpi.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color || "#f1f5f9" }}>{kpi.value}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{kpi.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: 10, background: "#0f172a", borderRadius: 8, fontSize: 13, color: "#94a3b8" }}>
                  Нужно минимум <span style={{ color: "#fbbf24", fontWeight: 700 }}>{res.breakEven} платящих</span> для покрытия расходов
                  <br />→ это <span style={{ color: "#fbbf24", fontWeight: 700 }}>{fmt(res.leadsNeeded)} лидов</span> при текущих конверсиях
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Scenarios */}
        {tab === 1 && (
          <div>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
              Базовые параметры берутся из калькулятора. Оптимистичный и консервативный сценарии меняют конверсии и количество лидов.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {scenarioResults.map((s, i) => {
                const r = s.res;
                const profit = r.profit;
                const pColor = profit >= 0 ? "#10b981" : "#ef4444";
                return (
                  <div key={i} style={{ background: "#1e293b", borderRadius: 12, padding: 20, borderTop: `3px solid ${s.color}` }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: s.color, marginBottom: 16 }}>{s.label}</h3>
                    {[
                      { label: "Лидов", value: fmt(i === 0 ? p.leads : s.mods.leads) },
                      { label: "CR1 (→ регистрация)", value: (i === 0 ? p.cr1 : s.mods.cr1) + "%" },
                      { label: "CR2 (→ CM)", value: (i === 0 ? p.cr2 : s.mods.cr2) + "%" },
                      { label: "CR3 (→ AI doc)", value: (i === 0 ? p.cr3 : s.mods.cr3) + "%" },
                      { label: "CR4 (→ план)", value: (i === 0 ? p.cr4 : s.mods.cr4) + "%" },
                      { label: "CR5 (→ оплата)", value: (i === 0 ? p.cr5 : s.mods.cr5) + "%" },
                    ].map((row, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0f172a", fontSize: 13 }}>
                        <span style={{ color: "#94a3b8" }}>{row.label}</span>
                        <span style={{ fontWeight: 700 }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: "#0f172a", borderRadius: 8, padding: 10, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Платящих</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{fmt(r.paid)}</div>
                      </div>
                      <div style={{ background: "#0f172a", borderRadius: 8, padding: 10, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Прибыль</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: pColor }}>{fmtEur(profit)}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, background: "#0f172a", borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Выручка</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{fmt(r.revenue, 0)} €</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Break-even */}
        {tab === 2 && (
          <div>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
              При каком количестве лидов ты выходишь в ноль и в плюс — при текущих конверсиях?
            </p>
            <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#c7d2fe" }}>🎯 Точка безубыточности</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                {[
                  { label: "Нужно платящих", value: fmt(res.breakEven), color: "#fbbf24" },
                  { label: "Нужно лидов", value: fmt(res.leadsNeeded), color: "#fbbf24" },
                  { label: "Сейчас лидов", value: fmt(p.leads), color: "#6366f1" },
                ].map((kpi, i) => (
                  <div key={i} style={{ background: "#0f172a", borderRadius: 8, padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{kpi.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Table: lead levels */}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>Таблица: лиды → прибыль</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#64748b" }}>
                      {["Лидов", "Платящих", "Выручка €", "Прибыль €", "Статус"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #0f172a" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[200, 500, 1000, 2000, 3000, 5000, 8000, 10000].map(leads => {
                      const r = calcFunnel({ ...p, leads });
                      const isNow = leads === p.leads;
                      const inPlus = r.profit >= 0;
                      return (
                        <tr key={leads} style={{ background: isNow ? "#1a2744" : "transparent" }}>
                          <td style={{ padding: "8px 12px", fontWeight: isNow ? 700 : 400, color: isNow ? "#a5b4fc" : "#f1f5f9" }}>{fmt(leads)}{isNow ? " ← сейчас" : ""}</td>
                          <td style={{ padding: "8px 12px" }}>{fmt(r.paid)}</td>
                          <td style={{ padding: "8px 12px" }}>{fmt(r.revenue, 0)}</td>
                          <td style={{ padding: "8px 12px", color: inPlus ? "#10b981" : "#ef4444", fontWeight: 700 }}>{fmtEur(r.profit)}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                              background: inPlus ? "#064e3b" : "#450a0a", color: inPlus ? "#10b981" : "#ef4444" }}>
                              {inPlus ? "✓ прибыль" : "✗ убыток"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
