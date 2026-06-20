"use strict";
const loadingScreen = document.querySelector(".loading-screen");
const codeEditorBtn = document.getElementById("code-editor");
const settingsBtn = document.getElementById("editor-settings");
const addNodeBtn = document.getElementById("add-node");
const deleteBtn = document.getElementById("delete");
const pathBtn = document.getElementById("path");
const clearBtn = document.getElementById("clear");
const hintBox = document.getElementById("hintbox");
const togglableBtns = [codeEditorBtn, addNodeBtn, deleteBtn, pathBtn];
const btnHints = ["Coding", "Add", "Delete", "Path"];
const canvasContainer = document.querySelector(".pixi-canvas");
let NodeCol = 0x5F81A8, PathCol = 0xFFFFFF;
let NodeCount = 1, PathCount = 1;
let Nodes = [];
let Paths = [];
let pathCreateState = false;
let startNodeForPath;
(async () => {
    //Pixi.js Setup Start
    const app = new PIXI.Application();
    await app.init({
        resizeTo: canvasContainer,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        background: "#030303",
        antialias: true
    });
    canvasContainer.appendChild(app.canvas);
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    app.stage.sortableChildren = true;
    Load();
    setTimeout(() => {
        loadingScreen.classList.add("faded-out-loading-screen");
        loadingScreen.style.pointerEvents = "none";
    }, 500);
    //Pixi.js Setup End
    //Button Toggling Start
    for (let i = 0; i < 4; i++) {
        const btn = togglableBtns[i];
        btn.addEventListener("click", () => {
            btn.classList.toggle("active");
            togglableBtns.forEach(b => b !== btn && b.classList.remove("active"));
            if (btn.classList.contains("active")) {
                ShowHint(btnHints[i]);
            }
            else {
                hintBox.innerHTML = "";
            }
        });
    }
    //Button Toggling End
    //HintBox Start
    function ShowHint(text) {
        hintBox.style.animation = "none";
        void hintBox.offsetWidth; //trigger reflow
        hintBox.style.animation = "appear 0.6s";
        hintBox.innerHTML = text;
    }
    //HintBox End
    //Node & Path Start
    function drawNode(x, y, idn) {
        const node = new PIXI.Graphics()
            .circle(x, y, 20)
            .fill(NodeCol);
        node.zIndex = 1;
        node.eventMode = "static";
        node.cursor = "pointer";
        const data = {
            idn: idn, //id number
            x: x,
            y: y
        };
        node.on("pointerdown", (e) => {
            e.stopPropagation();
            if (deleteBtn.classList.contains("active")) {
                node.destroy();
                Nodes = Nodes.filter((node) => node.idn !== data.idn);
                if (Nodes.length > 0)
                    NodeCount = Math.max(...Nodes.map((node) => node.idn)) + 1;
                Save();
            }
            else if (pathBtn.classList.contains("active")) {
                if (!pathCreateState) {
                    ShowHint("Start Node");
                    startNodeForPath = data;
                    pathCreateState = true;
                }
                else {
                    ShowHint("End Node");
                    if (startNodeForPath.idn === data.idn)
                        return;
                    const pdata = {
                        idn: PathCount,
                        startNode: startNodeForPath,
                        endNode: data
                    };
                    PathCount++;
                    drawPath(pdata);
                    Paths.push(pdata);
                    Save();
                    pathCreateState = false;
                    setTimeout(() => {
                        ShowHint("Path");
                    }, 700);
                }
            }
        });
        app.stage.addChild(node);
        return data;
    }
    function drawPath(pdata) {
        const path = new PIXI.Graphics()
            .moveTo(pdata.startNode.x, pdata.startNode.y)
            .lineTo(pdata.endNode.x, pdata.endNode.y)
            .stroke({ width: 2, color: PathCol });
        path.zIndex = 0;
        path.eventMode = "static";
        path.on("pointerdown", () => {
            if (deleteBtn.classList.contains("active")) {
                path.destroy();
                Paths = Paths.filter((p) => p.idn !== pdata.idn);
                if (Paths.length > 0)
                    PathCount = Math.max(...Paths.map((p) => p.idn)) + 1;
            }
        });
        app.stage.addChild(path);
    }
    app.stage.on("pointerdown", (e) => {
        if (addNodeBtn.classList.contains("active")) {
            const [ex, ey] = [e.global.x, e.global.y];
            NodeCount++;
            const ndata = drawNode(ex, ey, NodeCount);
            Nodes.push(ndata);
            Save();
        }
    });
    //Node & Path End
    //Clear Start
    clearBtn.onclick = () => {
        app.stage.children.forEach(obj => {
            if (obj.destroy) {
                obj.destroy();
            }
        });
        app.stage.removeChildren();
        localStorage.clear();
        Nodes = [], Paths = [];
        NodeCount = 1, PathCount = 1;
    };
    //Clear End
    //State Start
    function Save() {
        localStorage.setItem("state", JSON.stringify({ nodes: Nodes, paths: Paths }));
    }
    function Load() {
        const state = JSON.parse(localStorage.getItem("state")) ?? { nodes: [], paths: [] };
        if (state) {
            if (state.nodes.length > 0)
                NodeCount = Math.max(...state.nodes.map((node) => node.idn)) + 1;
            if (state.paths.length > 0)
                PathCount = Math.max(...state.paths.map((path) => path.idn)) + 1;
            state.nodes.forEach((node) => {
                drawNode(node.x, node.y, node.idn);
                Nodes.push(node);
            });
            state.paths.forEach((path) => {
                drawPath(path);
                Paths.push(path);
            });
        }
    }
    //State End
})();
//# sourceMappingURL=editor.js.map