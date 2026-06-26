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
    
    else {
      if (e.target instanceof PIXI.Graphics) {
        const selno = Nodes.get(e.target.nodeId);
        selno.selectToggle();
      }
    }
  });
  //Visual End
  
  //Camera Start
  let scale = 1;
  let prevDist = 0;
  let prevMidp;
  
  const allCRUDInactive = () => !togglableBtns.some(btn => btn.classList.contains("active"));
  
  const TouchCamera = (e) => {
    if (e.touches.length === 2 && allCRUDInactive()) {
      const lf1 = new PIXI.Point(e.touches[0].clientX, e.touches[0].clientY);
      const lf2 = new PIXI.Point(e.touches[1].clientX, e.touches[1].clientY);
        
      const [dx, dy] = [lf2.x - lf1.x, lf1.y - lf2.y];
      
      const distance = Math.hypot(dx, dy);
      
      const midpoint = new PIXI.Point((lf1.x + lf2.x) / 2, (lf1.y + lf2.y) / 2);
        
      if (e.type === "touchstart") {
        prevDist = distance;
        prevMidp = midpoint;
      }
      else if (e.type == "touchmove") {
        const worldPoint = view.toLocal(midpoint);
        
        const zoom = distance / prevDist;
        
        targetScale = scale *= zoom;
        scale = Math.max(0.075, Math.min(6, scale) );
        
        view.scale.set(scale);
        
        const changed = view.toGlobal(worldPoint);
        
        view.x += (midpoint.x - prevMidp.x) + (midpoint.x - changed.x);
        view.y += (midpoint.y - prevMidp.y) + (midpoint.y - changed.y);
        
        prevDist = distance;
        prevMidp = midpoint;
      }
      else {
        prevDist = 0;
        prevMidp = null;
      }
    }
  }
  canvasContainer.addEventListener("touchstart", TouchCamera);
  canvasContainer.addEventListener("touchmove", TouchCamera);
  canvasContainer.addEventListener("touchend", TouchCamera);
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