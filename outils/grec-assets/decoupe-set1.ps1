param([string]$Source,[string]$Destination)
Add-Type -AssemblyName System.Drawing
$code=@'
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class DecoupeSetGrec {
  public static string Run(string source,string destination){
    Directory.CreateDirectory(destination);
    using(var bmp=new Bitmap(source)){
      int w=bmp.Width,h=bmp.Height,n=w*h;
      /* Le générateur a parfois inscrit un damier clair au lieu d'un alpha réel.
         On ne retire que les pixels gris clairs reliés au bord : le marbre blanc,
         enfermé dans les contours foncés des objets, reste intact. */
      var bg=new bool[n];var flood=new Queue<int>();
      Func<int,int,bool> checker=(x,y)=>{var c=bmp.GetPixel(x,y);int mx=Math.Max(c.R,Math.Max(c.G,c.B)),mn=Math.Min(c.R,Math.Min(c.G,c.B));return c.A>20&&mx-mn<9&&mn>215;};
      Action<int,int> seed=(x,y)=>{int p=y*w+x;if(!bg[p]&&checker(x,y)){bg[p]=true;flood.Enqueue(p);}};
      for(int x=0;x<w;x++){seed(x,0);seed(x,h-1);}for(int y=0;y<h;y++){seed(0,y);seed(w-1,y);}
      int[] fx={-1,1,0,0},fy={0,0,-1,1};
      while(flood.Count>0){int z=flood.Dequeue(),zx=z%w,zy=z/w;for(int k=0;k<4;k++){int nx=zx+fx[k],ny=zy+fy[k];if(nx<0||ny<0||nx>=w||ny>=h)continue;int np=ny*w+nx;if(!bg[np]&&checker(nx,ny)){bg[np]=true;flood.Enqueue(np);}}}
      var on=new bool[n];
      for(int y=0;y<h;y++)for(int x=0;x<w;x++)on[y*w+x]=!bg[y*w+x]&&bmp.GetPixel(x,y).A>20;
      var seen=new bool[n];var labels=new int[n];var comps=new List<Rectangle>();var compIds=new List<int>();var q=new Queue<int>();int nextId=0;
      int[] dx={-1,0,1,-1,1,-1,0,1},dy={-1,-1,-1,0,0,1,1,1};
      for(int y=0;y<h;y++)for(int x=0;x<w;x++){
        int p=y*w+x;if(!on[p]||seen[p])continue;
        int current=++nextId;seen[p]=true;labels[p]=current;q.Enqueue(p);int minx=x,maxx=x,miny=y,maxy=y,count=0;
        while(q.Count>0){int z=q.Dequeue(),zx=z%w,zy=z/w;count++;
          if(zx<minx)minx=zx;if(zx>maxx)maxx=zx;if(zy<miny)miny=zy;if(zy>maxy)maxy=zy;
          for(int k=0;k<8;k++){int nx=zx+dx[k],ny=zy+dy[k];if(nx<0||ny<0||nx>=w||ny>=h)continue;
            int np=ny*w+nx;if(on[np]&&!seen[np]){seen[np]=true;labels[np]=current;q.Enqueue(np);}}
        }
        if(count>350){comps.Add(Rectangle.FromLTRB(minx,miny,maxx+1,maxy+1));compIds.Add(current);}
      }
      // Les détails séparés de quelques pixels (cordes, lance) sont rattachés par leur
      // proximité. On regroupe ensuite les boîtes qui appartiennent au même quadrant.
      var zones=new[]{
        new Rectangle(0,0,w/3,h*58/100),
        new Rectangle(w/3,0,w/3,h*60/100),
        new Rectangle(w*2/3,0,w-w*2/3,h),
        new Rectangle(0,h*48/100,w*2/3,h-h*48/100)
      };
      string[] names={"ruines-colonne","olivier","statue-athena","tente-grecque"};
      var report=new List<string>();
      for(int i=0;i<zones.Length;i++){
        Rectangle box=Rectangle.Empty;int best=0,bestId=0;
        /* Une zone peut effleurer l'objet voisin (la cime de la tente sous l'olivier).
           On prend uniquement la composante opaque dominante de la zone au lieu
           d'unir tout ce qui la touche. */
        for(int ci=0;ci<comps.Count;ci++){var c=comps[ci];var inter=Rectangle.Intersect(c,zones[i]);int score=inter.Width*inter.Height;if(score>best){best=score;box=c;bestId=compIds[ci];}}
        if(box.IsEmpty)continue;
        int m=4;box=Rectangle.FromLTRB(Math.Max(0,box.Left-m),Math.Max(0,box.Top-m),Math.Min(w,box.Right+m),Math.Min(h,box.Bottom+m));
        using(var cut=new Bitmap(box.Width,box.Height,PixelFormat.Format32bppArgb)){
          using(var g=Graphics.FromImage(cut)){g.CompositingMode=System.Drawing.Drawing2D.CompositingMode.SourceCopy;g.Clear(Color.Transparent);g.DrawImage(bmp,new Rectangle(0,0,cut.Width,cut.Height),box,GraphicsUnit.Pixel);}
          for(int yy=0;yy<cut.Height;yy++)for(int xx=0;xx<cut.Width;xx++)if(labels[(yy+box.Y)*w+(xx+box.X)]!=bestId)cut.SetPixel(xx,yy,Color.Transparent);
          string path=Path.Combine(destination,names[i]+".png");cut.Save(path,ImageFormat.Png);report.Add(names[i]+":"+box.X+","+box.Y+","+box.Width+","+box.Height);
        }
      }
      return String.Join("\n",report);
    }
  }
}
'@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[DecoupeSetGrec]::Run($Source,$Destination)
