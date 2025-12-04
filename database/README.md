# Database

PostgreSQL schema for the multi-tenant analytics platform.

Main entities:
- organizations
- users
- api_keys
- events
- reports

Use Alembic in `backend/api` for application migrations. This folder contains the base `schema.sql` and optional seed data.
