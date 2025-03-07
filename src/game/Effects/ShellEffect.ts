import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsImpostor,
  Quaternion,
  Animation,
  EasingFunction,
  CubicEase,
  Mesh
} from "@babylonjs/core";

export class ShellEffect {
  private scene: Scene;
  private shells: any[] = [];
  private maxShells: number = 30; // Augmenter le nombre maximum de douilles
  private shellLifetime: number = 10000; // 10 secondes (plus réaliste)
  private lastEjectionTime: number = 0;
  private ejectionCooldown: number = 100; // 100ms entre chaque éjection pour éviter les doublons
  private ejectionDelay: number = 50; // Délai réduit pour une éjection plus rapide et réaliste

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public eject(position: Vector3, direction: Vector3 = new Vector3(1, 0, 0), weaponRoot: Mesh | null = null): void {
    // Vérifier si le moteur physique est disponible
    if (!this.scene.getPhysicsEngine()) {
      console.warn("Moteur physique non disponible pour l'éjection des douilles");
      return;
    }

    // Éviter les éjections trop rapprochées (doublons)
    const currentTime = Date.now();
    if (currentTime - this.lastEjectionTime < this.ejectionCooldown) {
      return;
    }
    this.lastEjectionTime = currentTime;

    // Ajouter un délai avant l'éjection pour la rendre plus visible
    // et pour qu'elle ne se produise pas en même temps que le tir
    setTimeout(() => {
      this.createShell(position, direction, weaponRoot);
    }, this.ejectionDelay);
  }

  private createShell(position: Vector3, direction: Vector3, weaponRoot: Mesh | null = null): void {
    // Vérifier si le moteur physique est disponible
    if (!this.scene.getPhysicsEngine()) {
      console.warn("Moteur physique non disponible pour l'éjection des douilles");
      return;
    }
    
    // Créer une douille plus réaliste avec une forme plus allongée
    const shell = MeshBuilder.CreateCylinder(
      "shell",
      { height: 0.08, diameter: 0.03, tessellation: 12 }, // Plus petite et plus allongée
      this.scene
    );

    // Matériau doré plus terne et réaliste pour la douille
    const shellMaterial = new StandardMaterial("shellMat", this.scene);
    shellMaterial.diffuseColor = new Color3(0.7, 0.55, 0.2); // Plus terne
    shellMaterial.specularColor = new Color3(0.8, 0.7, 0.3); // Moins brillant
    shellMaterial.specularPower = 16; // Moins brillant
    shellMaterial.emissiveColor = new Color3(0.1, 0.08, 0); // Moins d'émission
    shell.material = shellMaterial;

    // Positionner la douille
    if (weaponRoot) {
      // Calculer la position mondiale de la douille
      const worldMatrix = weaponRoot.getWorldMatrix();
      const worldPosition = Vector3.TransformCoordinates(position, worldMatrix);
      shell.position = worldPosition;
    } else {
      shell.position = position.clone();
    }

    // Orienter la douille horizontalement
    const upVector = new Vector3(0, 1, 0);
    const forwardVector = direction.clone();
    const rightDir = Vector3.Cross(upVector, forwardVector).normalize();
    
    // Créer un quaternion pour orienter la douille
    const quaternion = Quaternion.RotationAxis(rightDir, Math.PI / 2);
    shell.rotationQuaternion = quaternion;

    // Ajouter de la physique à la douille avec une masse plus réaliste
    shell.physicsImpostor = new PhysicsImpostor(
      shell,
      PhysicsImpostor.CylinderImpostor,
      { mass: 0.1, friction: 0.5, restitution: 0.3 },
      this.scene
    );

    // Utiliser directement la direction fournie par le module
    // Ajouter une légère variation aléatoire pour plus de réalisme
    const ejectionDir = direction.clone()
      .add(new Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      ))
      .normalize()
      .scale(0.5 + Math.random() * 0.3); // Force d'éjection réduite pour que les douilles n'aillent pas trop loin

    // Vérifier que l'impostor physique a été correctement créé
    if (shell.physicsImpostor) {
      // Appliquer une impulsion pour l'éjecter
      shell.physicsImpostor.applyImpulse(ejectionDir, shell.position.clone());

      // Appliquer un couple pour faire tourner la douille (vitesse de rotation réduite)
      const angularVelocity = new Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      shell.physicsImpostor.setAngularVelocity(angularVelocity);
    } else {
      console.warn("Impossible de créer l'impostor physique pour la douille");
    }

    // Ajouter la douille à la liste
    this.shells.push({
      mesh: shell,
      creationTime: Date.now()
    });

    // Limiter le nombre de douilles
    if (this.shells.length > this.maxShells) {
      const oldestShell = this.shells.shift();
      if (oldestShell && oldestShell.mesh) {
        this.dispose(oldestShell);
      }
    }

    // Nettoyer les douilles périodiquement
    this.cleanupShells();
  }

  private cleanupShells(): void {
    const currentTime = Date.now();
    
    // Parcourir la liste des douilles et supprimer celles qui sont trop vieilles
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const shell = this.shells[i];
      if (currentTime - shell.creationTime > this.shellLifetime) {
        if (shell.mesh) {
          this.dispose(shell);
        }
        this.shells.splice(i, 1);
      }
    }
  }

  // Méthode pour nettoyer correctement les ressources
  private dispose(shell: any): void {
    if (shell.mesh) {
      if (shell.mesh.physicsImpostor) {
        shell.mesh.physicsImpostor.dispose();
      }
      shell.mesh.dispose();
    }
  }
}
