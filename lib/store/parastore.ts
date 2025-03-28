import { Manifest } from "@fizz/chart-metadata-validation";
import { Model2D } from "./model2D";

export class ParaStore {
  private model: Model2D;
  
  constructor(private manifest: Manifest) {
    this.model = Model2D.fromManifest(manifest);
  }
}