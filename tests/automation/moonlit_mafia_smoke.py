#!/usr/bin/env python3
"""Automated UI smoke test for Moonlit Mafia."""

from __future__ import annotations

import argparse
import os
import sys
from contextlib import nullcontext
from dataclasses import dataclass
from typing import List

from playwright.sync_api import (
    Browser,
    BrowserContext,
    ConsoleMessage,
    Page,
    TimeoutError as PlaywrightTimeoutError,
    expect,
    sync_playwright,
)


def attach_logging(page: Page, label: str) -> None:
    def _log_console(message: ConsoleMessage) -> None:
        location = message.location
        prefix = f"[{label}][console:{message.type}]"
        if location and location.get("url"):
            prefix += f" ({location['url']}:{location.get('lineNumber', '?')})"
        try:
            text = message.text()
        except Exception:  # pragma: no cover - defensive
            parts = []
            for arg in message.args:
                try:
                    value = arg.json_value()
                except Exception:  # pragma: no cover - best effort logging
                    value = "<unavailable>"
                parts.append(repr(value))
            text = " ".join(parts) if parts else "<unable to decode console message>"
        print(f"{prefix} {text}")

    def _log_error(error: Exception) -> None:
        print(f"[{label}][error] {error}")

    page.on("console", _log_console)
    page.on("pageerror", _log_error)

DEFAULT_NAMES = [
    "Host Harper",
    "Detective Dani",
    "Doctor Drew",
    "Villager Vic",
]


@dataclass
class PlayerSession:
    """Tracks a simulated player browser session."""

    name: str
    context: BrowserContext
    page: Page


class SmokeTestError(Exception):
    """Raised when the UI smoke test fails."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Moonlit Mafia UI smoke test")
    parser.add_argument(
        "--base-url",
        default=os.environ.get("MAFIA_BASE_URL", "http://localhost:3000"),
        help="Running app URL (default: http://localhost:3000)",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Run browsers in headed mode so you can watch the flow",
    )
    parser.add_argument(
        "--player-count",
        type=int,
        default=4,
        choices=range(4, 7),
        metavar="{4,5,6}",
        help="Total number of simulated players (min 4)",
    )
    parser.add_argument(
        "--spawn-dev-server",
        action="store_true",
        help="Launch a temporary `npm run dev` instance automatically",
    )
    parser.add_argument(
        "--dev-port",
        type=int,
        default=4300,
        help="Port to use when spawning the dev server (default: 4300)",
    )
    return parser.parse_args()


def wait_for_game_room(page: Page) -> None:
    try:
        page.wait_for_url("**/game/**", timeout=20_000)
    except PlaywrightTimeoutError:
        print("⚠️ Timed out waiting for game room. Current URL:", page.url)
        try:
            snapshot = page.content()
            print(snapshot[:750])
        except Exception as inner_error:  # pragma: no cover - debug aid only
            print(f"Unable to capture page content: {inner_error}")
        raise
    page.wait_for_selector('[data-testid="game-code-display"]', timeout=20_000)


def create_lobby(page: Page, base_url: str, host_name: str) -> str:
    page.goto(f"{base_url}/lobby/new")
    page.get_by_label("Your display name").fill(host_name)
    page.get_by_role("button", name="Create lobby").click()
    wait_for_game_room(page)
    code_text = page.locator('[data-testid="game-code-display"]').inner_text()
    return code_text.split("Code:")[-1].strip()


def join_lobby(
    browser: Browser,
    base_url: str,
    code: str,
    player_name: str,
    *,
    auto_ready: bool = True,
) -> PlayerSession:
    context = browser.new_context()
    page = context.new_page()
    attach_logging(page, player_name)
    page.goto(f"{base_url}/lobby/join")
    page.get_by_label("Lobby code").fill(code)
    page.get_by_label("Your name").fill(player_name)
    page.get_by_role("button", name="Join game").click()
    wait_for_game_room(page)
    player_row = page.locator(
        f'[data-testid="player-row"][data-player-name="{player_name}"]'
    )
    player_row.wait_for(timeout=15_000)
    ready_button = page.get_by_test_id("ready-toggle")
    ready_button.wait_for(state="visible", timeout=10_000)
    if auto_ready:
        ready_button.click()
        expect(ready_button).to_contain_text("Unready", timeout=15_000)
    return PlayerSession(name=player_name, context=context, page=page)


def start_game(page: Page) -> None:
    start_button = page.get_by_test_id("start-game-button")
    start_button.wait_for(state="visible", timeout=15_000)
    expect(start_button).to_be_enabled(timeout=15_000)
    start_button.click()
    page.locator('[data-testid="phase-status-card"]', has_text="Night actions").wait_for(timeout=15_000)


def send_chat_message(page: Page, text: str) -> None:
    textarea = page.get_by_placeholder("Share a hunch with the town...")
    textarea.fill(text)
    page.get_by_role("button", name="Send").click()
    page.get_by_text(text).wait_for(timeout=10_000)


def generate_names(count: int) -> List[str]:
    names = list(DEFAULT_NAMES)
    while len(names) < count:
        names.append(f"Villager {len(names) + 1}")
    return names[:count]


def run_smoke_test(base_url: str, headed: bool, player_count: int) -> None:
    if player_count < 4:
        raise SmokeTestError("At least four players are required to start a game")
    player_names = generate_names(player_count)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not headed)
        host_context = browser.new_context()
        host_page = host_context.new_page()
        attach_logging(host_page, "host")

        lobby_code = create_lobby(host_page, base_url, player_names[0])
        print(f"Created lobby with code {lobby_code}")

        sessions: List[PlayerSession] = []
        for name in player_names[1:]:
            session = join_lobby(browser, base_url, lobby_code, name)
            sessions.append(session)
            print(f"{name} joined and readied up")

        start_game(host_page)
        print("Host started the game")

        send_chat_message(host_page, "Automation smoke test says hi 👋")
        print("Host posted a chat message")

        for session in sessions:
            session.context.close()
        host_context.close()
        browser.close()


def main() -> int:
    args = parse_args()
    server_ctx = nullcontext()
    base_url = args.base_url
    if args.spawn_dev_server:
        try:
            from tests.automation.server import dev_server
        except ImportError:  # pragma: no cover - fallback when running as script
            from server import dev_server  # type: ignore
        server_ctx = dev_server(port=args.dev_port)
        base_url = f"http://localhost:{args.dev_port}"

    try:
        with server_ctx:
            run_smoke_test(base_url, args.headed, args.player_count)
            print("✅ Smoke test completed successfully")
            return 0
    except (PlaywrightTimeoutError, SmokeTestError) as error:
        print(f"❌ Smoke test failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
