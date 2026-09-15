from __future__ import annotations

import logging
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DOWNLOADS_DIR = ROOT_DIR / "downloads"
TEMP_DIR = ROOT_DIR / "temp"
OUTPUT_DIR = ROOT_DIR / "output"
LOGS_DIR = ROOT_DIR / "logs"
WHISPER_MODEL = "base"
OLLAMA_MODEL = "llama3.2"
MIN_CLIP_SECONDS = 20.0
MAX_CLIP_SECONDS = 90.0
PREFERRED_MAX_CLIP_SECONDS = 60.0


def ensure_directories() -> None:
    for directory in (DOWNLOADS_DIR, TEMP_DIR, OUTPUT_DIR, LOGS_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def configure_logging() -> None:
    ensure_directories()
    logging.basicConfig(
        filename=LOGS_DIR / "clipforge.log",
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        encoding="utf-8",
    )
