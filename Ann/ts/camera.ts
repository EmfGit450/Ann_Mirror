import type { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

//bn -> babylonjs

export class Camera {
  bnCanvas: HTMLCanvasElement;
  bnScene: Scene;
  bnCamera: ArcRotateCamera;

  constructor(props: { canvas: HTMLCanvasElement; scene: Scene }) {
    this.bnCamera = new ArcRotateCamera(
      "camera",
      -1.5707963267948966,
      1.5707963267948966,
      20,
      Vector3.Zero(),
      props.scene
    );

    this.bnScene = props.scene;
    this.bnCanvas = props.canvas;

    this.bnCamera.attachControl(props.canvas, true);

    this.bnCamera.lowerRadiusLimit = 4;
    this.bnCamera.upperRadiusLimit = 260;

    this.bnCamera.wheelPrecision = 10;
    this.bnCamera.panningSensibility = 200;

    this.bnCamera.inertia = 0.9;
  }
}
