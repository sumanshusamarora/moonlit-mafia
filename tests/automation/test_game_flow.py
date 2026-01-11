from __future__ import annotations

import os
import re
from collections.abc import Iterator

import pytest
from playwright.sync_api import Browser, expect, sync_playwright

from .moonlit_mafia_smoke import (
    attach_logging,
    create_test_lobby,
    generate_names,
    start_game,
)
from .server import dev_server


@pytest.fixture(scope="session", name="app_base_url")
def _app_base_url() -> Iterator[str]:
    port = int(os.environ.get("MAFIA_TEST_PORT", "4300"))
    with dev_server(port=port) as server:
        yield server.base_url


@pytest.fixture(name="browser_instance")
def _browser_instance() -> Iterator[Browser]:
    with sync_playwright() as playwright:
        browser_instance = playwright.chromium.launch(headless=True)
        try:
            yield browser_instance
        finally:
            browser_instance.close()


def test_host_cannot_start_until_host_ready(browser_instance: Browser, app_base_url: str) -> None:
    names = generate_names(4)
    host_context = browser_instance.new_context()
    host_page = host_context.new_page()
    attach_logging(host_page, "host")

    try:
        create_test_lobby(host_page, app_base_url, names[0])

        host_page.get_by_test_id("utility-tab-host").click()

        start_button = host_page.locator('[data-testid="start-game-button"]:visible')
        start_button.wait_for(state="visible", timeout=15_000)
        expect(start_button).to_be_disabled()

        host_ready = host_page.locator('[data-testid="ready-toggle"]:visible')
        host_ready.wait_for(state="visible", timeout=15_000)
        host_ready.click()
        expect(start_button).to_be_enabled(timeout=15_000)
    finally:
        host_context.close()


def test_vote_flow_during_day_phase(browser_instance: Browser, app_base_url: str) -> None:
    names = generate_names(4)
    host_context = browser_instance.new_context()
    host_page = host_context.new_page()
    attach_logging(host_page, "host")

    try:
        target_name = names[1]
        voter_name = names[2]

        create_test_lobby(host_page, app_base_url, names[0])

        # In Test Mode, we can ready each player from a single host session
        # by selecting them in the Players panel.
        ready_toggle = host_page.locator('[data-testid="ready-toggle"]:visible')
        ready_toggle.wait_for(state="visible", timeout=15_000)
        if "cancel" not in ready_toggle.inner_text().lower():
            ready_toggle.click()

        for name in names[1:]:
            host_page.locator(f'[data-testid="player-row"][data-player-name="{name}"]').click()
            ready_toggle.wait_for(state="visible", timeout=15_000)
            if "cancel" not in ready_toggle.inner_text().lower():
                ready_toggle.click()

        # Switch back to host to start the game.
        host_page.locator(f'[data-testid="player-row"][data-player-name="{names[0]}"]').click()

        host_page.get_by_test_id("utility-tab-host").click()
        start_game(host_page)

        advance_button = host_page.locator('[data-testid="advance-phase-button"]:visible')
        advance_button.wait_for(state="visible", timeout=10_000)
        expect(advance_button).to_contain_text("Enter day", timeout=10_000)
        advance_button.click()

        host_page.get_by_text("Day voting").wait_for(timeout=10_000)

        # Vote as a specific player (Test Mode view-as).
        host_page.locator(f'[data-testid="player-row"][data-player-name="{voter_name}"]').click()

        vote_row = host_page.get_by_role("listitem").filter(has_text=target_name)
        vote_button = vote_row.get_by_role("button", name=re.compile(r"^Vote$", re.IGNORECASE))
        vote_button.click()
        expect(vote_button).to_contain_text("You voted", timeout=10_000)
        expect(vote_row.get_by_text("1 votes")).to_be_visible(timeout=10_000)

        withdraw_button = host_page.get_by_role("button", name=re.compile(r"Withdraw vote|Unvote", re.IGNORECASE))
        withdraw_button.wait_for(timeout=10_000)
        withdraw_button.click()

        expect(vote_row.get_by_role("button", name="Vote")).to_be_visible(timeout=10_000)

    finally:
        host_context.close()
