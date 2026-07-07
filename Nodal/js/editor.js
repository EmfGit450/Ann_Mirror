const loadingScreen = document.querySelector(".loading-screen");

//const codeEditorBtn = document.getElementById("code-editor");
//Later

//const settingsBtn = document.getElementById("editor-settings");
//Later

const addNeuronBtn = document.getElementById("add-node");
const deleteNeuronBtn = document.getElementById("delete-node");

const addLayerBtn = document.getElementById("add-layer");
const deleteLayerBtn = document.getElementById("delete-layer");

const connectBtn = document.getElementById("connect");
const clearBtn = document.getElementById("clear");


const allCRUDInactive = () => !togglableBtns.some(btn => btn.classList.contains("active"));
const togglableBtns = [addNeuronBtn, deleteNeuronBtn, addLayerBtn, deleteLayerBtn, connectBtn];


const canvasContainer = document.querySelector(".pixi-canvas");


//Button Toggling Start
const toggleBtn = (btn) => {
  btn.classList.toggle("active");
  togglableBtns.forEach(b => b !== btn && b.classList.remove("active"));
}
  
togglableBtns.forEach(btn => btn.onclick = () => toggleBtn(btn));
//Button Toggling End


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
  
  
  const testd = new Neuron({x: 430, y: 330}, view);
  
  const test = new Layer({x: 400, y: 300}, view);
  
  test.addNeuron();
  //Pixi.js Setup End
  
  //Visual Start
  let lastPtrDown;
  let eventTarget;
  
  app.stage.on("pointerdown", (e) => {
    lastPtrDown = performance.now();
    eventTarget = e.target;
  });
  
  app.stage.on("pointerup", (e) => {
    const now = performance.now();
    console.log(`Press time: ${(now - lastPtrDown)/1000}`); //DEBUG
    
    if (e.target !== eventTarget) return;
    
    if (e.target.layerId) {
      const layer = Layers.get(e.target.layerId);
      
      if (addNeuronBtn.classList.contains("active")) {
        layer.addNeuron();
      }
    }
  });
  //Visual End
  
  //Camera Start
  const viewCamera = new Camera(app, view); //Camera class defined in ./camera.js
  //Camera End
})();