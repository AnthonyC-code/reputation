// passportd is the Reputation Passport backend: HTTP API plus embedded
// background workers, in one binary.
//
// Usage:
//
//	passportd serve            run the HTTP API (and, later, River workers)
//	passportd migrate          apply database migrations
//	passportd keys generate    generate an Ed25519 attestation keypair
package main

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/AnthonyC-code/reputation/api/internal/attest"
	"github.com/AnthonyC-code/reputation/api/internal/config"
	"github.com/AnthonyC-code/reputation/api/internal/httpapi"
	"github.com/AnthonyC-code/reputation/api/migrations"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	slog.SetDefault(logger)

	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: passportd <serve|migrate|keys generate>")
		os.Exit(2)
	}

	cfg, err := config.Load()
	if err != nil {
		logger.Error("loading config", "err", err)
		os.Exit(1)
	}

	switch os.Args[1] {
	case "serve":
		err = serve(cfg, logger)
	case "migrate":
		err = migrate(cfg, logger)
	case "keys":
		if len(os.Args) < 3 || os.Args[2] != "generate" {
			fmt.Fprintln(os.Stderr, "usage: passportd keys generate")
			os.Exit(2)
		}
		err = keysGenerate()
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n", os.Args[1])
		os.Exit(2)
	}
	if err != nil {
		logger.Error("fatal", "cmd", os.Args[1], "err", err)
		os.Exit(1)
	}
}

func serve(cfg config.Config, logger *slog.Logger) error {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	var pool *pgxpool.Pool
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err == nil {
		err = pool.Ping(ctx)
	}
	if err != nil {
		// In dev the web/API skeleton should still come up without Postgres.
		logger.Warn("database unavailable, serving without it", "err", err)
		pool = nil
	} else if cfg.Env == "dev" {
		if err := migrate(cfg, logger); err != nil {
			return fmt.Errorf("auto-migrating in dev: %w", err)
		}
	}

	var opts httpapi.Options
	if cfg.AttestSigningKey != "" {
		priv, err := base64.StdEncoding.DecodeString(cfg.AttestSigningKey)
		if err != nil || len(priv) != ed25519.PrivateKeySize {
			return fmt.Errorf("ATTEST_SIGNING_KEY is not a base64 ed25519 private key")
		}
		pub := ed25519.PrivateKey(priv).Public().(ed25519.PublicKey)
		opts.JWKS = &attest.JWKS{Keys: []attest.JWK{attest.PublicKeyJWK(pub, cfg.AttestKID)}}
	}

	srv := &http.Server{
		Addr:              cfg.APIAddr,
		Handler:           httpapi.New(pool, logger, opts),
		ReadHeaderTimeout: 5 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() { errCh <- srv.ListenAndServe() }()
	logger.Info("passportd serving", "addr", cfg.APIAddr, "env", cfg.Env)

	select {
	case err := <-errCh:
		return fmt.Errorf("http server: %w", err)
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return srv.Shutdown(shutdownCtx)
	}
}

func migrate(cfg config.Config, logger *slog.Logger) error {
	db, err := goose.OpenDBWithDriver("pgx", cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("opening db for migrations: %w", err)
	}
	defer db.Close()

	goose.SetBaseFS(migrations.FS)
	goose.SetLogger(gooseSlog{logger})
	if err := goose.Up(db, "."); err != nil {
		return fmt.Errorf("running migrations: %w", err)
	}
	return nil
}

func keysGenerate() error {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return fmt.Errorf("generating ed25519 key: %w", err)
	}
	// Printed once for the operator to place in the secret store; never
	// persisted by this command (AGENTS.md §7).
	fmt.Printf("ATTEST_SIGNING_KEY=%s\n", base64.StdEncoding.EncodeToString(priv))
	fmt.Printf("public key (JWKS material): %s\n", base64.StdEncoding.EncodeToString(pub))
	return nil
}

type gooseSlog struct{ l *slog.Logger }

func (g gooseSlog) Fatalf(format string, v ...any) { g.l.Error(fmt.Sprintf(format, v...)) }
func (g gooseSlog) Printf(format string, v ...any) { g.l.Info(fmt.Sprintf(format, v...)) }

var _ = stdlib.GetDefaultDriver // ensure pgx stdlib driver is linked for goose
