from __future__ import annotations

import os
import subprocess
import sys
import threading
import time
from contextlib import contextmanager
from pathlib import Path
from queue import Queue, Empty

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class DevServerError(RuntimeError):
    """Raised when the Next.js dev server fails to start."""


@contextmanager
def dev_server(port: int = 4300, ready_timeout: float = 60.0):
    """Spin up `npm run dev` on a custom port for automation tests."""

    lock_path = PROJECT_ROOT / ".next" / "dev" / "lock"
    if lock_path.exists():
        try:
            lock_path.unlink()
        except OSError:
            pass

    command = ["npm", "run", "dev", "--", "--port", str(port)]
    env = os.environ.copy()
    process = subprocess.Popen(
        command,
        cwd=PROJECT_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env,
    )

    output = Queue()

    def _pump_stdout() -> None:
        assert process.stdout is not None
        for line in process.stdout:
            output.put(line)
        output.put(None)

    pump_thread = threading.Thread(target=_pump_stdout, daemon=True)
    pump_thread.start()

    try:
        ready_line = f"http://localhost:{port}"
        saw_local = False
        start = time.time()
        buffered: list[str] = []
        while True:
            if process.poll() is not None:
                raise DevServerError("Next.js dev server exited before signaling readiness")
            try:
                line = output.get(timeout=ready_timeout)
            except Empty as error:
                raise DevServerError("Timed out waiting for Next.js dev server to start") from error
            if line is None:
                raise DevServerError("Next.js dev server stream ended unexpectedly")
            buffered.append(line)
            sys.stdout.write(line)
            sys.stdout.flush()
            if "Local:" in line and ready_line in line:
                saw_local = True
            if "✓ Ready" in line:
                if saw_local:
                    break
                continue
            if saw_local and "GET /" in line:
                break
            if time.time() - start > ready_timeout:
                raise DevServerError("Next.js dev server did not become ready in time")

        yield process
    finally:
        process.terminate()
        try:
            process.wait(timeout=15)
        except subprocess.TimeoutExpired:
            process.kill()
        pump_thread.join(timeout=5)
