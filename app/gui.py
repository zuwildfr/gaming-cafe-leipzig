from __future__ import annotations

import logging
import os
import shutil
import threading
import time
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk

from .analyzer import analyze
from .clipper import create_clips
from .config import DOWNLOADS_DIR, OUTPUT_DIR, TEMP_DIR, configure_logging, ensure_directories
from .downloader import download_video, validate_youtube_url
from .errors import ClipForgeError
from .transcriber import transcribe

class ClipForgeApp:
    def __init__(self) -> None:
        configure_logging()
        ensure_directories()
        self.root = tk.Tk()
        self.root.title("ClipForge")
        self.root.resizable(False, False)
        self.url = tk.StringVar()
        self.status = tk.StringVar(value="Bereit. Fügen Sie einen YouTube-Link ein.")
        self._build()

    def _build(self) -> None:
        frame = ttk.Frame(self.root, padding=20)
        frame.grid(sticky="nsew")
        ttk.Label(frame, text="ClipForge", font=("Segoe UI", 22, "bold")).grid(row=0, column=0, columnspan=2, pady=(0, 18))
        ttk.Label(frame, text="YouTube URL:").grid(row=1, column=0, sticky="w")
        self.entry = ttk.Entry(frame, textvariable=self.url, width=58)
        self.entry.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(4, 12))
        self.start_button = ttk.Button(frame, text="Video analysieren", command=self.start)
        self.start_button.grid(row=3, column=0, sticky="w")
        ttk.Button(frame, text="Ausgabeordner öffnen", command=self.open_output).grid(row=3, column=1, sticky="e")
        ttk.Label(frame, textvariable=self.status, wraplength=460).grid(row=4, column=0, columnspan=2, sticky="w", pady=(18, 6))
        self.progress = ttk.Progressbar(frame, mode="indeterminate")
        self.progress.grid(row=5, column=0, columnspan=2, sticky="ew")
        ttk.Label(frame, text="Clips:").grid(row=6, column=0, sticky="w", pady=(16, 4))
        self.clips = tk.Listbox(frame, height=6, width=65)
        self.clips.grid(row=7, column=0, columnspan=2, sticky="ew")

    def run(self) -> None:
        self.root.mainloop()

    def update_status(self, text: str) -> None:
        self.root.after(0, lambda: self.status.set(text))

    def start(self) -> None:
        try:
            url = validate_youtube_url(self.url.get())
        except ClipForgeError as exc:
            messagebox.showerror("ClipForge", str(exc))
            return
        self.start_button.configure(state="disabled")
        self.clips.delete(0, tk.END)
        self.progress.start(12)
        threading.Thread(target=self._process, args=(url,), daemon=True).start()

    def _process(self, url: str) -> None:
        try:
            job_id = time.strftime("%Y%m%d_%H%M%S")
            work_dir = TEMP_DIR / job_id
            download_dir = DOWNLOADS_DIR / job_id
            work_dir.mkdir(parents=True, exist_ok=True)
            video = download_video(url, download_dir, self.update_status)
            segments = transcribe(video, work_dir, self.update_status)
            choices = analyze(segments, self.update_status)
            destination = OUTPUT_DIR / job_id
            files = create_clips(video, choices, destination, self.update_status)
            self.root.after(0, lambda: self._show_success(files, choices))
        except ClipForgeError as exc:
            logging.exception("Expected processing error")
            self.root.after(0, lambda: messagebox.showerror("ClipForge", str(exc)))
            self.update_status("Analyse abgebrochen. Bitte prüfen Sie die Fehlermeldung.")
        except Exception:
            logging.exception("Unexpected processing error")
            self.root.after(0, lambda: messagebox.showerror("ClipForge", "Ein unerwarteter Fehler ist aufgetreten. Details stehen in logs/clipforge.log."))
            self.update_status("Analyse abgebrochen.")
        finally:
            self.root.after(0, self._finish)

    def _show_success(self, files: list[Path], choices) -> None:
        for path, choice in zip(files, choices):
            self.clips.insert(tk.END, f"✓ {path.name} — {choice.reason}")
        self.status.set(f"Fertig: {len(files)} MP4-Clips wurden erstellt.")

    def _finish(self) -> None:
        self.progress.stop()
        self.start_button.configure(state="normal")

    def open_output(self) -> None:
        ensure_directories()
        try:
            os.startfile(OUTPUT_DIR)  # type: ignore[attr-defined]
        except AttributeError:
            # Allows development checks on non-Windows systems; Windows uses os.startfile.
            import subprocess
            subprocess.Popen(["xdg-open", str(OUTPUT_DIR)])
