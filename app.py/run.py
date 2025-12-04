import streamlit as st

st.set_page_config(page_title="My Streamlit App", page_icon="📊", layout="centered")

st.title("My Streamlit App")
st.write("Welcome! This app is running from `app.py` in your GitHub repo.")

name = st.text_input("Your name", "")
if name:
    st.success(f"Hello, {name}! 👋")