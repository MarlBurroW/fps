import "@babylonjs/core";
import "@babylonjs/core/Sprites";

// Ajoutez des déclarations supplémentaires uniquement pour les propriétés manquantes
declare module "@babylonjs/core" {
  export interface Scene {
    lightsEnabled: boolean;
  }

  export interface PointLight {
    position: Vector3;
  }

  export interface StandardMaterial {
    backFaceCulling: boolean;
    alpha: number;
  }

  export interface FreeCamera {
    _previousPosition?: Vector3;
  }

  export interface ParticleSystem {
    particleTexture: Texture;
    color1: Color4;
    color2: Color4;
    colorDead: Color4;
    minSize: number;
    maxSize: number;
    minLifeTime: number;
    maxLifeTime: number;
    emitRate: number;
    minEmitPower: number;
    maxEmitPower: number;
    updateSpeed: number;
    direction1: Vector3;
    direction2: Vector3;
    gravity: Vector3;
    emitter: Vector3;
    start(): void;
    stop(): void;
    dispose(): void;
    createSphereEmitter(radius: number): void;
    isAnimationSheetEnabled: boolean;
    particleTexture: any; // Permettre null
    createBoxEmitter(
      min: Vector3,
      max: Vector3,
      directionMin: Vector3,
      directionMax: Vector3
    ): void;
    manualEmitCount: number;
  }

  export interface Mesh {
    rotationQuaternion: any;
  }
}

declare global {
  interface Object {
    getWorldMatrix(): any;
    billboardMode: number;
    getAbsolutePosition(): any;
  }
}
