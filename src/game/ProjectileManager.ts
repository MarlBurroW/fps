import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  FreeCamera,
  ParticleSystem,
  Texture,
  Color4,
  Ray,
  GlowLayer,
  Quaternion,
} from "@babylonjs/core";

import { LightPool } from "./utils/LightPool";
import { TargetManager } from "./TargetManager";

import { BloodEffect } from "./Effects/BloodEffect";
import { BaseWeapon } from "./Weapons/BaseWeapon";

export class ProjectileManager {
  private scene: Scene;
  private camera: FreeCamera;
  private weapon: BaseWeapon | null;

  private targetManager: TargetManager;
  private projectiles: any[] = [];
  private projectileSpeed: number = 1;
  private isFiring: boolean = false;
  private onTargetHit: (targetIndex: number, hitPosition: Vector3) => void;
  private bloodEffect: BloodEffect;
  private glowLayer: GlowLayer;
  private particleTexture: Texture;

  constructor(
    scene: Scene,
    camera: FreeCamera,
    weapon: BaseWeapon | null,

    targetManager: TargetManager,
    onTargetHit: (targetIndex: number, hitPosition: Vector3) => void
  ) {
    this.scene = scene;
    this.camera = camera;
    this.weapon = weapon;

    this.targetManager = targetManager;
    this.onTargetHit = onTargetHit;
    this.bloodEffect = new BloodEffect(scene);

    // Créer une couche de lueur pour tous les projectiles
    this.glowLayer = new GlowLayer("projectileGlow", this.scene);
    this.glowLayer.intensity = 0.8;

    // Charger la texture pour les particules
    this.particleTexture = new Texture("assets/particle.png", this.scene);
  }

  public startFiring(): void {
    this.isFiring = true;
    this.shoot();

    // Démarrer le tir automatique
    const autoFireInterval = setInterval(() => {
      if (this.isFiring) {
        this.shoot();
      } else {
        clearInterval(autoFireInterval);
      }
    }, 100); // Cadence de tir (100ms = 10 tirs par seconde)
  }

  public stopFiring(): void {
    this.isFiring = false;
  }

  public update(): void {
    this.updateProjectiles();
  }

  private shoot(): void {
    if (!this.weapon) return;

    // Obtenir la position et la direction du tir
    const muzzlePosition = this.weapon.getMuzzlePosition();
    const direction = this.camera.getDirection(new Vector3(0, 0, 1));

    // Ajouter une légère dispersion
    const spread = 0.03;
    const randomSpread = new Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );
    const finalDirection = direction.add(randomSpread).normalize();

    // Créer le projectile
    this.createProjectile(muzzlePosition, finalDirection);

    // Activer l'effet de flash du canon
    this.weapon.flash();
  }

  private createProjectile(position: Vector3, direction: Vector3): void {
    // Créer un cylindre pour représenter le projectile
    const length = 0.5; // Longueur du projectile
    const projectileMesh = MeshBuilder.CreateCylinder(
      "projectile",
      { height: length, diameter: 0.05, tessellation: 8 },
      this.scene
    );

    // Positionner et orienter le projectile
    projectileMesh.position = position.clone();

    // Orienter le cylindre dans la direction du tir
    const upVector = new Vector3(0, 1, 0);
    if (Math.abs(Vector3.Dot(direction, upVector)) >= 0.99) {
      upVector.set(1, 0, 0);
    }

    const axis = Vector3.Cross(upVector, direction).normalize();
    const angle = Math.acos(Vector3.Dot(upVector, direction));
    projectileMesh.rotationQuaternion = Quaternion.RotationAxis(axis, angle);

    // Créer un matériau lumineux pour le projectile
    const projectileMaterial = new StandardMaterial(
      "projectileMat",
      this.scene
    );
    projectileMaterial.emissiveColor = new Color3(1, 0.7, 0);
    projectileMaterial.disableLighting = true;
    projectileMaterial.alpha = 0.7;
    projectileMesh.material = projectileMaterial;

    // Ajouter le projectile à la couche de lueur
    this.glowLayer.addIncludedOnlyMesh(projectileMesh);

    // Créer un système de particules pour la traînée
    const trail = new ParticleSystem("trail", 100, this.scene);
    trail.particleTexture = this.particleTexture;
    trail.emitter = projectileMesh;
    trail.minEmitBox = new Vector3(0, 0, -length / 2);
    trail.maxEmitBox = new Vector3(0, 0, -length / 2);

    // Direction des particules (opposée à la direction du projectile)
    trail.direction1 = direction.scale(-1);
    trail.direction2 = direction.scale(-1);

    // Propriétés des particules
    trail.color1 = new Color4(1, 0.7, 0, 1);
    trail.color2 = new Color4(1, 0.5, 0, 1);
    trail.colorDead = new Color4(1, 0.3, 0, 0);

    trail.minSize = 0.05;
    trail.maxSize = 0.15;

    trail.minLifeTime = 0.05;
    trail.maxLifeTime = 0.15;

    trail.emitRate = 120;
    trail.blendMode = ParticleSystem.BLENDMODE_ADD;

    trail.gravity = Vector3.Zero();

    trail.minEmitPower = 0.1;
    trail.maxEmitPower = 0.3;
    trail.updateSpeed = 0.01;

    // Démarrer le système de particules
    trail.start();

    // Ajouter le projectile à la liste sans la lumière
    this.projectiles.push({
      mesh: projectileMesh,
      direction: direction,
      speed: 1.5,
      distance: 0,
      maxDistance: 100,
      trail: trail,
    });
  }

  private updateProjectiles(): void {
    // Mettre à jour la position de chaque projectile
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      const oldPosition = projectile.mesh.position.clone();

      // Calculer le déplacement
      const movement = projectile.direction.scale(projectile.speed);
      projectile.mesh.position.addInPlace(movement);

      // Mettre à jour la distance parcourue
      projectile.distance += movement.length();

      // Vérifier les collisions avec les cibles
      const hitResult = this.targetManager.checkHit(
        oldPosition,
        projectile.mesh.position
      );

      if (hitResult.hit) {
        // Créer un effet de sang à l'endroit de l'impact
        this.bloodEffect.create(hitResult.position);

        // Informer le gestionnaire de jeu de la cible touchée
        this.onTargetHit(hitResult.targetIndex, hitResult.position);

        // Supprimer le projectile
        projectile.mesh.dispose();
        if (projectile.trail) {
          projectile.trail.stop();
          setTimeout(() => {
            projectile.trail.dispose();
          }, 500);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // Vérifier les collisions avec l'environnement
      const ray = new Ray(oldPosition, projectile.direction, 2);
      const hit = this.scene.pickWithRay(ray, (mesh) => {
        return mesh.checkCollisions && mesh.name !== "projectile";
      });

      if (hit && hit.pickedPoint) {
        // Créer un effet d'impact sur le mur
        const normal = hit.getNormal(true, true);
        if (normal) {
          this.createImpactEffect(hit.pickedPoint, normal);
        } else {
          // Utiliser une normale par défaut si aucune n'est disponible
          this.createImpactEffect(hit.pickedPoint, new Vector3(0, 1, 0));
        }

        // Supprimer le projectile
        projectile.mesh.dispose();
        if (projectile.trail) {
          projectile.trail.stop();
          setTimeout(() => {
            projectile.trail.dispose();
          }, 500);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // Supprimer le projectile s'il a dépassé sa distance maximale
      if (projectile.distance > projectile.maxDistance) {
        projectile.mesh.dispose();
        if (projectile.trail) {
          projectile.trail.stop();
          setTimeout(() => {
            projectile.trail.dispose();
          }, 500);
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  private createImpactEffect(position: Vector3, normal: Vector3): void {
    // Créer un système de particules pour l'impact
    const impactSystem = new ParticleSystem("impact", 50, this.scene);
    impactSystem.particleTexture = this.particleTexture;
    impactSystem.emitter = position;
    impactSystem.minEmitBox = new Vector3(0, 0, 0);
    impactSystem.maxEmitBox = new Vector3(0, 0, 0);

    // Orienter les particules selon la normale de la surface
    impactSystem.direction1 = normal.add(new Vector3(0.5, 0.5, 0.5));
    impactSystem.direction2 = normal.add(new Vector3(-0.5, -0.5, -0.5));

    // Propriétés des particules
    impactSystem.color1 = new Color4(1, 0.7, 0, 1);
    impactSystem.color2 = new Color4(0.8, 0.8, 0.8, 1);
    impactSystem.colorDead = new Color4(0.7, 0.7, 0.7, 0);

    impactSystem.minSize = 0.03;
    impactSystem.maxSize = 0.1;

    impactSystem.minLifeTime = 0.1;
    impactSystem.maxLifeTime = 0.3;

    impactSystem.emitRate = 100;
    impactSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    impactSystem.gravity = new Vector3(0, -9.81, 0);

    impactSystem.minEmitPower = 0.5;
    impactSystem.maxEmitPower = 1.5;
    impactSystem.updateSpeed = 0.01;

    // Démarrer le système de particules
    impactSystem.start();

    // Arrêter l'émission après un court délai
    setTimeout(() => {
      impactSystem.stop();

      // Nettoyer après que toutes les particules aient disparu
      setTimeout(() => {
        impactSystem.dispose();
      }, 500);
    }, 50);
  }
}
