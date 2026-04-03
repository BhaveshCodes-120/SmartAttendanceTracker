import urllib.request
import os

base_url = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/'
models_dir = 'frontend/models'
js_dir = 'frontend/js'

files = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
]

for f in files:
    url = base_url + f
    dest = os.path.join(models_dir, f)
    print(f'Downloading {f}...')
    try:
        urllib.request.urlretrieve(url, dest)
        print(f'Done {f}')
    except Exception as e:
        print(f'Failed {f}: {e}')

js_url = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js'
js_dest = os.path.join(js_dir, 'face-api.min.js')
print('Downloading face-api.min.js...')
try:
    urllib.request.urlretrieve(js_url, js_dest)
    print('Done face-api.min.js')
except Exception as e:
    print(f'Failed face-api.min.js: {e}')
