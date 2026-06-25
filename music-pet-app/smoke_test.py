from pathlib import Path


ROOT = Path(__file__).resolve().parent
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
APP = (ROOT / "app.js").read_text(encoding="utf-8")
CSS = (ROOT / "styles.css").read_text(encoding="utf-8")


def assert_contains(name, text, values):
    missing = [value for value in values if value not in text]
    if missing:
        raise AssertionError(f"{name} missing: {', '.join(missing)}")


def main():
    assert_contains(
        "index",
        INDEX,
        [
            "Weekendgo App Simulator",
            "device-controls",
            "iphone-shell",
            "./styles.css",
            "./app.js",
        ],
    )
    assert_contains(
        "app",
        APP,
        [
            'iphone16: { name: "iPhone 16", width: 393, height: 852',
            'iphone16pro: { name: "iPhone 16 Pro", width: 402, height: 874',
            "MUSIC_GROWTH_MODES",
            "renderMusicGrowthPanel",
            "requestGrowthRecommendation",
            "renderPhotoResult",
            "data-listen-song",
            "data-equip-kind",
            "融合用户库",
            "运动提神",
            "开心转圈",
            "音乐养成状态",
            "ai-scene-section",
            "ai-scene-track",
            "ai-mini-player",
            "音乐宠物",
            "拍照推荐",
            "场景选择",
            "晴天",
            "律动",
        ],
    )
    assert_contains(
        "css",
        CSS,
        [
            "--screen-w: 393px",
            "--screen-h: 852px",
            "--screen-r: 47px",
            ".iphone-body",
            ".app-container",
            ".ai-work-frame",
            ".music-growth-card",
            ".growth-modes",
            ".beat-bounce",
            ".photo-result-page",
            ".pr-songs",
            ".ai-scene-section",
            ".ai-scene-track",
            ".ai-photo-cta",
            ".ai-mini-player",
            ".ai-bottom-nav",
            ".ai-playlists",
        ],
    )
    assert_contains(
        "server",
        (ROOT / "dev-server.mjs").read_text(encoding="utf-8"),
        [
            "/api/music-pet/recommendation",
            "/api/music-pet/state",
            "/api/music-pet/equip",
            "/api/music-pet/listening-events",
            "createMusicPetRecommendation",
            "sendJson",
            "userProfile",
        ],
    )
    assert_contains(
        "sqlite",
        (ROOT / "server" / "sqlite_bridge.py").read_text(encoding="utf-8"),
        [
            "CREATE TABLE IF NOT EXISTS users",
            "CREATE TABLE IF NOT EXISTS songs",
            "CREATE TABLE IF NOT EXISTS song_features",
            "CREATE TABLE IF NOT EXISTS listening_events",
            "CREATE TABLE IF NOT EXISTS recommendation_records",
        ],
    )
    print("smoke ok")


if __name__ == "__main__":
    main()
