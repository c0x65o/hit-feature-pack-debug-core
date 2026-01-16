'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import ServerStats from '../widgets/ServerStats';
import DbStats from '../widgets/DbStats';
import DashboardState from '../widgets/DashboardState';
import UiSpecDetailWidget from '../widgets/UiSpecDetailWidget';
export const contrib = {
    listWidgets: {
        serverStats: (args) => _jsx(ServerStats, { onNavigate: args.navigate }),
        dbStats: (args) => _jsx(DbStats, { onNavigate: args.navigate }),
        dashboardState: (args) => _jsx(DashboardState, { onNavigate: args.navigate }),
    },
    detailExtras: {
        uiSpecDetail: (args) => (_jsx(UiSpecDetailWidget, { record: args.record, ui: args.ui, navigate: args.navigate, platform: args.platform })),
    },
};
export default contrib;
