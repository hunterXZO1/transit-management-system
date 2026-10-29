# Transit graph design: MySQL and ArangoDB

MySQL is the only authoritative store. Transactions, foreign keys, passenger contacts, trip stops, booking seat uniqueness, payments and tickets remain relational. The optional ArangoDB database provides route topology queries and a disposable read projection. No MySQL source table is migrated or removed.

## Named graph and ownership

`transit_graph` contains the following application-owned collections:

| Vertex type | Collection | Stable identity |
| --- | --- | --- |
| Station | `transit_station` | station_id |
| Route | `transit_route` | route_id |
| Trip | `transit_trip` | trip_id |
| Vehicle | `transit_vehicle` | vehicle_id |
| Driver | `transit_driver` | driver_id |
| Passenger | `transit_passenger` | passenger_id |

| Relationship | Edge collection | Endpoints | Stable identity |
| --- | --- | --- | --- |
| STOPS_AT | `transit_stops_at` | Route → Station | route_id, stop_order |
| CONNECTS_TO | `transit_connects_to` | Station → Station | from station, to station, route_id |
| SERVES | `transit_serves` | Trip → Station | trip_id, stop_order |
| ASSIGNED_TO | `transit_assigned_to` | Vehicle → Driver | vehicle_id |
| OPERATES | `transit_operates` | Trip → Route | trip_id |
| BOOKS | `transit_books` | Passenger → Trip | booking_id |
| HAS_TICKET | `transit_has_ticket` | Passenger → Trip | ticket_id |

Keys are SHA-256 hashes of JSON-encoded identity tuples. Primary-key indexes enforce uniqueness, and built-in edge indexes support traversal. Reordering or reassigning a stop replaces the same logical slot and removes obsolete adjacency on the next sync. BOOKS and HAS_TICKET carry booking and ticket facts as edge properties; they do not require redundant booking/ticket vertex collections. Payments are counted by ID in the sync result but are never projected. Amounts and transaction references are never selected for graph projection.

The reserved `transit_metadata/owner` marker identifies this schema version. Initialization refuses existing reserved collections or an existing named graph without that marker, validates the marker, and verifies graph edge definitions on each sync. Unrelated collections are neither queried for records nor pruned. Use a dedicated ArangoDB database; reserve the `transit_*` namespace for this application. Metadata/DDL bootstrap is separate from data projection; if interrupted during first initialization, investigate its partial schema rather than deleting arbitrary existing collections. The marker protects against accidental adoption, not against an administrator forging or modifying application metadata.

## Synchronization and failure model

1. Acquire a MySQL named lock on a dedicated pooled connection. CLI sync, HTTP sync and graph-booking projection use the same lock for that MySQL database. A lock timeout returns 409, allowing retry.
2. Read all required relational facts inside a read-only repeatable-read consistent snapshot on that same connection. Commit the read transaction while holding the named lock.
3. Build documents with stable keys and a unique batch UUID. Validate endpoints and nonnegative, nondecreasing route distances before any graph write.
4. Begin one ArangoDB streaming transaction with exclusive access to all 13 owned graph collections, with implicit collection access disallowed. Replace/upsert documents in batches of 500, then remove edges and vertices not in the new batch. The transaction includes all upserts and stale deletion.
5. Commit once, then release the MySQL named lock. Counts are computed from the exact committed projection, avoiding a second post-commit health request that could obscure a successful commit.

A pre-commit failure aborts the streaming transaction and retains the previous graph data. An uncertain commit acknowledgement explicitly reports unknown outcome; retrying sync is safe because keys and replacement semantics are deterministic. A lost connection/process eventually releases the MySQL lock and ArangoDB's abandoned transaction expires. No batch is pruned outside the graph transaction. Large projections can exceed the server transaction size/runtime limits; they fail instead of intentionally committing partial batches. This implementation targets the supplied **single-server ArangoDB** setup, not untested cluster-wide atomicity guarantees.

MySQL mutations can continue while a snapshot is being projected. The graph describes that snapshot, not later concurrent changes; another sync catches up. Graph booking projection takes the snapshot after its MySQL booking commit and uses the same serialization lock. If projection cannot be confirmed, the endpoint returns explicit durable-MySQL partial success, never a generic retry-booking error. MySQL and ArangoDB do not participate in a distributed transaction; there is no automatic background outbox worker.

## AQL and path semantics

All request values, documents, vertex handles, hop bounds and collection names are bind variables. No user input is interpolated into AQL. The only generated query fragment is one of two internal, fixed sort clauses for bounded path selection.

Ordered route traces traverse STOPS_AT and sort `edge.order`. Passenger journeys traverse BOOKS → Trip → OPERATES → Route, then SERVES sorted by stop order. Network queries read directed CONNECTS_TO edges and their endpoint documents. Each route's consecutive stops create bidirectional edges with weight equal to the difference in cumulative distance. Invalid negative differences abort sync rather than silently becoming zero-cost edges.

Native path selection uses:

```aql
FOR vertex, edge IN OUTBOUND SHORTEST_PATH @origin TO @destination @@connections
  OPTIONS { weightAttribute: "distance_km", defaultWeight: 1 }
  RETURN { vertex, edge }
```

ArangoDB's native shortest-path search does not impose `maxHops`. If its weighted optimum fits the requested bound it is also optimal under that bound. Otherwise, a bounded weighted traversal selects the least-distance simple path of 1 through `maxHops` edges. Nonnegative weights make simple paths sufficient for minimum distance; zero-cost cycles cannot improve the objective. Default bound 8 and clamp 1–10 are retained. The frontend displays its bound explicitly. The fewest-hop comparison is computed under the same bound. Equal-cost ties are not assigned a stable route preference.

Bounded enumeration can be expensive on dense graphs even at depth 10. Runtime limits return an error instead of a fabricated result. There are no claims that ArangoDB outperforms MySQL, and no previous engine's timings or validation assertions are reused.

## Official references consulted

- [Official arangojs client and installed API documentation](https://github.com/arangodb/arangojs) — pinned client 10.6.0, Node.js ≥20, `Graph.create(edgeDefinitions)`, `Database.beginTransaction`, `Transaction.step`, commit and abort.
- [ArangoDB 3.12 weighted shortest-path documentation](https://docs.arangodb.com/3.12/aql/graph-queries/shortest-path/) and [official source](https://github.com/arangodb/docs-hugo/blob/main/site/content/arangodb/3.12/aql/graph-queries/shortest-path.md).
- [ArangoDB 3.12 traversal documentation](https://docs.arangodb.com/3.12/aql/graph-queries/traversals/) and [official source](https://github.com/arangodb/docs-hugo/blob/main/site/content/arangodb/3.12/aql/graph-queries/traversals.md).

The documentation site's HTTP access was denied in the implementation environment; official GitHub sources and the installed client type declarations were inspected instead. APIs and AQL were then exercised against ArangoDB 3.12.4.

## Validation scope

`backend/tests/graph.integration.test.js` creates unique disposable databases and removes only those databases. Tests exercise real database queries and HTTP API behavior, including transaction rollback through an injected failure after graph writes begin. They cover sync idempotency, edits, stale vertices and booking edges, unrelated-collection retention, projection privacy, named graph definitions, serialization, ordered routes, weighted native paths, bounded fallback, no path within the hop bound, passenger journeys, seat uniqueness, authoritative passenger fields, graph-offline errors and durable booking partial success.

Frontend TypeScript/build and backend syntax/import checks are separate from the integration suite. No automated browser interaction, performance benchmark, production deployment, existing-database modification, or cluster-failover test is claimed. DA2 remains the baseline. See [run commands and demo](../README.md).
