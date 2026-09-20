"use client";

import { useEffect, useState } from "react";

type ProbabilityResult = {
  games: number;
  wins: number;
  losses: number;
  win_probability: number | null;
  win_percentage: number | null;
  average_deficit?: number | null;
  average_favorite_by?: number | null;
};

type ComparisonRow = {
  label: string;
  games: number;
  wins: number;
  win_percentage: number | null;
};

export default function Home() {
  const [minDeficit, setMinDeficit] = useState(1);
  const [maxDeficit, setMaxDeficit] = useState(7);
  const [favoriteOnly, setFavoriteOnly] = useState(true);
  const [minFavoriteBy, setMinFavoriteBy] = useState(4);
  const [location, setLocation] = useState("any");
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [startSeason, setStartSeason] = useState(2010);
  const [endSeason, setEndSeason] = useState(2025);
  const [result, setResult] = useState<ProbabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function buildParams() {
    return new URLSearchParams({
      min_deficit: String(minDeficit),
      max_deficit: String(maxDeficit),
      favorite_only: String(favoriteOnly),
      min_favorite_by: String(minFavoriteBy),
      location,
      start_season: String(startSeason),
      end_season: String(endSeason),
    });
  }

  async function getProbability() {
    const params = buildParams();
    const response = await fetch(
      `http://127.0.0.1:8000/probability?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("API request failed.");
    }

    setResult(await response.json());
  }

  async function getComparison() {
    const params = buildParams();
    const response = await fetch(
      `http://127.0.0.1:8000/comparison?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Comparison request failed.");
    }

    setComparison(await response.json());
  }

  async function calculate() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([getProbability(), getComparison()]);
    } catch {
      setError(
        "Could not connect to the backend. Make sure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    calculate();
  }, []);

  const winRate = result?.win_percentage ?? null;
  const sampleStrength =
    !result || result.games < 30
      ? "Low sample"
      : result.games < 100
      ? "Moderate sample"
      : "Strong sample";

  return (
    <main className="min-h-screen bg-[#090b0f] text-[#f5f7fa]">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.7)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                NFL Historical Analytics
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
              Sports Probability Screener
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">
              Screen historical NFL halftime situations and see how each filter
              changes the outcome profile.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-zinc-400 sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            2010–2025 dataset
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#101319] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] xl:sticky xl:top-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Scenario</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Refine the historical sample
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                Filters
              </div>
            </div>

            <div className="space-y-5">
              <FilterGroup label="Halftime deficit">
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="Min"
                    value={minDeficit}
                    min={1}
                    onChange={setMinDeficit}
                  />
                  <NumberField
                    label="Max"
                    value={maxDeficit}
                    min={1}
                    onChange={setMaxDeficit}
                  />
                </div>
              </FilterGroup>

              <div className="h-px bg-white/[0.06]" />

              <FilterGroup label="Pregame favorite">
                <button
                  type="button"
                  onClick={() => setFavoriteOnly(!favoriteOnly)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-3 text-left transition hover:bg-white/[0.04]"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Favorites only
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Restrict to teams favored before kickoff
                    </p>
                  </div>

                  <span
                    className={`relative h-6 w-11 rounded-full transition ${
                      favoriteOnly ? "bg-emerald-400" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                        favoriteOnly ? "left-6" : "left-1"
                      }`}
                    />
                  </span>
                </button>

                <div className="mt-2">
                  <NumberField
                    label="Minimum favorite by"
                    value={minFavoriteBy}
                    step={0.5}
                    disabled={!favoriteOnly}
                    suffix="pts"
                    onChange={setMinFavoriteBy}
                  />
                </div>
              </FilterGroup>

              <div className="h-px bg-white/[0.06]" />

              <FilterGroup label="Location">
                <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1">
                  {[
                    ["any", "Any"],
                    ["home", "Home"],
                    ["away", "Away"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLocation(value)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                        location === value
                          ? "bg-white text-black shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </FilterGroup>

              <div className="h-px bg-white/[0.06]" />

              <FilterGroup label="Season range">
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="From"
                    value={startSeason}
                    onChange={setStartSeason}
                  />
                  <NumberField
                    label="To"
                    value={endSeason}
                    onChange={setEndSeason}
                  />
                </div>
              </FilterGroup>

              <button
                onClick={calculate}
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Recalculating
                  </>
                ) : (
                  <>
                    Run analysis
                    <span className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </aside>

          <section className="min-w-0">
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {result && (
              <>
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101319] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
                  <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
                    <div className="p-6 sm:p-8">
                      <div className="mb-10 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                          HISTORICAL RESULT
                        </span>
                        <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                          {sampleStrength}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-zinc-500">
                        Win probability
                      </p>

                      <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
                        <span className="text-[72px] font-semibold leading-none tracking-[-0.07em] text-white sm:text-[92px]">
                          {winRate !== null ? winRate : "—"}
                          <span className="ml-1 text-[0.38em] tracking-[-0.03em] text-zinc-500">
                            %
                          </span>
                        </span>

                        <div className="mb-2">
                          <p className="text-sm font-medium text-zinc-300">
                            {result.wins.toLocaleString()} wins
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            across {result.games.toLocaleString()} comparable games
                          </p>
                        </div>
                      </div>

                      <p className="mt-6 max-w-2xl text-sm leading-6 text-zinc-500">
                        Historical frequency for teams matching the selected
                        halftime, spread, location, and season filters.
                      </p>
                    </div>

                    <div className="border-t border-white/[0.07] bg-black/10 p-6 lg:border-l lg:border-t-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                        Active scenario
                      </p>

                      <div className="mt-5 space-y-4">
                        <ScenarioRow
                          label="Halftime deficit"
                          value={`${minDeficit}–${maxDeficit} pts`}
                        />
                        <ScenarioRow
                          label="Pregame favorite"
                          value={
                            favoriteOnly
                              ? `Yes, by ${minFavoriteBy}+ pts`
                              : "Any"
                          }
                        />
                        <ScenarioRow
                          label="Location"
                          value={
                            location === "any"
                              ? "Any"
                              : location === "home"
                              ? "Home"
                              : "Away"
                          }
                        />
                        <ScenarioRow
                          label="Seasons"
                          value={`${startSeason}–${endSeason}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Comparable games"
                    value={result.games.toLocaleString()}
                    subtext="Historical sample"
                  />
                  <MetricCard
                    label="Comeback wins"
                    value={result.wins.toLocaleString()}
                    subtext="Games won after trailing"
                  />
                  <MetricCard
                    label="Avg. deficit"
                    value={
                      result.average_deficit !== null &&
                      result.average_deficit !== undefined
                        ? `${result.average_deficit} pts`
                        : "—"
                    }
                    subtext="Within selected sample"
                  />
                  <MetricCard
                    label="Avg. favorite by"
                    value={
                      result.average_favorite_by !== null &&
                      result.average_favorite_by !== undefined
                        ? `${result.average_favorite_by} pts`
                        : "—"
                    }
                    subtext="Pregame spread"
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#101319] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-6">
                  <div className="flex flex-col gap-2 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-white">
                        Filter impact
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        How the historical win rate changes as conditions narrow.
                      </p>
                    </div>

                    <p className="text-xs text-zinc-600">
                      Each step uses the remaining sample
                    </p>
                  </div>

                  <div className="mt-2 divide-y divide-white/[0.06]">
                    {comparison.map((row, index) => {
                      const previous =
                        index > 0 ? comparison[index - 1].win_percentage : null;
                      const delta =
                        row.win_percentage !== null && previous !== null
                          ? row.win_percentage - previous
                          : null;

                      return (
                        <div
                          key={row.label}
                          className="grid gap-4 py-5 sm:grid-cols-[36px_minmax(0,1fr)_100px_100px] sm:items-center"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs font-semibold text-zinc-500">
                            {String(index + 1).padStart(2, "0")}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-sm font-medium text-zinc-200">
                                {row.label}
                              </p>
                              <span className="text-xs text-zinc-600 sm:hidden">
                                {row.games.toLocaleString()} games
                              </span>
                            </div>

                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    row.win_percentage ?? 0,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium text-zinc-300">
                              {row.games.toLocaleString()}
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-600">
                              games
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                            <div>
                              <span className="text-2xl font-semibold tracking-[-0.03em] text-white">
                                {row.win_percentage !== null
                                  ? `${row.win_percentage}%`
                                  : "—"}
                              </span>
                              <span className="ml-2 text-xs text-zinc-600 sm:hidden">
                                {row.wins} wins
                              </span>
                            </div>

                            {delta !== null && (
                              <p
                                className={`mt-0.5 text-[11px] font-medium ${
                                  delta > 0
                                    ? "text-emerald-400"
                                    : delta < 0
                                    ? "text-red-400"
                                    : "text-zinc-600"
                                }`}
                              >
                                {delta > 0 ? "+" : ""}
                                {delta.toFixed(1)} pts
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="mt-4 px-1 text-xs leading-5 text-zinc-700">
                  Historical results are descriptive, not predictive. Small
                  samples can produce unstable percentages.
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
        {label}
      </p>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  step,
  suffix,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label
      className={`block rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 transition focus-within:border-white/[0.18] ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600">
        {label}
      </span>

      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-200 outline-none disabled:cursor-not-allowed"
        />
        {suffix && <span className="text-xs text-zinc-600">{suffix}</span>}
      </div>
    </label>
  );
}

function ScenarioRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-zinc-600">{label}</span>
      <span className="text-right text-xs font-medium text-zinc-300">{value}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#101319] p-5">
      <p className="text-xs font-medium text-zinc-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-zinc-700">{subtext}</p>
    </div>
  );
}
