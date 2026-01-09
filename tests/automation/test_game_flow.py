from __future__ import annotations

import os

import pytest
from playwright.sync_api import Browser, expect, sync_playwright

from .moonlit_mafia_smoke import (
    PlayerSession,
    create_lobby,
    generate_names,
    join_lobby,
    start_game,
)
from .server import dev_server


@pytest.fixture(scope="session")
def base_url() -> str:
    port = int(os.environ.get("MAFIA_TEST_PORT", "4300"))
    with dev_server(port=port):
        yield f"http://localhost:{port}"


@pytest.fixture()
def browser(base_url: str) -> Browser:  # noqa: ARG001 - fixture ensures server is up
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            yield browser
        finally:
            browser.close()


def close_sessions(sessions: list[PlayerSession]) -> None:
    for session in sessions:
        session.context.close()


def test_host_cannot_start_until_everyone_ready(browser: Browser, base_url: str) -> None:
    names = generate_names(4)
    host_context = browser.new_context()
    host_page = host_context.new_page()
    sessions: list[PlayerSession] = []

    try:
        lobby_code = create_lobby(host_page, base_url, names[0])

        # Everyone except the final player readies up automatically.
        for name in names[1:-1]:
            sessions.append(join_lobby(browser, base_url, lobby_code, name))
        sessions.append(
            join_lobby(browser, base_url, lobby_code, names[-1], auto_ready=False)
        )

        start_button = host_page.get_by_test_id("start-game-button")
        start_button.wait_for(state="visible", timeout=10_000)
        expect(start_button).to_be_disabled()

        # Last player toggles ready and the button should enable shortly after.
        last_session = sessions[-1]
        last_ready = last_session.page.get_by_test_id("ready-toggle")
        last_ready.click()
        player_row = last_session.page.locator(
            f'[data-testid="player-row"][data-player-name="{names[-1]}"]'
        )
        expect(player_row).to_have_attribute("data-player-ready", "ready", timeout=15_000)
        expect(start_button).to_be_enabled(timeout=15_000)

    finally:
        close_sessions(sessions)
        host_context.close()


def test_vote_flow_during_day_phase(browser: Browser, base_url: str) -> None:
    names = generate_names(4)
    host_context = browser.new_context()
    host_page = host_context.new_page()
    sessions: list[PlayerSession] = []

    try:
        lobby_code = create_lobby(host_page, base_url, names[0])
        target_name = names[1]

        for name in names[1:]:
            sessions.append(join_lobby(browser, base_url, lobby_code, name))

        start_game(host_page)

        advance_button = host_page.get_by_test_id("advance-phase-button")
        advance_button.wait_for(state="visible", timeout=10_000)
        expect(advance_button).to_contain_text("Enter day", timeout=10_000)
        advance_button.click()

        host_page.get_by_text("Day voting").wait_for(timeout=10_000)

        vote_row = host_page.get_by_role("listitem").filter(has_text=target_name)
        vote_button = vote_row.get_by_role("button")
        vote_button.click()
        expect(vote_button).to_contain_text("You voted", timeout=10_000)
        expect(vote_row.get_by_text("1 votes")).to_be_visible(timeout=10_000)

        withdraw_button = host_page.get_by_role("button", name="Withdraw vote")
        withdraw_button.wait_for(timeout=10_000)
        withdraw_button.click()

        expect(vote_row.get_by_role("button", name="Vote")).to_be_visible(timeout=10_000)

    finally:
        close_sessions(sessions)
        host_context.close()
