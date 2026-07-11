import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

//bn -> babylonjs

export class AnnCamera {
  constructor(props) {
    this.bnCamera = new ArcRotateCamera(
      props.label ? props.label : "camera", 
      0,
      1.5707963267948966,
      20,
      Vector3.Zero(),
      props.scene
    );
    this.bnScene = props.scene;
    this.bnCanvas = props.canvas;
    
    this.bnCamera.attachControl(props.canvas, true);
    
    this.bnCamera.lowerRadiusLimit = 6.5;
    this.bnCamera.upperRadiusLimit = 55;
    this.bnCamera.lowerBetaLimit = 1.5707963267948966;
    this.bnCamera.upperBetaLimit = 1.5707963267948966;
    this.bnCamera.lowerAlphaLimit = -1.5707963267948966;
    this.bnCamera.upperAlphaLimit = -1.5707963267948966;
    this.bnCamera.panningSensibility = 300;
    this.bnCamera.angularSensibility = 1000000;

    this.bnCamera.wheelPrecision = 200;
  }
}