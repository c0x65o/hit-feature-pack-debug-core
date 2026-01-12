import { NextResponse } from 'next/server';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { resolveDebugCoreScopeMode } from '../lib/scope-mode';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function statFsFor(targetPath) {
    const s = await fs.statfs(targetPath);
    // Prefer 64-bit math; Node exposes bigint fields.
    const bsize = Number(s.bsize);
    const blocks = Number(s.blocks);
    const bfree = Number(s.bfree);
    const bavail = Number(s.bavail);
    const totalBytes = bsize * blocks;
    const freeBytes = bsize * bfree;
    const availBytes = bsize * bavail;
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    return {
        path: targetPath,
        total_bytes: totalBytes,
        used_bytes: usedBytes,
        free_bytes: freeBytes,
        available_bytes: availBytes,
    };
}
async function readTextMaybe(p) {
    try {
        const v = await fs.readFile(p, 'utf8');
        return String(v).trim();
    }
    catch {
        return null;
    }
}
async function readCgroupStats() {
    // Best-effort: works in many containers (cgroup v2); returns nulls when not available.
    const memCurrent = await readTextMaybe('/sys/fs/cgroup/memory.current');
    const memMax = await readTextMaybe('/sys/fs/cgroup/memory.max');
    const cpuMax = await readTextMaybe('/sys/fs/cgroup/cpu.max');
    const cpuStat = await readTextMaybe('/sys/fs/cgroup/cpu.stat');
    const parseIntMaybe = (s) => {
        if (!s)
            return null;
        if (s === 'max')
            return null;
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) ? n : null;
    };
    const cpu = (() => {
        if (!cpuMax)
            return null;
        const parts = cpuMax.split(/\s+/).filter(Boolean);
        if (parts.length < 2)
            return null;
        const quota = parts[0] === 'max' ? null : parseIntMaybe(parts[0]);
        const period = parseIntMaybe(parts[1]);
        return { quota_us: quota, period_us: period };
    })();
    const cpuStatObj = (() => {
        if (!cpuStat)
            return null;
        const out = {};
        for (const line of cpuStat.split('\n')) {
            const [k, v] = line.trim().split(/\s+/, 2);
            if (!k || !v)
                continue;
            const n = Number.parseInt(v, 10);
            if (Number.isFinite(n))
                out[k] = n;
        }
        return Object.keys(out).length ? out : null;
    })();
    return {
        memory_current_bytes: parseIntMaybe(memCurrent),
        memory_max_bytes: parseIntMaybe(memMax),
        cpu,
        cpu_stat: cpuStatObj,
    };
}
export async function GET(req) {
    const mode = await resolveDebugCoreScopeMode(req, { entity: 'debug', verb: 'read' });
    // Explicit branching on all four modes.
    // For debug endpoints we treat own/ldd as allowed (equivalent to any) because there is no
    // meaningful ownership/ldd filtering for system stats, and admins are provisioned with `.own`
    // by default for scope groups.
    if (mode === 'none') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    else if (mode === 'own') {
        // allow
    }
    else if (mode === 'ldd') {
        // allow
    }
    else if (mode === 'any') {
        // allow
    }
    else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    try {
        const procMem = process.memoryUsage();
        const osTotal = os.totalmem();
        const osFree = os.freemem();
        const cwd = process.cwd();
        const rootPath = path.parse(cwd).root || '/';
        const disks = await Promise.allSettled([
            statFsFor(cwd),
            statFsFor(rootPath),
            statFsFor('/tmp'),
        ]);
        const diskItems = disks
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value);
        const cgroup = await readCgroupStats();
        return NextResponse.json({
            now: new Date().toISOString(),
            node: {
                version: process.version,
                pid: process.pid,
                uptime_s: Math.round(process.uptime()),
            },
            os: {
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
                hostname: os.hostname(),
                uptime_s: os.uptime(),
                loadavg_1_5_15: os.loadavg(),
                cpus: os.cpus()?.length ?? null,
                total_mem_bytes: osTotal,
                free_mem_bytes: osFree,
            },
            process_memory_bytes: {
                rss: procMem.rss,
                heap_total: procMem.heapTotal,
                heap_used: procMem.heapUsed,
                external: procMem.external,
                array_buffers: procMem.arrayBuffers ?? null,
            },
            disks: diskItems,
            cgroup,
        });
    }
    catch (e) {
        return NextResponse.json({ error: e?.message ?? String(e), stack: e?.stack }, { status: 500 });
    }
}
