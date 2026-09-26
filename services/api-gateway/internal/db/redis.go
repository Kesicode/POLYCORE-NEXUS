package db

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// NewRedisClient creates and verifies a Redis client.
func NewRedisClient(redisURL string) (*redis.Client, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parsing Redis URL: %w", err)
	}

	client := redis.NewClient(opts)

	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("pinging Redis: %w", err)
	}

	return client, nil
}
