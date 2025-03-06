import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PointLight,
  FreeCamera,
} from "@babylonjs/core";

import { ShellEffect } from "./Effects/ShellEffect";

export class Weapon {
  private weaponRoot: any;
  private muzzleFlash: any;
  private muzzleLight: PointLight;
  private barrelTipMarker: any;
  private camera: FreeCamera;
  private scene: Scene;
  private shellEffect: ShellEffect;

  constructor(scene: Scene, camera: FreeCamera) {
    this.scene = scene;
    this.camera = camera;
    this.shellEffect = new ShellEffect(scene);
    this.createWeapon();
  }

  public getBarrelPosition(): Vector3 {
    return this.barrelTipMarker.getAbsolutePosition();
  }

  public applyRecoil(): void {
    const recoilAmount = 0.1;

    // Animation de recul
    this.weaponRoot.position.z += recoilAmount;

    // Éjecter une douille
    this.shellEffect.eject(this.weaponRoot.getAbsolutePosition());

    // Récupération du recul
    setTimeout(() => {
      this.weaponRoot.position.z -= recoilAmount;
    }, 50);

    // Effet de flash du canon
    this.muzzleFlash.isVisible = true;
    this.muzzleLight.intensity = 5;

    // Cacher le flash après un court délai
    setTimeout(() => {
      this.muzzleFlash.isVisible = false;
      this.muzzleLight.intensity = 0;
    }, 50);
  }

  public getMuzzlePosition(): Vector3 {
    // Retourne la position du bout du canon
    return this.barrelTipMarker.getAbsolutePosition();
  }

  public flash(): void {
    // Activer la lumière du flash
    this.muzzleLight.intensity = 15;

    // Désactiver après un court délai
    setTimeout(() => {
      this.muzzleLight.intensity = 0;
    }, 50);
  }

  private createWeapon(): void {
    // Création du mesh de l'arme (un simple fusil stylisé)
    const gunBody = MeshBuilder.CreateBox(
      "gunBody",
      { width: 0.1, height: 0.1, depth: 0.6 },
      this.scene
    );

    // Canon du fusil
    const gunBarrel = MeshBuilder.CreateCylinder(
      "gunBarrel",
      { height: 0.7, diameter: 0.05 },
      this.scene
    );
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.z = 0.65;
    gunBarrel.position.y = 0.02; // Légère élévation du canon

    // Poignée du fusil
    const gunHandle = MeshBuilder.CreateBox(
      "gunHandle",
      { width: 0.05, height: 0.15, depth: 0.05 },
      this.scene
    );
    gunHandle.position.y = -0.12;
    gunHandle.position.z = 0.3;

    // Viseur du fusil
    const gunSight = MeshBuilder.CreateBox(
      "gunSight",
      { width: 0.02, height: 0.05, depth: 0.02 },
      this.scene
    );
    gunSight.position.y = 0.08;
    gunSight.position.z = 0.3;

    // Matériau pour l'arme
    const gunMaterial = new StandardMaterial("gunMaterial", this.scene);
    gunMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
    gunBody.material = gunMaterial;
    gunBarrel.material = gunMaterial;
    gunHandle.material = gunMaterial;

    // Matériau pour le viseur
    const sightMaterial = new StandardMaterial("sightMaterial", this.scene);
    sightMaterial.diffuseColor = new Color3(1, 0, 0);
    gunSight.material = sightMaterial;

    // Regrouper tous les éléments de l'arme
    this.weaponRoot = MeshBuilder.CreateBox(
      "weaponRoot",
      { size: 0.01 },
      this.scene
    );
    this.weaponRoot.isVisible = false;
    gunBody.parent = this.weaponRoot;
    gunBarrel.parent = this.weaponRoot;
    gunHandle.parent = this.weaponRoot;
    gunSight.parent = this.weaponRoot;

    // Positionner l'arme devant la caméra
    this.weaponRoot.position = new Vector3(0.3, -0.3, 1);
    this.weaponRoot.parent = this.camera;

    // Ajouter une légère animation de balancement pendant le mouvement
    this.scene.registerBeforeRender(() => {
      // Animation de l'arme lors du mouvement
      const cameraVelocity = this.camera.position.subtract(
        this.camera._previousPosition || this.camera.position
      );
      this.camera._previousPosition = this.camera.position.clone();

      // Balancement basé sur la vitesse
      const swayAmount = 0.03;
      const swaySpeed = 0.1;

      if (cameraVelocity.length() > 0.01) {
        // Balancement horizontal
        this.weaponRoot.rotation.y =
          Math.sin(Date.now() * swaySpeed) * swayAmount;
        // Balancement vertical
        this.weaponRoot.rotation.x =
          Math.cos(Date.now() * swaySpeed) * swayAmount;
      } else {
        // Retour à la position normale
        this.weaponRoot.rotation.y *= 0.9;
        this.weaponRoot.rotation.x *= 0.9;
      }
    });

    // Ajouter un point de référence visible à l'extrémité du canon
    this.barrelTipMarker = MeshBuilder.CreateSphere(
      "barrelTipMarker",
      { diameter: 0.02 },
      this.scene
    );
    const markerMaterial = new StandardMaterial("markerMaterial", this.scene);
    markerMaterial.diffuseColor = new Color3(1, 0, 0);
    this.barrelTipMarker.material = markerMaterial;

    // Positionner le marqueur à l'extrémité du canon
    this.barrelTipMarker.position = new Vector3(0, 0, -0.0);
    this.barrelTipMarker.parent = gunBarrel;

    // Rendre le marqueur invisible
    this.barrelTipMarker.isVisible = false;

    // Alternative: utiliser un disque plat qui fait face à la caméra
    this.muzzleFlash = MeshBuilder.CreateDisc(
      "muzzleFlash",
      { radius: 0.2, tessellation: 16 },
      this.scene
    );
    const muzzleFlashMaterial = new StandardMaterial(
      "muzzleFlashMat",
      this.scene
    );
    muzzleFlashMaterial.diffuseColor = new Color3(1, 0.7, 0);
    muzzleFlashMaterial.emissiveColor = new Color3(1, 0.7, 0);
    muzzleFlashMaterial.backFaceCulling = false; // Visible des deux côtés
    this.muzzleFlash.material = muzzleFlashMaterial;

    // Positionner le disque devant le canon
    this.muzzleFlash.position = new Vector3(0, 0, 0.1);
    this.muzzleFlash.parent = this.barrelTipMarker;

    // Faire en sorte que le disque fasse toujours face à la caméra
    this.muzzleFlash.billboardMode = 7; // Toujours face à la caméra

    // Cacher la flamme par défaut
    this.muzzleFlash.isVisible = false;

    // Créer une lumière pour le flash du canon
    this.muzzleLight = new PointLight(
      "muzzleLight",
      new Vector3(0, 0, 0),
      this.scene
    );
    this.muzzleLight.diffuse = new Color3(1, 0.7, 0);
    this.muzzleLight.specular = new Color3(1, 0.7, 0);
    this.muzzleLight.intensity = 0;
    this.muzzleLight.range = 3;
    this.muzzleLight.parent = this.barrelTipMarker;
  }
}
export default Weapon;
