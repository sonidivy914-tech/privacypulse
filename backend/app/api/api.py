from fastapi import APIRouter
from app.api.routes import auth, accounts, checklist, reminders, incidents, dashboard, reports

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(accounts.router)
api_router.include_router(checklist.router)
api_router.include_router(reminders.router)
api_router.include_router(incidents.router)
api_router.include_router(reports.router)

