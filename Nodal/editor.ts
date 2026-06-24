declare const PIXI: typeof import("pixi.js");
type PIXIGraphics = import("pixi.js").Graphics;

const loadingScreen = document.querySelector(".loading-screen")! as HTMLElement;
const codeEditorBtn = document.getElementById("code-editor")!;

//const settingsBtn = document.getElementById("editor-settings")!;
//Later

const addNodeBtn = document.getElementById("add-node")!;
const deleteBtn = document.getElementById("delete")!;
const pathBtn = document.getElementById("path")!;
const clearBtn = document.getElementById("clear")!;

const hintBox = document.getElementById("hintbox")!;

const togglableBtns = [ addNodeBtn, deleteBtn, pathBtn ];
const btnHints = [ "Add", "Delete", "Path" ];

const canvasContainer = document.querySelector(".pixi-canvas")! as HTMLElement;

interface NodeData {
  idn: number;
  x: number;
  y: number;
}

interface PathData {
  idn: number;
  startNode: NodeData;
  endNode: NodeData;
  pgo?: PIXIGraphics | undefined; //pixi graphics object
}

let NodeCol = 0x5F81A8, PathCol = 0xFFFFFF;
let NodeCount = 1, PathCount = 1;

let Nodes: NodeData[] = [];
let Paths: PathData[] = [];

let pathCreateState: boolean = false;
let startNodeForPath: NodeData;


//const codingPanel = document.querySelector(".coding-panel");
//Later

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
  for (let i = 0; i < 3; i++) {
    const btn = togglableBtns[i]!;
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      togglableBtns.forEach(b => b !== btn && b.classList.remove("active"));
      
      if (btn.classList.contains("active")) {
        ShowHint(btnHints[i] as string);
      }
      else {
        hintBox.innerHTML = "";
      }
    });
  }
  //Button Toggling End
  
  //HintBox Start
  function ShowHint(text: string) {
    hintBox.style.animation = "none";
    void hintBox.offsetWidth; //trigger reflow
    hintBox.innerHTML = text;
    hintBox.style.animation = "appear 0.6s";
  }
  //HintBox End
  
  //Node & Path Start
  function drawNode(x: number, y: number, idn: number) {
    const node = new PIXI.Graphics()
          .circle(0, 0, 20)
          .fill(NodeCol);
          
    node.position.set(x, y);
    node.zIndex = 1;
    node.eventMode = "static";
    node.cursor = "pointer";
      
    const data: NodeData = {
      idn: idn, //id number
      x: x,
      y: y
    }
    
    app.stage.addChild(node); 
    
    let dragging = false;
    let thisPtrId: number | null = null;
    const offset = new PIXI.Point();
      
    node.on("pointerdown", (e) => {
      e.stopPropagation();
      if (deleteBtn.classList.contains("active")) {
        node.destroy();
        Nodes = Nodes.filter((node: NodeData) => node.idn !== data.idn);
        
        Paths.forEach(path => {
          if (path.startNode === data || path.endNode === data) {
            path.pgo?.destroy();
          }
        })
        Paths = Paths.filter(path => path.startNode !== data && path.endNode !== data);
       
        if (Nodes.length > 0) NodeCount = Math.max(...Nodes.map((node: NodeData) => node.idn)) + 1;
        else NodeCount = 1;
        
        Save();
      }
      
      else if (pathBtn.classList.contains("active")) {
        if (!pathCreateState) {
          ShowHint("Start Node")
          
          startNodeForPath = data;
          
          pathCreateState = true;
        }
        else {
          ShowHint("End Node")
          
          if (startNodeForPath.idn === data.idn) {
            setTimeout( () => {
              ShowHint("Path");
            }, 700);
            return;
          }
          
          PathCount++;
    
          const pdata = drawPath({startNode: startNodeForPath, endNode: data});
          
          Paths.push(pdata);
          Save();
          
          pathCreateState = false;
          
          setTimeout( () => {
            ShowHint("Path");
          }, 700);
        }
        
      }
      
      else {
        dragging = true;
        thisPtrId = e.pointerId;
      
        const localMouse = e.getLocalPosition(node);
        offset.x = localMouse.x;
        offset.y = localMouse.y;
      }
    });
    
    node.on("globalpointermove", (e) => {
      if (!dragging || e.pointerId !== thisPtrId) return;
      
      const stagePos = e.getLocalPosition(app.stage);
      
      const pathsToUpdate = Paths.filter(path => path.startNode === data || path.endNode === data);
      
      node.position.x = stagePos.x - offset.x;
      node.position.y = stagePos.y - offset.y;
      
      
      const tuda = Nodes.find(node => node.idn === idn); //to-update data
      if (tuda) {
        tuda.x = node.position.x;
        tuda.y = node.position.y;
      }
      
      pathsToUpdate.forEach(path => {
        drawPath({startNode: path.startNode, endNode: path.endNode, pgo: path.pgo});
      })
    });
    
    node.on("pointerup", () => {
      dragging = false;
      thisPtrId = null;
      Save();
    });
    node.on("pointerupoutside", () => {
      dragging = false;
      thisPtrId = null;
      Save();
    });
    
    return data;
  }
  
  function drawPath(ipdat: { idn?: number; startNode: NodeData; endNode: NodeData; pgo?: PIXIGraphics | undefined }) {
    let path = ipdat.pgo;
    if (path) {
      ipdat.pgo?.clear();
    }
    else {
      path = new PIXI.Graphics()
      
      path.zIndex = 0;
      path.eventMode = "static";
      
      path.on("pointerdown", () => {
        if (deleteBtn.classList.contains("active")) {
          path?.destroy();
          Paths = Paths.filter((p: PathData) => p.idn !== pdata.idn);
          
          if (Paths.length > 0) PathCount = Math.max(...Paths.map((p: PathData) => p.idn)) + 1;
          else PathCount = 1;
        }
      });
      
      app.stage.addChild(path);
    }
    
    path.moveTo(ipdat.startNode.x, ipdat.startNode.y)
        .lineTo(ipdat.endNode.x, ipdat.endNode.y)
        .stroke({ width: 2, color: PathCol });
    
    const pdata: PathData = {
      idn: ipdat.idn ? ipdat.idn : PathCount,
      startNode: ipdat.startNode,
      endNode: ipdat.endNode,
      pgo: path ? path : ipdat.pgo
    }
    
    return pdata;
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
  //Node & Path End
  
  //Clear Start
  clearBtn.onclick = () => {
    [...app.stage.children].forEach(obj => {
      obj?.destroy();
    });

    app.stage.removeChildren();
    
    localStorage.clear();
    Nodes = [], Paths = [];
    NodeCount = 1, PathCount = 1;
    pathCreateState = false;
  }
  //Clear End
   
  //State Start
  function Save() {
    const syncPaths = Paths.map(({pgo, ...other}) => other);
    
    localStorage.setItem("state", JSON.stringify({ nodes: Nodes, paths: syncPaths }));
  }
  
  function Load() {
    const state = JSON.parse(localStorage.getItem("state") as string) ?? { nodes: [], paths: [] };
    
    if (state) {
      if (state.nodes.length > 0) NodeCount = Math.max(...state.nodes.map((node: NodeData) => node.idn)) + 1;
      if (state.paths.length > 0) PathCount = Math.max(...state.paths.map((path: PathData) => path.idn)) + 1;
      
      state.nodes.forEach((node: NodeData) => {
        const hotnd = drawNode(node.x, node.y, node.idn);
        Nodes.push(hotnd);
      });
      state.paths.forEach((path: PathData) => {
        const StartNode = Nodes.find(n => n.idn === path.startNode.idn);
        const EndNode = Nodes.find(n => n.idn === path.endNode.idn);

        if (StartNode && EndNode) {
          path.startNode = StartNode;
          path.endNode = EndNode;
        }
        
        const pdata = drawPath(path);
        Paths.push(pdata);
      });
    }
  }
  //State End
  
  
  //Code Editor Start
  
  //Code Editor End
})();