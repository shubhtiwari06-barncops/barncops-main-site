export type SeatMark = {
  id: string;
  name: string;
  d: string;
  seams: readonly string[];
  pin: readonly [number, number];
};

/** Stylized seat silhouettes. Outlines only — no sheet, no citation. */
export const SEAT_MARKS: readonly SeatMark[] = [
  {
    id: "panipat-urban",
    name: "Panipat City Assembly, Haryana",
    d: "M 152.2 22 L 200.6 32.9 L 211.5 114 L 234.9 131.2 L 242.7 146.8 L 242.7 173.3 L 222.4 195.2 L 234.9 203 L 244.2 221.7 L 238 234.2 L 213 243.5 L 199 265.4 L 203.7 288.8 L 188.1 290.3 L 185 301.2 L 189.6 334 L 169.4 334 L 167.8 318.4 L 158.4 318.4 L 150.6 329.3 L 121 330.9 L 110.1 323.1 L 75.8 179.6 L 110.1 164 L 127.2 164 L 147.5 179.6 Z",
    seams: ["M 127.2 164 L 188 196 L 222.4 195", "M 152 220 L 203 236 L 169 318"],
    pin: [158, 210],
  },
  {
    id: "adarsh-nagar",
    name: "Adarsh Nagar Assembly, New Delhi",
    d: "M 36 134 L 58.8 119.3 L 84.7 147.5 L 198.8 146.3 L 284 188.1 L 236.4 190.4 L 206.5 225.6 L 135.8 221.4 L 128.1 236.7 L 120.3 226.9 Z",
    seams: ["M 84.7 147.5 L 160 176 L 236.4 190", "M 120 200 L 180 188 L 206.5 225"],
    pin: [168, 178],
  },
  {
    id: "bhawanipatna",
    name: "Bhawanipatna Assembly, Odisha",
    d: "M 230.7 76.9 L 267.3 95.5 L 255.3 116 L 283.9 116.6 L 277.7 136 L 245 143.5 L 248.5 172.8 L 233.2 182.3 L 257.3 220.6 L 284 227 L 245.3 233.8 L 228.4 279.1 L 183.8 277.1 L 157.9 234.9 L 141.8 260.4 L 105.5 257.8 L 94.5 220.4 L 143.1 150.3 L 102 155.5 L 114.6 147.8 L 71.7 115.6 L 62.1 132.6 L 36 122.4 L 52.2 96.6 L 145.2 80 L 198 98.1 L 217 83.4 Z",
    seams: ["M 102 150 L 180 160 L 248 172", "M 145 120 L 170 190 L 184 270"],
    pin: [164, 176],
  },
  {
    id: "niwari",
    name: "Niwari Assembly, Madhya Pradesh",
    d: "M 224.6 113.8 L 237.2 95.4 L 267 98 L 247.9 145.6 L 274 149.3 L 284 176.4 L 261.1 188.3 L 242.4 176.2 L 267.8 164.7 L 231.4 173.1 L 193.9 209.3 L 211.8 208.1 L 211 229.4 L 168.1 226.2 L 156.8 260.6 L 121.3 244.8 L 100.9 257.9 L 97.2 227.3 L 36 216.2 L 79 209.2 L 79.7 183.5 L 102.5 188.1 L 94.8 167.4 L 137.5 146.2 L 159.6 151.9 L 136.1 171 L 188 185.6 L 176.2 160.2 L 208.8 154.5 L 182.5 152.6 L 169.7 123.9 L 217.4 136.9 L 219.1 152.2 L 217.7 114.2 Z",
    seams: ["M 100 190 L 168 176 L 242 176", "M 140 150 L 176 200 L 156 250"],
    pin: [168, 180],
  },
];

const BY_ID = Object.fromEntries(SEAT_MARKS.map((mark) => [mark.id, mark]));

export function seatMarkFor(id: string) {
  return BY_ID[id];
}
