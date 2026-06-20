declare const PIXI: typeof import("pixi.js");

const loadingScreen = document.querySelector(".loading-screen")! as HTMLElement;
const codeEditorBtn = document.getElementById("code-editor")!;

const settingsBtn = document.getElementById("editor-settings")!;

const addNodeBtn = document.getElementById("add-node")!;
const deleteBtn = document.getElementById("delete")!;
const pathBtn = document.getElementById("path")!;
const clearBtn = document.getElementById("clear")!;

const hintBox = document.getElementById("hintbox")!;

const togglableBtns = [ codeEditorBtn, addNodeBtn, deleteBtn, pathBtn ];
const CRUDBtnHints = [ "Coding", "Add", "Delete", "Path" ];

const canvasContainer = document.querySelector(".pixi-canvas")! as HTMLElement;

interface NodeData {
  idn: number;
  x: number;
  y: number;
}

interface PathData {
  startNode: NodeData;
  endNode: NodeData;
}

let NodeCol = "#5F81A8", PathCol = "#FFFFFF";
let NodeCount = 1, PathCount = 1;

let Nodes: NodeData[] = [];
let Paths: PathData[] = [];

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
  
  setTimeout( () => {
    loadingScreen.classList.add("faded-out-loading-screen");
    loadingScreen.style.pointerEvents = "none";
  }, 500)
  //Pixi.js Setup End
  
  //Button Toggling Start
  
  for (let i = 0; i < 4; i++) {
    const btn = togglableBtns[i]!;
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      togglableBtns.forEach(b => b !== btn && b.classList.remove("active"));
      
      if (btn.classList.contains("active")) {
        hintBox.innerHTML = CRUDBtnHints[i] as string;
      } 
      else {
        hintBox.innerHTML = "";
      }
    });
  }
  //Button Toggling End
  
  //Node Start
  function drawNode(x: number, y: number, idn: number) {
    const node = new PIXI.Graphics()
          .circle(x, y, 20)
          .fill(NodeCol);
    node.zIndex = 1;
    node.eventMode = "static";
    node.cursor = "pointer";
      
    const data: NodeData = {
      idn: idn, //id number
      x: x,
      y: y
    }
      
    node.on("pointerdown", (e) => {
      e.stopPropagation();
      if (deleteBtn.classList.contains("active")) {
        node.destroy();
        Nodes = Nodes.filter((node: NodeData) => node.idn !== data.idn);
       
        if (Nodes.length > 0) NodeCount = Math.max(...Nodes.map((node: NodeData) => node.idn)) + 1;
        else NodeCount = 1;
        
        Save();
      }
    });
      
    app.stage.addChild(node);
    
    return data;
  }
  
  app.stage.on("pointerdown", (e) => {
    if (addNodeBtn.classList.contains("active")) {
      const [ ex, ey ] = [ e.global.x, e.global.y ];
      
      NodeCount++;
      const ndata = drawNode(ex, ey, NodeCount);
      
      Nodes.push(ndata);
      Save();
    }
    
  });
  //Node End
  
  //State Start
  function Save() {
    localStorage.setItem("state", JSON.stringify({ nodes: Nodes }));
  }
  
  function Load() {
    const state = JSON.parse(localStorage.getItem("state") as string) ?? { nodes: [] };
    
    if (state) {
      
      if (state.nodes.length > 0) NodeCount = Math.max(...state.nodes.map((node: NodeData) => node.idn)) + 1;
      else NodeCount = 1;
      
      state.nodes.forEach((node: NodeData) => {
        drawNode(node.x, node.y, node.idn);
        Nodes.push(node);
      });
    }
  }
  //State End
})();