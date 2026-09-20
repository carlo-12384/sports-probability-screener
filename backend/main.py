from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI(title="Sports Probability Screener")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FILE = "output/nfl_2010_2025_halftime_games.csv"

df = pd.read_csv(FILE)

if df["trailing_team_home"].dtype != bool:
    df["trailing_team_home"] = (
        df["trailing_team_home"].astype(str).str.lower().eq("true")
    )

if df["trailing_team_was_favorite"].dtype != bool:
    df["trailing_team_was_favorite"] = (
        df["trailing_team_was_favorite"].astype(str).str.lower().eq("true")
    )


@app.get("/")
def home():
    return {
        "message": "Sports Probability Screener API",
        "games_loaded": len(df),
    }


def apply_base_filters(
    data,
    min_deficit,
    max_deficit,
    start_season,
    end_season,
):
    filtered = data[
        (data["season"] >= start_season)
        & (data["season"] <= end_season)
    ].copy()

    filtered = filtered[
        (filtered["halftime_deficit"] >= min_deficit)
        & (filtered["halftime_deficit"] <= max_deficit)
    ]

    return filtered


def apply_location_filter(data, location):
    if location.lower() == "home":
        return data[data["trailing_team_home"] == True]

    if location.lower() == "away":
        return data[data["trailing_team_home"] == False]

    return data


@app.get("/probability")
def probability(
    min_deficit: int = Query(1, ge=1),
    max_deficit: int = Query(100, ge=1),
    favorite_only: bool = False,
    min_favorite_by: float = 0,
    location: str = "any",
    start_season: int = 2010,
    end_season: int = 2025,
):
    filtered = apply_base_filters(
        df,
        min_deficit,
        max_deficit,
        start_season,
        end_season,
    )

    if favorite_only:
        filtered = filtered[
            filtered["trailing_team_was_favorite"] == True
        ]

        filtered = filtered[
            filtered["trailing_team_favorite_by"] >= min_favorite_by
        ]

    filtered = apply_location_filter(filtered, location)

    games = len(filtered)

    if games == 0:
        return {
            "games": 0,
            "wins": 0,
            "losses": 0,
            "win_probability": None,
            "win_percentage": None,
            "average_deficit": None,
            "average_favorite_by": None,
        }

    wins = int(filtered["trailing_team_won"].sum())
    losses = games - wins
    win_probability = wins / games

    return {
        "games": games,
        "wins": wins,
        "losses": losses,
        "win_probability": round(win_probability, 4),
        "win_percentage": round(win_probability * 100, 1),
        "average_deficit": round(filtered["halftime_deficit"].mean(), 2),
        "average_favorite_by": round(
            filtered["trailing_team_favorite_by"].mean(),
            2,
        ),
    }


@app.get("/comparison")
def comparison(
    min_deficit: int = Query(1, ge=1),
    max_deficit: int = Query(100, ge=1),
    favorite_only: bool = False,
    min_favorite_by: float = 0,
    location: str = "any",
    start_season: int = 2010,
    end_season: int = 2025,
):
    rows = []

    def add_row(label, data):
        games = len(data)
        wins = int(data["trailing_team_won"].sum()) if games else 0

        rows.append(
            {
                "label": label,
                "games": games,
                "wins": wins,
                "win_percentage": (
                    round(wins / games * 100, 1)
                    if games
                    else None
                ),
            }
        )

    filtered = apply_base_filters(
        df,
        min_deficit,
        max_deficit,
        start_season,
        end_season,
    )

    add_row(
        f"Trailing by {min_deficit}-{max_deficit} at halftime",
        filtered,
    )

    if favorite_only:
        favorites = filtered[
            filtered["trailing_team_was_favorite"] == True
        ]

        add_row("Pregame favorites", favorites)

        strong_favorites = favorites[
            favorites["trailing_team_favorite_by"] >= min_favorite_by
        ]

        add_row(
            f"Favored by {min_favorite_by:g}+",
            strong_favorites,
        )

        final_data = strong_favorites
    else:
        final_data = filtered

    if location.lower() in {"home", "away"}:
        final_data = apply_location_filter(final_data, location)

        add_row(
            "Playing at home"
            if location.lower() == "home"
            else "Playing away",
            final_data,
        )

    return rows
