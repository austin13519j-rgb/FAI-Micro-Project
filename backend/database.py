"""
database.py
Operation Theatre Turnaround Planner - Database Configuration.
Configures SQLAlchemy ORM engine, connection pooling, and session management.
Supports Neon Serverless PostgreSQL with automatic SSL handling,
with local SQLite fallback when DATABASE_URL is not set.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Fetch DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# 2. Support standard PostgreSQL prefixes and Render/Neon quirks
if DATABASE_URL:
    # Some cloud providers (Render, Heroku) use 'postgres://' which SQLAlchemy 1.4+ rejects
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # If psycopg 3 is installed, use psycopg driver dialect if needed, or default postgresql
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,      # Verify connection validity before execution (critical for serverless Neon)
        pool_recycle=300,        # Recycle connections every 5 minutes to prevent stale dropped connections
        pool_size=10,
        max_overflow=20,
    )
else:
    # Fallback to local SQLite for offline development or student demonstration without cloud setup
    SQLITE_URL = "sqlite:///./ot_planner.db"
    engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI Dependency for database session life-cycle."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes tables on startup."""
    import models  # Ensure all model classes are imported
    Base.metadata.create_all(bind=engine)

