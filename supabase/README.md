# Supabase local dev

Run `supabase start` to spin up the local stack (requires Docker Desktop
running). First run pulls ~9 Docker images and can take a few minutes.
`supabase stop` shuts it down.

## Known issue (as of 2026-08): broken CLI image pin

Homebrew-installed Supabase CLI **v2.111.0** pins Postgres image
`public.ecr.aws/supabase/postgres:17.6.1.156`, which is broken: `/etc/passwd`
and `/etc/group` inside that image are 0 bytes (no `postgres` system user
baked in), so the container's entrypoint fails immediately with:

```
find: unknown user postgres
...
{"_tag":"Error","error":{"code":"LegacyHealthCheckTimeoutError","message":"supabase_db_<project>: container is not ready: unhealthy"}}
```

This reproduces with plain `docker run` too (unrelated to the Supabase CLI
orchestration), and reproduces on a genuinely non-cached fresh pull, so it's
not a local Docker cache/corruption issue — it's a bad image publish on
Supabase's registry.

**Workaround:**

1. Check if it's been fixed upstream: `brew upgrade supabase`, then retry
   `supabase start`.
2. If still broken, use Supabase CLI **v2.110.0** instead — it pins
   `postgres:17.6.1.143`, confirmed working (boots to "database system is
   ready to accept connections" / healthy). Download it directly and run it
   by full path instead of the brew-installed binary:

   ```bash
   curl -sL "https://github.com/supabase/cli/releases/download/v2.110.0/supabase_2.110.0_darwin_arm64.tar.gz" -o /tmp/supabase_2110.tar.gz
   mkdir -p /tmp/supabase_2110 && tar xzf /tmp/supabase_2110.tar.gz -C /tmp/supabase_2110
   /tmp/supabase_2110/supabase start
   ```

   (swap `darwin_arm64` for your platform if different). `config.toml` has
   no field to pin a specific Postgres image tag directly — `major_version`
   only selects the major version, not the exact build — so this CLI-version
   swap is the only lever available short of a custom Docker Compose
   override.

Full diagnostic trail (how this was isolated, all commands/output) is in
`.superpowers/sdd/2026-08-04-fase-0-setup-arquitectura/task-9-report.md`
(commit `722b466` and its task workspace), if that scratch file still exists
in the repo history — otherwise re-diagnose fresh using the steps above.
