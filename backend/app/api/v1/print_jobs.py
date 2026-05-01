"""Print jobs API routes"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.models.client import Client
from app.models.print_job import PrintJob
from app.schemas import PrintJobResponse, PrintJobCreate
from app.services.print_service import PrintService

router = APIRouter(prefix="/print-jobs", tags=["Print Jobs"])


def _get_client_by_agent_key(x_print_agent_key: str, db: Session) -> Client:
    """Validate X-Print-Agent-Key header and return the matching client."""
    client = db.query(Client).filter(Client.print_agent_key == x_print_agent_key).first()
    if not client:
        raise HTTPException(status_code=403, detail="Invalid or missing print agent key")
    return client


@router.get("/pending", response_model=List[PrintJobResponse])
def get_pending_print_jobs(
    x_print_agent_key: str = Header(...),
    db: Session = Depends(get_db),
):
    """Fetch unprinted KOT jobs for this restaurant's print agent."""
    client = _get_client_by_agent_key(x_print_agent_key, db)
    return PrintService.get_pending_jobs(db, client.id)


@router.post("/{id}/mark-printed", response_model=PrintJobResponse)
@router.post("/{id}/complete", response_model=PrintJobResponse)
def mark_print_job_as_printed(
    id: int,
    x_print_agent_key: str = Header(...),
    db: Session = Depends(get_db),
):
    """Mark a print job as completed (called by the local print agent)."""
    client = _get_client_by_agent_key(x_print_agent_key, db)
    job = PrintService.mark_as_printed(db, id, client.id)
    if not job:
        raise HTTPException(status_code=404, detail="Print job not found")
    return job


@router.get("", response_model=List[PrintJobResponse])
def list_print_jobs(
    order_id: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List print jobs for the current restaurant (frontend use)."""
    client_id = int(current_user["client_id"])
    query = db.query(PrintJob).filter(PrintJob.client_id == client_id)
    if order_id:
        query = query.filter(PrintJob.order_id == order_id)
    return query.all()
