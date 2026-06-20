declare const PIXI: typeof import("pixi.js");
declare const codeEditorBtn: HTMLElement;
declare const settingsBtn: HTMLElement;
declare const addNodeBtn: HTMLElement;
declare const deleteBtn: HTMLElement;
declare const pathBtn: HTMLElement;
declare const clearBtn: HTMLElement;
declare const togglableBtns: HTMLElement[];
declare const canvasContainer: HTMLElement;
interface NodeData {
    idn: number;
    x: number;
    y: number;
}
interface PathData {
    startNode: NodeData;
    endNode: NodeData;
}
declare let NodeCol: string, PathCol: string;
declare let NodeCount: number, PathCount: number;
declare let Nodes: NodeData[];
declare let Paths: PathData[];
//# sourceMappingURL=editor.d.ts.map