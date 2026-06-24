declare const PIXI: typeof import("pixi.js");
type PIXIGraphics = import("pixi.js").Graphics;
declare const loadingScreen: HTMLElement;
declare const codeEditorBtn: HTMLElement;
declare const addNodeBtn: HTMLElement;
declare const deleteBtn: HTMLElement;
declare const pathBtn: HTMLElement;
declare const clearBtn: HTMLElement;
declare const hintBox: HTMLElement;
declare const togglableBtns: HTMLElement[];
declare const btnHints: string[];
declare const canvasContainer: HTMLElement;
interface NodeData {
    idn: number;
    x: number;
    y: number;
}
interface PathData {
    idn: number;
    startNode: NodeData;
    endNode: NodeData;
    pgo?: PIXIGraphics | undefined;
}
declare let NodeCol: number, PathCol: number;
declare let NodeCount: number, PathCount: number;
declare let Nodes: NodeData[];
declare let Paths: PathData[];
declare let pathCreateState: boolean;
declare let startNodeForPath: NodeData;
//# sourceMappingURL=editor.d.ts.map