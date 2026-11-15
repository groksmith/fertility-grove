#!/usr/bin/env bash
# Start the Next dev server FULLY DETACHED, so it survives the shell that launched it.
#
# ⚠️ Why this exists. `yarn dev &`, even with `nohup`, stays in the launching shell's process group.
# When that shell is torn down the whole group is signalled, yarn forwards it to `next dev`, and the
# server exits cleanly — the log ends in a tidy "Done in NNs." with no error, which is why it reads
# as "the app randomly stops working" rather than as something killing it. `nohup` does not help:
# it ignores SIGHUP, and the signal being sent is SIGTERM.
#
# macOS ships no `setsid`, so the detach is done with a Python double-fork into a new session.
#
# ⚠️ A second dev server MUST pass a different NEXT_DIST_DIR. Two servers sharing `.next/` overwrite
# each other's manifests exactly as `yarn build` does — see next.config.ts.
#
# Usage: scripts/dev-server.sh [port] [logfile]
set -euo pipefail
PORT="${1:-3000}"
LOG="${2:-/tmp/fertility-grove-dev-$PORT.log}"
cd "$(dirname "$0")/.."

# ⚠️ LISTEN sockets only. `lsof -ti ":$PORT"` matches ANY socket on the port — a browser tab's
# ESTABLISHED connection, and the CLOSE_WAIT/TIME_WAIT ones it leaves behind for a minute or two
# after the server is killed. So the guard tripped on a port with nothing serving it, printed
# "already serving", and exited 0: the caller was told the server was up while every request
# failed to connect. Ask the question actually being asked — is anything LISTENING here.
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "port $PORT is already serving; leaving it alone"
  exit 0
fi

python3 - "$PORT" "$LOG" <<'PY'
import os, subprocess, sys
port, log = sys.argv[1], sys.argv[2]
if os.fork() == 0:                      # child
    os.setsid()                         # new session → no longer in the caller's process group
    with open(log, "ab", buffering=0) as out:
        subprocess.Popen(
            ["yarn", "dev", "-p", port],
            stdout=out, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL,
            start_new_session=True,
        )
    os._exit(0)
PY

for _ in $(seq 1 90); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://localhost:$PORT/login")" = "200" ]; then
    echo "dev server ready on http://localhost:$PORT (log: $LOG)"
    exit 0
  fi
  sleep 1
done
echo "dev server did not come up on $PORT; see $LOG" >&2
tail -20 "$LOG" >&2 || true
exit 1
