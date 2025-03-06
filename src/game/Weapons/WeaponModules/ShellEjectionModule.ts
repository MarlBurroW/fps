import { WeaponModule } from "./WeaponModule";
import { BaseWeapon } from "../BaseWeapon";
import { ShellEffect } from "../../Effects/ShellEffect";
import { Scene, Vector3 } from "@babylonjs/core";

export class ShellEjectionModule implements WeaponModule {
  private shellEffect: ShellEffect;
  private weapon: BaseWeapon;

  constructor(scene: Scene) {
    this.shellEffect = new ShellEffect(scene);
  }

  apply(weapon: BaseWeapon): void {
    this.weapon = weapon;
  }

  onFire(position: Vector3, direction: Vector3): void {
    this.shellEffect.eject(position);
  }
}
