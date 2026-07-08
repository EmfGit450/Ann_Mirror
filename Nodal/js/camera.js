export class Camera {
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
      if (this.activePointers.size === 2 && this.activePointers.has(e.pointerId)) {
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