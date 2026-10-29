# TransitFlow — MySQL + ArangoDB

DA3 runs React 18 / TypeScript / Vite and an Express API on Node.js 20 or newer. MySQL remains authoritative for passengers, contacts, drivers, vehicles, routes, stations, trips, bookings, payments and tickets. ArangoDB is an optional, rebuildable graph projection. DA2 remains unchanged.

## Local setup in VS Code

Run these commands from the repository root. Docker Compose uses persistent named volumes and binds database ports only to loopback. No schema script runs automatically.

```bash
cd DA3
cp -n .env.example .env
cp -n backend/.env.example backend/.env
```

Edit the ignored files in VS Code:

- `DA3/.env`: choose `MYSQL_ROOT_PASSWORD` and `ARANGO_PASSWORD`.
- `DA3/backend/.env`: set `DB_PASSWORD` to the same MySQL password and `ARANGO_PASSWORD` to the same ArangoDB password. Leave local host/ports as shown. For an existing MySQL database, use its actual connection settings instead.
- `VITE_API_BASE_URL` defaults to `http://localhost:5000/api`.

Keep passwords out of Git. Changing a Compose password after a volume is initialized does not change the stored database password. Do not remove volumes to fix credentials if they contain data.

Start MySQL and ArangoDB (VS Code terminal 1, working directory `DA3`):

```bash
docker compose up -d mysql arangodb
docker compose ps
docker compose logs --tail=30 mysql arangodb
```

For a **new, disposable local MySQL database only**, initialize the demo schema after MySQL is healthy. The SQL file starts with `DROP DATABASE IF EXISTS transit_management`: **never run this against an existing database**. First copy the schema into the local container:

```bash
docker compose cp database/schema.sql mysql:/tmp/transit-schema.sql
```

Then explicitly confirm initialization:

```bash
read -r -p 'This wipes local transit_management. Type INITIALIZE to continue: ' answer
if [ "$answer" = INITIALIZE ]; then
  docker compose exec mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root < /tmp/transit-schema.sql'
fi
```

There is no need to initialize an existing database. Back up and migrate existing schemas separately; this change does not alter the MySQL schema or its unique seat constraint.

Install and initialize the dedicated graph database (terminal 1, `DA3`):

```bash
npm ci
cd backend
npm ci
npm run init:graph
npm run sync:graph
```

`init:graph` creates `ARANGO_DATABASE` if missing and the named `transit_graph` with its collections. It never drops databases or adopts unowned collections. Creating a database requires administrative credentials; a deployed runtime should use a dedicated user with access only to the application's database. Configure that user through `ARANGO_USER` / `ARANGO_PASSWORD` after provisioning.

Start backend (terminal 2, from repository root):

```bash
cd DA3/backend
npm run dev
```

Start frontend (terminal 3, from repository root):

```bash
cd DA3
npm run dev
```

Build and check readiness (another terminal, from repository root):

```bash
cd DA3
npm run build
curl --fail http://localhost:5000/api/health
curl --fail http://localhost:5000/api/graph/health
cd backend
npm run sync:graph
```

ArangoDB's local web interface is on port 8529. In its query editor, select `transit_graph` (or your `ARANGO_DATABASE`) before running AQL.

## Demo: frontend → MySQL → ArangoDB

1. Open the frontend's Passengers module. Add passenger `P010`, first name `Meena`, last name `Ravi`, email `meena@example.com`, gender `F`, date of birth `2001-04-18`, city `Chennai`, state `TN`, PIN `600017`, and phone `9876500010`. Edit the first name to `Meena Updated` and save.
2. Verify the authoritative row from a terminal in `DA3`:

   ```bash
   docker compose exec mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root transit_management -e "SELECT passenger_id, first_name, email FROM passengers WHERE passenger_id=\"P010\";"'
   ```

3. Sync from a terminal in `DA3/backend`:

   ```bash
   npm run sync:graph
   ```

4. In ArangoDB's query editor, select the configured database and run:

   ```aql
   FOR passenger IN transit_passenger
     FILTER passenger.passenger_id == @passengerId
     RETURN KEEP(passenger, "_key", "passenger_id", "first_name", "email")
   ```

   Set bind variable `passengerId` to `P010`. Expect one vertex with first name `Meena Updated`. Run sync again: its `_key` and the vertex count remain stable. Graph Explorer also offers **Sync from MySQL**, route tracing, paths, passenger journeys and network edges.

## API compatibility and pathfinding

Existing `/api/graph` paths and success envelopes remain:

| Method / path | Behavior |
| --- | --- |
| GET `/health` | `status`, `engine: "ArangoDB"`, `nodes`, `relationships` |
| POST `/sync` | Full idempotent projection with relational counts, graph counts and pruned counts |
| GET `/routes/:routeId/stations` | Route metadata and stops ordered by stop order; existing route with no stops returns an empty list |
| GET `/path/shortest?originId=&destinationId=&maxHops=8` | Minimum total `distance_km` subject to the hop bound |
| GET `/passengers/:passengerId/journeys` | Booking/trip/route journeys and ordered trip endpoints |
| GET `/network` | Directed station connections with distance, route and transit type |
| POST `/bookings` | MySQL transaction first, then graph projection |

`maxHops` retains its previous normalization: default 8, finite inputs truncated and clamped to 1–10, nonfinite inputs fall back to 8. Native ArangoDB weighted `SHORTEST_PATH` finds the unrestricted minimum. If that result fits the bound, it is valid for the bounded problem too. Otherwise, a weighted AQL traversal with path-local uniqueness searches only the permitted depth and selects minimum distance. Nonnegative weights mean an optimal simple path always exists; cycles cannot improve distance. Equal-distance ties may return any optimal path. The hop-count comparison uses the same bound and chooses minimum distance among fewest-hop paths.

No path within the bound returns 404, including when an unrestricted path exists. Identical or malformed endpoints return 400; unknown stations return 404. Queries have a 10-second server runtime cap: very dense networks may fail rather than finish a bounded search. Graph Explorer explicitly shows its 8-hop search bound. No new performance benchmark is claimed.

Booking request shape is unchanged. MySQL locks the trip, validates foreign keys, and enforces `UNIQUE(trip_id, seat_number, date)`. Graph-demo booking IDs use random UUID-derived IDs within MySQL's 20-character column limit, avoiding races between trips. Passenger details in the graph come from MySQL, never from the request payload.

If MySQL commits but projection fails, HTTP **201** and `success: true` explicitly acknowledge the durable booking:

```json
{
  "success": true,
  "message": "Booking ... is committed in MySQL. Do not book again. Retry graph sync only.",
  "data": {
    "relational": { "bookingId": "..." },
    "graph": null,
    "partialSuccess": true,
    "graphSyncPending": true,
    "warning": "ArangoDB projection could not be confirmed. Run POST /api/graph/sync."
  }
}
```

The frontend API type preserves this status without throwing away the committed booking. The normal Bookings UI uses the unchanged MySQL checkout endpoint; it does not require the graph service. If the HTTP response itself is lost, inspect existing MySQL bookings before retrying a booking; there is no distributed transaction or request-idempotency-key store.

Graph connection, authentication, and missing database/collection errors return a clear 503. Invalid AQL and other graph operation defects return 500. MySQL CRUD and dashboard do not open graph connections. Graph bookings are the intentional exception to graph-offline errors: an already committed booking returns partial success.

The old destructive `sync:graph:clean` command has been removed. Full sync already replaces projected documents and safely prunes stale records; an old `{clean:true}` sync request simply performs normal sync.

## Validation

```bash
cd DA3
npm run build
cd backend
find config controllers database middleware models routes services tests utils -name '*.js' -exec node --check {} \;
node --check server.js
```

Integration tests create uniquely named `transit_test_<uuid>` databases, seed only the newly created MySQL database, launch a temporary API on port 15001, and delete only their own databases in cleanup. They never drop or seed an existing database. They require test-service credentials with create/drop database privileges. They do not load `.env`; opt in explicitly and pass service credentials through environment variables:

```bash
cd DA3/backend
read -r -s -p 'Test MySQL password: ' DB_PASSWORD; echo
read -r -s -p 'Test ArangoDB password: ' ARANGO_PASSWORD; echo
export DB_PASSWORD ARANGO_PASSWORD
TRANSIT_INTEGRATION=1 DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=root \
  ARANGO_URL=http://127.0.0.1:8529 ARANGO_USER=root npm run test:integration
unset DB_PASSWORD ARANGO_PASSWORD
```

Use separate test services whenever possible. `TEST_API_PORT` can override 15001. Without explicit opt-in the integration test is reported as skipped, not passed.

Verified during implementation: frontend TypeScript + Vite production build; backend syntax/imports; isolated integration tests covering idempotency, ownership, privacy, stable IDs and edits, vertex/edge pruning, rollback after an injected write failure, sync serialization, route order, native weighted and bounded paths, passenger journeys, booking uniqueness, and graph-offline MySQL/partial-booking behavior. See the graph design document for scope and limits. No browser-driven UI test or production database migration is claimed.
