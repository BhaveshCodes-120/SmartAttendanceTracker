const fs = require('fs');
const https = require('https');
const path = require('path');

const baseUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
const modelsDir = 'frontend/models';
const jsDir = 'frontend/js';

const files = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log('Downloaded: ' + dest);
                    resolve();
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // handle redirect
                https.get(response.headers.location, (responseRedirect) => {
                    if (responseRedirect.statusCode === 200) {
                         responseRedirect.pipe(file);
                         file.on('finish', () => {
                             file.close();
                             console.log('Downloaded (redirect): ' + dest);
                             resolve();
                         });
                    } else {
                         reject('Failed with status: ' + responseRedirect.statusCode + ' for ' + response.headers.location);
                    }
                }).on('error', (err) => {
                    fs.unlink(dest, () => {});
                    reject(err);
                });
            } else {
                reject('Failed with status: ' + response.statusCode + ' for ' + url);
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

(async () => {
    try {
        for (let f of files) {
            await downloadFile(baseUrl + f, path.join(modelsDir, f));
        }
        await downloadFile('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js', path.join(jsDir, 'face-api.min.js'));
        console.log('Done downloading everything.');
    } catch(e) {
        console.error('Error:', e);
    }
})();
