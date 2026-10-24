"""Découpe déterministe des PNG fournis : aucun dessin régénéré ni déformé.

Les polygones sont propres à chaque vue. Les coupes arrondies se chevauchent
aux articulations ; les segments conservent leurs proportions et leurs pixels.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import json, math

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'demo/assets/scene/minotaure-v2'
# screen-left / screen-right chains; coordinates in each 320x400 source.
V={
 'avant':dict(neck=(160,126),waist=(160,218),head=[(98,0),(224,0),(221,100),(190,126),(158,143),(125,122),(101,103)],
  arms=[([(108,119),(76,129),(54,174),(45,214),(43,257),(70,270),(83,246),(83,210),(108,176),(115,143)],[(98,139),(76,190),(62,237),(63,258)]), ([(209,120),(236,137),(259,180),(273,251),(258,267),(242,258),(234,218),(216,191),(204,155)],[(222,140),(244,191),(258,237),(258,256)])],
  legs=[([(96,259),(146,274),(133,312),(121,351),(117,375),(65,375),(76,346),(90,318)],[(122,273),(109,316),(99,350),(91,368)]), ([(176,273),(224,260),(231,315),(239,347),(260,377),(207,378),(196,341),(193,310)],[(201,274),(213,316),(222,350),(230,368)])],
  skirt=[(108,216),(205,214),(227,272),(166,299),(91,274)],tail=[(97,218),(119,221),(101,263),(88,259)],far='G'),
 'face':dict(neck=(166,126),waist=(163,216),head=[(99,0),(227,0),(238,104),(217,122),(187,138),(142,121),(111,113)],
  arms=[([(106,121),(87,124),(71,145),(55,184),(42,216),(42,266),(61,282),(85,272),(89,230),(99,199),(112,176),(127,148)],[(96,142),(75,200),(65,250),(66,270)]), ([(218,130),(235,149),(250,181),(262,225),(257,246),(242,255),(229,237),(226,202),(210,171)],[(225,151),(238,189),(246,221),(250,240)])],
  legs=[([(97,263),(151,275),(126,320),(114,349),(117,372),(88,382),(67,364),(78,341),(86,305)],[(121,274),(106,314),(99,350),(97,372)]), ([(186,272),(224,255),(233,285),(216,320),(228,340),(240,353),(210,357),(192,343),(189,316)],[(205,275),(204,309),(211,335),(224,349)])],
  skirt=[(116,215),(216,211),(227,274),(180,293),(94,272)],tail=[(90,260),(79,287),(66,301),(52,326),(40,332),(40,301),(63,277)],far='D'),
 'faceG':dict(neck=(159,126),waist=(160,214),head=[(93,0),(231,0),(234,114),(204,130),(145,134),(113,115),(88,98)],
  arms=[([(106,128),(89,135),(71,168),(63,208),(60,236),(76,251),(85,242),(90,215),(111,181),(120,147)],[(104,146),(88,184),(77,219),(77,237)]), ([(207,122),(226,134),(247,169),(256,211),(261,259),(245,280),(227,275),(224,240),(213,212),(198,173)],[(218,144),(234,198),(240,246),(243,268)])],
  legs=[([(96,258),(143,270),(131,303),(118,325),(119,344),(97,355),(65,357),(68,342),(90,327),(93,302)],[(117,272),(111,305),(103,332),(90,349)]), ([(166,277),(217,265),(228,306),(226,335),(241,360),(239,379),(204,381),(192,362),(199,334),(179,313)],[(194,281),(208,318),(213,348),(219,372)])],
  skirt=[(105,212),(207,213),(219,274),(149,293),(87,267)],tail=[(242,272),(255,284),(273,301),(281,328),(280,337),(259,318),(248,309),(234,286)],far='G'),
 'arriere':dict(neck=(160,137),waist=(161,216),head=[(90,0),(230,0),(216,116),(193,147),(177,160),(149,148),(121,130),(109,91)],
  arms=[([(112,116),(91,121),(76,144),(60,179),(45,210),(45,251),(60,264),(77,259),(83,233),(83,206),(104,184),(115,149)],[(100,139),(76,193),(64,234),(62,253)]), ([(213,116),(235,132),(246,166),(270,205),(276,246),(264,262),(248,262),(239,242),(239,212),(221,188),(208,157)],[(223,140),(245,193),(258,233),(260,252)])],
  legs=[([(97,265),(142,280),(134,322),(121,344),(123,366),(97,375),(78,369),(83,348),(92,326)],[(120,282),(112,322),(108,349),(101,367)]), ([(180,279),(221,265),(229,318),(236,349),(249,367),(232,375),(207,370),(202,348),(191,323)],[(203,281),(210,322),(218,349),(226,367)])],
  skirt=[(112,216),(208,217),(223,276),(176,290),(148,284),(93,276)],tail=[(150,247),(165,246),(170,297),(178,335),(164,361),(147,341),(149,305)],far='G'),
 'dos':dict(neck=(157,137),waist=(155,218),head=[(85,0),(196,0),(211,86),(210,115),(195,140),(179,152),(145,122),(109,108),(92,91)],
  arms=[([(106,126),(88,141),(81,163),(69,190),(57,225),(47,256),(53,271),(70,280),(83,264),(87,244),(101,218),(113,187),(141,159),(137,136)],[(117,151),(91,203),(70,248),(65,265)]), ([(204,124),(220,142),(228,170),(241,196),(245,230),(239,246),(223,250),(212,235),(211,215),(207,189),(199,156)],[(216,146),(226,192),(228,227),(230,241)])],
  legs=[([(98,268),(141,282),(145,308),(129,337),(127,365),(116,375),(81,374),(79,363),(99,346),(103,317)],[(121,282),(123,315),(116,347),(106,367)]), ([(169,282),(208,273),(214,303),(209,326),(219,340),(210,347),(173,345),(167,335),(183,318),(176,301)],[(192,284),(195,310),(192,329),(191,341)])],
  skirt=[(115,217),(190,218),(208,278),(168,291),(96,272)],tail=[(182,238),(197,247),(217,278),(235,291),(243,318),(235,325),(213,308),(200,291)],far='D'),
 'dosD':dict(neck=(159,137),waist=(161,217),head=[(102,0),(226,0),(228,99),(201,112),(178,133),(147,151),(125,137),(114,107)],
  arms=[([(109,120),(93,131),(85,158),(72,184),(69,224),(70,243),(87,253),(99,240),(100,213),(110,191),(124,154)],[(102,141),(88,184),(85,226),(84,241)]), ([(204,123),(223,134),(237,158),(249,186),(264,220),(275,260),(263,275),(246,275),(237,254),(231,231),(218,211),(202,184),(189,151)],[(211,144),(236,195),(253,243),(260,263)])],
  legs=[([(104,270),(149,280),(138,309),(132,331),(133,343),(113,350),(87,344),(86,333),(103,319),(103,295)],[(124,282),(119,307),(116,329),(109,343)]), ([(174,283),(218,272),(221,309),(211,338),(218,360),(226,371),(215,378),(181,376),(176,362),(187,339),(184,316)],[(198,285),(201,317),(197,346),(200,369)])],
  skirt=[(114,216),(201,216),(221,275),(157,292),(98,275)],tail=[(113,239),(97,263),(83,280),(62,299),(60,324),(68,332),(87,318),(108,294)],far='G'),
 'profil':dict(neck=(179,131),waist=(171,222),head=[(104,0),(238,0),(251,112),(220,131),(187,134),(149,139),(120,163),(104,135)],
  arms=[([(140,137),(153,129),(171,134),(183,151),(179,182),(174,215),(189,244),(195,264),(182,278),(164,281),(150,267),(146,238),(134,212),(121,180),(124,154)],[(151,152),(150,212),(166,253),(179,270)])]*2,
  legs=[([(130,274),(189,279),(194,301),(179,325),(181,349),(201,359),(204,374),(170,380),(146,371),(147,348),(132,323),(120,299)],[(154,286),(159,321),(163,350),(184,371)])]*2,
  skirt=[(126,218),(202,213),(211,293),(168,284),(116,283)],tail=[(127,216),(123,238),(111,256),(91,269),(72,285),(60,310),(60,319),(85,307),(98,284),(122,265),(140,234)],far='G'),
 'profilG':dict(neck=(142,131),waist=(151,222),head=[(82,0),(215,0),(216,137),(203,163),(178,141),(133,130),(98,114),(82,98)],
  arms=[([(156,131),(176,135),(192,154),(192,180),(180,217),(168,242),(167,265),(152,279),(130,278),(123,262),(138,235),(141,211),(141,177),(142,148)],[(167,150),(166,209),(148,251),(141,270)])]*2,
  legs=[([(120,277),(174,273),(195,297),(180,322),(172,347),(176,366),(156,377),(119,379),(116,368),(141,349),(138,325),(121,302)],[(155,286),(163,317),(154,348),(138,369)])]*2,
  skirt=[(111,215),(184,218),(199,282),(152,283),(105,293)],tail=[(184,218),(201,244),(220,267),(241,282),(251,311),(251,321),(230,307),(223,288),(198,268),(179,237)],far='D'),
 'assis':dict(neck=(169,198),waist=(167,267),head=[(95,60),(238,60),(236,169),(217,188),(198,203),(167,210),(130,201),(100,191)],
  arms=[([(104,170),(84,179),(66,203),(57,229),(58,255),(74,285),(91,305),(109,316),(133,304),(125,287),(105,270),(101,252),(111,221),(123,190)],[(97,193),(82,250),(107,288),(125,301)]), ([(217,175),(239,187),(249,215),(264,236),(280,258),(298,278),(298,294),(285,308),(271,298),(266,276),(241,260),(222,242),(210,207)],[(228,194),(247,241),(276,275),(285,291)])],
  legs=[([(112,287),(149,302),(151,324),(129,346),(134,362),(118,379),(96,379),(88,366),(101,349),(87,329)],[(144,305),(115,326),(114,351),(113,370)]), ([(204,298),(251,275),(272,293),(258,319),(228,335),(250,347),(250,360),(232,369),(212,366),(195,345),(194,323)],[(202,308),(247,302),(218,338),(232,356)])],
  skirt=[(111,267),(213,258),(241,302),(181,322),(128,310)],tail=[(74,277),(50,274),(26,289),(16,320),(26,330),(44,311),(54,296),(86,293)],far='D')
}

# Fine tracing of the supplied 3/4 front views (their foot-centering shifts
# the body sideways relative to the front/back illustrations).
V['face']['arms'][0]=([(133,113),(112,112),(95,133),(86,164),(77,191),(77,221),(81,241),(81,259),(91,272),(113,272),(125,261),(121,244),(119,228),(117,212),(126,185),(145,166),(154,139)],[(128,135),(105,194),(103,238),(105,258)])
V['face']['arms'][1]=([(216,125),(233,134),(244,157),(257,178),(267,215),(270,230),(257,242),(244,237),(238,217),(235,201),(225,183),(214,162)],[(228,147),(246,186),(254,216),(255,233)])
V['face']['legs'][0]=([(121,259),(172,271),(154,300),(137,322),(133,341),(139,362),(132,377),(106,382),(94,372),(97,354),(111,335),(112,314),(109,293)],[(145,277),(128,314),(120,348),(121,370)])
V['face']['legs'][1]=([(186,266),(227,253),(229,287),(219,309),(225,326),(240,336),(251,353),(233,359),(205,350),(193,334),(192,314)],[(208,275),(208,309),(213,333),(230,350)])
V['face']['tail']=[(90,265),(102,271),(90,294),(90,313),(69,329),(70,302),(78,280)]
V['face']['skirt']=[(126,207),(212,205),(230,266),(185,286),(119,265)]
V['face']['head']=[(101,0),(237,0),(241,102),(226,121),(200,136),(171,123),(143,114),(113,107)]
V['face']['neck']=(170,118)
V['faceG']['arms'][1]=([(190,111),(214,125),(229,149),(243,176),(248,201),(239,225),(239,252),(231,269),(211,273),(199,261),(204,242),(206,219),(202,200),(183,177),(174,146)],[(199,137),(225,193),(220,235),(218,256)])
V['faceG']['legs'][1]=([(151,269),(198,258),(213,288),(216,315),(216,333),(228,355),(223,376),(196,383),(175,376),(175,359),(190,337),(183,315),(165,299)],[(181,278),(197,312),(201,346),(203,369)])
V['faceG']['skirt']=[(104,204),(189,204),(207,262),(143,285),(85,260)]
V['faceG']['tail']=[(230,265),(243,277),(251,295),(254,317),(236,308),(225,290),(222,276)]

def poly(points):
 m=Image.new('L',(1280,1600));ImageDraw.Draw(m).polygon([(x*4,y*4) for x,y in points],fill=255)
 return m.resize((320,400),Image.Resampling.LANCZOS)
def circle(p,r):
 x,y=p;m=Image.new('L',(1280,1600));ImageDraw.Draw(m).ellipse(((x-r)*4,(y-r)*4,(x+r)*4,(y+r)*4),fill=255)
 return m.resize((320,400),Image.Resampling.LANCZOS)
def halfplane(p,q,positive,overlap=0):
 dx,dy=q[0]-p[0],q[1]-p[1];length=math.hypot(dx,dy);dx/=length;dy/=length
 sign=1 if positive else -1
 x,y=p[0]-sign*overlap*dx,p[1]-sign*overlap*dy
 return poly([(x-dy*700,y+dx*700),(x+dy*700,y-dx*700),(x+dy*700+sign*dx*700,y-dx*700+sign*dy*700),(x-dy*700+sign*dx*700,y+dx*700+sign*dy*700)])

definition=json.loads((DEST/'minotaure.json').read_text(encoding='utf-8'))
UNDERLAY=ROOT/'assets/sources/minotaure-v2/rig/torse-sous-couches.png'
UNDER_ORDER=['avant','face','profil','dos','arriere','assis','faceG','profilG','dosD']
UNDER_BOX={'avant':(91,106,231,294),'face':(113,108,235,285),'profil':(111,107,214,283),'dos':(94,111,214,293),'arriere':(94,109,226,296),'assis':(103,170,245,324),'faceG':(85,104,213,285),'profilG':(103,106,209,283),'dosD':(102,112,224,295)}
def underpainting(name):
 if not UNDERLAY.exists():return Image.new('RGBA',(320,400))
 sheet=Image.open(UNDERLAY).convert('RGBA');i=UNDER_ORDER.index(name);w,h=sheet.size
 c=sheet.crop((round(i%3*w/3),round(i//3*h/3),round((i%3+1)*w/3),round((i//3+1)*h/3)))
 # Ignore transparent RGB and isolated generation-edge speckles.
 alpha=c.getchannel('A').point(lambda a:255 if a>100 else 0)
 pix=alpha.load();seen=set();largest=[]
 for y in range(c.height):
  for x in range(c.width):
   if not pix[x,y] or (x,y) in seen:continue
   queue=[(x,y)];seen.add((x,y));component=[]
   while queue:
    px,py=queue.pop();component.append((px,py))
    for nx,ny in [(px-1,py),(px+1,py),(px,py-1),(px,py+1)]:
     if 0<=nx<c.width and 0<=ny<c.height and pix[nx,ny] and (nx,ny) not in seen:seen.add((nx,ny));queue.append((nx,ny))
   if len(component)>len(largest):largest=component
 clean=Image.new('L',c.size);cp=clean.load()
 for x,y in largest:cp[x,y]=255
 c.putalpha(ImageChops.multiply(c.getchannel('A'),clean.filter(ImageFilter.MaxFilter(3))));c=c.crop(c.getbbox())
 x,y,r,b=UNDER_BOX[name];c=c.resize((r-x,b-y),Image.Resampling.LANCZOS);out=Image.new('RGBA',(320,400));out.alpha_composite(c,(x,y));return out
def main_component(image):
 box=image.getbbox()
 if not box:return image
 c=image.crop(box);a=c.getchannel('A');pix=a.load();seen=set();largest=[]
 for y in range(c.height):
  for x in range(c.width):
   if pix[x,y]<25 or (x,y) in seen:continue
   q=[(x,y)];seen.add((x,y));part=[]
   while q:
    px,py=q.pop();part.append((px,py))
    for nx,ny in [(px-1,py),(px+1,py),(px,py-1),(px,py+1)]:
     if 0<=nx<c.width and 0<=ny<c.height and pix[nx,ny]>=25 and (nx,ny) not in seen:seen.add((nx,ny));q.append((nx,ny))
   if len(part)>len(largest):largest=part
 mask=Image.new('L',c.size);mp=mask.load()
 for x,y in largest:mp[x,y]=255
 c.putalpha(ImageChops.multiply(a,mask.filter(ImageFilter.MaxFilter(3))))
 out=Image.new('RGBA',image.size);out.alpha_composite(c,box[:2]);return out
for name,data in V.items():
 im=Image.open(DEST/(name+'.png')).convert('RGBA');parts={};bones={};masks={}
 def add(k,mask,pivot,parent,z):
  masks[k]=mask.point(lambda x:255 if x>80 else 0)
  bones[k]=dict(pivot=list(pivot),parent=parent,z=z)
 bones['bassin']=dict(pivot=list(data['waist']),parent=None,z=0)
 head=poly(data['head']);skirt=poly(data['skirt']);tail=poly(data['tail'])
 # Torso is the chest up to the belt. Shoulder disks remain under the moving arms.
 left=data['arms'][0][1][0];right=data['arms'][1][1][0]
 if name in ['profil','profilG']:
  bounds=[(112,120),(205,120),(207,220),(109,220)]
 elif name=='assis':bounds=[(103,187),(226,184),(242,263),(102,278)]
 else:bounds=[(left[0]+3,left[1]-15),(data['neck'][0],data['neck'][1]-4),(right[0]-3,right[1]-15),(right[0]-10,data['waist'][1]+8),(left[0]+12,data['waist'][1]+8)]
 torso=poly(bounds)
 # Avoid a frozen hand or outer arm inside the torso at profile angles.
 for arm,j in data['arms']:
  armMask=poly(arm);socket=circle(j[0],17)
  torso=ImageChops.subtract(torso,ImageChops.subtract(armMask,socket))
 add('torse',torso,data['waist'],'bassin',30)
 add('tete',head,data['neck'],'torse',80)
 add('pagne',skirt,data['waist'],'bassin',55)
 add('queue',tail,data['tail'][0],'bassin',5 if name not in ['arriere'] else 56)
 for side,(outline,joints) in zip(['G','D'],data['arms']):
  shoulder,elbow,wrist,hand=joints;mask=poly(outline)
  # A round joint cap, rather than a rectangular overlapping slice.
  upper=ImageChops.multiply(mask,ImageChops.lighter(halfplane(elbow,wrist,False),circle(elbow,13)))
  lower=ImageChops.multiply(mask,ImageChops.multiply(ImageChops.lighter(halfplane(elbow,wrist,True),circle(elbow,13)),ImageChops.lighter(halfplane(wrist,hand,False),circle(wrist,9))))
  palm=ImageChops.multiply(mask,ImageChops.lighter(halfplane(wrist,hand,True),circle(wrist,9)))
  z=20 if side==data['far'] else 65
  add('bras'+side,upper,shoulder,'torse',z)
  add('avantBras'+side,lower,elbow,'bras'+side,z+1)
  add('main'+side,palm,wrist,'avantBras'+side,z+2)
 for side,(outline,joints) in zip(['G','D'],data['legs']):
  hip,knee,ankle,foot=joints;mask=poly(outline)
  thigh=ImageChops.multiply(mask,ImageChops.lighter(halfplane(knee,ankle,False),circle(knee,14)))
  shin=ImageChops.multiply(mask,ImageChops.multiply(ImageChops.lighter(halfplane(knee,ankle,True),circle(knee,14)),ImageChops.lighter(halfplane(ankle,foot,False),circle(ankle,10))))
  hoof=ImageChops.multiply(mask,ImageChops.lighter(halfplane(ankle,foot,True),circle(ankle,10)))
  z=10 if side==data['far'] else 14
  add('jambe'+side,thigh,hip,'bassin',z)
  add('tibia'+side,shin,knee,'jambe'+side,z+1)
  add('pied'+side,hoof,ankle,'tibia'+side,z+2)
 # Preserve all visible source pixels, including irregular mane/hoof silhouettes.
 # Fill only omitted cut-mask pixels by nearest region growth, never invent colors.
 coverage=Image.new('L',im.size)
 for mask in masks.values():coverage=ImageChops.lighter(coverage,mask)
 missing=ImageChops.subtract(im.getchannel('A').point(lambda x:255 if x else 0),coverage)
 grown={k:m.copy() for k,m in masks.items()}
 for iteration in range(80):
  if not missing.getbbox():break
  for k in masks:
   grown[k]=grown[k].filter(ImageFilter.MaxFilter(3))
   take=ImageChops.multiply(grown[k],missing)
   masks[k]=ImageChops.lighter(masks[k],take)
   missing=ImageChops.subtract(missing,take)
 assert not missing.getbbox(),name
 # No frozen hands on the skirt; no tail fragments on a moving leg.
 arms=ImageChops.lighter(poly(data['arms'][0][0]),poly(data['arms'][1][0]))
 for k in ['torse','pagne']:
  protect=Image.new('L',im.size)
  if k=='torse':
   for outline,joints in data['arms']:protect=ImageChops.lighter(protect,circle(joints[0],15))
  masks[k]=ImageChops.subtract(masks[k],ImageChops.subtract(arms,protect))
 for k in masks:
  if k.startswith(('jambe','tibia','pied')):masks[k]=ImageChops.subtract(masks[k],tail)
 under=underpainting(name)
 for k,mask in masks.items():
  # One texel of underlap removes sampling seams at rest.
  mask=mask.filter(ImageFilter.MaxFilter(3))
  c=im.copy();c.putalpha(ImageChops.multiply(c.getchannel('A'),mask));box=c.getbbox() or (0,0,1,1)
  if k.startswith(('bras','avantBras','main','jambe','tibia','pied')):
   # Cloth belongs to the torso/skirt, not to an overlapping limb.
   px=c.load()
   for yy in range(box[1],box[3]):
    for xx in range(box[0],box[2]):
     r,g,b,a=px[xx,yy]
     if a and r>150 and g>r*.76 and b>r*.53:px[xx,yy]=(r,g,b,0)
  if k in ['torse','pagne']:
   # Newly exposed areas only: original visible pixels stay on top.
   waist=data['waist'][1]
   patch=under.copy();cut=Image.new('L',im.size);ImageDraw.Draw(cut).rectangle((0,0 if k=='torse' else waist-4,320,waist+4 if k=='torse' else 400),fill=255)
   patch.putalpha(ImageChops.multiply(patch.getchannel('A'),cut));patch.alpha_composite(c);c=patch;box=c.getbbox()
  c=main_component(c);box=c.getbbox() or (0,0,1,1);parts[k]=(c.crop(box),box)
 # One trimmed atlas per direction; transparent padding prevents edge bleed.
 atlas=Image.new('RGBA',(1024,512));x=y=row=0
 for k,(part,box) in parts.items():
  if x+part.width+4>1024:x=0;y+=row+4;row=0
  atlas.paste(part,(x+2,y+2));bones[k]['image']=dict(frame=[x+2,y+2,part.width,part.height],origine=list(box[:2]))
  x+=part.width+4;row=max(row,part.height)
 assert y+row+4<=512
 atlas=atlas.crop((0,0,1024,y+row+4));atlas.save(DEST/('rig-'+name+'.png'))
 v=definition['vues'][name]
 for obsolete in ['maillage','morceaux','ordre','anim','ombres','sac','accessoires']:v.pop(obsolete,None)
 tail_start=data['tail'][0];attach=[data['waist'][0]+(-30 if tail_start[0]<data['waist'][0] else 30),data['waist'][1]+12]
 bones['queue']['pivot']=attach
 v['squelette']=dict(atlas='rig-'+name+'.png',os=bones,queueLien=[attach,[(attach[0]+tail_start[0])/2,tail_start[1]-3],[tail_start[0]+2,tail_start[1]+10]],appuis={s:list(j[1][-1]) for s,j in zip(['G','D'],data['legs'])},profil=name in ['profil','profilG'],assis=name=='assis',proche='D' if data['far']=='G' else 'G')
 print(name,len(parts),'pieces',atlas.size)
(DEST/'minotaure.json').write_text(json.dumps(definition,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
