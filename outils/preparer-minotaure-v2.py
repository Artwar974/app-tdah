from PIL import Image
from pathlib import Path
out=Path('demo/assets/scene/minotaure-v2');out.mkdir(exist_ok=True)
base=Path('assets/sources/minotaure-v2')
im=Image.open(base/'assis-detoure.png').convert('RGBA');im=im.crop(im.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox());im.thumbnail((300,300),Image.Resampling.LANCZOS);cv=Image.new('RGBA',(320,400));cv.paste(im,((320-im.width)//2,380-im.height));cv.save(out/'assis.png');print('assis',im.size)
im=Image.open(base/'tetes-detourees.png').convert('RGBA');w,h=im.size
for i,name in enumerate(['calme','content','dort']):
 c=im.crop((round(i*w/3),0,round((i+1)*w/3),h));c=c.crop(c.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox());c=c.resize((118,145),Image.Resampling.LANCZOS).crop((0,0,118,120));c.save(out/('tete_'+name+'.png'));print(name,c.size)

im=Image.open(base/'hache-detouree.png').convert('RGBA');im=im.crop(im.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox());im.thumbnail((130,335),Image.Resampling.LANCZOS);im.save(out/'hache.png')

# Active directional views: supplied eight-direction sheet, already transparent.
sheet=Image.open(base/'8sprites-original.png').convert('RGBA')
rects={'dos':(118,50,273,297),'arriere':(400,50,570,297),'dosD':(715,50,870,297),'profilG':(114,370,238,626),'profil':(744,370,872,626),'faceG':(118,690,279,954),'avant':(398,690,573,954),'face':(710,690,872,954)}
for name,rect in rects.items():
 c=Image.open(base/'nord-ouest-corrige.png').convert('RGBA') if name=='dos' else sheet.crop(rect);c=c.crop(c.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox())
 # Anchor on the hooves, not on the tail or the width of the shoulders.
 foot=c.crop((0,int(c.height*.80),c.width,c.height)).getchannel('A').point(lambda a:255 if a>100 else 0).getbbox()
 center=(foot[0]+foot[2])/2
 ratio=360/c.height;c=c.resize((round(c.width*ratio),360),Image.Resampling.LANCZOS)
 cv=Image.new('RGBA',(320,400));cv.paste(c,(round(160-center*ratio),20));cv.save(out/(name+'.png'))
