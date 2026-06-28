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

let NodeCol = 0x5F81A8, PathCol = 0xFFFFFF;

let Nodes = new Map();
let Paths = new Map();

let pathCreateState = false;
let startNodeForPath;

//const codingPanel = document.querySelector(".coding-panel");
//Later

class Node {
  constructor(props, viewport) {
    this.x = props.x;
    this.y = props.y;
    this.id = crypto.randomUUID();
    this.label = props.label ? props.label : this.id;
    
    this.pig = new PIXI.Graphics().circle(0, 0, 20).fill(NodeCol);
    this.pig.position.set(this.x, this.y);
    this.pig.zIndex = 1;
    this.pig.eventMode = "static";
    this.pig.cursor = "pointer";
    
    this.pig.nodeId = this.id;
    
    this.selected = false;
    this.isDragging = false;
    this.dragOffset = {};
    this.dragTimeout = 0;
    this.pointerId = null;
    
    gsap.from(this.pig.scale, {
      x: 0,
      y: 0,
      duration: 0.2,
      ease: "power4.inOut"
    });
    
    viewport.addChild(this.pig);
    
    console.log(this.id, this.label, this.pig.nodeId);
  };
  
  delete() {
    gsap.to(this.pig.scale, {
      x: 0,
      y: 0,
      duration: 0.15,
      ease: "power4.inOut",
      onComplete: () => {
        this.pig.destroy();
      }
    });
  }
  
  update(props) {
    if (props.x !== undefined) {
      this.pig.position.x = props.x;
      this.x = props.x;
    }
    if (props.y !== undefined) {
      this.pig.position.y = props.y;
      this.y = props.y;
    }
    if (props.label !== undefined) {
      this.label = props.label;
    }
  }
  
  selectToggle(state) {
    if (state === undefined) this.selected = !this.selected;
    else this.selected = state;
    
    if (this.selected) {
      this.pig.clear().circle(0, 0, 20).fill(NodeCol).stroke({width: 2, color: 0xFFFFFF});
      this.pig.position.set(this.x, this.y);
    }
    else {
      this.pig.clear().circle(0, 0, 20).fill(NodeCol);
      this.pig.position.set(this.x, this.y);
    }
  }
  
}

(async () => {
  //Pixi.js Setup Start
  const app = new PIXI.Application();
  
  const view = new PIXI.Container();
  
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
  view.sortableChildren = true;
  
  app.stage.addChild(view);
  
  setTimeout( () => {
    loadingScreen.classList.add("faded-out-loading-screen");
    loadingScreen.style.pointerEvents = "none";
  }, 450)
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
  let lastTapTime = 0;
  let lastTapNodeId = null;
  
  //CreateDeleteSelect Nodes Start
  app.stage.on("pointerdown", (e) => {
    //Add Node Start
    if (addNodeBtn.classList.contains("active")) {
      const worldPos = view.toLocal(e.global);
      const [ex, ey] = [worldPos.x, worldPos.y]
      
      const newNode = new Node({x: ex, y: ey}, view);
      Nodes.set(newNode.id, newNode);
    }
    //Add Node End
    
    //Delete Start
    else if (deleteBtn.classList.contains("active")) {
      if (e.target instanceof PIXI.Graphics) {
        const schedno = Nodes.get(e.target.nodeId) //scheduled-death-of node
        schedno.delete();
        
        Nodes.delete(schedno.id);
      }
    }
    //Delete End
    
    //Select Nodes Start
    else if (e.target instanceof PIXI.Graphics) {
      const node = Nodes.get(e.target.nodeId);
    
      const now = performance.now();
      const isDoubleTap = (now - lastTapTime < 300) && (lastTapNodeId === node.id);
    
      if (isDoubleTap) {
        node.selectToggle();
        e.target.zIndex = node.selected ? 2 : 1;
  
        lastTapTime = 0;
        lastTapNodeId = null;
        
        node.isDragging = false;
        node.pointerId = null;
      }
      else {
        lastTapTime = now;
        lastTapNodeId = node.id;
  
        node.isDragging = true;
        node.pointerId = e.pointerId;
  
        const pointerLocal = node.pig.toLocal(e.global);
        node.dragOffset = { offx: -pointerLocal.x, offy: -pointerLocal.y };
      }
    }
    //Select Nodes End
  });
  //CreateDeleteSelect Nodes Emd
  
  //Drag Node Start
  app.stage.on("pointerdown", (e) => {
    if (e.target instanceof PIXI.Graphics && allCRUDInactive()) {
      const dragno = Nodes.get(e.target.nodeId);
      if (dragno.selected) {
        dragno.isDragging = true;
        dragno.pointerId = e.pointerId;
        const pointerLocal = dragno.pig.toLocal(e.global);
        dragno.dragOffset = { offx: -pointerLocal.x, offy: -pointerLocal.y };
      }
    }
  });

  app.stage.on("globalpointermove", (e) => {
    Nodes.forEach((node) => {
      if (node.pointerId === e.pointerId && node.isDragging) {
        const worldPos = view.toLocal(e.global);
        
        node.pig.position.x = worldPos.x + node.dragOffset.offx;
        node.pig.position.y = worldPos.y + node.dragOffset.offy;
        
        node.x = node.pig.position.x;
        node.y = node.pig.position.y;
      }
    });
  });

  const clearNodeDragState = (e) => {
    Nodes.forEach((node) => {
      if (node.dragTimeout) {
        clearTimeout(node.dragTimeout);
        node.dragTimeout = null;
      }
    
      if (node.pointerId === e.pointerId) {
        node.isDragging = false;
        node.pointerId = null;
        node.dragOffset = {};
      }
    });
  };
  
  app.stage.on("pointerup", clearNodeDragState);
  app.stage.on("pointerupoutside", clearNodeDragState);
  //Drag Nodes End
  
  //Visual End
  
  //Camera Start
  class Camera {
    constructor(app, viewport) {
      this.app = app;
      this.viewport = viewport;
      
      this.view = {
        scale: 1,
        zoom: 1,
        offsetX: 0,
        offsetY: 0
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
          console.log(anyNodeDragging())
          
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
          
          console.log(`scale: ${this.view.scale}\nzoom: ${this.view.zoom}`)
          
          this.viewport.scale.set(this.view.scale);
          
          const worldPointAfter = this.viewport.toLocal(midpoint);
          
          this.viewport.x += (worldPointAfter.x - worldPoint.x) * this.view.scale + (midpoint.x - this.touchState.prevMidp.x);
          this.viewport.y += (worldPointAfter.y - worldPoint.y) * this.view.scale + (midpoint.y - this.touchState.prevMidp.y);
          
          this.touchState.prevDist = currDist;
          this.touchState.prevMidp = midpoint;
        }
      });
      
      this.app.stage.on("pointerup", (e) => {
        console.log("pointerup:", e.pointerId);
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