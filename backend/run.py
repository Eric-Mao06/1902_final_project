import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        h11_max_incomplete_event_size=1024*1024,  # 1MB
        limit_concurrency=1000,
        limit_max_requests=1000,
        timeout_keep_alive=120,
        headers=[
            ("server", "FastAPI"),
            ("access-control-max-age", "1000"),
            ("access-control-allow-headers", "*"),
            ("access-control-expose-headers", "*"),
            ("access-control-allow-origin", "*"),   
            ("large-allocation", "true")
        ]
    )
