declare const PIXI: typeof import("pixi.js");

const codeEditorBtn = document.getElementById("code-editor")!;

const settingsBtn = document.getElementById("editor-settings")!;

const addNodeBtn = document.getElementById("add-node")!;
const deleteBtn = document.getElementById("delete")!;
const pathBtn = document.getElementById("path")!;
const clearBtn = document.getElementById("clear")!;

const togglableBtns = [ codeEditorBtn, addNodeBtn, deleteBtn, pathBtn ];

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
  togglableBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      togglableBtns.forEach(b => b !== btn && b.classList.remove("active"));
    });
  });
  //Button Toggling End
  
  //Add Start
  app.stage.on("pointerdown", (e) => {
    if (addNodeBtn.classList.contains("active")) {
      const [ ex, ey ] = [ e.global.x, e.global.y ];
      
      NodeCount++;
      
      const node = new PIXI.Graphics()
            .circle(ex, ey, 20)
            .fill(NodeCol);
      node.zIndex = 1;
      
      const data: NodeData = {
        idn: NodeCount, //id number
        x: ex,
        y: ey
      }
      
      Nodes.push(data);
      app.stage.addChild(node);
    }
    
  })
  //Add End
  
  
})();