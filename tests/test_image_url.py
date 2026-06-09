from urllib.request import Request, urlopen
import json

# Login
login_req = Request(
    'http://127.0.0.1:8000/auth/login',
    data=json.dumps({'emp_code': 'EMP001', 'password': '123456'}).encode(),
    headers={'Content-Type': 'application/json'}
)
login_resp = json.loads(urlopen(login_req).read())
token = login_resp['access_token']

# Get material
mat_req = Request(
    'http://127.0.0.1:8000/materials/1',
    headers={'Authorization': f'Bearer {token}'}
)
mat_resp = json.loads(urlopen(mat_req).read())
print("image URL:", mat_resp.get('image'))
