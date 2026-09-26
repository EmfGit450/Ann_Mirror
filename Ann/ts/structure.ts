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

//const DEG180BYPI = 57.2957795147;

export function randInt53(): number {
  const buf = new Uint8Array(7);
  crypto.getRandomValues(buf);
  buf[0]! &= 0b00011111;

  const view = new DataView(buf.buffer, buf.byteOffset);
  // Read as little-endian, handling the 7-byte limitation
  return view.getUint32(0, true) + view.getUint16(4, true) * 0x100000000 + buf[6]! * 0x10000000000;
}

export const enum ConnectionType {
  Dense = 100,
  ResidualTruncate,
  ResidualTransform
}

export const enum ActivationType {
  Linear = 1,
  Sigmoid,
  Tanh,
  Mish,
  Swish,
  Softplus,
  ReLU,
  LeakyReLU, //alpha = 1
  GELU,
  ELU,
  Softmax
}

export interface ConnectionData {
  //Render
  id: number | undefined;
  ids: Float64Array | undefined;
  
  //Data
  type: ConnectionType;
  input: LayerData;
  output: LayerData;
}

export interface LayerData {
  //Render
  id: number | undefined;
  pos: number[];
  
  //Data
  activation: ActivationType | undefined;
  shape: number[];
  
  //Internal
  _sequence_index: number | undefined;
}

export class Network {
  metadata: {
    layerCount: number
    connectionCount: {
      dense: number;
      residual: number;
    };
  }
  
  layerMemory: Map<LayerData, Mesh>;
  connectionMemory: Map<ConnectionData, GreasedLineMesh[] | undefined>;
  
  scene: Scene;
  
  private NeuronMaterial: StandardMaterial;
  
  constructor(renderScene: Scene) {
    this.metadata = {
      layerCount: 0,
      connectionCount: {
        dense: 0,
        residual: 0
      }
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
  
  parseNetworkAsArray() {
    const data = new Uint16Array(
      this.metadata.layerCount * 2 + this.metadata.connectionCount.residual * 2
    );

    let index = 4;
    let inputDecided = false;

    //@ts-ignore
    this.connectionMemory.forEach((meshArr, dataKey) => {
      if (!inputDecided) {
        //0 means Input. data[1] is the size of the input vector
        data[0] = 0;
        data[1] = dataKey.input.shape[0]! * dataKey.input.shape[1]! * dataKey.input.shape[2]!;
        
        data[2] = dataKey.output.activation ?? 1;
        data[3] = dataKey.output.shape[0]! * dataKey.output.shape[1]! * dataKey.output.shape[2]!;

        inputDecided = true;
      }

      else if (dataKey.type == ConnectionType.Dense) {
        data[index] = dataKey.output.activation ?? ActivationType.Linear;
        data[index + 1] = dataKey.output.shape[0]! * dataKey.output.shape[1]! * dataKey.output.shape[2]!;

        index += 2;
      }

      else if (dataKey.type == ConnectionType.ResidualTruncate ||
               dataKey.type == ConnectionType.ResidualTransform) {
        data[index] = dataKey.type;
        data[index + 1] = dataKey.output._sequence_index! - dataKey.input._sequence_index!;

        index += 2;
      }
    });

    return data;
  }
  
  
  newLayer(layer: LayerData) {
    const meshId = layer.id ?? randInt53();
    if (meshId !== layer.id) layer.id = meshId;
    
    //0-base indexing
    layer._sequence_index = this.metadata.layerCount;
    
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

    //@ts-ignore
    layerMesh.annMeta = layer;
    this.layerMemory.set(layer, layerMesh);
    this.metadata.layerCount++;

    return layerMesh;
  }

  newConnection(connection: ConnectionData) {
    if (connection.type == ConnectionType.Dense) {
      this.newDenseConnection(connection);
    }
    else if (connection.type == ConnectionType.ResidualTruncate ||
             connection.type == ConnectionType.ResidualTransform) {
      this.connectionMemory.set(connection, undefined);
      this.metadata.connectionCount.residual++;
    }
  }

  newDenseConnection(connection: ConnectionData) {
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
    
    //PROBLEM:
    //CANNOT WORK WITH ODD NUMBER OF lAnC. ALSO
    //LAST lBnC neurons SKIPPED with ODD shape_x * shape_y * shape_z
    for (let start = 0; start < lAnC; start += 2) {
      const currStart = start * 16;
      for (let end = 0; end < lBnC; end++) {
        const currEndOff = end * 16;

        /* COMMENTED OUT FOR TESTING OTHER FUNCTIONS
        const input1 = [lAneurons[currStart + 12]!, lAneurons[currStart + 13]!, lAneurons[currStart + 14]!];
        const input2 = [lAneurons[currStart + 28]!, lAneurons[currStart + 29]!, lAneurons[currStart + 30]!];
        const output = [lBneurons[currEndOff + 12]!, lBneurons[currEndOff + 13]!, lBneurons[currEndOff + 14]!];

        const dist_i1_lACenter = (input1[0] - lA.annMeta.pos[0]) ** 2 + (input1[1] - lA.annMeta.pos[1]) ** 2 + (input1[2] - lA.annMeta.pos[2]) ** 2;
        const dist_i1_lBCenter = (input1[0] - lB.annMeta.pos[0]) ** 2 + (input1[1] - lB.annMeta.pos[1]) ** 2 + (input1[2] - lB.annMeta.pos[2]) ** 2;

        console.log(Math.sqrt(dist_i1_lACenter), Math.sqrt(dist_i1_lBCenter)); */
        
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
    
    meshes.push(baseMesh as GreasedLineMesh);
    
    if (detail_fts.length > 0) {
      const detailMesh = CreateGreasedLine(`4_${meshId}_D`, {
        points: detail_fts
      }, materialOptions, this.scene);
      
      //@ts-ignore
      detailMesh.annMeta = metadata;

      detailMesh.setEnabled(false);

      meshes.push(detailMesh as GreasedLineMesh);
    }

    if (high_detail_fts.length > 0) {
      const highDetailMesh = CreateGreasedLine(`4_${meshId}_H`, {
        points: high_detail_fts
      }, materialOptions, this.scene);
      
      //@ts-ignore
      highDetailMesh.annMeta = metadata;

      highDetailMesh.setEnabled(false);

      meshes.push(highDetailMesh as GreasedLineMesh);
    }

    if (max_detail_fts.length > 0) {
      const maxDetailMesh = CreateGreasedLine(`4_${meshId}_X`, {
        points: max_detail_fts
      }, materialOptions, this.scene);
      
      //@ts-ignore
      maxDetailMesh.annMeta = metadata;

      maxDetailMesh.setEnabled(false);

      meshes.push(maxDetailMesh as GreasedLineMesh);
    }
    
    //DEBUG
    console.log(`--------------------------\nConnection ${meshId}\n\nbase.fts.length: ${base_fts.length}\ndetail.fts.length: ${detail_fts.length}\nhigh.fts.length: ${high_detail_fts.length}\nmax.fts.length: ${max_detail_fts.length}\n--------------------------`);

    this.connectionMemory.set(connection, meshes);
    this.metadata.connectionCount.dense++;
  }
  
}