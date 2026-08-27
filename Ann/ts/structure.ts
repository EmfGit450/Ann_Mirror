import type { Scene } from "@babylonjs/core/scene";

import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGreasedLine } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { GreasedLineMesh } from "@babylonjs/core/Meshes/GreasedLine/greasedLineMesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

import { Color3 } from "@babylonjs/core/Maths/math.color";

//IMP:
//Float64 is used for ids, since that gives 2^53 = 9,007,199,254,740,991(9 quintillion) possible integer ids
//Float32 is too low, 2^24 = 16,777,216(just 16 million)

//Using Float32 for pos since there needs to be a large network before i need Float64

const NEURON_SPACING = 2.5;

const DEG180BYPI = 57.2957795147;

export function randInt53(): number {
  const buf = new Uint8Array(7);
  crypto.getRandomValues(buf);
  buf[0]! &= 0b00011111;

  const view = new DataView(buf.buffer, buf.byteOffset);
  // Read as little-endian, handling the 7-byte limitation
  return view.getUint32(0, true) + view.getUint16(4, true) * 0x100000000 + buf[6]! * 0x10000000000;
}

export interface SynapseBatchData { //one weight matrix
  id: number;
  ids: Float64Array;
  fts: Float32Array[]; //[fx, fy, fz, ex, ey, ez, ...]
  ftshape: Float32Array; //[fx, fy, fz, tx, ty, tz]
}

export interface LayerData {
  id: number;
  pos: Float32Array;
  shape: Uint32Array; //Tensor visual thing
  ids: Float64Array | undefined; //child neuron ids
}

export class Network {
  memory: Map<string, Mesh | InstancedMesh | GreasedLineMesh>;
  scene: Scene;
  
  private NeuronMaterial: StandardMaterial;
  
  constructor(renderScene: Scene) {
    this.scene = renderScene;
    this.memory = new Map();
    
    this.NeuronMaterial = new StandardMaterial("hologramBlue", renderScene);
    this.NeuronMaterial.diffuseColor = new Color3(0.2, 0.6, 1.0);
    this.NeuronMaterial.emissiveColor = new Color3(0.05, 0.15, 0.25);

    this.NeuronMaterial.specularColor = new Color3(0,0,0);
    this.NeuronMaterial.specularPower = 1;
    this.NeuronMaterial.disableLighting = false;
    
    this.scene.registerBeforeRender(() => {
      const camPos = this.scene.activeCamera?.position;
    });
  }
  
  //0 = Layer, 4 = SynapseBatch  
  newLayer(batch: LayerData) {
    const masterNeuron = CreateSphere(`0_${batch.id}`, {
      diameter: 2,
      segments: 14
    }, this.scene);
    masterNeuron.material = this.NeuronMaterial;

    const sx = batch.pos[0]! - ((batch.shape[0]! - 1) * NEURON_SPACING) / 2;
    const sy = batch.pos[1]! - ((batch.shape[1]! - 1) * NEURON_SPACING) / 2;
    const sz = batch.pos[2]! - ((batch.shape[2]! - 1) * NEURON_SPACING) / 2;

    const idsUndefined = batch.ids === undefined ? true : false;
    
    const thinInstanceMatrix = new Float32Array(idsUndefined ? (batch.shape[0]! * batch.shape[1]! * batch.shape[2]!) * 16 : batch.ids!.length * 16);
    
    let offset = 0;
    
    for (let i = 0; i < batch.shape[0]!; i++) {
      const x = sx + i * NEURON_SPACING;
      for (let j = 0; j < batch.shape[1]!; j++) {
        const y = sy + j * NEURON_SPACING;
        for (let k = 0; k < batch.shape[2]!; k++) {
          const z = sz + k * NEURON_SPACING;
          
          //babylonjs uses column major notation
          thinInstanceMatrix[offset] = 1;
          thinInstanceMatrix[offset + 5] = 1;
          thinInstanceMatrix[offset + 10] = 1;
          thinInstanceMatrix[offset + 12] = x;
          thinInstanceMatrix[offset + 13] = y;
          thinInstanceMatrix[offset + 14] = z;
          thinInstanceMatrix[offset + 15] = 1;
          
          offset += 16;
        }
      }
    }
    
    masterNeuron.thinInstanceSetBuffer("matrix", thinInstanceMatrix, 16, true);
    
    //@ts-ignore
    masterNeuron.annMeta = {
      shape: batch.shape
    }
        
    this.memory.set(`0_${batch.id}`, masterNeuron);

    return masterNeuron;
  }

  newDenseSynapseBatch(layerA: LayerData, layerB: LayerData, id: number | undefined) {
    //NO ID CONFIG FOR NOW, ONLY PERFORMANCE TESTING
    let base_fts: Float32Array[] = [];
    let detail_fts: Float32Array[] = [];
    let high_detail_fts: Float32Array[] = [];
    let max_detail_fts: Float32Array[] = [];
 
    //lxnC = layer x neuron count
    const lAnC = layerA.shape[0]! * layerA.shape[1]! * layerA.shape[2]!
    const lBnC = layerB.shape[0]! * layerB.shape[1]! * layerB.shape[2]!

    const lAneurons = (this.memory.get(`0_${layerA.id}`)! as Mesh)._thinInstanceDataStorage.matrixData!;
    const lBneurons = (this.memory.get(`0_${layerB.id}`)! as Mesh)._thinInstanceDataStorage.matrixData!;
    
    const lAZshape = layerA.shape[2]! * 16;
    const vRef = [lBneurons[12]! - lAneurons[12]!, lBneurons[13]! - lAneurons[13]!, lBneurons[14]! - lAneurons[14]!];
    const vXZ = [lBneurons[12]! - lAneurons[28]!, lBneurons[13]! - lAneurons[29]!, lBneurons[14]! - lAneurons[30]!];
    const vXY = [lBneurons[12]! - lAneurons[lAZshape + 12]!, lBneurons[13]! - lAneurons[lAZshape + 13]!, lBneurons[14]! - lAneurons[lAZshape + 14]!];

    const vRef_mag = Math.sqrt(vRef[0]! * vRef[0]! + vRef[1]! * vRef[1]! + vRef[2]! * vRef[2]!);
    const vXZ_mag = Math.sqrt(vXZ[0]! * vXZ[0]! + vXZ[1]! * vXZ[1]! + vXZ[2]! * vXZ[2]!);
    const vXY_mag = Math.sqrt(vXY[0]! * vXY[0]! + vXY[1]! * vXY[1]! + vXY[2]! * vXY[2]!);

    const dot_xz = (vRef[0]! * vXZ[0]! + vRef[1]! * vXZ[1]! + vRef[2]! * vXZ[2]!) * (1 / (vRef_mag * vXZ_mag));
    const dot_xy = (vRef[0]! * vXY[0]! + vRef[1]! * vXY[1]! + vRef[2]! * vXY[2]!) * (1 / (vRef_mag * vXY_mag));
    
    const maxDensity = Math.max(dot_xz, dot_xy);

    let skipMod = maxDensity > 0.99802 ? 2 : 1;    // ~3.5°
    skipMod = maxDensity > 0.999105  ? 3 : skipMod; // ~2.4°
    skipMod = maxDensity > 0.99965 ? 4 : skipMod;  // ~1.5°

    for (let start = 1; start < lAnC; start++) {
      const currStart = start * 16;
      for (let end = 0; end < lBnC; end++) {
        const currEndOff = end * 16;
        
        const mod = (end + start) % skipMod;

        if (mod == 0) {
          base_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart - 4]!, lAneurons[currStart - 3]!, lAneurons[currStart - 2]! //source2
          ]));
        }
        else if (mod == 1) { //
          detail_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart - 4]!, lAneurons[currStart - 3]!, lAneurons[currStart - 2]! //source2
          ]));
        }
        else if (mod == 2) { //
          high_detail_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart - 4]!, lAneurons[currStart - 3]!, lAneurons[currStart - 2]! //source2
          ]));
        }
        else {
          max_detail_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart - 4]!, lAneurons[currStart - 3]!, lAneurons[currStart - 2]! //source2
          ]));
        }
      }
    }
    
    console.log(`dot: ${dot_xz}, ${dot_xy}\nangle(deg): ${Math.acos(dot_xz) * DEG180BYPI}, ${Math.acos(dot_xy) * DEG180BYPI}`)
    
    const metadata = {
      sourceLayer: layerA,
      targetLayer: layerB,
      density: undefined
    }

    const meshId = id ? id : randInt53();

    const baseMesh = CreateGreasedLine(`4_${meshId}_B}`, {
      points: base_fts
    }, {
      width: 0.02
    }, this.scene);
    
    //@ts-ignore
    baseMesh.annMeta = metadata;
    //@ts-ignore
    baseMesh.annMeta.density = {
      xz: Math.acos(dot_xz) * DEG180BYPI,
      xy: Math.acos(dot_xy) * DEG180BYPI
    }

    this.memory.set(`4_${meshId}_B`, baseMesh);
    
    if (detail_fts.length > 0) {
      const detailMesh = CreateGreasedLine(`4_${meshId}_D`, {
        points: detail_fts
      }, {
        width: 0.02
      }, this.scene);
      
      //@ts-ignore
      detailMesh.annMeta = metadata;

      detailMesh.setEnabled(false);

      this.memory.set(`4_${meshId}_D`, detailMesh);
    }

    if (high_detail_fts.length > 0) {
      const highDetailMesh = CreateGreasedLine(`4_${meshId}_H`, {
        points: high_detail_fts
      }, {
        width: 0.02
      }, this.scene);
      
      //@ts-ignore
      highDetailMesh.annMeta = metadata;

      highDetailMesh.setEnabled(false);

      this.memory.set(`4_${meshId}_X`, highDetailMesh);
    }

    if (max_detail_fts.length > 0) {
      const maxDetailMesh = CreateGreasedLine(`4_${meshId}_X`, {
        points: max_detail_fts
      }, {
        width: 0.02
      }, this.scene);
      
      //@ts-ignore
      maxDetailMesh.annMeta = metadata;

      maxDetailMesh.setEnabled(false);

      this.memory.set(`4_${meshId}_X`, maxDetailMesh);
    }

    console.log(`base.fts.length: ${base_fts.length}\ndetail.fts.length: ${detail_fts.length}\nhigh.fts.length: ${high_detail_fts.length}\nmax.fts.length: ${max_detail_fts.length}`)
  }
  
  rebuildMeshes() {
    console.log("Before rebuild\nnet.memory:\n", this.memory, "net.scene.meshes:\n", this.scene.meshes);

    for (let i = 0; i < this.scene.meshes.length; i++) {
      this.scene.meshes[i]?.dispose();
    }
    
    this.memory.forEach((mesh, key) => {
      if (key[0] == "0") {
        mesh.dispose();
        
        const sx = (mesh as Mesh)!._thinInstanceDataStorage.matrixData![12];
        const sy = (mesh as Mesh)!._thinInstanceDataStorage.matrixData![13];
        const sz = (mesh as Mesh)!._thinInstanceDataStorage.matrixData![14];
        
        this.newLayer({
          id: parseInt(key.split("_")[1] as string),
          pos: new Float32Array([
            sx! + ( ((mesh as any).annMeta.shape[0] - 1) * NEURON_SPACING) / 2,
            sy! + ( ((mesh as any).annMeta.shape[1] - 1) * NEURON_SPACING) / 2,
            sz! + ( ((mesh as any).annMeta.shape[2] - 1) * NEURON_SPACING) / 2
          ]),
          shape: (mesh as any).annMeta.shape,
          ids: undefined
        });
        
        return;
      }
      
      if (key.endsWith("D") ||
          key.endsWith("H") ||
          key.endsWith("X")) {
        mesh.dispose();    
      }
      
      if (key[0] == "4") {
        mesh.dispose();

        this.newDenseSynapseBatch(
          (mesh as any).annMeta.sourceLayer,
          (mesh as any).annMeta.targetLayer,
          parseInt(key.split("_")[1] as string)
        );
      }
    });

    console.log("After rebuild\nnet.memory:\n", this.memory, "net.scene.meshes:\n", this.scene.meshes);
  }
  
}