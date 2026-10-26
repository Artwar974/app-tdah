from PIL import Image
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
regions={
'auberge':[(0,0,480,414),(480,0,985,414),(985,0,1536,416),(0,450,750,936),(750,415,1536,962)],
'comptoir':[(0,0,475,414),(475,0,955,414),(955,0,1536,430),(0,460,720,922),(720,430,1536,953)],
'forge':[(0,0,470,430),(470,0,990,433),(990,0,1536,440),(0,445,755,932),(755,440,1536,935)]}
names={'auberge':'auberge-detouree.png','comptoir':'comptoir-detoure.png','forge':'forge-detouree.png'}
manifest={}
for name,rects in regions.items():
 im=Image.open(root/'assets/sources/batiments'/names[name]).convert('RGBA')
 levels=[]
 for n,rect in enumerate(rects,1):
  crop=im.crop(rect); box=crop.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
  crop=crop.crop(box)
  crop.thumbnail((640,640),Image.Resampling.LANCZOS)
  # Padding prevents interpolation from neighbouring atlas regions.
  out=Image.new('RGBA',(crop.width+8,crop.height+8));out.paste(crop,(4,4))
  path=f'batiments/{name}-{n}.webp';out.save(root/'demo/assets/scene'/path,lossless=True)
  levels.append({'image':path,'w':out.width,'h':out.height})
 manifest[name]=levels
(root/'demo/assets/scene/batiments/modeles.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest,indent=2))
