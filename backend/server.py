"""
Obsidian 日记同步后端 — 打卡应用与 Obsidian Vault 之间的桥梁
"""
import os
import re
import yaml
import base64
import shutil
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel
import markdown

# ===== 配置 =====
OBSIDIAN_DIARY_DIR = Path(r"D:\电脑默认缓存\文档\Obsidian Vault\TODAY\日记")
ASSETS_DIR_NAME = "assets"

app = FastAPI(title="Obsidian Diary Sync")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== 模型 =====
class DiarySave(BaseModel):
    tasks: str = ""
    content: str = ""  # HTML content


# ===== 工具 =====
def get_diary_path(date: str) -> Path:
    return OBSIDIAN_DIARY_DIR / f"{date}.md"


def get_assets_dir(date: str) -> Path:
    p = OBSIDIAN_DIARY_DIR / ASSETS_DIR_NAME / date
    p.mkdir(parents=True, exist_ok=True)
    return p


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """解析 YAML frontmatter，返回 (frontmatter_dict, body_text)"""
    if not text.startswith("---"):
        return {}, text
    end = text.find("---", 3)
    if end == -1:
        return {}, text
    try:
        fm = yaml.safe_load(text[3:end]) or {}
    except yaml.YAMLError:
        fm = {}
    body = text[end + 3:].strip()
    return fm, body


def generate_frontmatter(tasks: str) -> str:
    fm = {"updated": datetime.now().isoformat()}
    if tasks.strip():
        fm["tasks"] = tasks.strip()
    return "---\n" + yaml.dump(fm, allow_unicode=True, sort_keys=False) + "---\n\n"


# 匹配 <img src="data:image/...;base64,..." ... />
IMG_DATA_RE = re.compile(
    r'<img\s[^>]*src="(data:image/(png|jpeg|jpg|gif|webp);base64,([^"]+))"[^>]*/?>',
    re.IGNORECASE
)


def extract_and_save_images(html: str, date: str) -> str:
    """从 HTML 中提取 base64 图片 → 保存为文件 → 替换 src 为相对路径"""
    assets_dir = get_assets_dir(date)
    img_count = [0]

    def replacer(match):
        full_src = match.group(1)
        ext = match.group(2) or "png"
        if ext == "jpeg":
            ext = "jpg"
        b64data = match.group(3)
        try:
            img_data = base64.b64decode(b64data)
        except Exception:
            return match.group(0)  # 解码失败则保留原样

        ts = datetime.now().strftime("%H%M%S")
        filename = f"img_{ts}_{img_count[0]}.{ext}"
        img_count[0] += 1

        img_path = assets_dir / filename
        img_path.write_bytes(img_data)

        # 替换为相对路径，Obsidian 中可显示
        rel_path = f"{ASSETS_DIR_NAME}/{date}/{filename}"
        return match.group(0).replace(full_src, rel_path)

    return IMG_DATA_RE.sub(replacer, html)


def body_to_html(body: str, date: str) -> str:
    """将 .md 正文转为 HTML（用于编辑器显示）"""
    # 如果正文是 HTML（旧格式兼容），直接返回
    if body.strip().startswith("<"):
        html = body
    else:
        html = markdown.markdown(body, extensions=["extra", "nl2br"])

    # 转换图片路径：assets/date/filename → /api/images/date/filename
    api_prefix = f"/api/images/{date}/"
    html = html.replace(f'src="{ASSETS_DIR_NAME}/{date}/', f'src="{api_prefix}')
    html = html.replace(f"src='{ASSETS_DIR_NAME}/{date}/", f"src='{api_prefix}")

    return html


def read_diary(date: str) -> dict | None:
    path = get_diary_path(date)
    if not path.exists():
        return None

    raw = path.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(raw)

    tasks = fm.get("tasks", "") or ""

    return {
        "date": date,
        "tasks": tasks,
        "content": body,
        "contentHtml": body_to_html(body, date),
        "exists": True
    }


def normalize_image_paths(html: str, date: str) -> str:
    """统一处理图片路径：
    1. base64 图片 → 保存文件 → 替换为相对路径
    2. /api/images/date/xxx → 替换为相对路径（防止 API 路径写入 .md）
    """
    # Step 1: 提取 base64 图片
    html = extract_and_save_images(html, date)

    # Step 2: 将 API 路径改回相对路径
    api_prefix = f"/api/images/{date}/"
    rel_path = f"{ASSETS_DIR_NAME}/{date}/"
    html = html.replace(f'src="{api_prefix}', f'src="{rel_path}')
    html = html.replace(f"src='{api_prefix}", f"src='{rel_path}")

    return html


def write_diary(date: str, tasks: str, html_content: str) -> dict:
    path = get_diary_path(date)

    # 处理图片路径 → 提取 base64 + 恢复相对路径
    body = normalize_image_paths(html_content, date)

    fm_text = generate_frontmatter(tasks)
    path.write_text(fm_text + body, encoding="utf-8")

    return {"success": True, "date": date}


# ===== API =====

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "diary_dir": str(OBSIDIAN_DIARY_DIR),
        "diary_dir_exists": OBSIDIAN_DIARY_DIR.exists()
    }


@app.get("/api/diary/{date}")
def api_get_diary(date: str):
    result = read_diary(date)
    if result is None:
        return {"date": date, "tasks": "", "content": "", "contentHtml": "", "exists": False}
    return result


@app.post("/api/diary/{date}")
def api_save_diary(date: str, data: DiarySave):
    if not data.content.strip() and not data.tasks.strip():
        # 空日记：删除文件
        path = get_diary_path(date)
        if path.exists():
            path.unlink()
        return {"success": True, "date": date, "deleted": True}
    write_diary(date, data.tasks, data.content)
    return {"success": True, "date": date}


@app.delete("/api/diary/{date}")
def api_delete_diary(date: str):
    path = get_diary_path(date)
    if path.exists():
        path.unlink()
    assets_dir = get_assets_dir(date)
    if assets_dir.exists():
        shutil.rmtree(assets_dir, ignore_errors=True)
    return {"success": True}


@app.get("/api/diary/month/{year_month}")
def api_list_month(year_month: str):
    dates = []
    if OBSIDIAN_DIARY_DIR.exists():
        for f in OBSIDIAN_DIARY_DIR.glob(f"{year_month}-*.md"):
            dates.append({"date": f.stem})
    return {"dates": sorted(dates, key=lambda d: d["date"])}


@app.post("/api/images/{date}")
async def api_upload_image(date: str, file: UploadFile = File(...)):
    content = await file.read()
    ts = datetime.now().strftime("%H%M%S%f")
    safe_name = file.filename or "paste.png"
    filename = f"img_{ts}_{safe_name}"
    img_path = get_assets_dir(date) / filename
    img_path.write_bytes(content)
    return {"filename": filename, "url": f"/api/images/{date}/{filename}"}


@app.get("/api/images/{date}/{filename}")
def api_get_image(date: str, filename: str):
    # 安全检查防止路径穿越
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    img_path = get_assets_dir(date) / filename
    if not img_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(img_path)


# ===== 启动 =====
if __name__ == "__main__":
    import uvicorn
    print(f"Obsidian Diary Dir: {OBSIDIAN_DIARY_DIR}")
    print(f"Dir exists: {OBSIDIAN_DIARY_DIR.exists()}")
    uvicorn.run(app, host="127.0.0.1", port=8765)
