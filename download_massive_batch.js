const https = require('https');
const fs = require('fs');
const path = require('path');

const token = 'aca9d0f2b5f844e4ae335643f64a665d';
const targetDir = 'C:\\Users\\Jabali\\.gemini\\antigravity\\scratch\\cardex\\frontend\\public\\models';
const distDir = 'C:\\Users\\Jabali\\.gemini\\antigravity\\scratch\\cardex\\frontend\\dist\\models';

const batch = [
  { name: 'vw_gol.glb', uid: '156c3f4dd90146b7914df1ce33046420' },
  { name: 'vw_beetle.glb', uid: '969a477451ee40bb8e715ec0907d187e' },
  { name: 'vw_golf.glb', uid: '23e8f278995448e7be905b0777a31529' },
  { name: 'vw_amarok.glb', uid: '7d4c472ba3244d5a8f99cf72f83ae9e8' },
  { name: 'vw_bora.glb', uid: 'a2d7282bb67745b296861fece9385827' },
  { name: 'fiat_600.glb', uid: 'c388a49e5a7d4637930122bccf90570c' },
  { name: 'fiat_147.glb', uid: '6c643d284d144dcb8db46ab11285ec0b' },
  { name: 'fiat_uno.glb', uid: '5984042da707483ba5c3784c50a4410d' },
  { name: 'fiat_palio.glb', uid: '8a3e71d4b4234110b59b09ef663e9448' },
  { name: 'fiat_128.glb', uid: 'cea87e69e09c45c7ba8e66cb1d95ec75' },
  { name: 'ford_falcon.glb', uid: 'bdb8783310e34bf896cf0cde08bac168' },
  { name: 'ford_ranger.glb', uid: 'e93ac097ee9a46a4a9decca9aceed03c' },
  { name: 'ford_ecosport.glb', uid: '3f06f5bc72274089b06e4bc838ea4223' },
  { name: 'chevrolet_astra.glb', uid: '4935752f09fd4f6b915cb12f0d3340aa' },
  { name: 'chevrolet_onix.glb', uid: 'bfd798c2695847b28ab681d42abc7056' },
  { name: 'renault_fuego.glb', uid: '37a0f282de1046a680dbde3664cebacd' },
  { name: 'renault_torino.glb', uid: 'ba4abbfdc57b445491dd5c3297f5d9d5' },
  { name: 'renault_duster.glb', uid: 'a253d913f99d4611860e8dd955c476d7' },
  { name: 'renault_kangoo.glb', uid: 'd96aa1b41936459a83bb2d023bf90d84' },
  { name: 'peugeot_504.glb', uid: '2bf330a3c92c4b89959fe1fbb1b197d9' },
  { name: 'peugeot_208.glb', uid: '3d4a1578573645de9a2915e93b7edcf7' },
  { name: 'citroen_2cv.glb', uid: 'abdb2d11268b405c90b117e0992693ee' },
  { name: 'citroen_berlingo.glb', uid: '8eeea349f1ca49fc9e79a9cc35e3ee88' },
  { name: 'toyota_hilux.glb', uid: '82bd37c5065040098fb0b86e07fcb959' },
  { name: 'toyota_yaris.glb', uid: '443fd49eb0844557a06854cae0b61267' },
  { name: 'honda_civic.glb', uid: 'ff844e296f214e709c0d0691d031c68b' },
  { name: 'honda_fit.glb', uid: '240e909a9180493ebdc1def6cbdde88f' }
];

function getDownloadUrl(uid) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.sketchfab.com',
      path: '/v3/models/' + uid + '/download',
      headers: { 'Authorization': 'Token ' + token, 'User-Agent': 'Node' }
    };
    https.get(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.glb && json.glb.url) resolve(json.glb.url);
          else reject(new Error('No GLB download available for ' + uid));
        } catch(e) { reject(e); }
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
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP status ' + res.statusCode));
      }
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
  console.log(`Starting massive batch download of ${batch.length} vehicles...`);
  let successCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    const dest = path.join(targetDir, item.name);
    const destDist = path.join(distDir, item.name);

    if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
      console.log(`[${i+1}/${batch.length}] Already downloaded: ${item.name}`);
      try { fs.copyFileSync(dest, destDist); } catch (e) {}
      successCount++;
      continue;
    }

    console.log(`[${i+1}/${batch.length}] Fetching ${item.name}...`);
    try {
      const url = await getDownloadUrl(item.uid);
      await downloadFile(url, dest);
      try { fs.copyFileSync(dest, destDist); } catch (e) {}
      const sizeMB = (fs.statSync(dest).size / (1024 * 1024)).toFixed(2);
      console.log(` -> SUCCESS: ${item.name} (${sizeMB} MB)`);
      successCount++;
    } catch (err) {
      console.error(` -> FAILED: ${item.name}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Batch download complete: ${successCount}/${batch.length} models ready!`);
}

run();

