"""Prépare les 12 bâtiments de la fiche du 25 octobre, ordre validé par l'utilisateur."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'assets/sources/batiments-20261025'
DEST=ROOT/'demo/assets/scene/batiments'
TL=(0,0,768,512);TR=(768,0,1536,512);BL=(0,512,768,1024);BR=(768,512,1536,1024)
inn='auberge-4-finale.png' if (SRC/'auberge-4-finale.png').exists() else 'auberge-4-sans-enclume.png'
SELECTION={
 'auberge':[('auberge-planche.png',TR),('auberge-planche.png',TL),('auberge-planche.png',BL),(inn,None)],
 'forge':[('forge-1-detouree.png',None),('forge-planche.png',TL),('forge-planche.png',TR),('forge-planche.png',BL)],
 'comptoir':[('comptoir-planche.png',r) for r in [TL,TR,BL,BR]],
}
META={
 'auberge':[{'lampes':[[.55,.50]]},{},{'lampes':[[.43,.52]]},{}],
 'forge':[
  {'foyer':[.64,.63],'enclume':[.25,.59],'cheminee':[.74,.025]},
  {'foyer':[.65,.60],'enclume':[.37,.70],'cheminee':[.68,.025]},
  {'foyer':[.41,.65],'enclume':[.29,.75],'cheminee':[.49,.025]},
  {'foyer':[.63,.65],'enclume':[.32,.80],'cheminee':[.70,.025]},
 ],'comptoir':[{}, {}, {}, {}]
}
manifest={}
def main_box(im):
 # A roof from the neighbouring grid cell may extend a few pixels over the cut.
 # Find the main connected silhouette before trimming; preserve details inside it.
 a=im.getchannel('A');px=a.load();seen=set();largest=[]
 for y in range(im.height):
  for x in range(im.width):
   if px[x,y]<32 or (x,y) in seen:continue
   q=[(x,y)];seen.add((x,y));component=[]
   while q:
    xx,yy=q.pop();component.append((xx,yy))
    for dx,dy in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
     nx,ny=xx+dx,yy+dy
     if 0<=nx<im.width and 0<=ny<im.height and px[nx,ny]>=32 and (nx,ny) not in seen:seen.add((nx,ny));q.append((nx,ny))
   if len(component)>len(largest):largest=component
 assert largest
 return (max(0,min(x for x,y in largest)-2),max(0,min(y for x,y in largest)-2),min(im.width,max(x for x,y in largest)+3),min(im.height,max(y for x,y in largest)+3))
for name,selection in SELECTION.items():
 levels=[]
 for n,(source,rect) in enumerate(selection,1):
  c=Image.open(SRC/source).convert('RGBA')
  if rect:c=c.crop(rect)
  box=main_box(c)
  c=c.crop(box);c.thumbnail((640,640),Image.Resampling.LANCZOS)
  out=Image.new('RGBA',(c.width+8,c.height+8));out.paste(c,(4,4))
  filename=f'batiments/baie-{name}-{n}.webp';out.save(DEST.parent/filename,lossless=True)
  levels.append(dict(palette='saturate(0.64) sepia(0.12) contrast(0.88) brightness(0.96)',image=filename,w=out.width,h=out.height,pied=.965,taille=[.76,.84,.92,1][n-1],empreinte={'poly':[[.08,.87],[.5,.98],[.93,.87],[.5,.70]]},**META[name][n-1]))
 manifest[name]=levels
(DEST/'modeles-baie.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Diagnostic contact sheet, on a neutral background, with level labels outside assets.
cv=Image.new('RGB',(1000,800),'#dfdbd2');g=ImageDraw.Draw(cv)
for row,(name,entries) in enumerate(manifest.items()):
 for col,e in enumerate(entries):
  im=Image.open(DEST.parent/e['image']);im.thumbnail((230,230),Image.Resampling.LANCZOS)
  x=col*250+(250-im.width)//2;y=row*265+25+230-im.height
  cv.paste(im,(x,y),im);g.text((col*250+10,row*265+5),f'{name} {col+1}',fill='#24201c')
logs=ROOT/'test/logs/batiments-baie';logs.mkdir(parents=True,exist_ok=True);cv.save(logs/'modeles.png')
print('12 modèles exportés, forge 1 ajoutée, niveaux décalés corrigés, auberge 4 sans enclume.')
