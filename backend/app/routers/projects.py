from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectResponse
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all projects belonging to the current user."""
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()

    # Add site count to each project response
    result = []
    for project in projects:
        p = ProjectResponse.model_validate(project)
        p.site_count = len(project.sites)
        result.append(p)
    return result


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new project for the current user."""
    project = Project(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    result = ProjectResponse.model_validate(project)
    result.site_count = 0
    return result


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single project by ID. Only the owner can access it."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id,
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    result = ProjectResponse.model_validate(project)
    result.site_count = len(project.sites)
    return result


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a project and all its sites."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id,
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    db.delete(project)
    db.commit()
