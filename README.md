# ClipForge V0.1

ClipForge ist eine **lokale Windows-Anwendung**, die aus einem YouTube-Link ein zeitgestempeltes Transkript erstellt, mit einem lokalen Ollama-Modell interessante Stellen auswählt und daraus 3–5 MP4-Clips erzeugt. Es verwendet keine API-Keys und keine kostenpflichtigen Dienste.

> **Rechtlicher Hinweis:** Sie sind selbst dafür verantwortlich, ob Sie ein Video herunterladen, bearbeiten oder veröffentlichen dürfen. Verwenden Sie ClipForge nur für Inhalte, für die Sie die erforderlichen Rechte haben. ClipForge ist nicht zum Umgehen von DRM oder Zugriffsbeschränkungen vorgesehen.

## Voraussetzungen (Windows 11)

### 1. Python installieren

Installieren Sie Python 3 von [python.org](https://www.python.org/downloads/windows/). Aktivieren Sie beim Installer unbedingt **Add Python to PATH**. Öffnen Sie danach PowerShell und prüfen Sie:

```powershell
python --version
```

### 2. FFmpeg installieren

Installieren Sie eine Windows-Version von FFmpeg und fügen Sie deren `bin`-Ordner zur Windows-Umgebungsvariable `PATH` hinzu. Starten Sie PowerShell danach neu und prüfen Sie:

```powershell
ffmpeg -version
```

### 3. Ollama installieren und Modell laden

Installieren Sie Ollama für Windows von [ollama.com](https://ollama.com/download). Anschließend in PowerShell:

```powershell
ollama --version
ollama pull llama3.2
```

Ollama muss beim Start einer Analyse laufen. Die Windows-App startet den Dienst üblicherweise automatisch; andernfalls verwenden Sie `ollama serve` in einem separaten PowerShell-Fenster.

## So startest du ClipForge

1. PowerShell öffnen und zum Projektordner wechseln:

```powershell
cd C:\Pfad\zu\gaming-cafe-leipzig
```

2. Optional, aber empfohlen: virtuelle Umgebung anlegen und aktivieren:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Python-Abhängigkeiten installieren:

```powershell
pip install -r requirements.txt
```

4. Anwendung starten:

```powershell
python main.py
```

5. Einen vollständigen YouTube-Link einfügen und **Video analysieren** klicken. Nach dem Download erstellt ClipForge ein Transkript mit Zeitstempeln, fragt das lokale Modell `llama3.2` und exportiert drei bis fünf Clips.

## Dateien und Fehler

- Fertige Clips liegen je Analyse in `output\YYYYMMDD_HHMMSS\clip_01.mp4` usw.
- Downloads liegen getrennt in `downloads\`.
- Arbeitsdateien einschließlich `transcript.txt` liegen in `temp\`.
- Bei Problemen finden Sie technische Details in `logs\clipforge.log`; die Anwendung zeigt zusätzlich kurze verständliche Meldungen an.

Das Whisper-Modell `base` wird beim ersten Start der Transkription heruntergeladen. Danach kann die Analyse lokal erfolgen; nur der Abruf eines YouTube-Videos benötigt Internet.
