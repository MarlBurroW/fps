import { BaseWeapon } from "../BaseWeapon";
import { Vector3 } from "@babylonjs/core";

export interface WeaponModule {
  apply(weapon: BaseWeapon): void;
  update?(): void;
  onFire?(position: Vector3, direction: Vector3): void;
}
