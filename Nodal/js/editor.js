const loadingScreen = document.querySelector(".loading-screen");

const codeEditorBtn = document.getElementById("code-editor");

//const settingsBtn = document.getElementById("editor-settings");
//Later

const addNodeBtn = document.getElementById("add-node");
const deleteBtn = document.getElementById("delete");
const pathBtn = document.getElementById("path");
const clearBtn = document.getElementById("clear");

const hintBox = document.getElementById("hintbox");

const togglableBtns = [ addNodeBtn, deleteBtn, pathBtn ];
const btnHints = [ "Add", "Delete", "Path" ];

const canvasContainer = document.querySelector(".pixi-canvas");

let Nodes = new Map();
let Paths = new Map();

let pathCreateState = false;
let startNodeForPath;

//const codingPanel = document.querySelector(".coding-panel");
//Later

(async () => {
  //Pixi.js Setup Start
  const app = new PIXI.Application();
  
  const view = new PIXI.Container();
  
  await app.init({
    resizeTo: canvasContainer,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    transparent: true,
    antialias: true
  });
  app.renderer.background.alpha = 0;

  
  canvasContainer.appendChild(app.canvas);
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  view.sortableChildren = true;
  
  app.stage.addChild(view);
  
  setTimeout( () => {
    loadingScreen.classList.add("faded-out-loading-screen");
    loadingScreen.style.pointerEvents = "none";
  }, 450)
  
  
  const testd = new Neuron({x: 430, y: 330}, view)
   
const test = new Layer({x: 400, y: 300}, view);
setTimeout(() => test.setDim(0, 0), 3000)
console.log(test.nodes, test.id)
  //Pixi.js Setup End
  
  //Button Toggling Start
   const toggleBtn = (btn, hint) => {
    btn.classList.toggle("active");
    togglableBtns.forEach(b => b !== btn && b.classList.remove("active"));
      
    if (btn.classList.contains("active")) {
      ShowHint(hint);
    }
    else {
      hintBox.innerHTML = "";
    }
  }
  
  addNodeBtn.onclick = () => {
    toggleBtn(addNodeBtn, "Add");
  }
  deleteBtn.onclick = () => {
    toggleBtn(deleteBtn, "Delete");
    
    let noSelections = true;
    Nodes.forEach((node, id) => {
      if (node.selected) {
        noSelections = false;
        node.delete();
        Nodes.delete(id);
      }
    });
    if (!noSelections) {
      setTimeout( () => toggleBtn(deleteBtn, ""), 300);
    }
  }
  
  pathBtn.onclick = () => {
    toggleBtn(pathBtn, "Path")
  }
  //Button Toggling End
  
  //Visual Start
  
  //Visual End
  
  //Camera Start
  class Camera {
    constructor(app, viewport) {
      this.app = app;
      this.viewport = viewport;
      
      this.view = {
        scale: 1,
        zoom: 1
      }
      this.touchState = {
        prevDist: 0, 
        prevMidp: null
      }
      this.activePointers = new Map();
      
      this.touchOrbit();
      //this.keymiceOrbit();
    }
    
    touchOrbit = () => {
      this.app.stage.on("pointerdown", (e) => {
        this.activePointers.set(e.pointerId, {x: e.global.x, y: e.global.y});
        
        if (this.activePointers.size === 2) {
          const fArr = [...this.activePointers.values()];
          const f1 = fArr[0];
          const f2 = fArr[1];
          
          this.touchState.prevMidp = new PIXI.Point((f1.x + f2.x) / 2, (f1.y + f2.y) / 2);
          
          this.touchState.prevDist = Math.hypot(f1.x - f2.x, f1.y - f2.y);
        }
      });
      
      this.app.stage.on("pointermove", (e) => {
        if (!anyNodeDragging() && this.activePointers.size === 2 && this.activePointers.has(e.pointerId)) {
          this.activePointers.set(e.pointerId, {x: e.global.x, y: e.global.y});
          
          const fArr = [...this.activePointers.values()];
          const f1 = fArr[0];
          const f2 = fArr[1];
          
          const currDist = Math.hypot(f1.x - f2.x, f1.y - f2.y);
          const midpoint = new PIXI.Point((f1.x + f2.x) / 2, (f1.y + f2.y) / 2);
          
          if (!this.touchState.prevDist || !this.touchState.prevMidp) {
            this.touchState.prevDist = currDist;
            this.touchState.prevMidp = midpoint;
            return; 
          }
          
          const worldPoint = this.viewport.toLocal(midpoint);
          
          this.view.zoom = currDist / this.touchState.prevDist;
          const rawScale = this.view.scale * this.view.zoom;
          this.view.scale = Math.max(0.1, Math.min(10, rawScale));
          
          this.viewport.scale.set(this.view.scale);
          
          const worldPointAfter = this.viewport.toLocal(midpoint);
          
          const panX = midpoint.x - this.touchState.prevMidp.x;
          const panY = midpoint.y - this.touchState.prevMidp.y;
          
          this.viewport.x += (worldPointAfter.x - worldPoint.x) * this.view.scale + panX;
          this.viewport.y += (worldPointAfter.y - worldPoint.y) * this.view.scale + panY;
          
          this.touchState.prevDist = currDist;
          this.touchState.prevMidp = midpoint;
        }
      });
      
      this.app.stage.on("pointerup", (e) => {
        this.activePointers.delete(e.pointerId);
        
        if (this.activePointers.size <= 1) {
          this.touchState.prevDist = 0;
          this.touchState.prevMidp = null;
        }
      });
    }
    
  }
  
  const viewCamera = new Camera(app, view);
  
  const allCRUDInactive = () => !togglableBtns.some(btn => btn.classList.contains("active"));
  const anyNodeDragging = () => {
    for (const node of Nodes.values()) {
      if (node.isDragging) return true;
    }
    return false;
  }
  //Camera End
  
  //HintBox Start
  function ShowHint(text) {
    hintBox.style.animation = "none";
    void hintBox.offsetWidth; //trigger reflow
    hintBox.innerHTML = text;
    hintBox.style.animation = "appear 0.6s";
  }
  //HintBox End
})();