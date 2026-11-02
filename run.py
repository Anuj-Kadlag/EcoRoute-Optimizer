"""
EcoRoute Application Runner
Launches both the FastAPI backend (port 8000) and the React Vite frontend (port 5173),
and opens http://127.0.0.1:5173 in the browser.
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).parent.resolve()
FRONTEND_DIR = ROOT_DIR / "frontend"

def main():
    print("=" * 65)
    print(" EcoRoute - Intelligent Waste Collection Route Optimization")
    print(" Region: Moshi, Pimpri-Chinchwad, Maharashtra, India")
    print("=" * 65)

    # Start FastAPI backend
    print("\n[1/3] Starting FastAPI Backend on http://127.0.0.1:8000...")
    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "backend.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
    ]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(ROOT_DIR),
    )

    time.sleep(2)

    # Start Vite Frontend
    print("[2/3] Starting React Vite Frontend on http://127.0.0.1:5173...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_cmd = [
        npm_cmd,
        "run",
        "dev",
        "--",
        "--port",
        "5173",
        "--host",
        "127.0.0.1",
    ]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
    )

    time.sleep(2)

    # Open Browser
    app_url = "http://127.0.0.1:5173"
    print(f"\n[3/3] Opening browser at {app_url}...")
    webbrowser.open(app_url)

    print("\n" + "=" * 65)
    print(f" EcoRoute is running!")
    print(f" Frontend:  http://127.0.0.1:5173")
    print(f" Backend:   http://127.0.0.1:8000")
    print(f" API Docs:  http://127.0.0.1:8000/docs")
    print(" Press Ctrl+C in this console to terminate both servers.")
    print("=" * 65 + "\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping EcoRoute servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("EcoRoute stopped successfully.")

if __name__ == "__main__":
    main()
