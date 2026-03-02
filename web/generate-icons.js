import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

// Convert SVG to PNG
async function convertSvgToPng(svgPath, outputPath, size) {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Gerado: ${outputPath}`);
  } catch (error) {
    console.error(`Erro ao converter ${svgPath}:`, error.message);
  }
}

async function generateIcons() {
  console.log('Gerando ícones PWA...\n');
  
  await convertSvgToPng(
    path.join(publicDir, 'icon-192.svg'),
    path.join(publicDir, 'icon-192.png'),
    192
  );
  
  await convertSvgToPng(
    path.join(publicDir, 'icon-512.svg'),
    path.join(publicDir, 'icon-512.png'),
    512
  );
  
  console.log('\n✓ Ícones PWA gerados com sucesso!');
}

generateIcons();
