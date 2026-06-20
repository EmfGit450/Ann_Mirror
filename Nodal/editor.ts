declare const PIXI: typeof import("pixi.js");

const codeEditorBtn = document.getElementById("code-editor")!;

const settingsBtn = document.getElementById("editor-settings")!;

const addNodeBtn = document.getElementById("add-node")!;
const deleteBtn = document.getElementById("delete")!;
const pathBtn = document.getElementById("path")!;
const clearBtn = document.getElementById("clear")!;

const hintBox = document.getElementById("hintbox")!;

const togglableBtns = [ codeEditorBtn, addNodeBtn, deleteBtn, pathBtn ];
const CRUDBtnHints = [ "Coding", "Add", "Delete", "Path" ];

/*const togglableBtns = {
  "Add": addNodeBtn,
  "Remove": deleteBtn,
  "Path": pathBtn
}*/

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
let NodeCount = 0, PathCount = 0;

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
  
  //Loading Screen Removal
  
  //Pixi.js Setup End
  
  //Button Toggling Start
  
  for (let i = 0; i < 4; i++) {
    const btn = togglableBtns[i]!;
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      togglableBtns.forEach(b => b !== btn && b.classList.remove("active"));
      
      if (btn.classList.contains("active")) {
        hintBox.innerHTML = CRUDBtnHints[i];
      } 
      else {
        hintBox.innerHTML = "";
      }
    });
  }
  //Button Toggling End
  
  //Node Start
  app.stage.on("pointerdown", (e) => {
    if (addNodeBtn.classList.contains("active")) {
      const [ ex, ey ] = [ e.global.x, e.global.y ];
      
      NodeCount++;
      
      const node = new PIXI.Graphics()
            .circle(ex, ey, 20)
            .fill(NodeCol);
      node.zIndex = 1;
      node.eventMode = "static";
      node.cursor = "pointer";
      
      const data: NodeData = {
        idn: NodeCount, //id number
        x: ex,
        y: ey
      }
      
      node.on("pointerdown", (e) => {
        e.stopPropagation();
        if (deleteBtn.classList.contains("active")) {
          node.destroy();
          Nodes = Nodes.filter(node => node.idn !== data.idn);
        }
      });
      
      Nodes.push(data);
      app.stage.addChild(node);
    }
    
  });
  //Node End
  
  
})();