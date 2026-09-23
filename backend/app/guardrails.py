import sqlglot
from sqlglot import exp

BLOCKED_STATEMENT_TYPES = (exp.Drop, exp.Delete, exp.Insert, exp.Update, exp.Alter, exp.TruncateTable)
MAX_JOINS = 4

def validate_sql(sql: str) -> tuple[bool, str]:
    try:
        parsed = sqlglot.parse_one(sql, read="postgres")
    except Exception as e:
        return False, f"Could not parse SQL: {e}"

    if isinstance(parsed, BLOCKED_STATEMENT_TYPES):
        return False, f"Blocked statement type: {type(parsed).__name__}"

    if not isinstance(parsed, exp.Select):
        return False, "Only SELECT statements are allowed"

    return True, "OK"


def enforce_row_limit(sql: str, max_rows: int = 1000) -> str:
    parsed = sqlglot.parse_one(sql, read="postgres")
    if not parsed.args.get("limit"):
        parsed = parsed.limit(max_rows)
    return parsed.sql(dialect="postgres")


def check_complexity(sql: str) -> tuple[bool, str]:
    parsed = sqlglot.parse_one(sql, read="postgres")
    join_count = len(list(parsed.find_all(exp.Join)))
    if join_count > MAX_JOINS:
        return False, f"Query too complex: {join_count} joins (max {MAX_JOINS})"
    return True, "OK"