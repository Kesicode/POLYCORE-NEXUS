package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"polycore/api-gateway/internal/config"
)

// ExecutionStatus represents the state of an execution job.
type ExecutionStatus string

const (
	StatusQueued    ExecutionStatus = "queued"
	StatusStarting  ExecutionStatus = "starting"
	StatusRunning   ExecutionStatus = "running"
	StatusCompleted ExecutionStatus = "completed"
	StatusFailed    ExecutionStatus = "failed"
	StatusTimeout   ExecutionStatus = "timeout"
	StatusCancelled ExecutionStatus = "cancelled"
)

// ExecutionJob is the message sent to the execution queue.
type ExecutionJob struct {
	ID           string `json:"id"`
	UserID       string `json:"userId"`
	Language     string `json:"language"`
	SourceCode   string `json:"sourceCode"`
	Stdin        string `json:"stdin,omitempty"`
	TimeoutSecs  int    `json:"timeoutSecs"`
	MemoryLimitMB int   `json:"memoryLimitMb"`
}

// Execution represents a completed or in-progress execution.
type Execution struct {
	ID          string          `json:"id"`
	UserID      string          `json:"userId"`
	Language    string          `json:"language"`
	SourceCode  string          `json:"sourceCode"`
	Status      ExecutionStatus `json:"status"`
	ExitCode    *int            `json:"exitCode,omitempty"`
	Stdout      string          `json:"stdout"`
	Stderr      string          `json:"stderr"`
	WallTimeMs  *int64          `json:"wallTimeMs,omitempty"`
	MemoryBytes *int64          `json:"memoryBytes,omitempty"`
	QueuedAt    time.Time       `json:"queuedAt"`
	StartedAt   *time.Time      `json:"startedAt,omitempty"`
	CompletedAt *time.Time      `json:"completedAt,omitempty"`
}

// ExecutionService manages code execution jobs.
type ExecutionService struct {
	pool *pgxpool.Pool
	rdb  *redis.Client
	cfg  *config.Config
}

// NewExecutionService creates a new ExecutionService.
func NewExecutionService(pool *pgxpool.Pool, rdb *redis.Client, cfg *config.Config) *ExecutionService {
	return &ExecutionService{pool: pool, rdb: rdb, cfg: cfg}
}

// CreateRequest holds the parameters for creating an execution.
type CreateExecutionRequest struct {
	Language    string `json:"language"`
	SourceCode  string `json:"sourceCode"`
	Stdin       string `json:"stdin"`
	TimeoutSecs int    `json:"timeoutSecs"`
	ProjectID   string `json:"projectId,omitempty"`
}

// Create queues a new code execution job.
func (s *ExecutionService) Create(ctx context.Context, userID string, req CreateExecutionRequest) (*Execution, error) {
	// Validate language exists
	var languageID string
	err := s.pool.QueryRow(ctx,
		"SELECT id FROM languages WHERE name = $1 AND is_active = true",
		req.Language,
	).Scan(&languageID)
	if err != nil {
		return nil, fmt.Errorf("unsupported language: %s", req.Language)
	}

	// Apply limits
	timeout := req.TimeoutSecs
	if timeout <= 0 {
		timeout = s.cfg.ExecutionDefaultTimeoutSecs
	}
	if timeout > s.cfg.ExecutionMaxTimeoutSecs {
		timeout = s.cfg.ExecutionMaxTimeoutSecs
	}

	executionID := uuid.New().String()

	// Insert execution record
	_, err = s.pool.Exec(ctx,
		`INSERT INTO executions (id, user_id, language_id, source_code, stdin, status, queued_at)
		 VALUES ($1, $2, $3, $4, $5, 'queued', NOW())`,
		executionID, userID, languageID, req.SourceCode, req.Stdin,
	)
	if err != nil {
		return nil, fmt.Errorf("inserting execution: %w", err)
	}

	// Build job message
	job := ExecutionJob{
		ID:            executionID,
		UserID:        userID,
		Language:      req.Language,
		SourceCode:    req.SourceCode,
		Stdin:         req.Stdin,
		TimeoutSecs:   timeout,
		MemoryLimitMB: s.cfg.ExecutionMaxMemoryMB,
	}

	jobJSON, err := json.Marshal(job)
	if err != nil {
		return nil, fmt.Errorf("marshaling job: %w", err)
	}

	// Push to Redis execution queue
	if err := s.rdb.RPush(ctx, "polycore:executions:queue", string(jobJSON)).Err(); err != nil {
		return nil, fmt.Errorf("queuing execution: %w", err)
	}

	return &Execution{
		ID:         executionID,
		UserID:     userID,
		Language:   req.Language,
		SourceCode: req.SourceCode,
		Status:     StatusQueued,
		QueuedAt:   time.Now(),
	}, nil
}

// Get returns an execution by ID.
func (s *ExecutionService) Get(ctx context.Context, executionID, userID string) (*Execution, error) {
	exec := &Execution{}
	var languageName string

	err := s.pool.QueryRow(ctx,
		`SELECT e.id, e.user_id, l.name, e.source_code, e.status::text,
		        e.exit_code, COALESCE(e.stdout, ''), COALESCE(e.stderr, ''),
		        e.queued_at, e.started_at, e.completed_at
		 FROM executions e
		 JOIN languages l ON l.id = e.language_id
		 WHERE e.id::text = $1 AND (e.user_id::text = $2 OR $2 = 'admin')`,
		executionID, userID,
	).Scan(
		&exec.ID, &exec.UserID, &languageName, &exec.SourceCode,
		&exec.Status, &exec.ExitCode, &exec.Stdout, &exec.Stderr,
		&exec.QueuedAt, &exec.StartedAt, &exec.CompletedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("execution not found: %w", err)
	}

	exec.Language = languageName

	// Fetch metrics if completed
	if exec.Status == StatusCompleted || exec.Status == StatusFailed {
		_ = s.pool.QueryRow(ctx,
			"SELECT wall_time_ms, memory_bytes FROM execution_metrics WHERE execution_id::text = $1",
			executionID,
		).Scan(&exec.WallTimeMs, &exec.MemoryBytes)
	}

	return exec, nil
}

// List returns the most recent executions for a user.
func (s *ExecutionService) List(ctx context.Context, userID string, limit int) ([]Execution, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	rows, err := s.pool.Query(ctx,
		`SELECT e.id, e.user_id, l.name, e.source_code, e.status::text,
		        e.exit_code, COALESCE(e.stdout, ''), COALESCE(e.stderr, ''),
		        e.queued_at, e.started_at, e.completed_at
		 FROM executions e
		 JOIN languages l ON l.id = e.language_id
		 WHERE e.user_id::text = $1
		 ORDER BY e.queued_at DESC
		 LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var executions []Execution
	for rows.Next() {
		var exec Execution
		err := rows.Scan(
			&exec.ID, &exec.UserID, &exec.Language, &exec.SourceCode,
			&exec.Status, &exec.ExitCode, &exec.Stdout, &exec.Stderr,
			&exec.QueuedAt, &exec.StartedAt, &exec.CompletedAt,
		)
		if err != nil {
			continue
		}
		executions = append(executions, exec)
	}

	return executions, nil
}
