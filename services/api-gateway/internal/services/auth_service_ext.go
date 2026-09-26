package services

import (
	"context"
	"fmt"
)

// RefreshTokens rotates a refresh token and issues a new access+refresh pair.
func (s *AuthService) RefreshTokens(ctx context.Context, refreshToken string) (*TokenPair, error) {
	key := "polycore:refresh:" + refreshToken
	userID, err := s.rdb.Get(ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("invalid or expired refresh token")
	}

	user, err := s.GetUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	// Revoke the old token before issuing a new one
	_ = s.rdb.Del(ctx, key).Err()

	return s.generateTokens(user)
}

// ListUsers returns all users (for admin use).
func (s *AuthService) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT u.id, u.email, u.username, COALESCE(u.display_name, u.username),
		        r.name, u.is_active, u.created_at
		 FROM users u
		 JOIN roles r ON r.id = u.role_id
		 ORDER BY u.created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("querying users: %w", err)
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(
			&u.ID, &u.Email, &u.Username, &u.DisplayName,
			&u.Role, &u.IsActive, &u.CreatedAt,
		); err != nil {
			continue
		}
		users = append(users, u)
	}
	return users, nil
}
