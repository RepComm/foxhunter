
import { Drawing, EXPONENT_CSS_BODY_STYLES, EXPONENT_CSS_STYLES, Input, Panel } from "@repcomm/exponent-ts";
import { GameInput } from "@repcomm/gameinput-ts";
import { imageToImageData } from "./image";
import { RadioMap } from "./radiomap";

EXPONENT_CSS_BODY_STYLES.mount(document.head);
EXPONENT_CSS_STYLES.mount(document.head);

const container = new Panel()
.setId("container")
.mount(document.body);

let radiomap = new RadioMap({

});

let fr = new FileReader();

function inputToImage (input: Input): Promise<HTMLImageElement> {
  return new Promise(async (_resolve, _reject)=>{
    let files = input.element.files;
    if (!files || files.length < 1) {
      _reject(`no files in input element`);
      return;
    }
    let file = files[0];
    console.log(file);
    let cb = (evt) => {
      fr.removeEventListener("load", cb);
      let image = document.createElement("img") as HTMLImageElement;
      image.src = fr.result as string;
      let imageCb = (evt)=>{
        image.removeEventListener("load", imageCb);
        _resolve(image);
        return;
      }
      image.addEventListener("load", imageCb);
    }
    fr.addEventListener("load", cb);
    fr.readAsDataURL(file);
  });
}

const heightMapUpload = new Input()
.setType("file")
.setAttr("accept", "image/png, image/jpeg")
.setId("height-map-upload")
.mount(container)
.on("change", async (evt)=>{
  let image = await inputToImage(heightMapUpload);
  let data = imageToImageData(image, drawing.context);
  radiomap.heightMap = image;
  radiomap.heightMapData = data;

  let w = image.width;
  let h = image.height;

  radiomap.signalMapData = new ImageData(w, h);

  radiomap.transmission.position.set(w/2, h/2);

  drawing.width = w;
  drawing.height = h;

  console.log("rendering signal");
  radiomap.setNeedsSignalProcess();
  radiomap.processSignal();

  console.log("finished rendering");
});

const drawing = new Drawing()
// .setHandlesResize(true)
.setId("drawing")
.mount(container);

drawing.addRenderPass((ctx)=>{
  if (radiomap) {
    if (radiomap.heightMap) {
      ctx.save();
      if (radiomap.needsSignalProcess) {
        ctx.drawImage(
          radiomap.heightMap,
          0, 0,
          radiomap.heightMap.width,
          radiomap.heightMap.height
        );
      } else {
        ctx.putImageData(radiomap.signalMapData, 0, 0);

        ctx.globalAlpha = 0.5;

        ctx.drawImage(
          radiomap.heightMap,
          0, 0,
          radiomap.heightMap.width,
          radiomap.heightMap.height
        );

        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.ellipse(
          (input.raw.getPointerX() / window.innerWidth) * drawing.width,
          (input.raw.getPointerY() / window.innerHeight) * drawing.height,
          5, 5, 0, 0, Math.PI*2
        );
        ctx.stroke();
        ctx.closePath();

      }
      ctx.restore();
    }
  }
});

let fps = 5;

setInterval(()=>{
  drawing.setNeedsRedraw(true);
}, 1000/fps);

let input = GameInput.get();

setInterval(()=>{
  if (input.raw.getPointerButton(0)) {
    radiomap.transmission.position.set(
      (input.raw.getPointerX() / window.innerWidth) * drawing.width,
      (input.raw.getPointerY() / window.innerHeight) * drawing.height
    );
    if (radiomap.heightMap) {
      radiomap.setNeedsSignalProcess();
      radiomap.processSignal();
    }
  }
}, 1000/fps);
