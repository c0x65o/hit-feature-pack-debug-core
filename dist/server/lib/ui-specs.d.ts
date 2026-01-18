export type HitUiSpecs = {
    generated?: boolean;
    version?: number;
    entities?: Record<string, any>;
    fieldTypes?: Record<string, any>;
    workflows?: Record<string, any>;
    my?: Record<string, any>;
};
export type UiSpecRow = {
    id: string;
    entityKey: string;
    drizzleTable: string;
    tableId: string;
    listColumnCount: number;
    fieldCount: number;
    formSectionCount: number;
    relationCount: number;
    headerActionCount: number;
    detailExtrasCount: number;
};
export declare function loadUiSpecs(): Promise<HitUiSpecs | null>;
export declare function buildUiSpecRow(entityKey: string, entityAny: unknown): UiSpecRow;
export declare function buildUiSpecRows(specs: HitUiSpecs | null): UiSpecRow[];
//# sourceMappingURL=ui-specs.d.ts.map