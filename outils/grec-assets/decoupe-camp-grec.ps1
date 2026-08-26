param(
  [string]$Source='C:\Users\berri\Desktop\APPLI\3.0\GREC\SET_CAMP_GREC.png',
  [string]$Destination='C:\Users\berri\Documents\Claude\grec-assets\camp-set'
)
Add-Type -AssemblyName System.Drawing
$code=@'
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.Collections.Generic;

public static class CampGrecExtract {
  static bool Fond(Color c){
    int mx=Math.Max(c.R,Math.Max(c.G,c.B)),mn=Math.Min(c.R,Math.Min(c.G,c.B));
    return c.A<20 || (mn>216 && mx-mn<16);
  }
  public static string Run(string src,string dst){
    Directory.CreateDirectory(dst);
    using(var b=new Bitmap(src)){
      int w=b.Width,h=b.Height,n=w*h;var bg=new bool[n];var q=new Queue<int>();
      Action<int,int> seed=(x,y)=>{int p=y*w+x;if(!bg[p]&&Fond(b.GetPixel(x,y))){bg[p]=true;q.Enqueue(p);}};
      for(int x=0;x<w;x++){seed(x,0);seed(x,h-1);}for(int y=0;y<h;y++){seed(0,y);seed(w-1,y);}
      int[] dx={-1,1,0,0,-1,1,-1,1},dy={0,0,-1,1,-1,-1,1,1};
      while(q.Count>0){int p=q.Dequeue(),x=p%w,y=p/w;for(int k=0;k<8;k++){
        int xx=x+dx[k],yy=y+dy[k];if(xx<0||yy<0||xx>=w||yy>=h)continue;int z=yy*w+xx;
        if(!bg[z]&&Fond(b.GetPixel(xx,yy))){bg[z]=true;q.Enqueue(z);}
      }}
      /* Étiquette les silhouettes opaques. Les cellules de la planche se frôlent :
         garder tous leurs pixels emporterait un morceau du voisin. */
      var labels=new int[n];var areas=new List<int>();areas.Add(0);int next=0;
      for(int yy=0;yy<h;yy++)for(int xx=0;xx<w;xx++){
        int p=yy*w+xx;if(bg[p]||labels[p]!=0)continue;int id=++next,count=0;labels[p]=id;q.Enqueue(p);
        while(q.Count>0){int z=q.Dequeue(),zx=z%w,zy=z/w;count++;for(int k=0;k<8;k++){
          int nx=zx+dx[k],ny=zy+dy[k];if(nx<0||ny<0||nx>=w||ny>=h)continue;int np=ny*w+nx;
          if(!bg[np]&&labels[np]==0){labels[np]=id;q.Enqueue(np);}
        }}areas.Add(count);
      }
      int[] ys={0,330,600,835,1024};
      string[] fam={"tente","panneau","journal","oeuf"};
      /* Gabarits historiques communs des camps : une famille garde la même échelle
         visuelle d'un biome à l'autre, avec la légère variation propre à chaque palier. */
      int[,] tw={{130,130,130,130,130},{122,122,122,122,122},{80,80,80,80,80},{54,54,54,54,54}};
      int[,] th={{85,87,86,84,80},{88,87,86,87,88},{56,51,51,55,57},{40,40,40,40,40}};
      var rep=new List<string>();
      for(int row=0;row<4;row++)for(int col=0;col<5;col++){
        int x0=col*w/5,x1=(col+1)*w/5,y0=ys[row],y1=ys[row+1];
        var score=new Dictionary<int,int>();
        for(int y=y0;y<y1;y++)for(int x=x0;x<x1;x++){int id=labels[y*w+x];if(id>0)score[id]=score.ContainsKey(id)?score[id]+1:1;}
        int bestId=0,bestArea=0;foreach(var kv in score)if(kv.Value>bestArea){bestArea=kv.Value;bestId=kv.Key;}
        int l=x1,t=y1,r=x0-1,bb=y0-1;
        for(int y=y0;y<y1;y++)for(int x=x0;x<x1;x++)if(labels[y*w+x]==bestId){if(x<l)l=x;if(x>r)r=x;if(y<t)t=y;if(y>bb)bb=y;}
        if(r<l||bb<t)throw new Exception("Cellule vide "+row+","+col);
        l=Math.Max(x0,l-3);r=Math.Min(x1-1,r+3);t=Math.Max(y0,t-3);bb=Math.Min(y1-1,bb+3);
        int cw=r-l+1,ch=bb-t+1;
        using(var cut=new Bitmap(cw,ch,PixelFormat.Format32bppArgb)){
          for(int y=0;y<ch;y++)for(int x=0;x<cw;x++){
            int sx=l+x,sy=t+y;cut.SetPixel(x,y,labels[sy*w+sx]==bestId?b.GetPixel(sx,sy):Color.Transparent);
          }
          using(var outp=new Bitmap(tw[row,col],th[row,col],PixelFormat.Format32bppArgb)){
            float sc=Math.Min((tw[row,col]-4f)/cw,(th[row,col]-4f)/ch);int dw=Math.Max(1,(int)Math.Round(cw*sc)),dh=Math.Max(1,(int)Math.Round(ch*sc));
            int ox=(tw[row,col]-dw)/2,oy=th[row,col]-2-dh;
            using(var g=Graphics.FromImage(outp)){
              g.CompositingMode=CompositingMode.SourceCopy;g.Clear(Color.Transparent);
              g.CompositingQuality=CompositingQuality.HighQuality;g.InterpolationMode=InterpolationMode.HighQualityBicubic;
              g.PixelOffsetMode=PixelOffsetMode.Half;g.DrawImage(cut,new Rectangle(ox,oy,dw,dh),0,0,cw,ch,GraphicsUnit.Pixel);
            }
            string name=fam[row]+"-"+col+".png",path=Path.Combine(dst,name);outp.Save(path,ImageFormat.Png);
            rep.Add(name+" src="+l+","+t+","+cw+"x"+ch+" dst="+dw+"x"+dh);
          }
        }
      }
      return String.Join("\n",rep);
    }
  }
}
'@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[CampGrecExtract]::Run($Source,$Destination)
