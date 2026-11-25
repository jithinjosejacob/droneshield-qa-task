"""Pydantic models mirroring types/testSchema.ts — the server-side validation guard
for test documents created by the guided builder, plus auth/run models."""
from __future__ import annotations

from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Field

# --- UI steps (discriminated by `action`) ------------------------------------

class GotoStep(BaseModel):
    action: Literal["goto"]
    target: str

class FillStep(BaseModel):
    action: Literal["fill"]
    selector: str
    value: str

class TypeStep(BaseModel):
    action: Literal["type"]
    selector: str
    value: str

class ClickStep(BaseModel):
    action: Literal["click"]
    selector: str

class CheckStep(BaseModel):
    action: Literal["check"]
    selector: str

class SelectOptionStep(BaseModel):
    action: Literal["selectOption"]
    selector: str
    value: str

class PressStep(BaseModel):
    action: Literal["press"]
    selector: str
    key: str

class WaitForStep(BaseModel):
    action: Literal["waitFor"]
    selector: str | None = None
    timeout: int | None = None

class ExpectVisibleStep(BaseModel):
    action: Literal["expectVisible"]
    selector: str

class ExpectHiddenStep(BaseModel):
    action: Literal["expectHidden"]
    selector: str

class ExpectTextStep(BaseModel):
    action: Literal["expectText"]
    selector: str
    value: str

class ExpectUrlStep(BaseModel):
    action: Literal["expectUrl"]
    value: str

UiStep = Annotated[
    Union[
        GotoStep, FillStep, TypeStep, ClickStep, CheckStep, SelectOptionStep,
        PressStep, WaitForStep, ExpectVisibleStep, ExpectHiddenStep,
        ExpectTextStep, ExpectUrlStep,
    ],
    Field(discriminator="action"),
]

# --- API request + assertions ------------------------------------------------

class ApiRequest(BaseModel):
    method: Literal["get", "post", "put", "patch", "delete", "head"]
    url: str
    headers: dict[str, str] | None = None
    params: dict[str, Any] | None = None
    body: Any | None = None

class ExpectOk(BaseModel):
    type: Literal["expectOk"]

class ExpectStatus(BaseModel):
    type: Literal["expectStatus"]
    code: int

class ExpectBodyContains(BaseModel):
    type: Literal["expectBodyContains"]
    value: str

class ExpectJsonPath(BaseModel):
    type: Literal["expectJsonPath"]
    path: str
    value: Any

ApiAssertion = Annotated[
    Union[ExpectOk, ExpectStatus, ExpectBodyContains, ExpectJsonPath],
    Field(discriminator="type"),
]

# --- Test documents (discriminated by `type`) --------------------------------

class UiTestIn(BaseModel):
    type: Literal["ui"]
    name: str = Field(min_length=1)
    enabled: bool = True
    tags: list[str] = Field(default_factory=list)
    steps: list[UiStep] = Field(min_length=1)

class ApiTestIn(BaseModel):
    type: Literal["api"]
    name: str = Field(min_length=1)
    enabled: bool = True
    tags: list[str] = Field(default_factory=list)
    request: ApiRequest
    assertions: list[ApiAssertion] = Field(min_length=1)

TestIn = Annotated[Union[UiTestIn, ApiTestIn], Field(discriminator="type")]

# --- Auth --------------------------------------------------------------------

Role = Literal["author", "promoter"]

class UserCreate(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=4)
    role: Role

class UserRoleUpdate(BaseModel):
    role: Role

class UserOut(BaseModel):
    id: str
    username: str
    role: Role

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    username: str

# --- Runs --------------------------------------------------------------------

class RunCreate(BaseModel):
    source: Literal["draft", "production"] = "draft"
    test_ids: list[str] = Field(min_length=1)
