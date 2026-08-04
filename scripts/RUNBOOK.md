# Deploy Runbook

| Service | Port | systemd unit | Deploy command |
|---|---|---|---|
| Frontend | 3000 | react-frontend.service | ./scripts/deploy.sh frontend |
| Chess server | 3001 | chess-server.service | ./scripts/deploy.sh chess-server |
| Chess client | 3002 | chess-client.service | ./scripts/deploy.sh chess-client |
| Middleware | 8000 | middleware.service | ./scripts/deploy.sh middleware |
| Stockfish server | 8080 | stockfish-server.service | ./scripts/deploy.sh stockfish-server |

Deploy all: `./scripts/deploy.sh all`

## Known limitations
- Frontend has full rollback (backup/restore build/ on failed smoke test).
- Other four services restart + verify the port is listening; no automatic rollback — check `journalctl -u <service> -n 20` on failure.
- `deploy.sh all` runs services sequentially; a failure in one does NOT stop the rest from attempting to run, and the final exit code only reflects the last service run.
- chess-client runs `npm start` (CRA dev server), not a production build — known issue, not yet resolved.
- git pull failure handling (e.g. unclean working tree) relies on `set -e`; confirmed working elsewhere in these scripts but not explicitly tested for this exact scenario.
