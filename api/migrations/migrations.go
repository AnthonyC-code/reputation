// Package migrations embeds the goose SQL migrations so `passportd migrate`
// works from any working directory.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
