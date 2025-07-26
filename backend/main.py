from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import sqlite3
import uuid
from passlib.context import CryptContext
from jose import JWTError, jwt
from contextlib import contextmanager

app = FastAPI()


# ... (keep your existing imports and FastAPI setup)

# Define all Pydantic models FIRST
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str = None

class TenantCreate(BaseModel):
    name: str
    email: str
    timezone: str

class Tenant(TenantCreate):
    id: str
    created_at: str

class SourceConfigCreate(BaseModel):
    db_host: str
    db_port: int
    db_username: str
    db_password: str

class SourceConfig(SourceConfigCreate):
    id: str
    tenant_id: str

class PipelineStatus(BaseModel):
    is_active: bool

class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class User(UserCreate):
    id: str
    tenant_id: Optional[str]

# THEN define your utility functions and endpoints
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# ... (rest of your code can remain the same)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup with thread-safe connection handling
@contextmanager
def get_db_connection():
    conn = sqlite3.connect('db.sqlite3', check_same_thread=False)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    try:
        yield conn
    finally:
        conn.close()

@contextmanager
def get_db_cursor():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            yield cursor
            conn.commit()
        except Exception:
            conn.rollback()
            raise

# Initialize database tables
def init_db():
    with get_db_cursor() as cursor:
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS tenants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            timezone TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS source_configs (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            db_host TEXT NOT NULL,
            db_port INTEGER NOT NULL,
            db_username TEXT NOT NULL,
            db_password TEXT NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenants (id)
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS pipeline_status (
            tenant_id TEXT PRIMARY KEY,
            is_active BOOLEAN NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenants (id)
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            tenant_id TEXT,
            FOREIGN KEY (tenant_id) REFERENCES tenants (id)
        )
        ''')

# Initialize the database when starting
init_db()

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# JWT Configuration
SECRET_KEY = "6bc3cfe8e320d71ebffa14fe81c3178f"  # Your JWT secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ... (keep your existing Pydantic models here)

# Utility functions
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_user(username: str):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT id, username, password, role FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        return dict(row) if row else None

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user["password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user(username)
    if not user:
        raise credentials_exception
    return user

# ... (keep your existing endpoint decorators but update the database access)

# Updated endpoints with thread-safe database access
@app.post("/tenants/", response_model=Tenant)
def create_tenant(tenant: TenantCreate):
    tenant_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    with get_db_cursor() as cursor:
        cursor.execute(
            "INSERT INTO tenants (id, name, email, timezone, created_at) VALUES (?, ?, ?, ?, ?)",
            (tenant_id, tenant.name, tenant.email, tenant.timezone, created_at)
        )
    return {**tenant.dict(), "id": tenant_id, "created_at": created_at}

@app.get("/tenants/", response_model=List[Tenant])
def list_tenants():
    with get_db_cursor() as cursor:
        cursor.execute("SELECT id, name, email, timezone, created_at FROM tenants")
        return [dict(row) for row in cursor.fetchall()]

# ... (update all other endpoints similarly with the with get_db_cursor() pattern)

# Health check endpoint
@app.get("/health/{tenant_id}")
async def get_health_status(tenant_id: str):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT is_active FROM pipeline_status WHERE tenant_id = ?", (tenant_id,))
        status = cursor.fetchone()
    
    return {
        "last_sync_time": datetime.now().isoformat(),
        "last_error": "No errors" if not status or status["is_active"] else "Connection timeout",
        "status": "green" if not status or status["is_active"] else "red"
    }

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}    