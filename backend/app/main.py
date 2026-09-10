from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.database import engine, Base
from .api import strategies, prop, personal, imports, analytics

app = FastAPI(title="MokTradeDesk API", version="1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ایجاد جداول
Base.metadata.create_all(bind=engine)

# اضافه کردن روت‌ها
app.include_router(strategies.router, prefix="/api/strategies", tags=["strategies"])
app.include_router(prop.router, prefix="/api/prop", tags=["prop"])
app.include_router(personal.router, prefix="/api/personal", tags=["personal"])
app.include_router(imports.router, prefix="/api/imports", tags=["imports"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
@app.get("/")
def root():
    return {"message": "MokTradeDesk API is running"}