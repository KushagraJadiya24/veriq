import sqlglot
from sqlglot import exp

BLOCKED_STATEMENT_TYPES = (exp.Drop, exp.Delete, exp.Insert, exp.Update, exp.Alter, exp.TruncateTable)

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