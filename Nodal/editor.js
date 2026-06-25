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
let NodeCount = 0, PathCount = 0;

let Nodes = [];
let Paths = [];

let pathCreateState = false;
let startNodeForPath;

//const codingPanel = document.querySelector(".coding-panel");
//Later

class Node {
  constructor(props, viewport) {
    this.x = props.x;
    this.y = props.y;
    this.idn = props.idn;
    
    this.pig = new PIXI.Graphics().circle(0, 0, 20).fill(NodeCol);
    this.pig.position.set(this.x, this.y);
    this.pig.zIndex = 1;
    this.pig.eventMode = "static";
    this.pig.cursor = "pointer";
    
    this.selected = false;
    
    gsap.from(this.pig.scale, {
      x: 0,
      y: 0,
      duration: 0.3,
      ease: "power4.inOut"
    });
    
    viewport.addChild(this.pig);
  };
  
  delete() {
    gsap.to(this.pig.scale, {
      x: 0,
      y: 0,
      duration: 0.2,
      ease: "power4.inOut",
      onComplete: () => {
        this.pig.destroy();
      }
    });
  }
  
  update(props) {
    if (props.x) {
      this.pig.position.x = props.x;
      this.x = props.x;
    }
    if (props.y) {
      this.pig.position.y = props.y;
      this.y = props.y;
    }
    this.idn = props.idn ? props.idn : this.idn;
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
  }, 500)
  //Pixi.js Setup End
  
  //Button Toggling Start
  for (let i = 0; i < 3; i++) {
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
  
  //Visual Start
  app.stage.on("pointerdown", (e) => {
    //Add Node Start
    if (addNodeBtn.classList.contains("active")) {
      const worldPos = view.toLocal(e.global);
      const [ex, ey] = [worldPos.x, worldPos.y]
      
      NodeCount++;
      const newNode = new Node({x: ex, y: ey, idn: NodeCount}, view);
      Nodes.push(newNode);
    }
    //Add Node End
    
    //Delete Start
    else if (deleteBtn.classList.contains("active")) {
      if (e.target instanceof PIXI.Graphics) {
        const schedno = Nodes.find(node => node.pig === e.target) //scheduled death of node node
        schedno.selectToggle(false);
        schedno.delete();
      }
    }
    //Delete End
  });
  //Visual End
  
  //Camera Start
  let scale = 1;
  let prevDist = 0;
  
  canvasContainer.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!(addNodeBtn.classList.contains("active")) &&
        !(deleteBtn.classList.contains("active")) && 
        !(pathBtn.classList.contains("active")) ) {
      if (e.touches[0] && e.touches[1]) {
        const lf1 = new PIXI.Point(e.touches[0].clientX, e.touches[0].clientY);
        const lf2 = new PIXI.Point(e.touches[1].clientX, e.touches[1].clientY);
        const wf1 = view.toLocal(lf1);
        const wf2 = view.toLocal(lf2);
        
        const [dx, dy] = [wf2.x - wf1.x, wf2.y - wf2.y];
      
        const distance = Math.hypot(dx, dy);
        
        if (distance > prevDist) {
          scale -= 0.005
        }
        else if (distance < prevDist) {
          scale += 0.005;
        }
        console.log(scale, distance);
        
        scale = Math.max(0.075, Math.min(3, scale));
        view.scale.set(scale);
        prevDist = distance;
      }
    }
    
  });
  //Camera End
  
  //HintBox Start
  function ShowHint(text) {
    hintBox.style.animation = "none";
    void hintBox.offsetWidth; //trigger reflow
    hintBox.innerHTML = text;
    hintBox.style.animation = "appear 0.6s";
  }
  //HintBox End
   
  window.app = app
  window.state = () => [NodeCount, Nodes, PathCount, Paths];
  
})();