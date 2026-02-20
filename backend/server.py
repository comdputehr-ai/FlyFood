from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import hashlib
import secrets
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe
stripe_api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

# User Models
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: Optional[str] = None
    phone: Optional[str] = None
    name: str
    city: str = "Душанбе"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email_or_phone: str
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_admin: bool = False
    is_restaurant_owner: bool = False
    restaurant_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    city: str
    is_admin: bool
    is_restaurant_owner: bool
    restaurant_id: Optional[str] = None

class AuthResponse(BaseModel):
    user: UserResponse
    token: str

# Restaurant Models
class RestaurantBase(BaseModel):
    name: str
    description: str
    cuisine_type: str
    address: str
    city: str
    image_url: str
    rating: float = 4.5
    delivery_time: str = "30-45 мин"
    min_order: float = 50.0
    delivery_fee: float = 15.0
    is_active: bool = True

class RestaurantCreate(RestaurantBase):
    pass

class Restaurant(RestaurantBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# MenuItem Models
class MenuItemBase(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str
    is_available: bool = True
    is_vegetarian: bool = False
    is_spicy: bool = False

class MenuItemCreate(MenuItemBase):
    restaurant_id: str

class MenuItem(MenuItemBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str

# Cart Models
class CartItem(BaseModel):
    menu_item_id: str
    quantity: int = 1
    name: str
    price: float
    image_url: str

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    restaurant_id: Optional[str] = None
    restaurant_name: Optional[str] = None
    items: List[CartItem] = []
    total: float = 0.0

class AddToCartRequest(BaseModel):
    menu_item_id: str
    quantity: int = 1

# Order Models
class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    price: float
    quantity: int

class OrderBase(BaseModel):
    delivery_address: str
    phone: str
    comment: Optional[str] = None
    payment_method: str = "cash"  # cash or card

class OrderCreate(OrderBase):
    pass

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    restaurant_id: str
    restaurant_name: str
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float
    total: float
    status: str = "pending"  # pending, confirmed, preparing, delivering, delivered, cancelled
    delivery_address: str
    phone: str
    comment: Optional[str] = None
    payment_method: str
    payment_status: str = "pending"  # pending, paid, failed
    payment_session_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    city: str

# Favorite Model
class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    restaurant_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Payment Transaction Model
class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    order_id: str
    amount: float
    currency: str = "usd"
    status: str = "initiated"
    payment_status: str = "pending"
    metadata: Dict = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

# Simple token storage (in production, use Redis or JWT)
tokens: Dict[str, str] = {}

async def get_current_user(request: Request) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    user_id = tokens.get(token)
    if not user_id:
        return None
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc:
        return User(**user_doc)
    return None

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Не авторизован")
    return user

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({
        "$or": [
            {"email": user_data.email} if user_data.email else {"email": None},
            {"phone": user_data.phone} if user_data.phone else {"phone": None}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    
    user = User(
        id=str(uuid.uuid4()),
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        city=user_data.city
    )
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    token = generate_token()
    tokens[token] = user.id
    
    return AuthResponse(
        user=UserResponse(**user.model_dump()),
        token=token
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({
        "$or": [
            {"email": credentials.email_or_phone},
            {"phone": credentials.email_or_phone}
        ]
    }, {"_id": 0})
    
    if not user_doc or user_doc.get("password_hash") != hash_password(credentials.password):
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    
    token = generate_token()
    tokens[token] = user_doc["id"]
    
    return AuthResponse(
        user=UserResponse(**user_doc),
        token=token
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: User = Depends(require_auth)):
    return UserResponse(**user.model_dump())

@api_router.post("/auth/logout")
async def logout(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        tokens.pop(token, None)
    return {"message": "Вы вышли из системы"}

# ============ CITIES ============

CITIES = ["Душанбе", "Худжанд", "Курган-Тюбе", "Куляб"]

@api_router.get("/cities")
async def get_cities():
    return CITIES

# ============ RESTAURANT ENDPOINTS ============

@api_router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants(city: Optional[str] = None, cuisine: Optional[str] = None, search: Optional[str] = None):
    query = {"is_active": True}
    if city:
        query["city"] = city
    if cuisine:
        query["cuisine_type"] = cuisine
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    restaurants = await db.restaurants.find(query, {"_id": 0}).to_list(100)
    return restaurants

@api_router.get("/restaurants/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(restaurant_id: str):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Ресторан не найден")
    return restaurant

@api_router.post("/restaurants", response_model=Restaurant)
async def create_restaurant(restaurant_data: RestaurantCreate, user: User = Depends(require_auth)):
    if not user.is_admin and not user.is_restaurant_owner:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    restaurant = Restaurant(**restaurant_data.model_dump(), owner_id=user.id)
    await db.restaurants.insert_one(restaurant.model_dump())
    
    # Update user's restaurant_id
    await db.users.update_one({"id": user.id}, {"$set": {"restaurant_id": restaurant.id}})
    
    return restaurant

@api_router.put("/restaurants/{restaurant_id}", response_model=Restaurant)
async def update_restaurant(restaurant_id: str, restaurant_data: RestaurantCreate, user: User = Depends(require_auth)):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Ресторан не найден")
    
    if not user.is_admin and restaurant.get("owner_id") != user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    await db.restaurants.update_one(
        {"id": restaurant_id},
        {"$set": restaurant_data.model_dump()}
    )
    
    updated = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    return updated

# ============ MENU ENDPOINTS ============

@api_router.get("/restaurants/{restaurant_id}/menu", response_model=List[MenuItem])
async def get_menu(restaurant_id: str, category: Optional[str] = None):
    query = {"restaurant_id": restaurant_id}
    if category:
        query["category"] = category
    
    items = await db.menu_items.find(query, {"_id": 0}).to_list(200)
    return items

@api_router.get("/menu-categories/{restaurant_id}")
async def get_menu_categories(restaurant_id: str):
    items = await db.menu_items.find({"restaurant_id": restaurant_id}, {"category": 1, "_id": 0}).to_list(200)
    categories = list(set([item["category"] for item in items]))
    return categories

@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(item_data: MenuItemCreate, user: User = Depends(require_auth)):
    restaurant = await db.restaurants.find_one({"id": item_data.restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Ресторан не найден")
    
    if not user.is_admin and restaurant.get("owner_id") != user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    item = MenuItem(**item_data.model_dump())
    await db.menu_items.insert_one(item.model_dump())
    return item

@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, item_data: MenuItemBase, user: User = Depends(require_auth)):
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")
    
    restaurant = await db.restaurants.find_one({"id": item["restaurant_id"]}, {"_id": 0})
    if not user.is_admin and restaurant.get("owner_id") != user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    await db.menu_items.update_one({"id": item_id}, {"$set": item_data.model_dump()})
    updated = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    return updated

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str, user: User = Depends(require_auth)):
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")
    
    restaurant = await db.restaurants.find_one({"id": item["restaurant_id"]}, {"_id": 0})
    if not user.is_admin and restaurant.get("owner_id") != user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    await db.menu_items.delete_one({"id": item_id})
    return {"message": "Блюдо удалено"}

# ============ CART ENDPOINTS ============

@api_router.get("/cart", response_model=Cart)
async def get_cart(user: User = Depends(require_auth)):
    cart = await db.carts.find_one({"user_id": user.id}, {"_id": 0})
    if not cart:
        cart = Cart(user_id=user.id).model_dump()
    return cart

@api_router.post("/cart/add", response_model=Cart)
async def add_to_cart(item_data: AddToCartRequest, user: User = Depends(require_auth)):
    menu_item = await db.menu_items.find_one({"id": item_data.menu_item_id}, {"_id": 0})
    if not menu_item:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")
    
    restaurant = await db.restaurants.find_one({"id": menu_item["restaurant_id"]}, {"_id": 0})
    
    cart = await db.carts.find_one({"user_id": user.id}, {"_id": 0})
    
    if not cart:
        cart = Cart(user_id=user.id, restaurant_id=restaurant["id"], restaurant_name=restaurant["name"]).model_dump()
    
    # Check if adding from different restaurant
    if cart.get("restaurant_id") and cart["restaurant_id"] != menu_item["restaurant_id"]:
        # Clear cart and start fresh
        cart["items"] = []
        cart["restaurant_id"] = restaurant["id"]
        cart["restaurant_name"] = restaurant["name"]
    
    if not cart.get("restaurant_id"):
        cart["restaurant_id"] = restaurant["id"]
        cart["restaurant_name"] = restaurant["name"]
    
    # Check if item already in cart
    existing_item = None
    for i, item in enumerate(cart.get("items", [])):
        if item["menu_item_id"] == item_data.menu_item_id:
            existing_item = i
            break
    
    if existing_item is not None:
        cart["items"][existing_item]["quantity"] += item_data.quantity
    else:
        cart_item = CartItem(
            menu_item_id=menu_item["id"],
            name=menu_item["name"],
            price=menu_item["price"],
            image_url=menu_item["image_url"],
            quantity=item_data.quantity
        )
        if "items" not in cart:
            cart["items"] = []
        cart["items"].append(cart_item.model_dump())
    
    # Recalculate total
    cart["total"] = sum(item["price"] * item["quantity"] for item in cart["items"])
    
    await db.carts.update_one(
        {"user_id": user.id},
        {"$set": cart},
        upsert=True
    )
    
    return cart

@api_router.post("/cart/update", response_model=Cart)
async def update_cart_item(item_data: AddToCartRequest, user: User = Depends(require_auth)):
    cart = await db.carts.find_one({"user_id": user.id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Корзина пуста")
    
    for i, item in enumerate(cart.get("items", [])):
        if item["menu_item_id"] == item_data.menu_item_id:
            if item_data.quantity <= 0:
                cart["items"].pop(i)
            else:
                cart["items"][i]["quantity"] = item_data.quantity
            break
    
    # Recalculate total
    cart["total"] = sum(item["price"] * item["quantity"] for item in cart["items"])
    
    # Clear restaurant if cart is empty
    if not cart["items"]:
        cart["restaurant_id"] = None
        cart["restaurant_name"] = None
    
    await db.carts.update_one({"user_id": user.id}, {"$set": cart})
    return cart

@api_router.delete("/cart/clear", response_model=Cart)
async def clear_cart(user: User = Depends(require_auth)):
    cart = Cart(user_id=user.id).model_dump()
    await db.carts.update_one(
        {"user_id": user.id},
        {"$set": cart},
        upsert=True
    )
    return cart

# ============ ORDER ENDPOINTS ============

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, user: User = Depends(require_auth)):
    cart = await db.carts.find_one({"user_id": user.id}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Корзина пуста")
    
    restaurant = await db.restaurants.find_one({"id": cart["restaurant_id"]}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Ресторан не найден")
    
    order_items = [
        OrderItem(
            menu_item_id=item["menu_item_id"],
            name=item["name"],
            price=item["price"],
            quantity=item["quantity"]
        ).model_dump() for item in cart["items"]
    ]
    
    subtotal = cart["total"]
    delivery_fee = restaurant.get("delivery_fee", 15.0)
    total = subtotal + delivery_fee
    
    order = Order(
        user_id=user.id,
        restaurant_id=cart["restaurant_id"],
        restaurant_name=cart["restaurant_name"],
        items=order_items,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        delivery_address=order_data.delivery_address,
        phone=order_data.phone,
        comment=order_data.comment,
        payment_method=order_data.payment_method,
        city=user.city
    )
    
    await db.orders.insert_one(order.model_dump())
    
    # Clear cart
    await db.carts.update_one(
        {"user_id": user.id},
        {"$set": Cart(user_id=user.id).model_dump()}
    )
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(user: User = Depends(require_auth)):
    orders = await db.orders.find({"user_id": user.id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, user: User = Depends(require_auth)):
    order = await db.orders.find_one({"id": order_id, "user_id": user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user: User = Depends(require_auth)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Check permission
    restaurant = await db.restaurants.find_one({"id": order["restaurant_id"]}, {"_id": 0})
    if not user.is_admin and restaurant.get("owner_id") != user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    valid_statuses = ["pending", "confirmed", "preparing", "delivering", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Неверный статус")
    
    await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    return {"message": "Статус обновлен"}

# ============ FAVORITES ENDPOINTS ============

@api_router.get("/favorites", response_model=List[Restaurant])
async def get_favorites(user: User = Depends(require_auth)):
    favorites = await db.favorites.find({"user_id": user.id}, {"_id": 0}).to_list(100)
    restaurant_ids = [f["restaurant_id"] for f in favorites]
    restaurants = await db.restaurants.find({"id": {"$in": restaurant_ids}}, {"_id": 0}).to_list(100)
    return restaurants

@api_router.post("/favorites/{restaurant_id}")
async def add_favorite(restaurant_id: str, user: User = Depends(require_auth)):
    existing = await db.favorites.find_one({"user_id": user.id, "restaurant_id": restaurant_id})
    if existing:
        return {"message": "Уже в избранном"}
    
    favorite = Favorite(user_id=user.id, restaurant_id=restaurant_id)
    await db.favorites.insert_one(favorite.model_dump())
    return {"message": "Добавлено в избранное"}

@api_router.delete("/favorites/{restaurant_id}")
async def remove_favorite(restaurant_id: str, user: User = Depends(require_auth)):
    await db.favorites.delete_one({"user_id": user.id, "restaurant_id": restaurant_id})
    return {"message": "Удалено из избранного"}

@api_router.get("/favorites/check/{restaurant_id}")
async def check_favorite(restaurant_id: str, user: User = Depends(require_auth)):
    favorite = await db.favorites.find_one({"user_id": user.id, "restaurant_id": restaurant_id})
    return {"is_favorite": favorite is not None}

# ============ PAYMENT ENDPOINTS ============

class CreateCheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

@api_router.post("/payments/create-checkout")
async def create_checkout(data: CreateCheckoutRequest, request: Request, user: User = Depends(require_auth)):
    order = await db.orders.find_one({"id": data.order_id, "user_id": user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    if order.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Заказ уже оплачен")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    success_url = f"{data.origin_url}/orders/{data.order_id}?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/checkout"
    
    # Convert somoni to USD (approximate rate: 1 USD = 10.9 TJS)
    amount_usd = round(order["total"] / 10.9, 2)
    
    checkout_request = CheckoutSessionRequest(
        amount=amount_usd,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": data.order_id,
            "user_id": user.id
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        session_id=session.session_id,
        user_id=user.id,
        order_id=data.order_id,
        amount=amount_usd,
        currency="usd",
        status="initiated",
        payment_status="pending",
        metadata={"order_id": data.order_id}
    )
    await db.payment_transactions.insert_one(transaction.model_dump())
    
    # Update order with session_id
    await db.orders.update_one(
        {"id": data.order_id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request, user: User = Depends(require_auth)):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction
        now = datetime.now(timezone.utc).isoformat()
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": status.status,
                "payment_status": status.payment_status,
                "updated_at": now
            }}
        )
        
        # If paid, update order
        if status.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if transaction:
                await db.orders.update_one(
                    {"id": transaction["order_id"]},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            order_id = webhook_response.metadata.get("order_id")
            if order_id:
                await db.orders.update_one(
                    {"id": order_id},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {
                        "status": "complete",
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ============ ADMIN ENDPOINTS ============

@api_router.get("/admin/orders", response_model=List[Order])
async def get_admin_orders(user: User = Depends(require_auth)):
    if not user.is_admin and not user.is_restaurant_owner:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    if user.is_admin:
        orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        orders = await db.orders.find({"restaurant_id": user.restaurant_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return orders

@api_router.get("/admin/analytics")
async def get_analytics(user: User = Depends(require_auth)):
    if not user.is_admin and not user.is_restaurant_owner:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    query = {} if user.is_admin else {"restaurant_id": user.restaurant_id}
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    
    total_orders = len(orders)
    total_revenue = sum(o["total"] for o in orders)
    completed_orders = len([o for o in orders if o["status"] == "delivered"])
    pending_orders = len([o for o in orders if o["status"] in ["pending", "confirmed", "preparing", "delivering"]])
    
    # Orders by status
    status_counts = {}
    for order in orders:
        status = order["status"]
        status_counts[status] = status_counts.get(status, 0) + 1
    
    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "status_counts": status_counts
    }

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    existing = await db.restaurants.find_one()
    if existing:
        return {"message": "Данные уже загружены"}
    
    # Sample restaurants
    restaurants_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "Плов Хаус",
            "description": "Традиционный таджикский плов и национальные блюда",
            "cuisine_type": "Таджикская",
            "address": "ул. Рудаки 45",
            "city": "Душанбе",
            "image_url": "https://images.unsplash.com/photo-1603076218042-64efad4281b5?crop=entropy&cs=srgb&fm=jpg&q=85",
            "rating": 4.8,
            "delivery_time": "30-40 мин",
            "min_order": 50.0,
            "delivery_fee": 10.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Бургер Мания",
            "description": "Сочные бургеры и картофель фри",
            "cuisine_type": "Фаст-фуд",
            "address": "ул. Исмоили Сомони 12",
            "city": "Душанбе",
            "image_url": "https://images.unsplash.com/photo-1541592391523-5ae8c2c88d10?crop=entropy&cs=srgb&fm=jpg&q=85",
            "rating": 4.5,
            "delivery_time": "25-35 мин",
            "min_order": 40.0,
            "delivery_fee": 15.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Суши Тайм",
            "description": "Свежие суши и роллы",
            "cuisine_type": "Японская",
            "address": "пр. Айни 78",
            "city": "Душанбе",
            "image_url": "https://images.unsplash.com/photo-1513615147033-3ed2afaaae8f?crop=entropy&cs=srgb&fm=jpg&q=85",
            "rating": 4.6,
            "delivery_time": "35-50 мин",
            "min_order": 80.0,
            "delivery_fee": 20.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Кафе Ориён",
            "description": "Традиционная кухня и свежая выпечка",
            "cuisine_type": "Таджикская",
            "address": "ул. Бухоро 23",
            "city": "Худжанд",
            "image_url": "https://images.unsplash.com/photo-1765894711185-63800b16dbba?crop=entropy&cs=srgb&fm=jpg&q=85",
            "rating": 4.7,
            "delivery_time": "30-45 мин",
            "min_order": 45.0,
            "delivery_fee": 12.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Пицца Белла",
            "description": "Итальянская пицца на тонком тесте",
            "cuisine_type": "Итальянская",
            "address": "ул. Ленина 56",
            "city": "Курган-Тюбе",
            "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?crop=entropy&cs=srgb&fm=jpg&q=85",
            "rating": 4.4,
            "delivery_time": "35-45 мин",
            "min_order": 60.0,
            "delivery_fee": 15.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Шашлык Дом",
            "description": "Сочные шашлыки и кебабы",
            "cuisine_type": "Кавказская",
            "address": "ул. Мира 34",
            "city": "Куляб",
            "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=srgb&fm=jpg&q=85",
            "rating": 4.6,
            "delivery_time": "40-55 мин",
            "min_order": 70.0,
            "delivery_fee": 10.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.restaurants.insert_many(restaurants_data)
    
    # Sample menu items
    menu_items_data = []
    for restaurant in restaurants_data:
        if restaurant["cuisine_type"] == "Таджикская":
            items = [
                {"name": "Плов", "description": "Традиционный плов с бараниной", "price": 45.0, "category": "Горячие блюда", "image_url": "https://images.unsplash.com/photo-1614778168922-ab1cdf04800e?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Самбуса", "description": "Хрустящая самбуса с мясом", "price": 15.0, "category": "Закуски", "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Лагман", "description": "Наваристый лагман с овощами", "price": 40.0, "category": "Горячие блюда", "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Манты", "description": "Паровые манты с мясом", "price": 35.0, "category": "Горячие блюда", "image_url": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Зеленый чай", "description": "Традиционный зеленый чай", "price": 10.0, "category": "Напитки", "image_url": "https://images.unsplash.com/photo-1556881286-fc6915169721?crop=entropy&cs=srgb&fm=jpg&q=85"},
            ]
        elif restaurant["cuisine_type"] == "Фаст-фуд":
            items = [
                {"name": "Классик Бургер", "description": "Сочный бургер с говядиной", "price": 55.0, "category": "Бургеры", "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Чизбургер", "description": "Бургер с двойным сыром", "price": 65.0, "category": "Бургеры", "image_url": "https://images.unsplash.com/photo-1550547660-d9450f859349?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Картофель фри", "description": "Хрустящий картофель", "price": 25.0, "category": "Закуски", "image_url": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Кола", "description": "Освежающий напиток", "price": 15.0, "category": "Напитки", "image_url": "https://images.unsplash.com/photo-1554866585-cd94860890b7?crop=entropy&cs=srgb&fm=jpg&q=85"},
            ]
        elif restaurant["cuisine_type"] == "Японская":
            items = [
                {"name": "Филадельфия", "description": "Ролл с лососем и сыром", "price": 85.0, "category": "Роллы", "image_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Калифорния", "description": "Классический ролл", "price": 70.0, "category": "Роллы", "image_url": "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Сашими", "description": "Свежие ломтики рыбы", "price": 95.0, "category": "Сашими", "image_url": "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Мисо суп", "description": "Традиционный японский суп", "price": 25.0, "category": "Супы", "image_url": "https://images.unsplash.com/photo-1547928576-b822bc410e05?crop=entropy&cs=srgb&fm=jpg&q=85"},
            ]
        elif restaurant["cuisine_type"] == "Итальянская":
            items = [
                {"name": "Маргарита", "description": "Классическая пицца с томатами", "price": 65.0, "category": "Пицца", "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Пепперони", "description": "Пицца с колбасой", "price": 75.0, "category": "Пицца", "image_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Карбонара", "description": "Паста со сливками", "price": 55.0, "category": "Паста", "image_url": "https://images.unsplash.com/photo-1612874742237-6526221588e3?crop=entropy&cs=srgb&fm=jpg&q=85"},
            ]
        elif restaurant["cuisine_type"] == "Кавказская":
            items = [
                {"name": "Шашлык из баранины", "description": "Сочный шашлык", "price": 85.0, "category": "Шашлыки", "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Люля-кебаб", "description": "Кебаб из рубленого мяса", "price": 70.0, "category": "Шашлыки", "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?crop=entropy&cs=srgb&fm=jpg&q=85"},
                {"name": "Хачапури", "description": "Грузинская лепешка с сыром", "price": 45.0, "category": "Выпечка", "image_url": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?crop=entropy&cs=srgb&fm=jpg&q=85"},
            ]
        else:
            items = []
        
        for item in items:
            menu_items_data.append({
                "id": str(uuid.uuid4()),
                "restaurant_id": restaurant["id"],
                "is_available": True,
                "is_vegetarian": False,
                "is_spicy": False,
                **item
            })
    
    if menu_items_data:
        await db.menu_items.insert_many(menu_items_data)
    
    return {"message": "Данные успешно загружены", "restaurants": len(restaurants_data), "menu_items": len(menu_items_data)}

# ============ ROOT ============

@api_router.get("/")
async def root():
    return {"message": "Dushanbe Eats API", "version": "1.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
