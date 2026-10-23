import { pool, withTransaction } from '../config/db.js';
import { ApiError } from '../utils/http.js';
import { normalizeForDb, rowToClient, validateChildValues, validateValue } from '../utils/fields.js';

const columnListOf = (spec) => [spec.pk.column, ...spec.fields.map((f) => f.column)];

const placeholders = (n) => Array(n).fill('?').join(', ');

function validateMain(spec, body) {
  const errors = [];
  const values = {};

  for (const field of spec.fields) {
    const raw = body?.[field.field];
    const missing = raw === undefined || raw === null || raw === '';

    if (missing) {
      if (field.required) {
        errors.push(`${field.label || field.field} is required.`);
      } else {
        values[field.column] = field.default ?? null;
      }
      continue;
    }

    const error = validateValue(field, raw);
    if (error) {
      errors.push(error);
      continue;
    }
    values[field.column] = normalizeForDb(field, raw);
  }

  if (errors.length) throw new ApiError(400, errors.join(' '));
  return values;
}

function validateChildren(spec, body) {
  try {
    return (spec.children || []).map((child) => ({
      child,
      values: validateChildValues(child.item, body?.[child.field]),
    }));
  } catch (err) {
    throw new ApiError(400, err.message);
  }
}

async function assertReferences(spec, body, conn) {
  for (const ref of spec.refs || []) {
    const value = body?.[ref.field];
    const missing = value === undefined || value === null || value === '';
    if (missing) {
      if (ref.nullable) continue;
      throw new ApiError(400, `${ref.label} is required.`);
    }
    const [rows] = await conn.query(
      `SELECT 1 AS ok FROM ${ref.table} WHERE ${ref.column} = ? LIMIT 1`,
      [String(value).trim()]
    );
    if (rows.length === 0) throw new ApiError(400, `${ref.label} "${value}" does not exist.`);
  }
}

async function assertNotConflicting(spec, values, conn, excludeId = null) {
  if (spec.seatConflict) {
    const [rows] = await conn.query(
      `SELECT booking_id FROM bookings
        WHERE trip_id = ? AND seat_number = ? AND date = ? AND status = 'Confirmed' LIMIT 1`,
      [values.trip_id, values.seat_number, values.date]
    );
    if (rows.length && rows[0].booking_id !== excludeId) {
      throw new ApiError(
        409,
        `Seat ${values.seat_number} is already booked on trip ${values.trip_id} for ${values.date}.`
      );
    }
  }

  if (spec.oneToOne && values[spec.oneToOne.column]) {
    const [rows] = await conn.query(
      `SELECT ${spec.pk.column} FROM ${spec.table}
        WHERE ${spec.oneToOne.column} = ? AND ${spec.pk.column} <> ? LIMIT 1`,
      [values[spec.oneToOne.column], excludeId ?? '']
    );
    if (rows.length) {
      throw new ApiError(
        409,
        `This ${spec.oneToOne.label} already operates vehicle ${rows[0][spec.pk.column]}. A driver can be assigned to only one vehicle.`
      );
    }
  }
}

function mapRow(spec, row) {
  const entity = { [spec.pk.field]: row[spec.pk.column] };
  for (const field of spec.fields) {
    entity[field.field] = rowToClient(field, row[field.column]);
  }
  for (const child of spec.children || []) {
    entity[child.field] = [];
  }
  return entity;
}

async function attachChildren(spec, entities, conn = pool) {
  if (!(spec.children || []).length || entities.length === 0) return entities;
  const ids = entities.map((e) => e[spec.pk.field]);
  for (const child of spec.children) {
    const [rows] = await conn.query(
      `SELECT ${child.fkColumn} AS owner, ${child.valueColumn} AS value
         FROM ${child.table}
        WHERE ${child.fkColumn} IN (${placeholders(ids.length)})
        ORDER BY ${child.valueColumn}`,
      ids
    );
    const grouped = new Map();
    for (const row of rows) {
      const list = grouped.get(row.owner) || [];
      list.push(row.value);
      grouped.set(row.owner, list);
    }
    for (const entity of entities) {
      entity[child.field] = grouped.get(entity[spec.pk.field]) || [];
    }
  }
  return entities;
}

async function readBack(conn, spec, idValue) {
  const [rows] = await conn.query(
    `SELECT ${columnListOf(spec).join(', ')} FROM ${spec.table} WHERE ${spec.pk.column} = ?`,
    [idValue]
  );
  const [entity] = await attachChildren(spec, [mapRow(spec, rows[0])], conn);
  return entity;
}

function resolveId(spec, body) {
  const raw = body?.[spec.pk.field] ?? (spec.idFrom ? spec.idFrom(body) : '');
  const idValue = String(raw ?? '').trim();
  if (!idValue) throw new ApiError(400, `${spec.label} identifier is required.`);
  const error = validateValue({ type: 'id', label: `${spec.label} ID` }, idValue);
  if (error) throw new ApiError(400, error);
  return idValue;
}

// Insert runs on the caller's connection so composite endpoints stay transactional.
export async function insertResource(conn, spec, body) {
  const idValue = resolveId(spec, body);
  await assertReferences(spec, body, conn);
  const children = validateChildren(spec, body);
  const values = validateMain(spec, body);

  await assertNotConflicting(spec, values, conn, idValue);

  const [existing] = await conn.query(
    `SELECT ${spec.pk.column} FROM ${spec.table} WHERE ${spec.pk.column} = ? FOR UPDATE`,
    [idValue]
  );
  if (existing.length) throw new ApiError(409, `${spec.label} ${idValue} already exists.`);

  const columns = [spec.pk.column, ...spec.fields.map((f) => f.column)];
  await conn.query(
    `INSERT INTO ${spec.table} (${columns.join(', ')}) VALUES (${placeholders(columns.length)})`,
    [idValue, ...spec.fields.map((f) => values[f.column] ?? null)]
  );

  for (const { child, values: childList } of children) {
    if (childList.length) {
      await conn.query(
        `INSERT INTO ${child.table} (${child.fkColumn}, ${child.valueColumn}) VALUES ${childList
          .map(() => '(?, ?)')
          .join(', ')}`,
        childList.flatMap((v) => [idValue, v])
      );
    }
  }

  return readBack(conn, spec, idValue);
}

export async function replaceResource(conn, spec, idValue, body) {
  await assertReferences(spec, body, conn);
  const children = validateChildren(spec, body);

  const [rows] = await conn.query(
    `SELECT ${spec.pk.column} FROM ${spec.table} WHERE ${spec.pk.column} = ? FOR UPDATE`,
    [idValue]
  );
  if (rows.length === 0) throw new ApiError(404, `${spec.label} ${idValue} was not found.`);

  const values = validateMain(spec, body);
  await assertNotConflicting(spec, values, conn, idValue);

  await conn.query(
    `UPDATE ${spec.table} SET ${spec.fields.map((f) => `${f.column} = ?`).join(', ')} WHERE ${spec.pk.column} = ?`,
    [...spec.fields.map((f) => values[f.column] ?? null), idValue]
  );

  for (const { child, values: childList } of children) {
    await conn.query(`DELETE FROM ${child.table} WHERE ${child.fkColumn} = ?`, [idValue]);
    if (childList.length) {
      await conn.query(
        `INSERT INTO ${child.table} (${child.fkColumn}, ${child.valueColumn}) VALUES ${childList
          .map(() => '(?, ?)')
          .join(', ')}`,
        childList.flatMap((v) => [idValue, v])
      );
    }
  }

  return readBack(conn, spec, idValue);
}

export async function listResources(spec) {
  const [rows] = await pool.query(
    `SELECT ${columnListOf(spec).join(', ')} FROM ${spec.table} ORDER BY ${spec.orderBy}`
  );
  return attachChildren(spec, rows.map((row) => mapRow(spec, row)));
}

export async function findResource(spec, resourceKey, filter = {}) {
  const [column, value] = Object.entries(filter)[0] || [];
  if (column) {
    const [rows] = await pool.query(
      `SELECT ${columnListOf(spec).join(', ')} FROM ${spec.table} WHERE ${spec.filterColumns[column]} = ? ORDER BY stop_order`,
      [value]
    );
    return rows.map((row) => mapRow(spec, row));
  }
  const [rows] = await pool.query(
    `SELECT ${columnListOf(spec).join(', ')} FROM ${spec.table} WHERE ${spec.pk.column} = ? LIMIT 1`,
    [resourceKey]
  );
  if (rows.length === 0) throw new ApiError(404, `${spec.label} ${resourceKey} was not found.`);
  const [entity] = await attachChildren(spec, [mapRow(spec, rows[0])]);
  return entity;
}

export async function createResource(spec, body) {
  return withTransaction((conn) => insertResource(conn, spec, body));
}

export async function updateResource(spec, idValue, body) {
  return withTransaction((conn) => replaceResource(conn, spec, idValue, body));
}

export async function deleteResource(spec, idValue, { force = false } = {}) {
  if (!force && (spec.referencedBy || []).length) {
    const blockers = [];
    for (const ref of spec.referencedBy) {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS n FROM ${ref.table} WHERE ${ref.column} = ?`,
        [idValue]
      );
      if (rows[0].n > 0) blockers.push(`${rows[0].n} ${ref.label}${rows[0].n === 1 ? '' : 's'}`);
    }
    if (blockers.length) {
      throw new ApiError(
        409,
        `${spec.label} ${idValue} is referenced by ${blockers.join(' and ')}. Delete or reassign those records first.`
      );
    }
  }

  const [result] = await pool.query(
    `DELETE FROM ${spec.table} WHERE ${spec.pk.column} = ?`,
    [idValue]
  );
  if (result.affectedRows === 0) throw new ApiError(404, `${spec.label} ${idValue} was not found.`);
  return { deletedId: idValue };
}
