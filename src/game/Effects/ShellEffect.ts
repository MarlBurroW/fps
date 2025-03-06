import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsImpostor,
} from "@babylonjs/core";

export class ShellEffect {
  private scene: Scene;
  private shells: any[] = [];
  private maxShells: number = 20;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public eject(position: Vector3): void {
    // Créer une douille
    const shell = MeshBuilder.CreateCylinder(
      "shell",
      { height: 0.1, diameter: 0.05, tessellation: 8 },
      this.scene
    );

    // Matériau doré pour la douille
    const shellMaterial = new StandardMaterial("shellMat", this.scene);
    shellMaterial.diffuseColor = new Color3(0.8, 0.6, 0.2);
    shellMaterial.specularColor = new Color3(1, 0.8, 0.3);
    shell.material = shellMaterial;

    // Positionner la douille à côté de l'arme
    shell.position = position.clone();
    shell.position.y -= 0.1; // Légèrement en dessous
    shell.position.x += 0.2; // À droite

    // Rotation aléatoire
    shell.rotation.x = Math.random() * Math.PI;
    shell.rotation.y = Math.random() * Math.PI;
    shell.rotation.z = Math.random() * Math.PI;

    // Ajouter de la physique à la douille
    if (this.scene.getPhysicsEngine()) {
      shell.physicsImpostor = new PhysicsImpostor(
        shell,
        PhysicsImpostor.CylinderImpostor,
        { mass: 0.1, friction: 0.5, restitution: 0.3 },
        this.scene
      );

      // Appliquer une impulsion pour l'éjecter
      const impulseDir = new Vector3(
        0.5 + Math.random() * 0.5, // Vers la droite
        0.2 + Math.random() * 0.3, // Vers le haut
        -0.2 + Math.random() * 0.4 // Légèrement vers l'arrière
      );

      shell.physicsImpostor.applyImpulse(impulseDir, shell.position.clone());
    }

    // Ajouter la douille à la liste
    this.shells.push(shell);

    // Limiter le nombre de douilles
    if (this.shells.length > this.maxShells) {
      const oldestShell = this.shells.shift();
      if (oldestShell) {
        oldestShell.dispose();
      }
    }

    // Supprimer la douille après un certain temps
    setTimeout(() => {
      const index = this.shells.indexOf(shell);
      if (index !== -1) {
        this.shells.splice(index, 1);
        shell.dispose();
      }
    }, 5000);
  }
}
