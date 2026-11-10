"""Usage: python3 gen.py <out.png> <aspect> <prompt-file> [ref.png ...]
Calls Nano Banana Pro (gemini-3-pro-image) over REST. Key from $GEMINI_API_KEY (never commit it)."""
import base64, json, os, sys, urllib.request, time
here = os.path.dirname(os.path.abspath(__file__))
key = os.environ["GEMINI_API_KEY"]
out, aspect, pfile, *refs = sys.argv[1:]
prompt = open(pfile).read() if os.path.exists(pfile) else pfile
style = open(os.path.join(here, os.environ.get("ART_STYLE", "style.txt"))).read()  # ART_STYLE picks another style file in this folder
parts = []
for r in refs:
    parts.append({"inline_data": {"mime_type": "image/png", "data": base64.b64encode(open(r, "rb").read()).decode()}})
parts.append({"text": prompt + "\n\n" + style})
body = {"contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect, "imageSize": "2K"}}}
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key={key}"
for attempt in range(3):
    try:
        import subprocess, tempfile
        bf = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False); json.dump(body, bf); bf.close()
        r = subprocess.run(["curl", "-s", "--max-time", "300", "-H", "Content-Type: application/json", "-d", "@" + bf.name, url], capture_output=True)
        os.unlink(bf.name)
        d = json.loads(r.stdout)
        if "error" in d: print("api", json.dumps(d["error"])[:300]); time.sleep(10); continue
        for c in d.get("candidates", []):
            for p in c.get("content", {}).get("parts", []):
                blob = p.get("inline_data") or p.get("inlineData")
                if blob:
                    open(out, "wb").write(base64.b64decode(blob["data"]))
                    print("ok", out); sys.exit(0)
        print("no image:", json.dumps(d)[:400])
    except urllib.error.HTTPError as e:
        print("http", e.code, e.read()[:300].decode(errors="ignore"))
    except Exception as e:
        print("err", repr(e)[:300])
    time.sleep(5)
sys.exit(1)
