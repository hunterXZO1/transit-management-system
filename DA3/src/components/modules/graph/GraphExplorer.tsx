import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Database,
  Loader2,
  MapPin,
  RefreshCw,
  Route as RouteIcon,
  Search,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { useTransit } from '../../../context/TransitContext';
import {
  graphApi,
  ApiError,
  GraphHealth,
  GraphPathResult,
  GraphRouteDetail,
  GraphPassengerJourneys,
  GraphEdge,
} from '../../../services/api';
import { Badge } from '../../common/Badge';

const messageOf = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Something went wrong while querying the graph.';

const Panel: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, children }) => (
  <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
    <header className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </header>
    <div className="px-5 py-4">{children}</div>
  </section>
);

const StateLine: React.FC<{ kind: 'loading' | 'error' | 'empty'; text: string }> = ({ kind, text }) => {
  if (kind === 'loading') {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-500 py-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        {text}
      </p>
    );
  }
  if (kind === 'error') {
    return (
      <p className="flex items-start gap-2 text-sm text-rose-800 bg-rose-50 border border-rose-200/70 rounded-lg p-3">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
        {text}
      </p>
    );
  }
  return (
    <p className="flex items-start gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
      <Database className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
      {text}
    </p>
  );
};

const selectClass =
  'w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10';

const buttonClass =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const GraphExplorer: React.FC = () => {
  const { routes, stations, passengers, addToast } = useTransit();

  // ---- Graph health ----
  const [health, setHealth] = useState<GraphHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [revision, setRevision] = useState(0);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const result = await graphApi.health();
      setHealth(result);
      setHealthError(null);
    } catch (err) {
      setHealth(null);
      setHealthError(messageOf(err));
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await graphApi.sync();
      const pruned = result.graph.prunedInThisRun;
      addToast(
        'success',
        'Graph refreshed',
        `${result.relational.stations} stations, ${result.relational.routes} routes and ${
          result.graph.relationships?.CONNECTS_TO ?? 0
        } connections synced from MySQL${pruned ? `; ${pruned.relationships} stale relationship(s) pruned` : ''}.`
      );
      setRevision(value => value + 1);
      setRouteDetail(null);
      setPath(null);
      setJourneys(null);
      await loadHealth();
    } catch (err) {
      addToast('error', 'Sync failed', messageOf(err));
    } finally {
      setSyncing(false);
    }
  };

  // ---- A. Stations along a route ----
  const [routeId, setRouteId] = useState('');
  const [routeDetail, setRouteDetail] = useState<GraphRouteDetail | null>(null);
  const [routeState, setRouteState] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle');
  const [routeError, setRouteError] = useState('');

  const loadRouteStops = async () => {
    if (!routeId) return;
    setRouteState('loading');
    try {
      const detail = await graphApi.routeStations(routeId);
      setRouteDetail(detail);
      setRouteState(detail.stops.length ? 'idle' : 'empty');
    } catch (err) {
      setRouteError(messageOf(err));
      setRouteState('error');
    }
  };

  // ---- B. Weighted shortest path ----
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [path, setPath] = useState<GraphPathResult | null>(null);
  const [pathState, setPathState] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle');
  const [pathError, setPathError] = useState('');

  const findPath = async () => {
    if (!originId || !destinationId) return;
    if (originId === destinationId) {
      setPathError('Pick two different stations.');
      setPathState('error');
      return;
    }
    setPathState('loading');
    try {
      const result = await graphApi.shortestPath(originId, destinationId);
      setPath(result);
      setPathState(result.pathStations.length ? 'idle' : 'empty');
    } catch (err) {
      setPathError(messageOf(err));
      setPathState('error');
    }
  };

  // ---- C. Passenger journeys ----
  const [passengerId, setPassengerId] = useState('');
  const [journeys, setJourneys] = useState<GraphPassengerJourneys | null>(null);
  const [journeyState, setJourneyState] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle');
  const [journeyError, setJourneyError] = useState('');

  const loadJourneys = async () => {
    if (!passengerId) return;
    setJourneyState('loading');
    try {
      const result = await graphApi.passengerJourneys(passengerId);
      setJourneys(result);
      setJourneyState(result.journeys.length ? 'idle' : 'empty');
    } catch (err) {
      setJourneyError(messageOf(err));
      setJourneyState('error');
    }
  };

  const nodeSummary = useMemo(() => {
    if (!health) return null;
    return Object.entries(health.nodes ?? {})
      .map(([label, count]) => `${label} ${count}`)
      .join('  ·  ');
  }, [health]);

  return (
    <div className="space-y-6">
      {/* Graph status bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="p-2 rounded-lg bg-emerald-50 border border-emerald-200/70">
            <Database className="w-4 h-4 text-emerald-600" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900">ArangoDB graph layer</p>
              {healthLoading ? (
                <Badge size="sm" variant="neutral">
                  checking
                </Badge>
              ) : health ? (
                <Badge size="sm" variant="success">
                  connected
                </Badge>
              ) : (
                <Badge size="sm" variant="danger">
                  offline
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {healthLoading
                ? 'Contacting /api/graph/health…'
                : health
                ? nodeSummary
                : healthError}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={loadHealth} className={buttonClass} disabled={healthLoading}>
            <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
            Check health
          </button>
          <button type="button" onClick={handleSync} className={buttonClass} disabled={syncing}>
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            {syncing ? 'Syncing…' : 'Sync from MySQL'}
          </button>
        </div>
      </div>

      {!healthLoading && !health && (
        <StateLine
          kind="error"
          text="The graph API is unreachable, so these three panels cannot run. MySQL CRUD stays fully functional — start ArangoDB, or run: npm run sync:graph"
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* A */}
        <Panel
          title="Stations along a route"
          subtitle="Graph walk of Route → STOPS_AT → Station ordered by stop order"
          icon={<RouteIcon className="w-4 h-4" />}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={routeId} onChange={(e) => setRouteId(e.target.value)} className={selectClass}>
              <option value="">Select a route…</option>
              {routes.map((r) => (
                <option key={r.routeId} value={r.routeId}>
                  {r.routeId} — {r.name} ({r.type})
                </option>
              ))}
            </select>
            <button type="button" onClick={loadRouteStops} className={buttonClass} disabled={!routeId || routeState === 'loading'}>
              {routeState === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Trace
            </button>
          </div>

          <div className="mt-4">
            {routeState === 'loading' && <StateLine kind="loading" text="Traversing the route in ArangoDB…" />}
            {routeState === 'error' && <StateLine kind="error" text={routeError} />}
            {routeState === 'empty' && <StateLine kind="empty" text="This route has no stops in the graph yet." />}
            {routeState === 'idle' && !routeDetail && (
              <p className="text-xs text-slate-400">Pick a route to list its stops in traversal order.</p>
            )}
            {routeState === 'idle' && routeDetail && (
              <ol className="space-y-2">
                <li className="text-xs text-slate-500">
                  {routeDetail.routeName} · {routeDetail.transitType} · total {routeDetail.totalDistanceKm} km
                </li>
                {routeDetail.stops.map((stop) => (
                  <li key={stop.stationId} className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                      {stop.stopOrder}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{stop.stationName}</p>
                      <p className="text-[11px] text-slate-500">
                        {stop.stationId} · {stop.area}, {stop.city} · {stop.distanceFromStartKm} km from origin
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Panel>

        {/* B */}
        <Panel
          title="Shortest journey between two stations"
          subtitle="Shortest distance within 8 hops using CONNECTS_TO.distance_km"
          icon={<MapPin className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
            <select value={originId} onChange={(e) => setOriginId(e.target.value)} className={selectClass}>
              <option value="">Origin…</option>
              {stations.map((s) => (
                <option key={s.stationId} value={s.stationId}>
                  {s.stationId} — {s.name}
                </option>
              ))}
            </select>
            <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)} className={selectClass}>
              <option value="">Destination…</option>
              {stations.map((s) => (
                <option key={s.stationId} value={s.stationId}>
                  {s.stationId} — {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={findPath}
              className={buttonClass}
              disabled={!originId || !destinationId || pathState === 'loading'}
            >
              {pathState === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Find path
            </button>
          </div>

          <div className="mt-4">
            {pathState === 'loading' && <StateLine kind="loading" text="Finding the shortest distance within 8 hops…" />}
            {pathState === 'error' && <StateLine kind="error" text={pathError} />}
            {pathState === 'empty' && <StateLine kind="empty" text="No connected path was found." />}
            {pathState === 'idle' && !path && (
              <p className="text-xs text-slate-400">
                Two connected stations are compared against the hop-count-optimal path as well.
              </p>
            )}
            {pathState === 'idle' && path && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                  <span>{path.totalDistanceKm} km</span>
                  <span className="text-slate-400 font-normal">over {path.totalHops} hop(s)</span>
                  {path.hopCountOptimalComparison && (
                    <span className="text-[11px] font-normal text-slate-500">
                      (fewest hops = {path.hopCountOptimalComparison.hopCount} hop(s) at{' '}
                      {path.hopCountOptimalComparison.totalDistanceKm} km)
                    </span>
                  )}
                </div>
                <ol className="space-y-1.5">
                  {path.pathStations.map((station, index) => (
                    <li key={station.stationId} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-center text-[11px] font-mono text-slate-400">{index + 1}</span>
                      <span className="font-medium text-slate-800">{station.name}</span>
                      <span className="text-[11px] text-slate-400">{station.stationId}</span>
                      {index < path.transitHops.length && (
                        <span className="text-[11px] text-slate-500">
                          → {path.transitHops[index].distanceKm} km via {path.transitHops[index].routeId} (
                          {path.transitHops[index].transitType})
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
                <p className="text-[11px] text-slate-400">
                  Strategy: {path.strategy} · search bounded to {path.maxHopsExplored} hops.
                </p>
              </div>
            )}
          </div>
        </Panel>

        {/* C */}
        <Panel
          title="Passenger journeys"
          subtitle="Passenger → BOOKS → Trip → OPERATES → Route traversal"
          icon={<Users className="w-4 h-4" />}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={passengerId} onChange={(e) => setPassengerId(e.target.value)} className={selectClass}>
              <option value="">Select a passenger…</option>
              {passengers.map((p) => (
                <option key={p.passengerId} value={p.passengerId}>
                  {p.passengerId} — {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadJourneys}
              className={buttonClass}
              disabled={!passengerId || journeyState === 'loading'}
            >
              {journeyState === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Load
            </button>
          </div>

          <div className="mt-4">
            {journeyState === 'loading' && <StateLine kind="loading" text="Reading booking relationships…" />}
            {journeyState === 'error' && <StateLine kind="error" text={journeyError} />}
            {journeyState === 'empty' && (
              <StateLine kind="empty" text="This passenger has no BOOKS edge in the graph. Create a booking, then run Sync from MySQL." />
            )}
            {journeyState === 'idle' && !journeys && (
              <p className="text-xs text-slate-400">Pick a passenger to see the trips they are linked to.</p>
            )}
            {journeyState === 'idle' && journeys && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  {journeys.name} ({journeys.passengerId})
                </p>
                {journeys.journeys.map((j) => (
                  <div key={j.bookingId} className="p-3 border border-slate-200 rounded-lg bg-slate-50/60">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">
                        {j.tripId} · {j.routeName}
                      </p>
                      <Badge size="sm" variant={j.status === 'Confirmed' ? 'success' : 'neutral'}>
                        {j.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {j.date} · seat {j.seatNumber} · booking {j.bookingId} · {j.boardedAt} → {j.alightAt} ·{' '}
                      {j.connectedStations} stop(s) served
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        {/* Network topology */}
        <Panel
          title="Connectivity edges"
          subtitle="Every Station → CONNECTS_TO → Station edge built from route stop adjacency"
          icon={<Database className="w-4 h-4" />}
        >
          <NetworkEdges key={revision} />
        </Panel>
      </div>
    </div>
  );
};

const NetworkEdges: React.FC = () => {
  const [edges, setEdges] = useState<GraphEdge[] | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'idle'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    graphApi
      .network()
      .then((result) => {
        if (cancelled) return;
        setEdges(result);
        setState('idle');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(messageOf(err));
        setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') return <StateLine kind="loading" text="Loading graph topology…" />;
  if (state === 'error') return <StateLine kind="error" text={error} />;
  if (!edges || edges.length === 0)
    return <StateLine kind="empty" text="No CONNECTS_TO edges. Run Sync from MySQL." />;

  return (
    <ul className="space-y-1.5 max-h-72 overflow-auto pr-1">
      {edges.map((e) => (
        <li key={`${e.fromStation}-${e.toStation}-${e.routeId}`} className="flex items-center gap-2 text-xs">
          <span className="font-mono text-slate-500">{e.fromStation}</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="font-mono text-slate-500">{e.toStation}</span>
          <span className="text-slate-700 truncate">
            {e.fromName} → {e.toName}
          </span>
          <span className="ml-auto text-slate-500 whitespace-nowrap">
            {e.distanceKm} km · {e.routeId} · {e.transitType}
          </span>
        </li>
      ))}
    </ul>
  );
};
