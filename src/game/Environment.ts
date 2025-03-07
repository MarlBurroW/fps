import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsImpostor
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
    
    // Ajouter un impostor physique au sol pour que les douilles puissent entrer en collision avec lui
    if (this.scene.getPhysicsEngine()) {
      ground.physicsImpostor = new PhysicsImpostor(
        ground,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.5, friction: 0.5 },
        this.scene
      );
    }
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
    
    // Ajouter un impostor physique au mur du fond
    if (this.scene.getPhysicsEngine()) {
      backWall.physicsImpostor = new PhysicsImpostor(
        backWall,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.5, friction: 0.5 },
        this.scene
      );
    }

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
    
    // Ajouter un impostor physique au mur gauche
    if (this.scene.getPhysicsEngine()) {
      leftWall.physicsImpostor = new PhysicsImpostor(
        leftWall,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.5, friction: 0.5 },
        this.scene
      );
    }

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
    
    // Ajouter un impostor physique au mur droit
    if (this.scene.getPhysicsEngine()) {
      rightWall.physicsImpostor = new PhysicsImpostor(
        rightWall,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.5, friction: 0.5 },
        this.scene
      );
    }
  }
}
