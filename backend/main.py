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

# Make sure booleans load correctly
if df["trailing_team_home"].dtype != bool:
    df["trailing_team_home"] = (
        df["trailing_team_home"]
        .astype(str)
        .str.lower()
        .eq("true")
    )

if df["trailing_team_was_favorite"].dtype != bool:
    df["trailing_team_was_favorite"] = (
        df["trailing_team_was_favorite"]
        .astype(str)
        .str.lower()
        .eq("true")
    )


@app.get("/")
def home():
    return {
        "message": "Sports Probability Screener API",
        "games_loaded": len(df),
    }


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
    filtered = df.copy()

    # Season filter
    filtered = filtered[
        (filtered["season"] >= start_season)
        & (filtered["season"] <= end_season)
    ]

    # Deficit filter
    filtered = filtered[
        (filtered["halftime_deficit"] >= min_deficit)
        & (filtered["halftime_deficit"] <= max_deficit)
    ]

    # Favorite filters
    if favorite_only:
        filtered = filtered[
            filtered["trailing_team_was_favorite"] == True
        ]

        filtered = filtered[
            filtered["trailing_team_favorite_by"]
            >= min_favorite_by
        ]

    # Home / away
    if location.lower() == "home":
        filtered = filtered[
            filtered["trailing_team_home"] == True
        ]

    elif location.lower() == "away":
        filtered = filtered[
            filtered["trailing_team_home"] == False
        ]

    games = len(filtered)

    if games == 0:
        return {
            "games": 0,
            "wins": 0,
            "losses": 0,
            "win_probability": None,
        }

    wins = int(filtered["trailing_team_won"].sum())
    losses = games - wins

    probability = wins / games

    return {
        "games": games,
        "wins": wins,
        "losses": losses,

        "win_probability": round(probability, 4),
        "win_percentage": round(probability * 100, 1),

        "average_deficit": round(
            filtered["halftime_deficit"].mean(),
            2
        ),

        "average_favorite_by": round(
            filtered[
                "trailing_team_favorite_by"
            ].mean(),
            2
        ),
    }
@app.get("/comparison")
def comparison():
    rows = []

    def add_row(label, data):
        games = len(data)

        if games == 0:
            win_percentage = None
            wins = 0
        else:
            wins = int(data["trailing_team_won"].sum())
            win_percentage = round(
                wins / games * 100,
                1
            )

        rows.append(
            {
                "label": label,
                "games": games,
                "wins": wins,
                "win_percentage": win_percentage,
            }
        )

    # 1. Baseline
    add_row(
        "All teams trailing at halftime",
        df
    )

    # 2. Any pregame favorite
    favorites = df[
        df["trailing_team_was_favorite"] == True
    ]

    add_row(
        "Pregame favorites",
        favorites
    )

    # 3. Favorite by 4+
    favorite_4 = df[
        (df["trailing_team_was_favorite"] == True)
        & (df["trailing_team_favorite_by"] >= 4)
    ]

    add_row(
        "Favored by 4+",
        favorite_4
    )

    # 4. Favorite by 4+, down 1-7
    favorite_4_close = df[
        (df["trailing_team_was_favorite"] == True)
        & (df["trailing_team_favorite_by"] >= 4)
        & (df["halftime_deficit"] >= 1)
        & (df["halftime_deficit"] <= 7)
    ]

    add_row(
        "Favored by 4+ and down 1-7",
        favorite_4_close
    )

    # 5. Away subset
    favorite_4_close_away = df[
        (df["trailing_team_was_favorite"] == True)
        & (df["trailing_team_favorite_by"] >= 4)
        & (df["halftime_deficit"] >= 1)
        & (df["halftime_deficit"] <= 7)
        & (df["trailing_team_home"] == False)
    ]

    add_row(
        "Same situation, away",
        favorite_4_close_away
    )

    return rows