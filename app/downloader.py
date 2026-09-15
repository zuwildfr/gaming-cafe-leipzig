from __future__ import annotations

from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .errors import ClipForgeError


def validate_youtube_url(url: str) -> str:
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower().removeprefix("www.")
    valid = (host == "youtu.be" and bool(parsed.path.strip("/"))) or (
        host in {"youtube.com", "m.youtube.com"}
        and (parsed.path in {"/watch", "/shorts/", "/live/"} or parsed.path.startswith(("/shorts/", "/live/")))
        and (bool(parse_qs(parsed.query).get("v")) or parsed.path.startswith(("/shorts/", "/live/")))
    )
    if parsed.scheme not in {"http", "https"} or not valid:
        raise ClipForgeError("Bitte geben Sie einen gültigen YouTube-Link ein.")
    return url.strip()


def download_video(url: str, target_dir: Path, progress=None) -> Path:
    try:
        import yt_dlp
    except ImportError as exc:
        raise ClipForgeError("yt-dlp ist nicht installiert. Führen Sie 'pip install -r requirements.txt' aus.") from exc

    target_dir.mkdir(parents=True, exist_ok=True)
    options = {
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl": str(target_dir / "source.%(ext)s"),
        "merge_output_format": "mp4",
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
    }
    if progress:
        options["progress_hooks"] = [lambda data: progress("Video wird heruntergeladen...") if data.get("status") == "downloading" else None]
    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.extract_info(url, download=True)
    except Exception as exc:
        raise ClipForgeError(f"Der Video-Download ist fehlgeschlagen: {exc}") from exc
    files = sorted(target_dir.glob("source.*"), key=lambda item: item.stat().st_mtime, reverse=True)
    if not files:
        raise ClipForgeError("Der Download hat keine Videodatei erzeugt.")
    return files[0]
