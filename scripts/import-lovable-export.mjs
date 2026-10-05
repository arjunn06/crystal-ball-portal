#!/usr/bin/env node
// One-off import of the Lovable Cloud CSV exports into a fresh Supabase project.
//
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/import-lovable-export.mjs <folder-with-csvs> [--dry-run] [--replace-existing]
//
// Auth users are recreated with their ORIGINAL ids and emails so every foreign key
// (profiles, subscriptions, lesson_progress...) lines up. Users then sign in with
// the same email (OTP or Google) and land on their existing account.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const [dir, ...flags] = process.argv.slice(2)
const DRY = flags.includes('--dry-run')
const REPLACE = flags.includes('--replace-existing')
const URL_ = process.env.SUPABASE_URL?.replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!dir || !URL_ || !KEY) {
  console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-lovable-export.mjs <csv-folder> [--dry-run]')
  process.exit(1)
}

// Order matters: parents before children.
const TABLES = [
  'profiles',
  'user_roles',
  'courses',
  'course_modules',
  'lessons',
  'lesson_progress',
  'subscriptions',
  'discord_config',
  'discord_role_claims',
  'admin_audit_log',
]
const CONFLICT = {
  profiles: 'id',
  user_roles: 'user_id,role',
  courses: 'id',
  course_modules: 'id',
  lessons: 'id',
  lesson_progress: 'user_id,lesson_id',
  subscriptions: 'id',
  discord_config: 'id',
  discord_role_claims: 'id',
  admin_audit_log: 'id',
}
// Columns whose CSV text is JSON and must be sent as real JSON values.
const JSON_COLS = new Set(['role_ids', 'red_pill_role_ids', 'roles_cache', 'red_roles_cache', 'details'])
// Old column name -> new column name, applied only when the new table lacks the old one.
const RENAMES = { user_roles: { created_at: 'granted_at' } }
// Tables whose user_id must exist as an auth user.
const USER_FK = { user_roles: ['user_id'], lesson_progress: ['user_id'], subscriptions: ['user_id'], discord_role_claims: ['user_id'] }

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const rows = []
  let row = [], field = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else q = false }
      else field += c
    } else if (c === '"') q = true
    else if (c === ';') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] === undefined || r[i] === '' ? null : r[i]])))
}

const files = readdirSync(dir)
function load(table) {
  const f = files.find((n) => n.startsWith(`${table}-export-`) && n.endsWith('.csv'))
  return f ? parseCsv(readFileSync(join(dir, f), 'utf8')) : null
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

async function destColumns() {
  const res = await fetch(`${URL_}/rest/v1/`, { headers: H })
  if (!res.ok) throw new Error(`Cannot read schema: ${res.status} ${await res.text()}`)
  const spec = await res.json()
  return Object.fromEntries(Object.entries(spec.definitions ?? {}).map(([t, d]) => [t, new Set(Object.keys(d.properties ?? {}))]))
}

async function listAuthUsers() {
  const all = []
  for (let page = 1; ; page++) {
    const res = await fetch(`${URL_}/auth/v1/admin/users?page=${page}&per_page=1000`, { headers: H })
    if (!res.ok) throw new Error(`Cannot list users: ${res.status} ${await res.text()}`)
    const { users } = await res.json()
    all.push(...users)
    if (users.length < 1000) return all
  }
}

async function deleteAuthUser(id) {
  const res = await fetch(`${URL_}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: H })
  return res.ok
}

async function createAuthUser(p, existingByEmail, existingById) {
  if (existingById.has(p.id)) return 'exists'
  const clash = existingByEmail.get(p.email.toLowerCase())
  if (clash) {
    // Same email already registered under a different id (e.g. a test login on the new project).
    if (!REPLACE) return `MISMATCH: ${p.email} already exists as ${clash.id}, expected ${p.id} (rerun with --replace-existing to swap it)`
    if (!(await deleteAuthUser(clash.id))) return `ERROR could not delete existing user ${clash.id}`
  }
  const res = await fetch(`${URL_}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: p.id,
      email: p.email,
      email_confirm: true,
      user_metadata: { full_name: p.full_name, avatar_url: p.avatar_url },
    }),
  })
  if (res.ok) return clash ? 'replaced' : 'created'
  return `ERROR ${res.status}: ${(await res.text()).slice(0, 200)}`
}

async function upsert(table, rows) {
  for (let i = 0; i < rows.length; i += 200) {
    const res = await fetch(`${URL_}/rest/v1/${table}?on_conflict=${CONFLICT[table]}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows.slice(i, i + 200)),
    })
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`)
  }
}

const data = Object.fromEntries(TABLES.map((t) => [t, load(t)]))
for (const t of TABLES) console.log(`${t.padEnd(22)} ${data[t] ? data[t].length + ' rows' : 'NO CSV FOUND (skipped)'}`)

const profiles = data.profiles ?? []
const userIds = new Set(profiles.map((p) => p.id))
const dest = await destColumns()

// Prepare rows: rename/drop columns, parse JSON, drop rows whose user doesn't exist.
const prepared = {}
for (const t of TABLES) {
  const rows = data[t]
  if (!rows) continue
  const cols = dest[t]
  if (!cols) { console.error(`!! table public.${t} not found in destination — did the migrations run?`); process.exit(1) }
  const dropped = new Set()
  let skipped = 0
  const out = []
  for (const r of rows) {
    if (USER_FK[t] && USER_FK[t].some((c) => r[c] && !userIds.has(r[c]))) { skipped++; continue }
    const o = {}
    for (const [k, v] of Object.entries(r)) {
      let key = k
      if (!cols.has(key) && RENAMES[t]?.[k] && cols.has(RENAMES[t][k])) key = RENAMES[t][k]
      if (!cols.has(key)) { dropped.add(k); continue }
      o[key] = v !== null && JSON_COLS.has(k) ? JSON.parse(v) : v
    }
    out.push(o)
  }
  prepared[t] = out
  if (dropped.size) console.log(`  ${t}: columns not in destination, skipped: ${[...dropped].join(', ')}`)
  if (skipped) console.log(`  ${t}: ${skipped} rows skipped (user has no profile/auth account)`)
}

if (DRY) { console.log('\nDry run only — nothing written.'); process.exit(0) }

console.log(`\nCreating ${profiles.length} auth users...`)
const existing = await listAuthUsers()
const existingByEmail = new Map(existing.filter((u) => u.email).map((u) => [u.email.toLowerCase(), u]))
const existingById = new Set(existing.map((u) => u.id))
const tally = {}
let blocked = 0
for (const p of profiles) {
  if (!p.email) { console.log(`  skip ${p.id}: no email`); continue }
  const r = await createAuthUser(p, existingByEmail, existingById)
  const k = r.startsWith('ERROR') || r.startsWith('MISMATCH') ? 'problem' : r
  tally[k] = (tally[k] ?? 0) + 1
  if (k === 'problem') { blocked++; console.log(`  ${p.email}: ${r}`) }
  await new Promise((r) => setTimeout(r, 120))
}
console.log('  ', tally)
if (blocked) { console.error(`\n${blocked} user(s) could not be created; stopping before importing tables.`); process.exit(1) }

for (const t of TABLES) {
  if (!prepared[t]?.length) continue
  await upsert(t, prepared[t])
  console.log(`imported ${t}: ${prepared[t].length}`)
}
console.log('\nDone.')
