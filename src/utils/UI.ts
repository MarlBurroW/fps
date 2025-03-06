import {
  AdvancedDynamicTexture,
  TextBlock,
  Control,
  Rectangle,
} from "@babylonjs/gui";

export class UI {
  private advancedTexture: AdvancedDynamicTexture;
  private scoreText: TextBlock;
  private onScoreUpdate: (score: number) => void;

  constructor(onScoreUpdate: (score: number) => void) {
    this.onScoreUpdate = onScoreUpdate;
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this.createScoreDisplay();
    this.createCrosshair();
  }

  public updateScore(score: number): void {
    this.scoreText.text = "Score: " + score;
    this.onScoreUpdate(score);
  }

  private createScoreDisplay(): void {
    this.scoreText = new TextBlock();
    this.scoreText.text = "Score: 0";
    this.scoreText.color = "white";
    this.scoreText.fontSize = 24;
    this.scoreText.top = "20px";
    this.scoreText.left = "20px";
    this.scoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.advancedTexture.addControl(this.scoreText);
  }

  private createCrosshair(): void {
    // Créer un réticule simple (croix)
    const crosshairSize = 20;
    const crosshairThickness = 2;
    const crosshairColor = "white";

    // Ligne horizontale
    const horizontalLine = new Rectangle();
    horizontalLine.width = crosshairSize + "px";
    horizontalLine.height = crosshairThickness + "px";
    horizontalLine.background = crosshairColor;
    horizontalLine.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    horizontalLine.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.advancedTexture.addControl(horizontalLine);

    // Ligne verticale
    const verticalLine = new Rectangle();
    verticalLine.width = crosshairThickness + "px";
    verticalLine.height = crosshairSize + "px";
    verticalLine.background = crosshairColor;
    verticalLine.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    verticalLine.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.advancedTexture.addControl(verticalLine);
  }
}
