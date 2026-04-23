from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.inventory import InventoryLogCreate, InventoryLogResponse
from app.services.inventory_service import InventoryService


router = APIRouter(prefix="/inventory", tags=["Inventory"])


# -------- CREATE LOG --------
@router.post("/logs", response_model=InventoryLogResponse)
def create_inventory_log(
    product_id: int,                          # ?product_id=4
    data: InventoryLogCreate,                # body JSON
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        return InventoryService.create_inventory_log(
            db,
            product_id,
            int(current_user["user_id"]),
            data,
            int(current_user["client_id"]),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------- GET ALL LOGS --------
@router.get("/logs", response_model=List[InventoryLogResponse])
def list_inventory_logs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return InventoryService.get_all_logs(db, int(current_user["client_id"]))


# -------- GET ONE LOG BY ID --------
@router.get("/logs/{log_id}", response_model=InventoryLogResponse)
def get_inventory_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    log = InventoryService.get_log_by_id(db, log_id, int(current_user["client_id"]))
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log


# -------- GET PRODUCT INVENTORY HISTORY --------
@router.get("/product/{product_id}/history", response_model=List[InventoryLogResponse])
def get_product_inventory_history(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return InventoryService.get_product_history(db, product_id, int(current_user["client_id"]))


# -------- INVENTORY SUMMARY --------
@router.get("/summary")
def get_inventory_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return InventoryService.get_inventory_summary(db, int(current_user["client_id"]))
