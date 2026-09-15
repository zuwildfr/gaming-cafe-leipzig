from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from .analyzer import ClipSelection
from .errors import ClipForgeError


def check_ffmpeg() -> None:
    if not shutil.which("ffmpeg"):
        raise ClipForgeError("FFmpeg wurde nicht gefunden. Installieren Sie FFmpeg und fügen Sie es zum PATH hinzu.")


def create_clips(video_path: Path, clips: list[ClipSelection], output_dir: Path, progress=None) -> list[Path]:
    check_ffmpeg()
    output_dir.mkdir(parents=True, exist_ok=True)
    produced: list[Path] = []
    for index, clip in enumerate(clips, start=1):
        destination = output_dir / f"clip_{index:02d}.mp4"
        if progress: progress(f"Clip {index} von {len(clips)} wird exportiert...")
        command = ["ffmpeg", "-y", "-ss", str(clip.start), "-to", str(clip.end), "-i", str(video_path), "-map", "0:v:0", "-map", "0:a:0?", "-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart", str(destination)]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0 or not destination.exists() or destination.stat().st_size == 0:
            raise ClipForgeError(f"FFmpeg konnte Clip {index} nicht erzeugen. Details stehen in logs/clipforge.log.")
        produced.append(destination)
    return produced
