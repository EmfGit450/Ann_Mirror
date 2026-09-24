import type { Scene } from "@babylonjs/core/scene";

import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGreasedLine } from "@babylonjs/core/Meshes/Builders/greasedLineBuilder";

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { GreasedLineMesh } from "@babylonjs/core/Meshes/GreasedLine/greasedLineMesh";
import { GreasedLineMeshMaterialType } from "@babylonjs/core/Materials/GreasedLine/greasedLineMaterialInterfaces";
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
  input: LayerData;
  output: LayerData;
}

export interface LayerData {
  id: number | undefined;
  pos: number[] | undefined;
  
  shape: number[];
}

export class Network {
  metadata: {
    layerCount: number
    connectionCount: number;
  }
  
  layerMemory: Map<LayerData, Mesh>;
  connectionMemory: Map<ConnectionData, GreasedLineMesh[]>;
  
  scene: Scene;
  
  private NeuronMaterial: StandardMaterial;
  
  constructor(renderScene: Scene) {
    this.metadata = {
      layerCount: 0,
      connectionCount: 0
    }
    
    this.layerMemory = new Map();
    this.connectionMemory = new Map();
    
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
  
  
  parseTensorDimensions() {
    const dimensionArray = new Uint16Array(this.metadata.layerCount * 3);

    let inputDecided = false;
    let index = 6;
    
    this.connectionMemory.forEach((meshArr, dataKey) => {
      if (!inputDecided) {
        dimensionArray[0] = dataKey.input.shape[0];
        dimensionArray[1] = dataKey.input.shape[1];
        dimensionArray[2] = dataKey.input.shape[2];
        
        dimensionArray[3] = dataKey.output.shape[0];
        dimensionArray[4] = dataKey.output.shape[1];
        dimensionArray[5] = dataKey.output.shape[2];

        inputDecided = true;
      }

      else {
        dimensionArray[index] = dataKey.output.shape[0];
        dimensionArray[index + 1] = dataKey.output.shape[1];
        dimensionArray[index + 2] = dataKey.output.shape[2];

        index += 3;
      }
    });

    return dimensionArray;
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

    layerMesh.annMeta = layer;
    this.layerMemory.set(layer, layerMesh);
    this.metadata.layerCount++;

    return layerMesh;
  }

  newDenseConnection(connection: ConnectionData, skipModOverride: number | undefined) {
    let base_fts: Float32Array[] = [];
    let detail_fts: Float32Array[] = [];
    let high_detail_fts: Float32Array[] = [];
    let max_detail_fts: Float32Array[] = [];

    const lA = this.layerMemory.get(connection.input)!;
    const lB = this.layerMemory.get(connection.output)!;
 
    //lxnC = layer x neuron count
    //@ts-ignore
    const lAnC = lA.annMeta.shape[0]! * lA.annMeta.shape[1]! * lA.annMeta.shape[2]!
    //@ts-ignore
    const lBnC = lB.annMeta.shape[0]! * lB.annMeta.shape[1]! * lB.annMeta.shape[2]!

    const lAneurons = lA._thinInstanceDataStorage.matrixData!;
    const lBneurons = lB._thinInstanceDataStorage.matrixData!;
    
    const layersCenter = [lB.annMeta.pos[0] - lA.annMeta.pos[0], lB.annMeta.pos[1] - lA.annMeta.pos[1], lB.annMeta.pos[2] - lA.annMeta.pos[2]];
    const layersCenterMag = Math.sqrt(layersCenter[0] * layersCenter[0] + layersCenter[1] * layersCenter[1] + layersCenter[2] * layersCenter[2]);


    const DEBUG_DOTPRODS = [];
    
    //PROBLEM:
    //CANNOT WORK WITH ODD NUMBER OF lAnC. ALSO
    //LAST lBnC neurons SKIPPED with ODD shape_x * shape_y * shape_z
    for (let start = 0; start < lAnC; start += 2) {
      const currStart = start * 16;
      for (let end = 0; end < lBnC; end++) {
        const currEndOff = end * 16;
        
        const input1 = [lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!];
        const input2 = [lAneurons[currStart + 28]!, lAneurons[currStart + 29]!, lAneurons[currStart + 30]!];
        const output = [lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!];

        const dist_i1_lACenter = (input1[0] - lA.annMeta.pos[0]) ** 2 + (input1[1] - lA.annMeta.pos[1]) ** 2 + (input1[2] - lA.annMeta.pos[2]) ** 2;
        const dist_i1_lBCenter = (input1[0] - lB.annMeta.pos[0]) ** 2 + (input1[1] - lB.annMeta.pos[1]) ** 2 + (input1[2] - lB.annMeta.pos[2]) ** 2;

        console.log(Math.sqrt(dist_i1_lACenter), Math.sqrt(dist_i1_lBCenter));
        
        base_fts.push(new Float32Array([
          lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!, //input1
          lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!, //output
          lAneurons[currStart + 28]!, lAneurons[currStart + 29]!, lAneurons[currStart + 30]! //input2
        ]));
      }
    }
    
    const metadata = {
      input: connection.input,
      output: connection.output
    }

    const meshId = connection.id ?? randInt53();

    let meshes: GreasedLineMesh[] = [];

    const materialOptions = {
      materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE,
      width: 0.02
    }

    const baseMesh = CreateGreasedLine(`4_${meshId}_B`, {
      points: base_fts
    }, materialOptions, this.scene);
    
    //@ts-ignore
    baseMesh.annMeta = metadata;
    
    meshes.push(baseMesh);
    
    if (detail_fts.length > 0) {
      const detailMesh = CreateGreasedLine(`4_${meshId}_D`, {
        points: detail_fts
      }, materialOptions, this.scene);
      
      //@ts-ignore
      detailMesh.annMeta = metadata;

      detailMesh.setEnabled(false);

      meshes.push(detailMesh);
    }

    if (high_detail_fts.length > 0) {
      const highDetailMesh = CreateGreasedLine(`4_${meshId}_H`, {
        points: high_detail_fts
      }, materialOptions, this.scene);
      
      //@ts-ignore
      highDetailMesh.annMeta = metadata;

      highDetailMesh.setEnabled(false);

      meshes.push(highDetailMesh);
    }

    if (max_detail_fts.length > 0) {
      const maxDetailMesh = CreateGreasedLine(`4_${meshId}_X`, {
        points: max_detail_fts
      }, materialOptions, this.scene);
      
      //@ts-ignore
      maxDetailMesh.annMeta = metadata;

      maxDetailMesh.setEnabled(false);

      meshes.push(maxDetailMesh);
    }
    
    //DEBUG
    console.log("--------------------------");
    console.log(`SynapseBatch ${meshId}`);
    console.log(`base.fts.length: ${base_fts.length}\ndetail.fts.length: ${detail_fts.length}\nhigh.fts.length: ${high_detail_fts.length}\nmax.fts.length: ${max_detail_fts.length}`);
    console.log("--------------------------");

    this.connectionMemory.set(connection, meshes);
    this.metadata.connectionCount++;
  }
  
}