import { BaseWeapon } from "./BaseWeapon";
import {
  Scene,
  FreeCamera,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
} from "@babylonjs/core";

export class AssaultRifle extends BaseWeapon {
  constructor(scene: Scene, camera: FreeCamera) {
    super(scene, camera);

    // Propriétés spécifiques à l'assault rifle
    this.fireRate = 100; // Tir rapide
    this.damage = 15;
    this.spread = 0.03;
    this.automatic = true;
  }

  protected createWeaponMesh(): Mesh {
    // Création du mesh spécifique à l'assault rifle
    const gunBody = MeshBuilder.CreateBox(
      "assaultRifleBody",
      { width: 0.1, height: 0.1, depth: 0.6 },
      this.scene
    );

    // Ajouter d'autres parties...

    // Définir la position du canon
    this.muzzlePosition = new Vector3(0, 0, 0.9);

    return gunBody;
  }
}
