#!/usr/bin/env python3
"""Generate neural TTS clips for each card / language / voice (Piper)."""
from __future__ import annotations

from pathlib import Path
import subprocess
import urllib.request
import wave

from piper.config import SynthesisConfig
from piper.voice import PiperVoice

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / ".tools"
OUT = ROOT / "audio"
TMP = ROOT / ".tools" / "wav_tmp"
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main"

# (lang, gender) -> model files under HF + optional speaker_id
VOICES = {
    ("en", "female"): {"rel": "en/en_US/lessac/medium/en_US-lessac-medium", "speaker": None},
    ("en", "male"): {"rel": "en/en_US/ryan/medium/en_US-ryan-medium", "speaker": None},
}

SUIT_KEYS = [
    ("heart", "hearts"),
    ("diamond", "diamonds"),
    ("club", "clubs"),
    ("spade", "spades"),
]

RANKS = [
    ("1", "ace"),
    ("2", "2"),
    ("3", "3"),
    ("4", "4"),
    ("5", "5"),
    ("6", "6"),
    ("7", "7"),
    ("8", "8"),
    ("9", "9"),
    ("10", "10"),
    ("jack", "jack"),
    ("queen", "queen"),
    ("king", "king"),
]

PHRASES = {
    "en": {
        "suit": {
            "hearts": "hearts",
            "diamonds": "diamonds",
            "clubs": "clubs",
            "spades": "spades",
        },
        "rank": {
            "ace": "Ace",
            "2": "2",
            "3": "3",
            "4": "4",
            "5": "5",
            "6": "6",
            "7": "7",
            "8": "8",
            "9": "9",
            "10": "10",
            "jack": "Jack",
            "queen": "Queen",
            "king": "King",
        },
        "fmt": "{rank} of {suit}.",
    },
}


def ensure_model(rel: str) -> Path:
    stem = Path(rel).name
    onnx = TOOLS / f"{stem}.onnx"
    cfg = TOOLS / f"{stem}.onnx.json"
    if not onnx.exists():
        print("downloading", rel)
        urllib.request.urlretrieve(f"{HF}/{rel}.onnx", onnx)
    if not cfg.exists():
        urllib.request.urlretrieve(f"{HF}/{rel}.onnx.json", cfg)
    return onnx


def to_mp3(wav: Path, mp3: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(wav),
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "48k",
            "-ar",
            "22050",
            "-ac",
            "1",
            str(mp3),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def phrase(lang: str, suit_name: str, rank_name: str) -> str:
    p = PHRASES[lang]
    return p["fmt"].format(rank=p["rank"][rank_name], suit=p["suit"][suit_name])


def main() -> None:
    TOOLS.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    # Remove legacy flat clips
    for old in OUT.glob("*.mp3"):
        old.unlink()

    cache: dict[str, PiperVoice] = {}

    for (lang, gender), meta in VOICES.items():
        model_path = ensure_model(meta["rel"])
        key = str(model_path)
        if key not in cache:
            cache[key] = PiperVoice.load(str(model_path))
        voice = cache[key]
        syn = (
            SynthesisConfig(speaker_id=meta["speaker"])
            if meta["speaker"] is not None
            else None
        )

        dest = OUT / lang / gender
        dest.mkdir(parents=True, exist_ok=True)

        for suit_key, suit_name in SUIT_KEYS:
            for rank_key, rank_name in RANKS:
                text = phrase(lang, suit_name, rank_name)
                stem = f"{suit_key}_{rank_key}"
                wav = TMP / f"{lang}_{gender}_{stem}.wav"
                with wave.open(str(wav), "wb") as wf:
                    voice.synthesize_wav(text, wf, syn_config=syn)
                out = dest / f"{stem}.mp3"
                to_mp3(wav, out)
                print(f"{lang}/{gender}/{out.name}", out.stat().st_size, repr(text))

    print("done ->", OUT)


if __name__ == "__main__":
    main()
