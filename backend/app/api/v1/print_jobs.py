from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.schemas import PrintJobResponse
from app.services.print_service import PrintService

router = APIRouter(prefix="/print-jobs", tags=["Print Jobs"])

@router.get("/pending", response_model=List[PrintJobResponse])
def get_pending_print_jobs(
    db: Session = Depends(get_db)
):
    """Fetch unprinted KOT jobs"""
    jobs = PrintService.get_pending_jobs(db)
    return jobs

@router.post("/{id}/mark-printed", response_model=PrintJobResponse)
def mark_print_job_as_printed(
    id: int,
    db: Session = Depends(get_db)
):
    """Mark a print job as completed"""
    job = PrintService.mark_as_printed(db, id)
    if not job:
        raise HTTPException(status_code=404, detail="Print job not found")
    return job

@router.get("", response_model=List[PrintJobResponse])
def list_print_jobs(
    order_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """List print jobs by order ID"""
    from app.models.print_job import PrintJob
    query = db.query(PrintJob)
    if order_id:
        query = query.filter(PrintJob.order_id == order_id)
    jobs = query.all()
    return jobs
