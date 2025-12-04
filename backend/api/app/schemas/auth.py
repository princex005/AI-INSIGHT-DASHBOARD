from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.organization import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    organization_name: str


class UserLogin(UserBase):
    password: str


class UserOut(UserBase):
    id: str
    org_id: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
