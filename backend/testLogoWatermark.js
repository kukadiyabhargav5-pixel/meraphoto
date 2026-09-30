const sharp = require('sharp');
const axios = require('axios');

async function testLogo() {
  try {
    const width = 1600;
    const height = 1200;
    const opacity = 1;
    
    // Download logo
    const logoUrl = 'https://res.cloudinary.com/dikvjohp8/image/upload/v1784434740/events/assets/watermarks/s7qlbqaegz6m9ejuzszb.png';
    const logoRes = await axios.get(logoUrl, { responseType: 'arraybuffer' });
    const logoBuffer = Buffer.from(logoRes.data);
    
    // Resize logo
    const widthPercentage = 35;
    const heightPercentage = 20;
    const logoResizedWidth = Math.round(width * (widthPercentage / 100));
    const refHeight = Math.round(width * 0.75);
    const logoResizedHeight = Math.round(refHeight * (heightPercentage / 100));
    
    const sharpLogo = sharp(logoBuffer).resize({ width: logoResizedWidth, height: logoResizedHeight, fit: 'fill' });
    const resizedLogoBuffer = await sharpLogo.png().toBuffer();
    
    const logoW = logoResizedWidth;
    const logoH = logoResizedHeight;
    
    console.log("Resized Logo Width:", logoW, "Height:", logoH);
    
    const svgWrapper = `
      <svg width="${logoW}" height="${logoH}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="data:image/png;base64,${resizedLogoBuffer.toString('base64')}" width="${logoW}" height="${logoH}" opacity="${opacity}" />
      </svg>
    `;
    
    const finalLogoBuffer = await sharp(Buffer.from(svgWrapper)).png().toBuffer();
    console.log("Final Logo Buffer length:", finalLogoBuffer.length);
    
    const imageBuffer = await sharp({
      create: { width, height, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } }
    }).jpeg().toBuffer();
    
    const result = await sharp(imageBuffer)
      .composite([{ input: finalLogoBuffer, top: 100, left: 100 }])
      .toBuffer();
      
    await sharp(result).toFile('test_logo_watermark.jpg');
    console.log("Logo applied successfully");
  } catch (e) {
    console.error("Error:", e);
  }
}

testLogo();
