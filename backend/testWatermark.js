const fs = require('fs');
const sharp = require('sharp');

async function test() {
  const width = 1600;
  const height = 1200;
  const opacity = 0.5;
  const text = "Test Watermark";
  const fontSize = 100;
  const textX = "50%";
  const textY = "50%";
  const textAnchor = "middle";
  const dominantBaseline = "middle";

  const svgText = `
    <svg width="${width}" height="${height}">
      <style>
        .watermark-text {
          fill: #ffffff;
          font-size: ${fontSize}px;
          font-family: Arial, sans-serif;
          font-weight: bold;
          opacity: ${opacity};
        }
      </style>
      <text x="${textX}" y="${textY}" class="watermark-text" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${text}</text>
    </svg>
  `;
  
  try {
    const res = await sharp({
      create: { width, height, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } }
    })
    .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
    .png()
    .toFile('test_watermark.png');
    console.log("Success");
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
