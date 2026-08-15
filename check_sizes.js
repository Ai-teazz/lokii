const fs = require('fs');
const path = require('path');

const dir1 = 'C:/Users/sanjeevi/.gemini/antigravity/scratch/loki-cinematic-scroll/extracted/seq1';
const dir2 = 'C:/Users/sanjeevi/.gemini/antigravity/scratch/loki-cinematic-scroll/extracted/seq2';
const dir3 = 'C:/Users/sanjeevi/.gemini/antigravity/scratch/loki-cinematic-scroll/extracted/seq3';

function getInfo(dir) {
  const files = fs.readdirSync(dir).sort();
  let totalBytes = 0;
  files.forEach(f => {
    totalBytes += fs.statSync(path.join(dir, f)).size;
  });
  return {
    count: files.length,
    first: files[0],
    last: files[files.length - 1],
    sizeMB: (totalBytes / (1024 * 1024)).toFixed(2)
  };
}

console.log('Seq1:', getInfo(dir1));
console.log('Seq2:', getInfo(dir2));
console.log('Seq3:', getInfo(dir3));
