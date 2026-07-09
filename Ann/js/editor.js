import * as PIXI from "pixi";
import {gsap} from "gsap";
import {GridPad, Neuron,Layer,Layers, Comment} from "./structure.js";
import {Camera} from "./camera.js";

const loadingScreen = document.querySelector(".loading-screen");

const generalModal = document.querySelector(".general-modal");

//const codeEditorBtn = document.getElementById("code-editor");
//Later

//const settingsBtn = document.getElementById("editor-settings");
//Later

const addNeuronBtn = document.getElementById("add-node");
const deleteNeuronBtn = document.getElementById("delete-node");

const addLayerBtn = document.getElementById("add-layer");
const deleteLayerBtn = document.getElementById("delete-layer");

const commentBtn = document.getElementById("comment");
const connectBtn = document.getElementById("connect");
const clearBtn = document.getElementById("clear");


const allCRUDInactive = () => !togglableBtns.some(btn => btn.classList.contains("active"));
const togglableBtns = [addNeuronBtn, deleteNeuronBtn, addLayerBtn, deleteLayerBtn, commentBtn, connectBtn];


const canvasContainer = document.querySelector(".pixi-canvas");


//Button Toggling Start
const toggleBtn = (btn) => {
  btn.classList.toggle("active");
  togglableBtns.forEach(b => b !== btn && b.classList.remove("active"));
}
  
togglableBtns.forEach(btn => btn.onclick = () => toggleBtn(btn));
//Button Toggling End

//General Modal Prompt Start
function modalPrompt() {
  return new Promise((resolve) => {
    const input = generalModal.querySelector("input");
    if (!input) return resolve(null);

    let finished = false;

    generalModal.style.display = "block";
    generalModal.style.pointerEvents = "all";
    input.value = "";
    
    gsap.fromTo(generalModal, 
      {opacity: 0}, 
      {
        opacity: 1,
        duration: 0.2,
        onComplete: () => input.focus()
        
    });

    function finish(val) {
      if(finished) return;
      finished = true;
      
      document.removeEventListener('keyup', onKey);
      document.removeEventListener('pointerdown', onClickOutside, true);
      input.removeEventListener('blur', onBlur);
      
      input.blur();
      gsap.to(generalModal, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          generalModal.style.display = "none";
          generalModal.style.pointerEvents = "none";
        }
      });
      resolve(val);
    }

    function onKey(e) {
      if (e.key === "Enter") finish(input.value.trim());
      if (e.key === "Escape") finish(null);
    }

    function onBlur() {
      requestAnimationFrame(() => {
        if (!finished) finish(null);
      });
    }

    function onClickOutside(e) {
      if (!generalModal.contains(e.target)) {
        e.stopPropagation();
        finish(null);
      }
    }

    document.addEventListener('keyup', onKey);
    document.addEventListener('pointerdown', onClickOutside, true);
    input.addEventListener('blur', onBlur);
  });
}
//General Modal Prompt End
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
  }, 450);
  //Pixi.js Setup End
  
  //Visual Start
  let lastPtrDown;
  let eventTarget;
  
  app.stage.on("pointerdown", (e) => {
    lastPtrDown = performance.now();
    eventTarget = e.target;
  });
  
  app.stage.on("pointerup", async (e) => {
    const now = performance.now();
    console.log(`Press time: ${(now - lastPtrDown)/1000}`); //DEBUG
    
    if (e.target !== eventTarget) return;
    
    //Neuron CD Start
    if (e.target.layerId) {
      const layer = Layers.get(e.target.layerId);
      
      if (addNeuronBtn.classList.contains("active")) {
        layer.addNeuron();
      }
      else if (deleteNeuronBtn.classList.contains("active")) {
        layer.deleteNeuron();
      }
      
      //Layer Delete
      else if (deleteLayerBtn.classList.contains("active")) {
        layer.delete();
      }
      //End
      
    }
    //Neuron CD End
    
    //Layer C Start
    else if (addLayerBtn.classList.contains("active")) {
      const rawPos = view.toLocal(e.global);
      const pos = {
        x: Math.round(rawPos.x/GridPad) * GridPad,
        y: Math.round(rawPos.y/GridPad) * GridPad
      }
      
      const newLayer = new Layer({x: pos.x - 30, y: pos.y - 30}, view);
    }
    //Layer C End
    
    //Comment Start
    else if (commentBtn.classList.contains("active")) {
      const pos = view.toLocal(e.global);
      
      const input = await modalPrompt();
      if (!input) return;
      
      new Comment({x: pos.x, y: pos.y, text: input}, view);
    }
    //Comment End
    
  });
  //Visual End
  
  //Camera Start
  const viewCamera = new Camera(app, view); //Camera class defined in ./camera.js
  //Camera End
})();