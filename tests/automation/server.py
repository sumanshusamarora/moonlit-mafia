from __future__ import annotations

import os
import signal
import socket
import subprocess
import sys
import threading
import time
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from queue import Queue, Empty

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class DevServerError(RuntimeError):
    """Raised when the Next.js dev server fails to start."""


@dataclass(frozen=True)
class DevServerHandle:
    process: subprocess.Popen
    port: int

    @property
    def base_url(self) -> str:
        return f"http://localhost:{self.port}"


def _is_port_available(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(("127.0.0.1", port))
        except OSError:
            return False
        return True


def _pick_port(preferred_port: int, max_tries: int = 25) -> int:
    if preferred_port <= 0:
        raise ValueError("preferred_port must be a positive integer")
    for candidate in range(preferred_port, preferred_port + max_tries):
        if _is_port_available(candidate):
            return candidate
    raise DevServerError(
        f"Unable to find a free port in range {preferred_port}-{preferred_port + max_tries - 1}"
    )


@contextmanager
def dev_server(port: int = 4300, ready_timeout: float = 60.0):
    """Spin up `npm run dev` on a custom port for automation tests."""

    lock_path = PROJECT_ROOT / ".next" / "dev" / "lock"
    if lock_path.exists():
        try:
            lock_path.unlink()
        except OSError:
            pass

    selected_port = _pick_port(port)
    command = ["npm", "run", "dev", "--", "--port", str(selected_port)]
    env = os.environ.copy()
    process = subprocess.Popen(
        command,
        cwd=PROJECT_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env,
        start_new_session=True,
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
        ready_line = f"http://localhost:{selected_port}"
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

        yield DevServerHandle(process=process, port=selected_port)
    finally:
        try:
            if process.poll() is None:
                try:
                    os.killpg(process.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
            try:
                process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
        finally:
            pump_thread.join(timeout=5)
