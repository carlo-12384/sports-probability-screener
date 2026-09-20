"use client";

import { useEffect, useState } from "react";

type ProbabilityResult = {
  games: number;
  wins: number;
  losses: number;
  win_probability: number | null;
  win_percentage: number | null;
  average_deficit?: number;
  average_favorite_by?: number;
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

    const data = await response.json();
    setResult(data);
  }

  async function getComparison() {
    const params = buildParams();

    const response = await fetch(
      `http://127.0.0.1:8000/comparison?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Comparison request failed.");
    }

    const data = await response.json();
    setComparison(data);
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            NFL Historical Analytics
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Sports Probability Screener
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Analyze how NFL teams historically performed from similar halftime
            situations.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-6 text-xl font-semibold">Filters</h2>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Minimum halftime deficit
                </label>
                <input
                  type="number"
                  value={minDeficit}
                  min={1}
                  onChange={(e) => setMinDeficit(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Maximum halftime deficit
                </label>
                <input
                  type="number"
                  value={maxDeficit}
                  min={1}
                  onChange={(e) => setMaxDeficit(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-400">
                  Pregame favorites only
                </label>
                <input
                  type="checkbox"
                  checked={favoriteOnly}
                  onChange={(e) => setFavoriteOnly(e.target.checked)}
                  className="h-5 w-5"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Minimum favorite by
                </label>
                <input
                  type="number"
                  value={minFavoriteBy}
                  step={0.5}
                  disabled={!favoriteOnly}
                  onChange={(e) => setMinFavoriteBy(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 disabled:opacity-40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                >
                  <option value="any">Any</option>
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Start season
                  </label>
                  <input
                    type="number"
                    value={startSeason}
                    onChange={(e) => setStartSeason(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    End season
                  </label>
                  <input
                    type="number"
                    value={endSeason}
                    onChange={(e) => setEndSeason(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                  />
                </div>
              </div>

              <button
                onClick={calculate}
                disabled={loading}
                className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? "Calculating..." : "Calculate Probability"}
              </button>
            </div>
          </section>

          <section>
            {error && (
              <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
                {error}
              </div>
            )}

            {result && (
              <>
                <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
                  <p className="text-sm uppercase tracking-wider text-zinc-500">
                    Historical win probability
                  </p>

                  <div className="mt-3 flex items-end gap-3">
                    <span className="text-7xl font-bold tracking-tight">
                      {result.win_percentage !== null
                        ? `${result.win_percentage}%`
                        : "—"}
                    </span>

                    <span className="mb-2 text-zinc-500">
                      from {result.games.toLocaleString()} games
                    </span>
                  </div>

                  <p className="mt-5 text-sm text-zinc-500">
                    Historical performance does not guarantee future results.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <StatCard
                    title="Comparable Games"
                    value={result.games.toLocaleString()}
                  />
                  <StatCard
                    title="Comeback Wins"
                    value={result.wins.toLocaleString()}
                  />
                  <StatCard
                    title="Losses"
                    value={result.losses.toLocaleString()}
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <StatCard
                    title="Average Deficit"
                    value={
                      result.average_deficit !== undefined
                        ? `${result.average_deficit} pts`
                        : "—"
                    }
                  />
                  <StatCard
                    title="Average Favorite By"
                    value={
                      result.average_favorite_by !== undefined
                        ? `${result.average_favorite_by} pts`
                        : "—"
                    }
                  />
                </div>

                <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold">Filter Impact</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      See how historical win probability changes as filters are
                      added.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {comparison.map((row, index) => (
                      <div
                        key={row.label}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">
                              {index + 1}. {row.label}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500">
                              {row.games.toLocaleString()} games
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-3xl font-bold">
                              {row.win_percentage !== null
                                ? `${row.win_percentage}%`
                                : "—"}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {row.wins} wins
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-white"
                            style={{
                              width: `${row.win_percentage ?? 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
