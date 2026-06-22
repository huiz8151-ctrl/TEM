from pathlib import Path


ROOT = Path(__file__).resolve().parent
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
APP = (ROOT / "app.js").read_text(encoding="utf-8")
API = (ROOT / "api.js").read_text(encoding="utf-8")
CSS = (ROOT / "styles.css").read_text(encoding="utf-8")


REQUIRED_TEXT = [
    "音乐宠物",
    "拍照推荐",
    "搜索歌曲 / 歌手 / 歌单",
    "场景选择",
    "AI分析中",
    "歌曲推荐",
    "为你推荐",
    "在线听",
    "音乐日记",
    "我的在听档案",
    "我的专属陪伴",
    "任务",
]

REQUIRED_ROUTES = [
    "home",
    "camera",
    "scene",
    "analyzing",
    "recommendations",
    "for-you",
    "player",
    "diary-new",
    "diary-list",
    "diary-detail",
    "profile",
    "pet",
    "pet-actions",
    "tasks",
    "video",
]

REQUIRED_API = [
    "apiConfig",
    "getHome",
    "getScenes",
    "analyzeScene",
    "analyzeCameraPhoto",
    "getRecommendations",
    "getForYou",
    "getPlayer",
    "getDiaries",
    "getDiaryDetail",
    "saveDiary",
    "getProfile",
    "getPet",
    "getTasks",
    "completeTask",
]


def assert_contains(name, text, values):
    missing = [value for value in values if value not in text]
    if missing:
        raise AssertionError(f"{name} missing: {', '.join(missing)}")


def main():
    assert_contains("index", INDEX, ["./styles.css", "./app.js", "zh-CN"])
    assert_contains("app routes", APP, REQUIRED_ROUTES)
    assert_contains("app text", APP + API, REQUIRED_TEXT)
    assert_contains("api exports", API, REQUIRED_API)
    assert_contains(
        "css",
        CSS,
        [".phone.figma-home", ".figma-home-frame", ".figma-bottom-nav", "Noto Sans SC"],
    )
    print("smoke ok")


if __name__ == "__main__":
    main()
