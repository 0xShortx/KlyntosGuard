#!/usr/bin/env python3
"""Initialize database with tables and migrations."""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from klyntos_guard.db.models import Base
from klyntos_guard.db.session import engine, async_session
from klyntos_guard.core.config import settings
import structlog

logger = structlog.get_logger(__name__)


async def init_database():
    """Initialize database with tables."""
    try:
        logger.info("initializing_database", database_url=settings.database_url)

        # Create all tables
        async with engine.begin() as conn:
            logger.info("creating_tables")
            await conn.run_sync(Base.metadata.create_all)

        logger.info("database_initialized_successfully")

        # Verify tables were created
        async with async_session() as session:
            result = await session.execute(
                text(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """
                )
            )
            tables = [row[0] for row in result.fetchall()]
            logger.info("tables_created", tables=tables, count=len(tables))

        return True

    except Exception as e:
        logger.error("database_initialization_failed", error=str(e), exc_info=True)
        return False


async def drop_database():
    """Drop all tables (use with caution!)."""
    logger.warning("dropping_all_tables")

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.info("tables_dropped_successfully")
        return True
    except Exception as e:
        logger.error("drop_tables_failed", error=str(e), exc_info=True)
        return False


async def reset_database():
    """Reset database by dropping and recreating tables."""
    logger.warning("resetting_database")

    # Drop all tables
    if not await drop_database():
        return False

    # Recreate tables
    if not await init_database():
        return False

    logger.info("database_reset_complete")
    return True


async def check_database_connection():
    """Check if database connection works."""
    try:
        async with async_session() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
        logger.info("database_connection_successful")
        return True
    except Exception as e:
        logger.error("database_connection_failed", error=str(e))
        return False


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Database initialization script")
    parser.add_argument(
        "command",
        choices=["init", "drop", "reset", "check"],
        help="Command to execute",
    )
    parser.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help="Skip confirmation prompts",
    )

    args = parser.parse_args()

    if args.command == "check":
        success = asyncio.run(check_database_connection())
        sys.exit(0 if success else 1)

    elif args.command == "init":
        print("🔧 Initializing database...")
        print(f"Database: {settings.database_url}")
        print()

        if not args.yes:
            response = input("Continue? (y/N): ")
            if response.lower() != "y":
                print("Cancelled.")
                sys.exit(0)

        success = asyncio.run(init_database())
        if success:
            print("\n✅ Database initialized successfully!")
            print("\nNext steps:")
            print("1. Start the API server: uvicorn klyntos_guard.api.main:app --reload")
            print("2. Test with CLI: kg auth signup")
        else:
            print("\n❌ Database initialization failed!")
        sys.exit(0 if success else 1)

    elif args.command == "drop":
        print("⚠️  WARNING: This will DROP ALL TABLES!")
        print(f"Database: {settings.database_url}")
        print()

        if not args.yes:
            response = input("Are you sure? Type 'DELETE' to confirm: ")
            if response != "DELETE":
                print("Cancelled.")
                sys.exit(0)

        success = asyncio.run(drop_database())
        sys.exit(0 if success else 1)

    elif args.command == "reset":
        print("⚠️  WARNING: This will DROP and RECREATE ALL TABLES!")
        print(f"Database: {settings.database_url}")
        print()

        if not args.yes:
            response = input("Are you sure? Type 'RESET' to confirm: ")
            if response != "RESET":
                print("Cancelled.")
                sys.exit(0)

        success = asyncio.run(reset_database())
        if success:
            print("\n✅ Database reset successfully!")
        else:
            print("\n❌ Database reset failed!")
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
