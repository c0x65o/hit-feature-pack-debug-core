import { checkDebugCoreAction } from './require-action';
/**
 * Resolve effective scope mode using a tree:
 * - entity override: debug-core.{entity}.{verb}.scope.{mode}
 * - debug-core default: debug-core.{verb}.scope.{mode}
 * - fallback: own
 *
 * Precedence if multiple are granted: most restrictive wins.
 *
 * Back-compat:
 * - Treat `.scope.all` as `.scope.any` (debug-core originally used `all`).
 */
export async function resolveDebugCoreScopeMode(request, args) {
    const { entity, verb } = args;
    const entityPrefix = entity ? `debug-core.${entity}.${verb}.scope` : `debug-core.${verb}.scope`;
    const globalPrefix = `debug-core.${verb}.scope`;
    // Most restrictive wins (first match returned).
    const modes = ['none', 'own', 'ldd', 'any'];
    for (const m of modes) {
        if (m === 'any') {
            const resAll = await checkDebugCoreAction(request, `${entityPrefix}.all`);
            if (resAll.ok)
                return 'any';
            const resAny = await checkDebugCoreAction(request, `${entityPrefix}.any`);
            if (resAny.ok)
                return 'any';
            continue;
        }
        const res = await checkDebugCoreAction(request, `${entityPrefix}.${m}`);
        if (res.ok)
            return m;
    }
    for (const m of modes) {
        if (m === 'any') {
            const resAll = await checkDebugCoreAction(request, `${globalPrefix}.all`);
            if (resAll.ok)
                return 'any';
            const resAny = await checkDebugCoreAction(request, `${globalPrefix}.any`);
            if (resAny.ok)
                return 'any';
            continue;
        }
        const res = await checkDebugCoreAction(request, `${globalPrefix}.${m}`);
        if (res.ok)
            return m;
    }
    return 'own';
}
