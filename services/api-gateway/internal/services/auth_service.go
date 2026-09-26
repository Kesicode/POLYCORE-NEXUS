package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12

// User represents the user model returned from the database.
type User struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	Username    string    `json:"username"`
	DisplayName string    `json:"displayName"`
	Role        string    `json:"role"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
}

// AuthService handles authentication business logic.
type AuthService struct {
	pool      *pgxpool.Pool
	rdb       *redis.Client
	jwtSecret []byte
}

// NewAuthService creates a new AuthService.
func NewAuthService(pool *pgxpool.Pool, rdb *redis.Client, jwtSecret string) *AuthService {
	return &AuthService{
		pool:      pool,
		rdb:       rdb,
		jwtSecret: []byte(jwtSecret),
	}
}

// RegisterRequest holds registration input.
type RegisterRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginRequest holds login input.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// TokenPair holds access and refresh tokens.
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int    `json:"expiresIn"` // seconds
}

// Register creates a new user account.
func (s *AuthService) Register(ctx context.Context, req RegisterRequest) (*User, *TokenPair, error) {
	// Check if email already exists
	var count int
	err := s.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM users WHERE email = $1 OR username = $2",
		req.Email, req.Username,
	).Scan(&count)
	if err != nil {
		return nil, nil, fmt.Errorf("checking existing user: %w", err)
	}
	if count > 0 {
		return nil, nil, errors.New("email or username already registered")
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		return nil, nil, fmt.Errorf("hashing password: %w", err)
	}

	// Get default 'user' role ID
	var roleID string
	err = s.pool.QueryRow(ctx, "SELECT id FROM roles WHERE name = 'user'").Scan(&roleID)
	if err != nil {
		return nil, nil, fmt.Errorf("fetching user role: %w", err)
	}

	// Insert user
	user := &User{}
	err = s.pool.QueryRow(ctx,
		`INSERT INTO users (email, username, password_hash, display_name, role_id)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, email, username, COALESCE(display_name, username), 'user', is_active, created_at`,
		req.Email, req.Username, string(hash), req.Username, roleID,
	).Scan(&user.ID, &user.Email, &user.Username, &user.DisplayName, &user.Role, &user.IsActive, &user.CreatedAt)
	if err != nil {
		return nil, nil, fmt.Errorf("inserting user: %w", err)
	}

	tokens, err := s.generateTokens(user)
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

// Login authenticates a user and returns a token pair.
func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*User, *TokenPair, error) {
	user := &User{}
	var passwordHash string

	err := s.pool.QueryRow(ctx,
		`SELECT u.id, u.email, u.username, COALESCE(u.display_name, u.username),
		        r.name, u.is_active, u.created_at, u.password_hash
		 FROM users u
		 JOIN roles r ON r.id = u.role_id
		 WHERE u.email = $1`,
		req.Email,
	).Scan(&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.Role, &user.IsActive, &user.CreatedAt, &passwordHash)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, errors.New("invalid email or password")
		}
		return nil, nil, fmt.Errorf("querying user: %w", err)
	}

	if !user.IsActive {
		return nil, nil, errors.New("account has been disabled")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		return nil, nil, errors.New("invalid email or password")
	}

	// Update last login timestamp
	_, _ = s.pool.Exec(ctx,
		"UPDATE users SET last_login_at = NOW() WHERE id = $1", user.ID)

	tokens, err := s.generateTokens(user)
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

// GetUser returns a user by ID.
func (s *AuthService) GetUser(ctx context.Context, userID string) (*User, error) {
	user := &User{}
	err := s.pool.QueryRow(ctx,
		`SELECT u.id, u.email, u.username, COALESCE(u.display_name, u.username),
		        r.name, u.is_active, u.created_at
		 FROM users u
		 JOIN roles r ON r.id = u.role_id
		 WHERE u.id = $1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Username, &user.DisplayName,
		&user.Role, &user.IsActive, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// generateTokens creates a new JWT access + refresh token pair.
func (s *AuthService) generateTokens(user *User) (*TokenPair, error) {
	const accessExpirySeconds = 900 // 15 minutes

	// Access token
	accessClaims := jwt.MapClaims{
		"sub":      user.ID,
		"email":    user.Email,
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(time.Duration(accessExpirySeconds) * time.Second).Unix(),
		"iat":      time.Now().Unix(),
	}
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("signing access token: %w", err)
	}

	// Refresh token (long-lived, opaque UUID stored in Redis)
	refreshToken := uuid.New().String()
	refreshKey := "polycore:refresh:" + refreshToken
	if err := s.rdb.Set(context.Background(), refreshKey, user.ID, 7*24*time.Hour).Err(); err != nil {
		return nil, fmt.Errorf("storing refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    accessExpirySeconds,
	}, nil
}

// RevokeRefreshToken invalidates a refresh token.
func (s *AuthService) RevokeRefreshToken(ctx context.Context, refreshToken string) error {
	return s.rdb.Del(ctx, "polycore:refresh:"+refreshToken).Err()
}
