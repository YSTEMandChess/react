# Production Deploy — React Frontend

`deploy.sh` standardizes deploying the YSTEMandChess React frontend to the
production VM. It replaces the old "SSH in and run commands by hand" process
with a single, repeatable, fail-safe script.

> **Scope:** this covers **Fix 3** of the June 2026 production mitigation plan.
> It depends on **Fix 2** (the `react-frontend` systemd service) already being
> in place on the VM. See [Prerequisites](#prerequisites).

## What it does

Run in order, aborting on the first error (`set -euo pipefail`):

1. Records the current commit (for rollback reference)
2. Pulls the latest code — `git pull --ff-only`
3. Installs dependencies — `npm ci` (falls back to `npm install` if no lockfile)
4. Builds the app — `npm run build`
5. Restarts the frontend — `sudo systemctl restart react-frontend`
6. Verifies the service came back up, and prints its status

Because it aborts on the first failure, a broken build can never restart the
service with a bad app — the previously running version stays up.

## Prerequisites

- **Fix 2 must be done first.** The restart step calls
  `sudo systemctl restart react-frontend`, which only works once the
  `react-frontend.service` systemd unit has been created and enabled on the VM.
- Run as a user with `sudo` and access to the app directory
  (`/home/azureuser/YSTEMandChess/react/react-ystemandchess`).

## Usage

On the production VM:

```bash
# One-time: place the script at the canonical path and make it executable
cd /home/azureuser/YSTEMandChess/react
git pull
cp deploy/deploy.sh /home/azureuser/deploy.sh
chmod +x /home/azureuser/deploy.sh

# Every deploy after that:
/home/azureuser/deploy.sh
```

Then confirm the live site loads: <https://ystemandchess.com>

## Configuration

Edit these variables at the top of `deploy.sh` if paths change:

| Variable   | Default                                                       |
|------------|--------------------------------------------------------------|
| `APP_DIR`  | `/home/azureuser/YSTEMandChess/react/react-ystemandchess`    |
| `SERVICE`  | `react-frontend`                                             |
| `LOG_FILE` | `/home/azureuser/deploy.log`                                 |

## Logs

Every run is timestamped and appended to `/home/azureuser/deploy.log`, giving a
record of past deploys.

## Rollback

On completion the script prints the exact rollback command using the commit it
recorded before pulling. It looks like:

```bash
cd /home/azureuser/YSTEMandChess/react/react-ystemandchess \
  && git reset --hard <PREV_COMMIT> \
  && npm ci && npm run build \
  && sudo systemctl restart react-frontend
```

## Notes

- **Do not run against production without Kristopher reviewing first.**
- For the first test run, have the team aware and online, then verify the live
  site before considering the deploy done.
