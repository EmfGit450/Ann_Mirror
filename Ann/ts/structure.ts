import type { Scene } from "@babylonjs/core/scene";

import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGreasedLine } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { GreasedLineMesh } from "@babylonjs/core/Meshes/GreasedLine/greasedLineMesh";
import "@babylonjs/core/Meshes/thinInstanceMesh";

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

import { Color3 } from "@babylonjs/core/Maths/math.color";


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

export const enum ConnectionType {
  Dense,
  Residual
}

export interface ConnectionData {
  id: number | undefined;
  ids: Float64Array | undefined;
  
  type: ConnectionType;
  inputLayer: number;
  outputLayer: number
}

export interface LayerData {
  id: number | undefined;
  pos: number[] | undefined;
  
  shape: number[];
}

export class Network {
  networkData: Array<LayerData | ConnectionData>;
  
  memory: Map<
    LayerData | ConnectionData,
    Mesh | Array<GreasedLineMesh>
  >;
  
  scene: Scene;
  
  private NeuronMaterial: StandardMaterial;
  
  constructor(renderScene: Scene) {
    this.networkData = [];
    this.memory = new Map();
    
    this.scene = renderScene;
    
    this.NeuronMaterial = new StandardMaterial("hologramBlue", renderScene);
    this.NeuronMaterial.diffuseColor = new Color3(0.2, 0.6, 1.0);
    this.NeuronMaterial.emissiveColor = new Color3(0.05, 0.15, 0.25);

    this.NeuronMaterial.specularColor = new Color3(0,0,0);
    this.NeuronMaterial.specularPower = 1;
    this.NeuronMaterial.disableLighting = false;
    
    this.scene.registerBeforeRender(() => {
      
    });
  }
  
  newLayer(layer: LayerData) {
    const meshId = layer.id ?? randInt53();
    if (meshId !== layer.id) layer.id = meshId;
    
    const layerMesh = CreateSphere(`0_${meshId}`, {
      diameter: 2,
      segments: 14
    }, this.scene);
    layerMesh.material = this.NeuronMaterial;

    const sx = layer.pos[0]! - ((layer.shape[0]! - 1) * NEURON_SPACING) / 2;
    const sy = layer.pos[1]! - ((layer.shape[1]! - 1) * NEURON_SPACING) / 2;
    const sz = layer.pos[2]! - ((layer.shape[2]! - 1) * NEURON_SPACING) / 2;
    
    const thinInstanceMatrix = new Float32Array(layer.shape[0]! * layer.shape[1]! * layer.shape[2]! * 16);
    
    let offset = 0;
    
    for (let i = 0; i < layer.shape[0]!; i++) {
      const x = sx + i * NEURON_SPACING;
      for (let j = 0; j < layer.shape[1]!; j++) {
        const y = sy + j * NEURON_SPACING;
        for (let k = 0; k < layer.shape[2]!; k++) {
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
    
    layerMesh.thinInstanceSetBuffer("matrix", thinInstanceMatrix, 16, true);

    layerMesh.annMeta = {
      layer
    }
    this.memory.set(layer, layerMesh);

    return layerMesh;
  }

  newDenseConnection(connection: ConnectionData, skipModOverride: number | undefined) {
    let base_fts: Float32Array[] = [];
    let detail_fts: Float32Array[] = [];
    let high_detail_fts: Float32Array[] = [];
    let max_detail_fts: Float32Array[] = [];

    const lA = this.memory.get(connection.inputLayer)! as Mesh;
    const lB = this.memory.get(connection.outputLayer)! as Mesh;
 
    //lxnC = layer x neuron count
    //@ts-ignore
    const lAnC = lA.annMeta.shape[0]! * lA.annMeta.shape[1]! * lA.annMeta.shape[2]!
    //@ts-ignore
    const lBnC = lB.annMeta.shape[0]! * lB.annMeta.shape[1]! * lB.annMeta.shape[2]!

    const lAneurons = lA._thinInstanceDataStorage.matrixData!;
    const lBneurons = lB._thinInstanceDataStorage.matrixData!;
    
    //@ts-ignore
    const lAZshape = lA.annMeta.shape[2]! * 16;
    const vRef = [lBneurons[12]! - lAneurons[12]!, lBneurons[13]! - lAneurons[13]!, lBneurons[14]! - lAneurons[14]!];
    const vXZ = [lBneurons[12]! - lAneurons[28]!, lBneurons[13]! - lAneurons[29]!, lBneurons[14]! - lAneurons[30]!];
    const vXY = [lBneurons[12]! - lAneurons[lAZshape + 12]!, lBneurons[13]! - lAneurons[lAZshape + 13]!, lBneurons[14]! - lAneurons[lAZshape + 14]!];

    const vRef_mag = Math.sqrt(vRef[0]! * vRef[0]! + vRef[1]! * vRef[1]! + vRef[2]! * vRef[2]!);
    const vXZ_mag = Math.sqrt(vXZ[0]! * vXZ[0]! + vXZ[1]! * vXZ[1]! + vXZ[2]! * vXZ[2]!);
    const vXY_mag = Math.sqrt(vXY[0]! * vXY[0]! + vXY[1]! * vXY[1]! + vXY[2]! * vXY[2]!);

    const dot_xz = (vRef[0]! * vXZ[0]! + vRef[1]! * vXZ[1]! + vRef[2]! * vXZ[2]!) / (vRef_mag * vXZ_mag);
    const dot_xy = (vRef[0]! * vXY[0]! + vRef[1]! * vXY[1]! + vRef[2]! * vXY[2]!) / (vRef_mag * vXY_mag);
    
    const maxDensity = Math.max(dot_xz, dot_xy);
    //@ts-ignore
    const minShape = Math.min(lA.annMeta.shape[1], lB.annMeta.shape[1], lA.annMeta.shape[2], lB.annMeta.shape[2]);

    const densityScore = maxDensity * minShape;

    let skipMod;
    if (skipModOverride != null) skipMod = skipModOverride;
    else {
      skipMod = densityScore > 5 ? 2 : 1;
      skipMod = densityScore > 10 ? 3 : skipMod;
      skipMod = densityScore > 15 ? 4 : skipMod;
    }
    
    //PROBLEM:
    //CANNOT WORK WITH ODD NUMBER OF lAnC. ALSO
    //FIRST lBnC neurons SKIPPED
    for (let start = 0; start < lAnC; start += 2) {
      const currStart = start * 16;
      for (let end = 0; end < lBnC; end++) {
        const currEndOff = end * 16;
        
        const mod = Math.floor(Math.random() * lAnC * lBnC) % skipMod;

        if (mod == 0) {
          base_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart + 28]!, lAneurons[currStart + 29]!, lAneurons[currStart + 30]! //source2
          ]));
        }
        else if (mod == 1) {
          detail_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart + 28]!, lAneurons[currStart + 29]!, lAneurons[currStart + 30]! //source2
          ]));
        }
        else if (mod == 2) {
          high_detail_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart + 28]!, lAneurons[currStart + 29]!, lAneurons[currStart + 30]! //source2
          ]));
        }
        else {
          max_detail_fts.push(new Float32Array([
            lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //source1
            lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //target
            lAneurons[currStart + 28]!, lAneurons[currStart + 29]!, lAneurons[currStart + 30]! //source2
          ]));
        }
      }
    }
    
    const metadata = {
      sourceLayerId: layerA_id,
      targetLayerId: layerB_id,
      density: undefined
    }

    const meshId = id ? id : randInt53();

    const baseMesh = CreateGreasedLine(`4_${meshId}_B`, {
      points: base_fts
    }, {
      width: 0.02
    }, this.scene);
    
    //@ts-ignore
    baseMesh.annMeta = metadata;
    //@ts-ignore
    baseMesh.annMeta.density = densityScore;

    this.memory.set(`4_${meshId}_B`, baseMesh);
    
    if (detail_fts.length > 0) {
      const detailMesh = CreateGreasedLine(`4_${meshId}_D`, {
        points: detail_fts
      }, {
        width: 0.02
      }, this.scene);
      
      //@ts-ignore
      detailMesh.annMeta = metadata;

      //detailMesh.setEnabled(false);

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

      this.memory.set(`4_${meshId}_H`, highDetailMesh);
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
    
    //DEBUG
    console.log("--------------------------");
    console.log(`SynapseBatch ${meshId}`);
    console.log(`dot: ${dot_xz}, ${dot_xy}\nangle(deg): ${Math.acos(dot_xz) * DEG180BYPI}, ${Math.acos(dot_xy) * DEG180BYPI}`)
    console.log(`maxDensity: ${maxDensity}\nminShape: ${minShape}\ndensityScore: ${densityScore}`);
    console.log(`base.fts.length: ${base_fts.length}\ndetail.fts.length: ${detail_fts.length}\nhigh.fts.length: ${high_detail_fts.length}\nmax.fts.length: ${max_detail_fts.length}`)
    console.log("--------------------------");
  }
  
  rebuildMeshes() {
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
          pos: [
            sx! + ( ((mesh as any).annMeta.shape[0] - 1) * NEURON_SPACING) / 2,
            sy! + ( ((mesh as any).annMeta.shape[1] - 1) * NEURON_SPACING) / 2,
            sz! + ( ((mesh as any).annMeta.shape[2] - 1) * NEURON_SPACING) / 2
          ],
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
      
      if (key.endsWith("B")) {
        mesh.dispose();

        this.newDenseSynapseBatch(
          (mesh as any).annMeta.sourceLayerId,
          (mesh as any).annMeta.targetLayerId,
          parseInt(key.split("_")[1] as string),
          undefined
        );
      }
    });
  }
  
}