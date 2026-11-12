const https = require('https');
const fs = require('fs');
const path = require('path');

const token = 'aca9d0f2b5f844e4ae335643f64a665d';
const targetDir = 'C:\\Users\\Jabali\\.gemini\\antigravity\\scratch\\cardex\\frontend\\public\\models';
const distDir = 'C:\\Users\\Jabali\\.gemini\\antigravity\\scratch\\cardex\\frontend\\dist\\models';

const items = [
  // Clean replacements for the reported broken models
  { name: 'vw_golf.glb', uid: '1fb8f26b105445fbaa98ca2577f7067e', label: 'VW Golf GTI Mk2' },
  { name: 'lada_niva.glb', uid: '41ac406a63524beb9b87b182ce5559ac', label: 'Lada Niva 4x4' },
  { name: 'vw_bora.glb', uid: 'cd7b81c9b9434216ab27d1ea198f236e', label: 'VW Bora MK4' },
  { name: 'fiat_128.glb', uid: '8f51c52ca76c42f198da45a3e7cab8c0', label: 'Fiat 125/128 Special' },
  { name: 'fiat_palio.glb', uid: '8cade8d6612149afb5231594b45985d9', label: 'Fiat Palio ELX 2006' },
  { name: 'renault_duster.glb', uid: '30bc2e09de66426bb67be72c95fa2476', label: 'Renault Duster 2011' },
  { name: 'peugeot_504.glb', uid: 'cc25e4d5a33a402e81ab764be6a0f61e', label: 'Peugeot 504 1968' },
  { name: 'peugeot_208.glb', uid: '6b1702763de542f68fed562f69d76fbb', label: 'Peugeot 208 WRX' },
  { name: 'peugeot_308.glb', uid: 'fa9cc490373148038254ad1a4c23720a', label: 'Peugeot 308 GT' },
  { name: 'chevrolet_astra.glb', uid: '83801648aa334f5fa23b4b4473649728', label: 'Chevrolet Astra 1998' },
  { name: 'citroen_2cv.glb', uid: 'fc67f88a5e7e497ca34195758e2c3bbe', label: 'Citroen 2CV 1970' },
  { name: 'honda_fit.glb', uid: '2b1f535f185e4a6abf6b0a3222487704', label: 'Honda Fit Jazz 2018' },
  { name: 'mitsubishi_lancer.glb', uid: 'c3d5dcd8ff724bc88c46760d92fc5188', label: 'Mitsubishi Lancer Evo 6' },
  // Clean replacements for Fitito and Kangoo (upright models)
  { name: 'fiat_600.glb', uid: '074fc934413d490e9094de44f8af32e7', label: 'Fiat 600 SS Replika' },
  { name: 'renault_kangoo.glb', uid: 'b41aca99878c4ffb8d7171b1f5df20d5', label: 'Renault Kangoo MK2' },

  // BMW Classics and Normals
  { name: 'bmw_e30.glb', uid: 'ac3c7013434e403e8faff87948caf422', label: 'BMW M3 E30' },
  { name: 'bmw_e36.glb', uid: '762b90efd3dc413cb61c3e3c8097b8ac', label: 'BMW E36 M3' },
  { name: 'bmw_e46.glb', uid: '478330312c3d46fd94999c3133ce0366', label: 'BMW 3 Series E46' },
  { name: 'bmw_e39.glb', uid: '93814bd879a64a61b58410422750ae3f', label: 'BMW M5 E39' },
  { name: 'bmw_2002.glb', uid: '285320b3030941b6909ae0be28ce45d1', label: 'BMW 2002 Turbo' },
  { name: 'bmw_1series.glb', uid: 'f474a256fd7b4b6ea60b1fdcdd8a933d', label: 'BMW 1 Series Coupe' },
  { name: 'bmw_x5.glb', uid: '9b211d525797457e988c903f67d0b753', label: 'BMW X5 M' },

  // More cars in general (Audi, Mercedes, Alfa Romeo)
  { name: 'audi_a3.glb', uid: 'b0eb581f30b941b3a2278194489c5374', label: 'Audi A3 2.0T' },
  { name: 'audi_a4.glb', uid: 'fd2e6813f8224d58b104dfbfc1ab3173', label: 'Audi A4 3.2 FSI' },
  { name: 'mercedes_190e.glb', uid: '15e5576f4b724f2db357165caed3492b', label: 'Mercedes 190E Evo' },
  { name: 'mercedes_cclass.glb', uid: 'd367d28eee22450da57ab4b7a2f0c56d', label: 'Mercedes C-Class W202' },
  { name: 'alfa_147.glb', uid: 'd0a4e13a2ee94dcbad7c57922c4c81e6', label: 'Alfa Romeo 147 GTA' }
];

function getDownloadUrl(uid) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.sketchfab.com',
      path: '/v3/models/' + uid + '/download',
      headers: { 'Authorization': 'Token ' + token, 'User-Agent': 'Node' }
    }, res => {
      let data = ''; res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.glb && json.glb.url) resolve(json.glb.url);
          else reject(new Error('No GLB download: ' + JSON.stringify(json)));
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP status ' + res.statusCode));
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Downloading ' + items.length + ' models (replacements + BMW classics + more)...');
  let ok = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const dest = path.join(targetDir, item.name);
    const destDist = path.join(distDir, item.name);
    console.log(`[${i+1}/${items.length}] ${item.label} -> ${item.name}...`);
    try {
      const url = await getDownloadUrl(item.uid);
      await downloadFile(url, dest);
      try { fs.copyFileSync(dest, destDist); } catch(e){}
      const mb = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
      console.log(`  -> OK (${mb} MB)`);
      ok++;
    } catch(err) {
      console.error(`  -> FAIL: ${err.message}`);
    }
  }
  console.log(`DONE: ${ok}/${items.length} downloaded successfully!`);
}

run();

