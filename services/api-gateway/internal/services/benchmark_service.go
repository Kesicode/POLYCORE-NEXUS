package services

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// BenchmarkAlgorithm represents a benchmark algorithm definition.
type BenchmarkAlgorithm struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"displayName"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
}

// BenchmarkService handles benchmark operations.
type BenchmarkService struct {
	pool *pgxpool.Pool
}

// NewBenchmarkService creates a new BenchmarkService.
func NewBenchmarkService(pool *pgxpool.Pool) *BenchmarkService {
	return &BenchmarkService{pool: pool}
}

// ListAlgorithms returns all active benchmark algorithms.
func (s *BenchmarkService) ListAlgorithms(ctx context.Context) ([]BenchmarkAlgorithm, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, name, display_name, COALESCE(description,''), category, is_active, created_at
		 FROM benchmark_algorithms WHERE is_active = true ORDER BY category, display_name`)
	if err != nil {
		return nil, fmt.Errorf("querying algorithms: %w", err)
	}
	defer rows.Close()

	var algorithms []BenchmarkAlgorithm
	for rows.Next() {
		var a BenchmarkAlgorithm
		if err := rows.Scan(&a.ID, &a.Name, &a.DisplayName, &a.Description,
			&a.Category, &a.IsActive, &a.CreatedAt); err != nil {
			continue
		}
		algorithms = append(algorithms, a)
	}
	return algorithms, nil
}
