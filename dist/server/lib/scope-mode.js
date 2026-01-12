import { checkDebugCoreAction } from './require-action';
/**
 * Resolve effective scope mode using a tree:
 * - entity override: debug-core.{entity}.{verb}.scope.{mode}
 * - debug-core default: debug-core.{verb}.scope.{mode}
 * - fallback: own
 *
 * Precedence if multiple are granted: most restrictive wins.
 */
export async function resolveDebugCoreScopeMode(request, args) {
    const { entity, verb } = args;
    const entityPrefix = entity ? `debug-core.${entity}.${verb}.scope` : `debug-core.${verb}.scope`;
    const globalPrefix = `debug-core.${verb}.scope`;
    // Most restrictive wins (first match returned).
    const modes = ['none', 'own', 'ldd', 'any'];
    for (const m of modes) {
        const res = await checkDebugCoreAction(request, `${entityPrefix}.${m}`);
        if (res.ok)
            return m;
    }
    for (const m of modes) {
        const res = await checkDebugCoreAction(request, `${globalPrefix}.${m}`);
        if (res.ok)
            return m;
    }
    return 'own';
}
