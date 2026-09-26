package services

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Language represents a language in the registry.
type Language struct {
	ID                  string    `json:"id"`
	Name                string    `json:"name"`
	DisplayName         string    `json:"displayName"`
	Version             string    `json:"version"`
	Category            string    `json:"category"`
	Runtime             string    `json:"runtime"`
	FileExtensions      []string  `json:"fileExtensions"`
	ExecutionCommand    string    `json:"executionCommand"`
	SupportsCompilation bool      `json:"supportsCompilation"`
	SupportsMetrics     bool      `json:"supportsMetrics"`
	RunnerImage         string    `json:"runnerImage"`
	Color               string    `json:"color"`
	Description         string    `json:"description"`
	IsActive            bool      `json:"isActive"`
	IsExperimental      bool      `json:"isExperimental"`
	CreatedAt           time.Time `json:"createdAt"`
}

// LanguageService handles language registry operations.
type LanguageService struct {
	pool *pgxpool.Pool
}

// NewLanguageService creates a new LanguageService.
func NewLanguageService(pool *pgxpool.Pool) *LanguageService {
	return &LanguageService{pool: pool}
}

// List returns all languages, optionally filtered by category.
func (s *LanguageService) List(ctx context.Context, category string, activeOnly bool) ([]Language, error) {
	query := `
		SELECT id, name, display_name, COALESCE(version, ''), category,
		       COALESCE(runtime, ''), file_extensions, COALESCE(execution_command, ''),
		       supports_compilation, supports_metrics,
		       COALESCE(runner_image, ''), COALESCE(color, '#808080'),
		       COALESCE(description, ''), is_active, is_experimental, created_at
		FROM languages
		WHERE ($1 = '' OR category = $1)
		  AND ($2 = false OR is_active = true)
		ORDER BY category, display_name`

	rows, err := s.pool.Query(ctx, query, category, activeOnly)
	if err != nil {
		return nil, fmt.Errorf("querying languages: %w", err)
	}
	defer rows.Close()

	var languages []Language
	for rows.Next() {
		var lang Language
		err := rows.Scan(
			&lang.ID, &lang.Name, &lang.DisplayName, &lang.Version,
			&lang.Category, &lang.Runtime, &lang.FileExtensions,
			&lang.ExecutionCommand, &lang.SupportsCompilation, &lang.SupportsMetrics,
			&lang.RunnerImage, &lang.Color, &lang.Description,
			&lang.IsActive, &lang.IsExperimental, &lang.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning language: %w", err)
		}
		languages = append(languages, lang)
	}

	return languages, nil
}

// GetByName returns a single language by its name.
func (s *LanguageService) GetByName(ctx context.Context, name string) (*Language, error) {
	var lang Language
	err := s.pool.QueryRow(ctx,
		`SELECT id, name, display_name, COALESCE(version, ''), category,
		        COALESCE(runtime, ''), file_extensions, COALESCE(execution_command, ''),
		        supports_compilation, supports_metrics,
		        COALESCE(runner_image, ''), COALESCE(color, '#808080'),
		        COALESCE(description, ''), is_active, is_experimental, created_at
		 FROM languages WHERE name = $1`,
		name,
	).Scan(
		&lang.ID, &lang.Name, &lang.DisplayName, &lang.Version,
		&lang.Category, &lang.Runtime, &lang.FileExtensions,
		&lang.ExecutionCommand, &lang.SupportsCompilation, &lang.SupportsMetrics,
		&lang.RunnerImage, &lang.Color, &lang.Description,
		&lang.IsActive, &lang.IsExperimental, &lang.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("language not found: %w", err)
	}
	return &lang, nil
}
