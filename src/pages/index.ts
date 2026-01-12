/**
 * Debug Core Pages
 * 
 * Using direct exports for optimal tree-shaking and code splitting.
 * Each component is only bundled when actually imported/used.
 */

export { ServerStats, default as ServerStatsPage } from './ServerStats';
export { DbStats, default as DbStatsPage } from './DbStats';
export { DashboardState, default as DashboardStatePage } from './DashboardState';
export { UiSpecsList, default as UiSpecsListPage } from './UiSpecsList';
export { UiSpecsDetail, default as UiSpecsDetailPage } from './UiSpecsDetail';