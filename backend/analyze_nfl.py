import pandas as pd

FILE = "output/nfl_2010_2025_halftime_games.csv"

df = pd.read_csv(FILE)

def show_result(name, data):
    games = len(data)

    if games == 0:
        print(f"\n{name}")
        print("No games found.")
        return

    wins = data["trailing_team_won"].sum()
    losses = games - wins
    win_rate = wins / games * 100

    print(f"\n{name}")
    print("-" * len(name))
    print(f"Games: {games}")
    print(f"Wins: {wins}")
    print(f"Losses: {losses}")
    print(f"Win rate: {win_rate:.1f}%")

# 1. Baseline
show_result(
    "ALL TEAMS TRAILING AT HALFTIME",
    df
)

# 2. Pregame favorites
favorites = df[
    df["trailing_team_was_favorite"] == True
]

show_result(
    "PREGAME FAVORITES TRAILING AT HALFTIME",
    favorites
)

# 3. Favorite by 3+
fav_3 = df[
    (df["trailing_team_was_favorite"] == True)
    & (df["trailing_team_favorite_by"] >= 3)
]

show_result(
    "FAVORITE BY 3+ TRAILING",
    fav_3
)

# 4. Favorite by 4+
fav_4 = df[
    (df["trailing_team_was_favorite"] == True)
    & (df["trailing_team_favorite_by"] >= 4)
]

show_result(
    "FAVORITE BY 4+ TRAILING",
    fav_4
)

# 5. Favorite by 4+, deficit <= 7
fav_4_close = df[
    (df["trailing_team_was_favorite"] == True)
    & (df["trailing_team_favorite_by"] >= 4)
    & (df["halftime_deficit"] <= 7)
]

show_result(
    "FAVORITE BY 4+ AND DOWN 1-7",
    fav_4_close
)

# 6. Same filter, home only
fav_4_close_home = df[
    (df["trailing_team_was_favorite"] == True)
    & (df["trailing_team_favorite_by"] >= 4)
    & (df["halftime_deficit"] <= 7)
    & (df["trailing_team_home"] == True)
]

show_result(
    "FAVORITE BY 4+, DOWN 1-7, HOME",
    fav_4_close_home
)

# 7. Same filter, away only
fav_4_close_away = df[
    (df["trailing_team_was_favorite"] == True)
    & (df["trailing_team_favorite_by"] >= 4)
    & (df["halftime_deficit"] <= 7)
    & (df["trailing_team_home"] == False)
]

show_result(
    "FAVORITE BY 4+, DOWN 1-7, AWAY",
    fav_4_close_away
)

print("\n\nCOMEBACK RATE BY HALFTIME DEFICIT")
print("--------------------------------")

def deficit_bucket(deficit):
    if deficit <= 3:
        return "1-3"
    elif deficit <= 7:
        return "4-7"
    elif deficit <= 10:
        return "8-10"
    elif deficit <= 14:
        return "11-14"
    else:
        return "15+"

df["deficit_bucket"] = df["halftime_deficit"].apply(deficit_bucket)

summary = (
    df.groupby("deficit_bucket")
    .agg(
        games=("trailing_team_won", "size"),
        wins=("trailing_team_won", "sum"),
        win_rate=("trailing_team_won", "mean"),
    )
)

summary["win_rate"] = summary["win_rate"] * 100

print(summary.round(1))


print("\n\nFAVORITES BY SPREAD STRENGTH")
print("----------------------------")

favorite_df = df[
    df["trailing_team_was_favorite"] == True
].copy()

def favorite_bucket(spread):
    if spread < 3:
        return "Fav 1-2.5"
    elif spread < 4:
        return "Fav 3-3.5"
    elif spread < 7:
        return "Fav 4-6.5"
    elif spread < 10:
        return "Fav 7-9.5"
    else:
        return "Fav 10+"

favorite_df["favorite_bucket"] = (
    favorite_df["trailing_team_favorite_by"]
    .apply(favorite_bucket)
)

fav_summary = (
    favorite_df.groupby("favorite_bucket")
    .agg(
        games=("trailing_team_won", "size"),
        wins=("trailing_team_won", "sum"),
        win_rate=("trailing_team_won", "mean"),
    )
)

fav_summary["win_rate"] = fav_summary["win_rate"] * 100

print(fav_summary.round(1))