from __future__ import annotations

import json
import re
from dataclasses import dataclass
from urllib.error import URLError
from urllib.request import Request, urlopen

from .config import MAX_CLIP_SECONDS, MIN_CLIP_SECONDS, OLLAMA_MODEL
from .errors import ClipForgeError
from .transcriber import TranscriptSegment

OLLAMA_URL = "http://127.0.0.1:11434"

@dataclass(frozen=True)
class ClipSelection:
    start: float
    end: float
    reason: str
    score: int


def _request(path: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(OLLAMA_URL + path, data=data, headers={"Content-Type": "application/json"})
    try:
        with urlopen(request, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise ClipForgeError("Ollama ist nicht erreichbar. Starten Sie Ollama und prüfen Sie die Installation.") from exc


def check_ollama(model: str = OLLAMA_MODEL) -> None:
    data = _request("/api/tags")
    names = {entry.get("name", "") for entry in data.get("models", [])}
    if model not in names and not any(name.split(":")[0] == model for name in names):
        raise ClipForgeError(f"Das Ollama-Modell '{model}' fehlt. Führen Sie 'ollama pull {model}' aus.")


def _prompt(segments: list[TranscriptSegment]) -> str:
    transcript = "\n".join(f"[{s.start:.2f}-{s.end:.2f}] {s.text}" for s in segments)
    return f'''Wähle die 3 bis 5 besten, nicht überlappenden Video-Shorts aus diesem Transkript. Bewerte Überraschung, Humor, Spannung, starke Meinung, Geschichte, Aha-Moment und eigenständige Verständlichkeit. Wähle nicht einfach die ersten Stellen. Jeder Clip muss zwischen 20 und 90 Sekunden lang sein und an Segmentgrenzen beginnen und enden. Antworte AUSSCHLIESSLICH mit einem JSON-Array. Jedes Objekt hat genau start (Zahl), end (Zahl), reason (kurzer String), score (Ganzzahl 1-10).\n\nTRANSKRIPT:\n{transcript}'''


def _parse_response(text: str, segments: list[TranscriptSegment]) -> list[ClipSelection]:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE)
    try:
        raw = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ClipForgeError("Das lokale KI-Modell hat keine gültige JSON-Antwort geliefert.") from exc
    if not isinstance(raw, list) or not 3 <= len(raw) <= 5:
        raise ClipForgeError("Das lokale KI-Modell muss genau 3 bis 5 Clips liefern.")
    selections: list[ClipSelection] = []
    for item in raw:
        if not isinstance(item, dict) or set(item) != {"start", "end", "reason", "score"}:
            raise ClipForgeError("Die KI-Antwort hat ein ungültiges Clip-Format.")
        if isinstance(item["start"], bool) or isinstance(item["end"], bool) or not isinstance(item["start"], (int, float)) or not isinstance(item["end"], (int, float)):
            raise ClipForgeError("Die KI-Antwort enthält ungültige Zeitstempel.")
        start = min(segments, key=lambda s: abs(s.start - float(item["start"]))).start
        end = min(segments, key=lambda s: abs(s.end - float(item["end"]))).end
        if not MIN_CLIP_SECONDS <= end - start <= MAX_CLIP_SECONDS:
            raise ClipForgeError("Die KI-Antwort enthält einen Clip außerhalb der erlaubten Länge.")
        if not isinstance(item["reason"], str) or not item["reason"].strip() or not isinstance(item["score"], int) or not 1 <= item["score"] <= 10:
            raise ClipForgeError("Die KI-Antwort enthält ungültige Bewertungen.")
        selections.append(ClipSelection(start, end, item["reason"].strip(), item["score"]))
    ordered = sorted(selections, key=lambda clip: clip.start)
    if any(right.start < left.end for left, right in zip(ordered, ordered[1:])):
        raise ClipForgeError("Die KI-Antwort enthält überlappende Clips.")
    return ordered


def analyze(segments: list[TranscriptSegment], progress=None) -> list[ClipSelection]:
    check_ollama()
    if progress: progress("Lokales KI-Modell wählt interessante Stellen aus...")
    data = _request("/api/generate", {"model": OLLAMA_MODEL, "prompt": _prompt(segments), "stream": False, "format": "json"})
    response = data.get("response")
    if not isinstance(response, str):
        raise ClipForgeError("Ollama hat keine verwertbare Antwort geliefert.")
    return _parse_response(response, segments)
