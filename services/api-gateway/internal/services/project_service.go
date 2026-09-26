package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Project represents a user project.
type Project struct {
	ID          string    `json:"id"`
	OwnerID     string    `json:"ownerId"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	IsPublic    bool      `json:"isPublic"`
	IsArchived  bool      `json:"isArchived"`
	Tags        []string  `json:"tags"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// ProjectFile represents a file in a project.
type ProjectFile struct {
	ID          string    `json:"id"`
	ProjectID   string    `json:"projectId"`
	Path        string    `json:"path"`
	Name        string    `json:"name"`
	Content     string    `json:"content"`
	IsDirectory bool      `json:"isDirectory"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// ProjectService handles project operations.
type ProjectService struct {
	pool *pgxpool.Pool
}

// NewProjectService creates a new ProjectService.
func NewProjectService(pool *pgxpool.Pool) *ProjectService {
	return &ProjectService{pool: pool}
}

func (s *ProjectService) List(ctx context.Context, userID string) ([]Project, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, owner_id, name, slug, COALESCE(description,''), is_public, is_archived, 
		        COALESCE(tags, '{}'), created_at, updated_at
		 FROM projects WHERE owner_id = $1 AND is_archived = false
		 ORDER BY updated_at DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("querying projects: %w", err)
	}
	defer rows.Close()

	var projects []Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.OwnerID, &p.Name, &p.Slug, &p.Description,
			&p.IsPublic, &p.IsArchived, &p.Tags, &p.CreatedAt, &p.UpdatedAt); err != nil {
			continue
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (s *ProjectService) Get(ctx context.Context, id, userID string) (*Project, error) {
	var p Project
	err := s.pool.QueryRow(ctx,
		`SELECT id, owner_id, name, slug, COALESCE(description,''), is_public, is_archived,
		        COALESCE(tags, '{}'), created_at, updated_at
		 FROM projects WHERE id = $1 AND (owner_id = $2 OR is_public = true)`,
		id, userID,
	).Scan(&p.ID, &p.OwnerID, &p.Name, &p.Slug, &p.Description,
		&p.IsPublic, &p.IsArchived, &p.Tags, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *ProjectService) Create(ctx context.Context, ownerID, name, description string, isPublic bool) (*Project, error) {
	id := uuid.New().String()
	slug := fmt.Sprintf("%s-%s", sanitizeSlug(name), id[:8])

	var p Project
	err := s.pool.QueryRow(ctx,
		`INSERT INTO projects (id, owner_id, name, slug, description, is_public)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, owner_id, name, slug, COALESCE(description,''), is_public, is_archived,
		           COALESCE(tags, '{}'), created_at, updated_at`,
		id, ownerID, name, slug, description, isPublic,
	).Scan(&p.ID, &p.OwnerID, &p.Name, &p.Slug, &p.Description,
		&p.IsPublic, &p.IsArchived, &p.Tags, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("inserting project: %w", err)
	}
	return &p, nil
}

func (s *ProjectService) Update(ctx context.Context, id, userID string, fields map[string]interface{}) (*Project, error) {
	// Only allow updating description and isPublic for now
	desc, _ := fields["description"].(string)
	isPublic, _ := fields["isPublic"].(bool)

	_, err := s.pool.Exec(ctx,
		`UPDATE projects SET description = $1, is_public = $2, updated_at = NOW()
		 WHERE id = $3 AND owner_id = $4`,
		desc, isPublic, id, userID)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, id, userID)
}

func (s *ProjectService) Delete(ctx context.Context, id, userID string) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE projects SET is_archived = true WHERE id = $1 AND owner_id = $2`,
		id, userID)
	return err
}

func (s *ProjectService) ListFiles(ctx context.Context, projectID string) ([]ProjectFile, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, project_id, path, name, COALESCE(content,''), is_directory, created_at, updated_at
		 FROM project_files WHERE project_id = $1 ORDER BY path`,
		projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []ProjectFile
	for rows.Next() {
		var f ProjectFile
		if err := rows.Scan(&f.ID, &f.ProjectID, &f.Path, &f.Name, &f.Content,
			&f.IsDirectory, &f.CreatedAt, &f.UpdatedAt); err != nil {
			continue
		}
		files = append(files, f)
	}
	return files, nil
}

func (s *ProjectService) CreateFile(ctx context.Context, projectID, path, name, content string) (*ProjectFile, error) {
	id := uuid.New().String()
	var f ProjectFile
	err := s.pool.QueryRow(ctx,
		`INSERT INTO project_files (id, project_id, path, name, content)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, project_id, path, name, COALESCE(content,''), is_directory, created_at, updated_at`,
		id, projectID, path, name, content,
	).Scan(&f.ID, &f.ProjectID, &f.Path, &f.Name, &f.Content, &f.IsDirectory, &f.CreatedAt, &f.UpdatedAt)
	return &f, err
}

func (s *ProjectService) UpdateFile(ctx context.Context, projectID, fileID, content string) (*ProjectFile, error) {
	var f ProjectFile
	err := s.pool.QueryRow(ctx,
		`UPDATE project_files SET content = $1, updated_at = NOW()
		 WHERE id = $2 AND project_id = $3
		 RETURNING id, project_id, path, name, COALESCE(content,''), is_directory, created_at, updated_at`,
		content, fileID, projectID,
	).Scan(&f.ID, &f.ProjectID, &f.Path, &f.Name, &f.Content, &f.IsDirectory, &f.CreatedAt, &f.UpdatedAt)
	return &f, err
}

func sanitizeSlug(name string) string {
	result := ""
	for _, c := range name {
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' {
			result += string(c)
		} else if c >= 'A' && c <= 'Z' {
			result += string(c + 32)
		} else if c == ' ' || c == '_' {
			result += "-"
		}
	}
	if len(result) > 40 {
		result = result[:40]
	}
	return result
}
