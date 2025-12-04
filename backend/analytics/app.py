import os
import time
from typing import Any, Dict

import httpx
import pandas as pd
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")
DEFAULT_TOKEN = os.getenv("STREAMLIT_DEFAULT_TOKEN")

st.set_page_config(page_title="Analytics Dashboard", layout="wide")


def get_auth_token() -> str | None:
    token = st.session_state.get("auth_token")
    if not token and DEFAULT_TOKEN:
        token = DEFAULT_TOKEN
        st.session_state["auth_token"] = token
    return token


def api_get(path: str, params: Dict[str, Any] | None = None) -> Dict[str, Any] | None:
    url = f"{BACKEND_API_URL}{path}"
    headers: Dict[str, str] = {}
    token = get_auth_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(url, params=params, headers=headers)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:  # noqa: BLE001
        st.error(f"Failed to load data from backend: {exc}")
        return None


def render_kpi_cards(summary: Dict[str, Any]) -> None:
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Events", f"{summary.get('total_events', 0):,}")
    col2.metric("Total Value", f"{summary.get('total_value', 0):,.2f}")
    col3.metric("Avg Value", f"{summary.get('avg_value', 0):,.2f}")


def render_trend_chart(data: pd.DataFrame) -> None:
    if data.empty:
        st.info("No trend data available for the selected filters.")
        return
    data = data.sort_values("event_time")
    st.line_chart(data.set_index("event_time")["value"])


def render_category_comparison(data: pd.DataFrame, by: str) -> None:
    if data.empty or by not in data.columns:
        st.info("No data available for category comparison.")
        return
    grouped = data.groupby(by)["value"].sum().reset_index()
    grouped = grouped.sort_values("value", ascending=False)
    st.bar_chart(grouped.set_index(by)["value"])


def render_ai_insights(filters: Dict[str, Any]) -> None:
    with st.expander("AI Insights", expanded=True):
        st.write("Automatically generated insights based on current filters.")
        payload = {"filters": filters}
        url = f"{BACKEND_API_URL}/api/ai/insights"
        headers: Dict[str, str] = {}
        token = get_auth_token()
        if token:
            headers["Authorization"] = f"Bearer {token}"
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                st.markdown(data.get("insights", "No insights available."))
            else:
                st.warning("AI insights endpoint not available yet.")
        except Exception as exc:  # noqa: BLE001
            st.warning(f"AI insights error: {exc}")


def sidebar_filters() -> Dict[str, Any]:
    st.sidebar.header("Filters")
    date_from = st.sidebar.date_input("From date")
    date_to = st.sidebar.date_input("To date")
    category = st.sidebar.text_input("Category contains")
    segment = st.sidebar.text_input("Segment contains")

    auto_refresh = st.sidebar.checkbox("Auto-refresh every 30s", value=False)

    filters: Dict[str, Any] = {
        "date_from": str(date_from) if date_from else None,
        "date_to": str(date_to) if date_to else None,
        "category": category or None,
        "segment": segment or None,
    }

    st.session_state["auto_refresh"] = auto_refresh
    return filters


def overview_page() -> None:
    st.title("Overview")

    filters = sidebar_filters()

    summary_data = api_get("/api/summary", params=filters) or {}
    render_kpi_cards(summary_data.get("kpis", {}))

    events_json = summary_data.get("events", [])
    df = pd.DataFrame(events_json)

    st.subheader("Trend over time")
    render_trend_chart(df)

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("By category")
        render_category_comparison(df, by="category")
    with col2:
        st.subheader("By segment")
        render_category_comparison(df, by="segment")

    render_ai_insights(filters)


def segmentation_page() -> None:
    st.title("Segmentation Explorer")
    filters = sidebar_filters()
    summary_data = api_get("/api/summary", params=filters) or {}
    df = pd.DataFrame(summary_data.get("events", []))

    if df.empty:
        st.info("No data for current filters.")
        return

    st.dataframe(df.head(500))


def reports_page() -> None:
    st.title("Reports")
    st.info("Report generation UI will call backend /api/reports endpoints.")


PAGES = {
    "Overview": overview_page,
    "Segmentation": segmentation_page,
    "Reports": reports_page,
}


def maybe_auto_refresh() -> None:
    if st.session_state.get("auto_refresh"):
        time.sleep(30)
        st.experimental_rerun()


def main() -> None:
    with st.sidebar:
        st.markdown("## Navigation")
        page = st.radio("Go to", list(PAGES.keys()))
        token_input = st.text_input("Auth token (JWT)", type="password")
        if token_input:
            st.session_state["auth_token"] = token_input

    PAGES[page]()

    maybe_auto_refresh()


if __name__ == "__main__":
    main()
