#!/usr/bin/env node
// Signed Cloudinary upload. Usage: node cloudinary-upload.js <file> <public_id>
// Reads CLOUDINARY_URL from ../.env (gitignored). No SDK required.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const txt = fs.readFileSync(envPath, 'utf8');
  const line = txt.split('\n').find(l => l.trim().startsWith('CLOUDINARY_URL='));
  if (!line) throw new Error('CLOUDINARY_URL not found in .env');
  return line.slice(line.indexOf('=') + 1).trim();
}

function parseUrl(u) {
  const m = u.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) throw new Error('Bad CLOUDINARY_URL');
  return { apiKey: m[1], apiSecret: m[2], cloud: m[3] };
}

function upload(file, publicId) {
  const { apiKey, apiSecret, cloud } = parseUrl(loadEnv());
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: 'champions-network', overwrite: 'true', public_id: publicId, timestamp };
  const toSign = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');

  const boundary = '----cnform' + crypto.randomBytes(8).toString('hex');
  const fields = { ...params, api_key: apiKey, signature };
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${path.basename(file)}"\r\nContent-Type: image/png\r\n\r\n`));
  parts.push(fs.readFileSync(file));
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  const body = Buffer.concat(parts);

  const opts = {
    method: 'POST',
    hostname: 'api.cloudinary.com',
    path: `/v1_1/${cloud}/image/upload`,
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => (data += d));
      res.on('end', () => {
        const j = JSON.parse(data);
        if (j.secure_url) resolve(j.secure_url);
        else reject(new Error(data));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const [file, publicId] = process.argv.slice(2);
if (!file || !publicId) { console.error('Usage: node cloudinary-upload.js <file> <public_id>'); process.exit(1); }
upload(file, publicId).then(url => console.log(url)).catch(e => { console.error(e.message); process.exit(1); });
