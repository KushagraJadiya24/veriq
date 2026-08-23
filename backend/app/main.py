from fastapi import FastAPI

app = FastAPI()

# TODO: define a GET route at path "/health"
# It should be an async function (FastAPI supports both sync and async
# handlers — use async here; we'll get into *why* async matters once
# we're doing DB calls) that returns a small JSON-serializable dict,
# e.g. something indicating status = "ok".
#
# Hint: decorator pattern is @app.get("/your-path")
#       def/async def function_name():
#           return {...}