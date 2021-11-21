

export function imageToImageData (
    image: HTMLImageElement,
    ctx: CanvasRenderingContext2D,
    width?: number,
    height?: number
  ): ImageData {
  if (!width) width = image.width;
  if (!height) height = image.height;
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}
