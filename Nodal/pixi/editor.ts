declare const PIXI: typeof import("pixi.js");

const codeEditorBtn = document.getElementById("code-editor")!;

const settingsBtn = document.getElementById("editor-settings")!;

const addNodeBtn = document.getElementById("add-node")!;
const deleteBtn = document.getElementById("delete")!;
const pathBtn = document.getElementById("path")!;
const clearBtn = document.getElementById("clear")!;

const canvasContainer = document.querySelector<HTMLElement>(".pixi-canvas")!;


let Nodes = {};
let Paths = {};

(async () => {
  const app = new PIXI.Application();
  
  await app.init({
    resizeTo: canvasContainer,
    background: "#030303",
    antialias: true
  })
  
  canvasContainer.appendChild(app.canvas);
  
  console.log("Pixi.js Canvas is set up")
  
  
  const test = new PIXI.Graphics()
        .circle(200, 200, 70)
        .fill({ color: "#EEEEEE" });
  
  app.stage.addChild(test);
  
  
})();