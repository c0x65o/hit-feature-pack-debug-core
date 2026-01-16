import React from 'react';
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
export declare const contrib: PackContrib;
export default contrib;
//# sourceMappingURL=index.d.ts.map