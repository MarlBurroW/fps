import { BaseWeapon } from "./BaseWeapon";
import { Scene, FreeCamera, MeshBuilder, Vector3, Mesh } from "@babylonjs/core";

export class Shotgun extends BaseWeapon {
  constructor(scene: Scene, camera: FreeCamera) {
    super(scene, camera);

    // Propriétés spécifiques au shotgun
    this.fireRate = 800; // Tir lent
    this.damage = 50;
    this.spread = 0.1; // Spread important
    this.automatic = false; // Pas de tir automatique
  }

  protected createWeaponMesh(): Mesh {
    // Création du mesh spécifique au shotgun
    const gunBody = MeshBuilder.CreateBox(
      "shotgunBody",
      { width: 0.12, height: 0.12, depth: 0.7 },
      this.scene
    );

    // Ajouter d'autres parties...

    // Définir la position du canon
    this.muzzlePosition = new Vector3(0, 0, 0.8);

    return gunBody;
  }
}
