import json
import sqlite3
import sys
from pathlib import Path


def connect(db_path):
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_schema(conn):
    conn.executescript(
        """
        PRAGMA journal_mode=WAL;

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          profile_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS pets (
          user_id TEXT PRIMARY KEY,
          energy INTEGER NOT NULL,
          intimacy INTEGER NOT NULL,
          growth INTEGER NOT NULL,
          shards INTEGER NOT NULL,
          mood TEXT NOT NULL,
          equipped_outfit TEXT NOT NULL,
          equipped_action TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS pet_inventory (
          user_id TEXT NOT NULL,
          kind TEXT NOT NULL,
          item_id TEXT NOT NULL,
          name TEXT NOT NULL,
          asset TEXT NOT NULL,
          unlocked INTEGER NOT NULL,
          requirement TEXT,
          PRIMARY KEY(user_id, kind, item_id),
          FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS listening_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          song_id TEXT NOT NULL,
          title TEXT NOT NULL,
          artist TEXT NOT NULL,
          action TEXT NOT NULL,
          scene_id TEXT,
          played_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_listening_user_time
          ON listening_events(user_id, played_at DESC);

        CREATE TABLE IF NOT EXISTS recommendation_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          trace_id TEXT NOT NULL,
          scene_id TEXT,
          frontend_mode TEXT,
          top_song_id TEXT,
          pet_mood TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_recommendation_user_time
          ON recommendation_records(user_id, created_at DESC);

        CREATE TABLE IF NOT EXISTS songs (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          artist TEXT NOT NULL,
          album TEXT,
          cover_url TEXT,
          preview_url TEXT,
          platform TEXT,
          platform_song_id TEXT,
          copyright TEXT,
          tags_json TEXT NOT NULL,
          scenes_json TEXT NOT NULL,
          moods_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS song_features (
          song_id TEXT PRIMARY KEY,
          bpm REAL NOT NULL,
          energy REAL NOT NULL,
          valence REAL NOT NULL,
          FOREIGN KEY(song_id) REFERENCES songs(id)
        );
        """
    )


def seed(conn, state):
    user = state["users"]["demo"]
    conn.execute(
        "INSERT OR IGNORE INTO users (id, name, profile_json) VALUES (?, ?, ?)",
        (user["id"], user["name"], json.dumps(user["profile"], ensure_ascii=False)),
    )
    conn.execute(
        """
        INSERT OR IGNORE INTO pets
        (user_id, energy, intimacy, growth, shards, mood, equipped_outfit, equipped_action)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user["id"],
            user["pet"]["energy"],
            user["pet"]["intimacy"],
            user["pet"]["growth"],
            user["pet"]["shards"],
            user["pet"]["mood"],
            user["pet"]["equippedOutfit"],
            user["pet"]["equippedAction"],
        ),
    )
    for kind, items in (("outfit", user["inventory"]["outfits"]), ("action", user["inventory"]["actions"])):
        for item_id, item in items.items():
            conn.execute(
                """
                INSERT OR IGNORE INTO pet_inventory
                (user_id, kind, item_id, name, asset, unlocked, requirement)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["id"],
                    kind,
                    item_id,
                    item["name"],
                    item["asset"],
                    1 if item.get("unlocked") else 0,
                    item.get("requirement", ""),
                ),
            )
    existing = conn.execute(
        "SELECT COUNT(*) AS count FROM listening_events WHERE user_id = ?",
        (user["id"],),
    ).fetchone()["count"]
    if not existing:
        for event in user["listeningHistory"]:
            conn.execute(
                """
                INSERT INTO listening_events
                (user_id, song_id, title, artist, action, scene_id, played_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["id"],
                    event["songId"],
                    event["title"],
                    event["artist"],
                    event["action"],
                    event.get("sceneId", ""),
                    event["playedAt"],
                ),
            )
    song_existing = conn.execute("SELECT COUNT(*) AS count FROM songs").fetchone()["count"]
    if not song_existing:
        for song in state.get("songCatalog", []):
            conn.execute(
                """
                INSERT OR REPLACE INTO songs
                (id, title, artist, album, cover_url, preview_url, platform, platform_song_id, copyright, tags_json, scenes_json, moods_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    song["id"],
                    song["title"],
                    song["artist"],
                    song.get("album", ""),
                    song.get("coverUrl", ""),
                    song.get("previewUrl", ""),
                    song.get("platform", "local-demo"),
                    song.get("platformSongId", song["id"]),
                    song.get("copyright", "demo-safe"),
                    json.dumps(song.get("tags", []), ensure_ascii=False),
                    json.dumps(song.get("scenes", []), ensure_ascii=False),
                    json.dumps(song.get("moods", []), ensure_ascii=False),
                ),
            )
            conn.execute(
                """
                INSERT OR REPLACE INTO song_features
                (song_id, bpm, energy, valence)
                VALUES (?, ?, ?, ?)
                """,
                (
                    song["id"],
                    song.get("bpm", 90),
                    song.get("energy", 50),
                    song.get("valence", 50),
                ),
            )


def read_user(conn, user_id):
    user_row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    pet_row = conn.execute("SELECT * FROM pets WHERE user_id = ?", (user_id,)).fetchone()
    inventory_rows = conn.execute(
        "SELECT * FROM pet_inventory WHERE user_id = ? ORDER BY kind, item_id",
        (user_id,),
    ).fetchall()
    history_rows = conn.execute(
        """
        SELECT song_id, title, artist, action, scene_id, played_at
        FROM listening_events
        WHERE user_id = ?
        ORDER BY played_at DESC, id DESC
        LIMIT 100
        """,
        (user_id,),
    ).fetchall()
    record_rows = conn.execute(
        """
        SELECT trace_id, scene_id, frontend_mode, top_song_id, pet_mood, created_at
        FROM recommendation_records
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 30
        """,
        (user_id,),
    ).fetchall()

    inventory = {"outfits": {}, "actions": {}}
    for row in inventory_rows:
        bucket = "outfits" if row["kind"] == "outfit" else "actions"
        inventory[bucket][row["item_id"]] = {
            "unlocked": bool(row["unlocked"]),
            "name": row["name"],
            "asset": row["asset"],
            "requirement": row["requirement"] or "",
        }

    return {
        "id": user_row["id"],
        "name": user_row["name"],
        "profile": json.loads(user_row["profile_json"]),
        "pet": {
            "energy": pet_row["energy"],
            "intimacy": pet_row["intimacy"],
            "growth": pet_row["growth"],
            "shards": pet_row["shards"],
            "mood": pet_row["mood"],
            "equippedOutfit": pet_row["equipped_outfit"],
            "equippedAction": pet_row["equipped_action"],
        },
        "inventory": inventory,
        "listeningHistory": [
            {
                "songId": row["song_id"],
                "title": row["title"],
                "artist": row["artist"],
                "action": row["action"],
                "sceneId": row["scene_id"],
                "playedAt": row["played_at"],
            }
            for row in history_rows
        ],
        "recommendationRecords": [
            {
                "traceId": row["trace_id"],
                "sceneId": row["scene_id"],
                "frontendMode": row["frontend_mode"],
                "topSongId": row["top_song_id"],
                "petMood": row["pet_mood"],
                "createdAt": row["created_at"],
            }
            for row in record_rows
        ],
    }


def update_pet(conn, user_id, pet):
    conn.execute(
        """
        UPDATE pets
        SET energy = ?, intimacy = ?, growth = ?, shards = ?, mood = ?
        WHERE user_id = ?
        """,
        (pet["energy"], pet["intimacy"], pet["growth"], pet["shards"], pet["mood"], user_id),
    )


def unlock_items(conn, user_id, item_ids):
    for kind, item_id in item_ids:
        conn.execute(
            "UPDATE pet_inventory SET unlocked = 1 WHERE user_id = ? AND kind = ? AND item_id = ?",
            (user_id, kind, item_id),
        )


def equip_item(conn, user_id, kind, item_id):
    row = conn.execute(
        "SELECT * FROM pet_inventory WHERE user_id = ? AND kind = ? AND item_id = ?",
        (user_id, kind, item_id),
    ).fetchone()
    if not row or not row["unlocked"]:
        raise ValueError("Item is locked or missing")
    field = "equipped_action" if kind == "action" else "equipped_outfit"
    conn.execute(f"UPDATE pets SET {field} = ? WHERE user_id = ?", (item_id, user_id))


def insert_listening(conn, user_id, event):
    conn.execute(
        """
        INSERT INTO listening_events
        (user_id, song_id, title, artist, action, scene_id, played_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            event["songId"],
            event["title"],
            event["artist"],
            event["action"],
            event.get("sceneId", ""),
            event["playedAt"],
        ),
    )


def insert_recommendation(conn, user_id, record):
    conn.execute(
        """
        INSERT INTO recommendation_records
        (user_id, trace_id, scene_id, frontend_mode, top_song_id, pet_mood, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            record["traceId"],
            record.get("sceneId", ""),
            record.get("frontendMode", ""),
            record.get("topSongId", ""),
            record.get("petMood", ""),
            record["createdAt"],
        ),
    )


def list_songs(conn):
    rows = conn.execute(
        """
        SELECT s.*, f.bpm, f.energy, f.valence
        FROM songs s
        JOIN song_features f ON f.song_id = s.id
        ORDER BY s.id
        """
    ).fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "artist": row["artist"],
            "album": row["album"],
            "coverUrl": row["cover_url"],
            "previewUrl": row["preview_url"],
            "platform": row["platform"],
            "platformSongId": row["platform_song_id"],
            "copyright": row["copyright"],
            "tags": json.loads(row["tags_json"]),
            "scenes": json.loads(row["scenes_json"]),
            "moods": json.loads(row["moods_json"]),
            "bpm": row["bpm"],
            "energy": row["energy"],
            "valence": row["valence"],
        }
        for row in rows
    ]


def main():
    command = json.loads(sys.stdin.read())
    conn = connect(command["dbPath"])
    try:
        init_schema(conn)
        seed(conn, command["defaultState"])
        action = command["action"]
        user_id = command.get("userId", "demo")
        payload = command.get("payload") or {}

        if action == "getUser":
            result = read_user(conn, user_id)
        elif action == "updatePet":
            update_pet(conn, user_id, payload["pet"])
            unlock_items(conn, user_id, payload.get("unlock", []))
            result = read_user(conn, user_id)
        elif action == "insertListening":
            insert_listening(conn, user_id, payload)
            result = read_user(conn, user_id)["listeningHistory"][0]
        elif action == "insertRecommendation":
            insert_recommendation(conn, user_id, payload)
            result = read_user(conn, user_id)
        elif action == "equip":
            equip_item(conn, user_id, payload["kind"], payload["id"])
            result = read_user(conn, user_id)
        elif action == "listSongs":
            result = list_songs(conn)
        else:
            raise ValueError(f"Unknown action: {action}")

        conn.commit()
        print(json.dumps({"ok": True, "result": result}, ensure_ascii=False))
    except Exception as exc:
        conn.rollback()
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
