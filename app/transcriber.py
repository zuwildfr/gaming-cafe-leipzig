from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .config import WHISPER_MODEL
from .errors import ClipForgeError

@dataclass(frozen=True)
class TranscriptSegment:
    start: float
    end: float
    text: str


def format_timestamp(seconds: float) -> str:
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(int(minutes), 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:04.1f}"


def write_transcript(segments: list[TranscriptSegment], destination: Path) -> None:
    destination.write_text("\n\n".join(
        f"[{format_timestamp(item.start)} - {format_timestamp(item.end)}]\n{item.text}" for item in segments
    ), encoding="utf-8")


def transcribe(video_path: Path, work_dir: Path, progress=None) -> list[TranscriptSegment]:
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise ClipForgeError("faster-whisper ist nicht installiert. Führen Sie 'pip install -r requirements.txt' aus.") from exc
    try:
        if progress: progress("Whisper-Modell wird geladen (CPU)...")
        model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
        raw_segments, _ = model.transcribe(str(video_path), vad_filter=True)
        segments = [TranscriptSegment(round(s.start, 2), round(s.end, 2), s.text.strip()) for s in raw_segments if s.text.strip()]
    except Exception as exc:
        raise ClipForgeError(f"Die Transkription ist fehlgeschlagen: {exc}") from exc
    if not segments:
        raise ClipForgeError("Das Video enthält keine verwertbare Audiospur.")
    write_transcript(segments, work_dir / "transcript.txt")
    return segments
