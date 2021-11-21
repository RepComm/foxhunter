
import { Vec2 } from "@repcomm/vec2d";
import { deg2rad, lerp } from "./math";

export function _2dTo1d(x: number, y: number, width: number) {
  return x + width * y;
}
export function _1dTo2dX(index: number, width: number): number {
  return index % width;
}
export function _1dTo2dY(index: number, width: number): number {
  return index / width;
}

export interface RadioMapJson {
  heightMap: HTMLImageElement;
  heightMapData: ImageData;
  displayMap: ImageData;
  signalMapData: ImageData;
  minHeight: number;
  maxHeight: number;
}

export interface RadioMapOptions extends RadioMapJson {
  width: number;
  height: number;

}

export interface HeightMapRead {
  position: Vec2;
  pixelIndex: number;
  r: number;
  g: number;
  b: number;
  a: number;
  height: number;
}

export interface Transmission {
  position: Vec2;
  altitude: number;
  watts: number;
  frequency: number;
}

export class RadioMap implements RadioMapJson {
  heightMapData: ImageData;
  displayMap: ImageData;
  signalMapData: ImageData;
  minHeight: number;
  maxHeight: number;
  heightMapRead: HeightMapRead;
  point: Vec2;
  transmission: Transmission;
  needsSignalProcess: boolean;
  heightMap: HTMLImageElement;
  scanTo: Vec2;
  
  constructor(options: Partial<RadioMapOptions>) {
    let w = options.width || 512;
    let h = options.height || 512;
    
    this.heightMapData = options.heightMapData || new ImageData(w, h);
    this.displayMap = options.displayMap || new ImageData(w, h);
    this.signalMapData = options.signalMapData || new ImageData(w, h);

    this.minHeight = options.minHeight || 0;
    this.maxHeight = options.maxHeight || 100;

    this.heightMapRead = {
      a: 0,
      b: 0,
      g: 0,
      pixelIndex: 0,
      r: 0,
      position: new Vec2(),
      height: 0
    };

    this.point = new Vec2();

    this.transmission = {
      altitude: 75,
      frequency: 400,
      position: new Vec2().set(400, 400),
      watts: 800
    };

    this.needsSignalProcess = false;

    this.scanTo = new Vec2();
  }
  readHeightPixel(r: HeightMapRead) {
    r.pixelIndex = _2dTo1d(r.position.x, r.position.y, this.heightMapData.width) * 4;
    r.r = this.heightMapData.data[r.pixelIndex];
    r.g = this.heightMapData.data[r.pixelIndex + 1];
    r.b = this.heightMapData.data[r.pixelIndex + 2];
    r.a = this.heightMapData.data[r.pixelIndex + 3];
    r.height = lerp(this.minHeight, this.maxHeight, ((r.r + r.g + r.b)/3)/255 );
  }
  render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    ctx.putImageData(this.signalMapData, 0, 0);

    ctx.restore();
  }
  setNeedsSignalProcess (n: boolean = true): this {
    this.needsSignalProcess = n;
    return this;
  }
  isPointContained (p: Vec2): boolean {
    return (
      p.x > -1 && p.y > -1 &&
      p.x < this.heightMap.width &&
      p.y < this.heightMap.height
    );
  }
  scanLine(from: Vec2, to: Vec2) {
    let dist = from.distance(to);

    for (let i=0; i<dist; i++) {

      this.point.copy(from).lerp(to, i/dist);
      this.heightMapRead.position.set(
        Math.floor(this.point.x),
        Math.floor(this.point.y)
      );
      if (!this.isPointContained(this.heightMapRead.position)) break;
      this.readHeightPixel(this.heightMapRead);
      if (this.transmission.altitude < this.heightMapRead.height) {
        this.signalMapData.data[this.heightMapRead.pixelIndex] = 255;
        this.signalMapData.data[this.heightMapRead.pixelIndex + 1] = 0;
        this.signalMapData.data[this.heightMapRead.pixelIndex + 2] = 0;
        this.signalMapData.data[this.heightMapRead.pixelIndex + 3] = 255;
        break;
      } else {
        this.signalMapData.data[this.heightMapRead.pixelIndex] = 255;
        this.signalMapData.data[this.heightMapRead.pixelIndex + 1] = 255;
        this.signalMapData.data[this.heightMapRead.pixelIndex + 2] = 255;
        this.signalMapData.data[this.heightMapRead.pixelIndex + 3] = 255;
      }
    }

  }
  processSignal() {
    this.signalMapData.data.fill(0);
    if (!this.needsSignalProcess) return;
    
    let degreeStep = 2;
    let rads = 0;

    //set antenna altitude to height of terrain at its position
    //aka make mouse position aquire height of terrain its over
    this.heightMapRead.position.copy(this.transmission.position);
    this.readHeightPixel(this.heightMapRead);
    this.transmission.altitude = this.heightMapRead.height + 2;

    //scan in a circle
    for (let i=0; i<360; i+=degreeStep) {
      rads = deg2rad(i);

      this.scanTo
      .set(
        Math.sin(rads),
        Math.cos(rads)
      )
      .mulScalar(this.transmission.watts)
      .add(this.transmission.position);

      this.scanLine(this.transmission.position, this.scanTo);
    }

    this.needsSignalProcess = false;
  }
}

