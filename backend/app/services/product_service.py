from sqlalchemy.orm import Session
from typing import Optional, Tuple, List

from app.models import Product, Category
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.api.v1.upload import delete_image_from_s3
from app.core.exceptions import conflict_exception, not_found_exception


class ProductService:

    @staticmethod
    def create_product(db: Session, product_create: ProductCreate, user_id: int, client_id: int) -> Product:
        existing = db.query(Product).filter(
            Product.client_id == client_id,
            Product.sku == product_create.sku,
        ).first()
        if existing:
            raise conflict_exception("Product with this SKU already exists")

        db_product = Product(
            client_id=client_id,
            sku=product_create.sku,
            name=product_create.name,
            description=product_create.description,
            barcode=product_create.barcode,
            price=product_create.price,
            cost_price=product_create.cost_price,
            stock_quantity=product_create.stock_quantity,
            min_stock_level=product_create.min_stock_level,
            category_id=product_create.category_id,
            image_url=product_create.image_url,
            is_active=True,
        )

        db.add(db_product)
        db.commit()
        db.refresh(db_product)

        return db_product

    @staticmethod
    def get_product_by_id(db: Session, product_id: int, client_id: int) -> Optional[Product]:
        return db.query(Product).filter(Product.id == product_id, Product.client_id == client_id).first()

    @staticmethod
    def update_product(db: Session, product_id: int, product_update: ProductUpdate, client_id: int) -> Product:
        product = ProductService.get_product_by_id(db, product_id, client_id)
        if not product:
            raise not_found_exception("Product not found")

        if product_update.sku and product_update.sku != product.sku:
            existing = db.query(Product).filter(
                Product.client_id == client_id,
                Product.sku == product_update.sku,
            ).first()
            if existing:
                raise conflict_exception("Product with this SKU already exists")

        old_image_url = product.image_url

        update_data = product_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)

        # If image changed → delete old image from S3
        if product_update.image_url and old_image_url != product_update.image_url:
            if old_image_url:
                delete_image_from_s3(old_image_url)

        db.commit()
        db.refresh(product)

        return product

    @staticmethod
    def delete_product(db: Session, product_id: int, client_id: int) -> bool:
        product = ProductService.get_product_by_id(db, product_id, client_id)
        if not product:
            raise not_found_exception("Product not found")

        if product.image_url:
            delete_image_from_s3(product.image_url)

        db.delete(product)
        db.commit()

        return True

    @staticmethod
    def list_products(
        db: Session,
        client_id: int,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        is_active: Optional[bool] = None,
    ) -> Tuple[List[Product], int]:

        query = db.query(Product).filter(Product.client_id == client_id)

        if category_id is not None:
            query = query.filter(Product.category_id == category_id)

        if is_active is not None:
            query = query.filter(Product.is_active == is_active)

        total = query.count()
        products = query.offset(skip).limit(limit).all()

        return products, total


class CategoryService:

    @staticmethod
    def create_category(db: Session, category_create: CategoryCreate, client_id: int) -> Category:
        existing = db.query(Category).filter(
            Category.client_id == client_id,
            Category.name == category_create.name,
        ).first()
        if existing:
            raise conflict_exception("Category with this name already exists")

        db_category = Category(
            client_id=client_id,
            name=category_create.name,
            description=category_create.description,
            icon_name=getattr(category_create, 'icon_name', 'Coffee'),
            tax_rate=getattr(category_create, 'tax_rate', 5),
        )

        db.add(db_category)
        db.commit()
        db.refresh(db_category)

        return db_category

    @staticmethod
    def get_category_by_id(db: Session, category_id: int, client_id: int) -> Optional[Category]:
        return db.query(Category).filter(Category.id == category_id, Category.client_id == client_id).first()

    @staticmethod
    def update_category(db: Session, category_id: int, category_update: CategoryUpdate, client_id: int) -> Category:
        category = CategoryService.get_category_by_id(db, category_id, client_id)
        if not category:
            raise not_found_exception("Category not found")

        update_data = category_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)

        db.commit()
        db.refresh(category)

        return category

    @staticmethod
    def delete_category(db: Session, category_id: int, client_id: int) -> bool:
        category = CategoryService.get_category_by_id(db, category_id, client_id)
        if not category:
            raise not_found_exception("Category not found")

        db.delete(category)
        db.commit()

        return True

    @staticmethod
    def list_categories(
        db: Session,
        client_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Category], int]:

        query = db.query(Category).filter(Category.client_id == client_id)
        total = query.count()
        categories = query.offset(skip).limit(limit).all()

        return categories, total
