/**Linear interpolation between from and to, using 0.0 - 1.0 interpolant `by`*/
export const lerp = (from: number, to: number, by: number): number => {
  return from*(1-by)+to*by;
}

/**Performs the inverse of lerp
 * Will give you the interpolant given the interpolated number and its bounds (to and from)
 */
export const inverseLerp = (from: number, to: number, value: number): number => {
  return (value - from) / (to - from);
}

export const deg2rad = (deg: number): number => deg * (Math.PI/180);
