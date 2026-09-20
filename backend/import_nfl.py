import pandas as pd
import numpy as np
from pathlib import Path

START_SEASON = 2010
END_SEASON = 2025

all_games = []

for season in range(START_SEASON, END_SEASON + 1):
    url = (
        "https://github.com/nflverse/nflverse-data/releases/download/pbp/"
        f"play_by_play_{season}.parquet"
    )

    print(f"Downloading {season}...")

    try:
        df = pd.read_parquet(url)
    except Exception as e:
        print(f"Could not load {season}: {e}")
        continue

    df = df[df["season_type"] == "REG"].copy()

    q2 = df[df["qtr"] == 2].copy()
    q2 = q2.sort_values(["game_id", "play_id"])

    halftime = q2.groupby("game_id", as_index=False).tail(1).copy()

    games = halftime[
        [
            "game_id",
            "season",
            "week",
            "game_date",
            "home_team",
            "away_team",
            "total_home_score",
            "total_away_score",
            "home_score",
            "away_score",
            "spread_line",
            "total_line",
        ]
    ].copy()

    games = games.rename(
        columns={
            "total_home_score": "halftime_home_score",
            "total_away_score": "halftime_away_score",
            "home_score": "final_home_score",
            "away_score": "final_away_score",
            "spread_line": "pregame_spread",
            "total_line": "pregame_total",
        }
    )

    games = games[
        games["halftime_home_score"] != games["halftime_away_score"]
    ].copy()

    games["trailing_team_home"] = (
        games["halftime_home_score"] < games["halftime_away_score"]
    )

    games["trailing_team"] = np.where(
        games["trailing_team_home"],
        games["home_team"],
        games["away_team"],
    )

    games["halftime_deficit"] = np.where(
        games["trailing_team_home"],
        games["halftime_away_score"] - games["halftime_home_score"],
        games["halftime_home_score"] - games["halftime_away_score"],
    ).astype(int)

    games["trailing_team_was_favorite"] = np.where(
        games["trailing_team_home"],
        games["pregame_spread"] > 0,
        games["pregame_spread"] < 0,
    )

    games["trailing_team_favorite_by"] = np.where(
        games["trailing_team_was_favorite"],
        np.abs(games["pregame_spread"]),
        0.0,
    )

    games["trailing_team_won"] = np.where(
        games["trailing_team_home"],
        games["final_home_score"] > games["final_away_score"],
        games["final_away_score"] > games["final_home_score"],
    ).astype(int)

    all_games.append(games)

    print(f"  Added {len(games)} games")

combined = pd.concat(all_games, ignore_index=True)

output_dir = Path("output")
output_dir.mkdir(exist_ok=True)

output_file = output_dir / "nfl_2010_2025_halftime_games.csv"
combined.to_csv(output_file, index=False)

print("\nFinished.")
print(f"Total games: {len(combined):,}")
print(f"Saved to: {output_file}")
print(
    f"Overall comeback rate: "
    f"{combined['trailing_team_won'].mean() * 100:.1f}%"
)