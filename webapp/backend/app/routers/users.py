from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from ..db import users
from ..schemas import UserCreate, UserOut, UserRoleUpdate
from ..security import hash_password, require_role

# User administration is restricted to promoters.
router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(require_role("promoter"))],
)


def _out(user: dict) -> UserOut:
    return UserOut(id=str(user["_id"]), username=user["username"], role=user["role"])


@router.get("", response_model=list[UserOut])
async def list_users() -> list[UserOut]:
    docs = await users().find().sort("username", 1).to_list(length=None)
    return [_out(d) for d in docs]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate) -> UserOut:
    if await users().find_one({"username": body.username}):
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already exists")
    doc = {
        "username": body.username,
        "role": body.role,
        "hashed_password": hash_password(body.password),
    }
    result = await users().insert_one(doc)
    doc["_id"] = result.inserted_id
    return _out(doc)


@router.put("/{user_id}/role", response_model=UserOut)
async def update_role(user_id: str, body: UserRoleUpdate) -> UserOut:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    result = await users().find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": body.role}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return _out(result)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str) -> None:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    count = await users().count_documents({})
    if count <= 1:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete the last user")
    result = await users().delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
