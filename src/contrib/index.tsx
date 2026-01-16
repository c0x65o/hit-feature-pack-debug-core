'use client';

import React from 'react';
import ServerStats from '../widgets/ServerStats';
import DbStats from '../widgets/DbStats';
import DashboardState from '../widgets/DashboardState';
import UiSpecDetailWidget from '../widgets/UiSpecDetailWidget';

export type PackListWidgetRendererArgs = {
  entityKey: string;
  uiSpec: any;
  listSpec: any;
  navigate?: (path: string) => void;
  ui?: any;
  platform?: string;
  params?: Record<string, string>;
};

export type PackDetailExtraRendererArgs = {
  entityKey: string;
  record: any;
  uiSpec?: any;
  spec: any;
  navigate?: (path: string) => void;
  ui?: any;
  platform?: string;
};

export type PackContrib = {
  listWidgets?: Record<string, (args: PackListWidgetRendererArgs) => React.ReactNode>;
  detailExtras?: Record<string, (args: PackDetailExtraRendererArgs) => React.ReactNode>;
};

export const contrib: PackContrib = {
  listWidgets: {
    serverStats: (args) => <ServerStats onNavigate={args.navigate} />,
    dbStats: (args) => <DbStats onNavigate={args.navigate} />,
    dashboardState: (args) => <DashboardState onNavigate={args.navigate} />,
  },
  detailExtras: {
    uiSpecDetail: (args) => (
      <UiSpecDetailWidget
        record={args.record}
        ui={args.ui}
        navigate={args.navigate}
        platform={args.platform}
      />
    ),
  },
};

export default contrib;
