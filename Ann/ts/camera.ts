import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

//bn -> babylonjs

export class AnnCamera {
  constructor(props) {
    this.bnCamera = new ArcRotateCamera(
      props.label ? props.label : "camera", 
      -1.5707963267948966,
      1.5707963267948966,
      20,
      Vector3.Zero(),
      props.scene
    );
    const aspect = props.canvas.clientWidth / props.canvas.clientHeight;
    const orthoHeight = 10;

    this.bnCamera.orthoTop = orthoHeight / 2;
    this.bnCamera.orthoBottom = -orthoHeight / 2;

    this.bnCamera.orthoRight = (orthoHeight / 2) * aspect;
    this.bnCamera.orthoLeft = -((orthoHeight / 2) * aspect);

    this.bnScene = props.scene;
    this.bnCanvas = props.canvas;
    
    this.bnCamera.attachControl(props.canvas, true);
    
    this.bnCamera.lowerRadiusLimit = 6.5;
    this.bnCamera.upperRadiusLimit = 2000;
    this.bnCamera.lowerBetaLimit = 1.5707963267948966;
    this.bnCamera.upperBetaLimit = 1.5707963267948966;
    this.bnCamera.lowerAlphaLimit = -1.5707963267948966;
    this.bnCamera.upperAlphaLimit = -1.5707963267948966;
    this.bnCamera.panningSensibility = 200;

    this.bnCamera.wheelPrecision = 200;
  }
}