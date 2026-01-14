import { checkActionPermission, requireActionPermission, } from '@hit/feature-pack-auth-core/server/lib/action-check';
export async function checkDebugCoreAction(request, actionKey) {
    return checkActionPermission(request, actionKey, { logPrefix: 'Debug-Core' });
}
export async function requireDebugCoreAction(request, actionKey) {
    return requireActionPermission(request, actionKey, { logPrefix: 'Debug-Core' });
}
