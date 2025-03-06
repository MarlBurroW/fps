import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";

export class Environment {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
    this.createGround();
    this.createWalls();
  }

  private createGround(): void {
    // Création du sol
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 50, height: 50 },
      this.scene
    );
    const groundMaterial = new StandardMaterial("groundMat", this.scene);
    groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
    groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    groundMaterial.emissiveColor = new Color3(0.05, 0.05, 0.05); // Légère auto-illumination
    ground.material = groundMaterial;
    ground.checkCollisions = true;
  }

  private createWalls(): void {
    // Mur du fond
    const backWall = MeshBuilder.CreateBox(
      "backWall",
      { width: 50, height: 10, depth: 0.5 },
      this.scene
    );
    backWall.position = new Vector3(0, 5, 25);
    const backWallMat = new StandardMaterial("backWallMat", this.scene);
    backWallMat.diffuseColor = new Color3(0.4, 0.4, 0.6);
    backWallMat.specularColor = new Color3(0.2, 0.2, 0.3);
    backWallMat.emissiveColor = new Color3(0.1, 0.1, 0.2); // Ajouter une émission pour l'auto-illumination
    backWall.material = backWallMat;
    backWall.checkCollisions = true;

    // Mur gauche
    const leftWall = MeshBuilder.CreateBox(
      "leftWall",
      { width: 0.5, height: 10, depth: 50 },
      this.scene
    );
    leftWall.position = new Vector3(-25, 5, 0);
    const leftWallMat = new StandardMaterial("leftWallMat", this.scene);
    leftWallMat.diffuseColor = new Color3(0.6, 0.4, 0.4);
    leftWall.material = leftWallMat;
    leftWall.checkCollisions = true;

    // Mur droit
    const rightWall = MeshBuilder.CreateBox(
      "rightWall",
      { width: 0.5, height: 10, depth: 50 },
      this.scene
    );
    rightWall.position = new Vector3(25, 5, 0);
    const rightWallMat = new StandardMaterial("rightWallMat", this.scene);
    rightWallMat.diffuseColor = new Color3(0.6, 0.4, 0.4);
    rightWall.material = rightWallMat;
    rightWall.checkCollisions = true;
  }
}
