#!/usr/bin/env python3
"""Generate neural TTS clips for each card (Piper). Dev/build helper only."""
from pathlib import Path
import subprocess
import wave

from piper.voice import PiperVoice

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / ".tools" / "en_US-lessac-medium.onnx"
OUT = ROOT / "audio"
TMP = ROOT / ".tools" / "wav_tmp"

SUITS = ["hearts", "diamonds", "clubs", "spades"]
RANKS = [
    ("1", "Ace"),
    ("2", "2"),
    ("3", "3"),
    ("4", "4"),
    ("5", "5"),
    ("6", "6"),
    ("7", "7"),
    ("8", "8"),
    ("9", "9"),
    ("10", "10"),
    ("jack", "Jack"),
    ("queen", "Queen"),
    ("king", "King"),
]

SUIT_KEYS = {"hearts": "heart", "diamonds": "diamond", "clubs": "club", "spades": "spade"}


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


def to_m4a(wav: Path, m4a: Path) -> None:
    subprocess.run(
        ["afconvert", "-f", "m4af", "-d", "aac", "-b", "48000", str(wav), str(m4a)],
        check=True,
    )


def main() -> None:
    if not MODEL.exists():
        raise SystemExit(f"Missing model: {MODEL}")

    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)

    voice = PiperVoice.load(str(MODEL))
    use_ffmpeg = subprocess.run(["which", "ffmpeg"], capture_output=True).returncode == 0

    for suit in SUITS:
        for rank_key, rank_word in RANKS:
            text = f"{rank_word} of {suit}."
            stem = f"{SUIT_KEYS[suit]}_{rank_key}"
            wav = TMP / f"{stem}.wav"
            with wave.open(str(wav), "wb") as wf:
                voice.synthesize_wav(text, wf)

            if use_ffmpeg:
                out = OUT / f"{stem}.mp3"
                to_mp3(wav, out)
            else:
                out = OUT / f"{stem}.m4a"
                to_m4a(wav, out)
            print(out.name, out.stat().st_size)

    print("done ->", OUT)


if __name__ == "__main__":
    main()
