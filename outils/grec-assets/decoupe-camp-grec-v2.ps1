param(
  [string]$Tentes='C:\Users\berri\Desktop\APPLI\3.0\GREC\tentes_grec.png',
  [string]$Panneaux='C:\Users\berri\Desktop\APPLI\3.0\GREC\panneaux_grec.png',
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

public static class CampGrecV2 {
  static bool Fond(Color c){
    int mx=Math.Max(c.R,Math.Max(c.G,c.B)),mn=Math.Min(c.R,Math.Min(c.G,c.B));
    return c.A<18 || (mn>218 && mx-mn<18);
  }
  static bool[] FondExterieur(Bitmap b){
    int w=b.Width,h=b.Height;var bg=new bool[w*h];var q=new Queue<int>();
    Action<int,int> seed=(x,y)=>{int p=y*w+x;if(!bg[p]&&Fond(b.GetPixel(x,y))){bg[p]=true;q.Enqueue(p);}};
    for(int x=0;x<w;x++){seed(x,0);seed(x,h-1);}for(int y=0;y<h;y++){seed(0,y);seed(w-1,y);}
    int[] dx={-1,1,0,0,-1,1,-1,1},dy={0,0,-1,1,-1,-1,1,1};
    while(q.Count>0){int p=q.Dequeue(),x=p%w,y=p/w;for(int k=0;k<8;k++){int xx=x+dx[k],yy=y+dy[k];
      if(xx<0||yy<0||xx>=w||yy>=h)continue;int z=yy*w+xx;
      if(!bg[z]&&Fond(b.GetPixel(xx,yy))){bg[z]=true;q.Enqueue(z);}}}
    return bg;
  }
  /* La planche fournie contient un damier très clair et quelques pixels blancs
     soudés au contour des silhouettes. Après réduction bicubique, ils devenaient
     un liseré blanc opaque. On ne retire ici que le blanc neutre CONNECTÉ à la
     transparence, par trois pelures successives : les toiles crème et les pierres
     claires, colorées, restent intactes. */
  static void NettoieLiseres(Bitmap b){
    int w=b.Width,h=b.Height;int[] dx={-1,0,1,-1,1,-1,0,1},dy={-1,-1,-1,0,0,1,1,1};
    for(int tour=0;tour<3;tour++){
      var retire=new List<Point>();
      for(int y=0;y<h;y++)for(int x=0;x<w;x++){
        Color c=b.GetPixel(x,y);if(c.A<16)continue;
        int mx=Math.Max(c.R,Math.Max(c.G,c.B)),mn=Math.Min(c.R,Math.Min(c.G,c.B));
        if(mn<236||mx-mn>13)continue;
        bool bord=false;for(int k=0;k<8&&!bord;k++){int xx=x+dx[k],yy=y+dy[k];
          if(xx<0||yy<0||xx>=w||yy>=h||b.GetPixel(xx,yy).A<16)bord=true;}
        if(bord)retire.Add(new Point(x,y));
      }
      foreach(Point p in retire)b.SetPixel(p.X,p.Y,Color.Transparent);
      if(retire.Count==0)break;
    }
  }
  static void Serie(string src,string dst,string fam,Rectangle[] cells,int[] tw,int[] th,Rectangle[] noyaux){
    using(var b=new Bitmap(src)){int w=b.Width,h=b.Height;var bg=FondExterieur(b);
      for(int i=0;i<5;i++){var c=cells[i];int l=c.Right,t=c.Bottom,r=c.Left-1,bb=c.Top-1;
        /* Les deux rangées de la planche se chevauchent légèrement. On conserve la
           plus grande silhouette connexe de chaque cellule : aucun morceau du voisin
           ne peut donc rester suspendu au bord du PNG. */
        var seen=new bool[w*h];List<int> best=null;int[] ddx={-1,1,0,0,-1,1,-1,1},ddy={0,0,-1,1,-1,-1,1,1};
        for(int yy=Math.Max(0,c.Top);yy<Math.Min(h,c.Bottom);yy++)for(int xx=Math.Max(0,c.Left);xx<Math.Min(w,c.Right);xx++){
          int root=yy*w+xx;if(bg[root]||seen[root])continue;var part=new List<int>();var qq=new Queue<int>();seen[root]=true;qq.Enqueue(root);
          while(qq.Count>0){int p=qq.Dequeue(),px=p%w,py=p/w;part.Add(p);for(int k=0;k<8;k++){int nx=px+ddx[k],ny=py+ddy[k];
            if(nx<c.Left||nx>=c.Right||ny<c.Top||ny>=c.Bottom||nx<0||ny<0||nx>=w||ny>=h)continue;int np=ny*w+nx;
            if(!bg[np]&&!seen[np]){seen[np]=true;qq.Enqueue(np);}}}
          if(best==null||part.Count>best.Count)best=part;
        }
        if(best==null)throw new Exception("Cellule vide "+fam+" "+i);var keep=new HashSet<int>(best);
        foreach(int p in best){int x=p%w,y=p/w;if(x<l)l=x;if(x>r)r=x;if(y<t)t=y;if(y>bb)bb=y;}
        if(r<l||bb<t)throw new Exception("Cellule vide "+fam+" "+i);
        l=Math.Max(c.Left,l-2);r=Math.Min(c.Right-1,r+2);t=Math.Max(c.Top,t-2);bb=Math.Min(c.Bottom-1,bb+2);
        int cw=r-l+1,ch=bb-t+1;
        using(var cut=new Bitmap(cw,ch,PixelFormat.Format32bppArgb)){
          for(int y=0;y<ch;y++)for(int x=0;x<cw;x++){int sx=l+x,sy=t+y;Color px=b.GetPixel(sx,sy);
            /* Dans les tentes, le fond blanc forme parfois une poche entièrement
               fermée entre une corde et la toile. Elle appartient alors à la plus
               grande composante et échappe au détourage extérieur. Le fond de la
               planche est blanc/gris NEUTRE tandis que la toile est crème : on peut
               donc supprimer ces pixels neutres internes sans toucher au dessin. */
            bool trouInterieur=fam=="tente"&&Fond(px);
            cut.SetPixel(x,y,keep.Contains(sy*w+sx)&&!trouInterieur?px:Color.Transparent);}
          NettoieLiseres(cut);
          /* Pour les panneaux, la norme porte sur le NOYAU fonctionnel en bois et
             ses trois feuilles, pas sur les ornements extérieurs. Chaque noyau est
             amené à 100 × 64 px ; le fronton, les colonnes, rideaux et flammes
             conservent alors leur dépassement naturel. */
          bool panneau=noyaux!=null;
          float scaleX,scaleY;int ow,oh,dw,dh;
          if(panneau){Rectangle n=noyaux[i];scaleX=100f/n.Width;scaleY=64f/n.Height;
            dw=Math.Max(1,(int)Math.Round(cw*scaleX));dh=Math.Max(1,(int)Math.Round(ch*scaleY));ow=dw+4;oh=dh+4;
          }else{float sc=Math.Min((tw[i]-4f)/cw,(th[i]-4f)/ch);scaleX=scaleY=sc;
            dw=Math.Max(1,(int)Math.Round(cw*sc));dh=Math.Max(1,(int)Math.Round(ch*sc));ow=tw[i];oh=th[i];}
          using(var o=new Bitmap(ow,oh,PixelFormat.Format32bppArgb)){
            int ox=(ow-dw)/2,oy=oh-2-dh;using(var g=Graphics.FromImage(o)){
              g.CompositingMode=CompositingMode.SourceCopy;g.Clear(Color.Transparent);
              g.CompositingQuality=CompositingQuality.HighQuality;g.InterpolationMode=InterpolationMode.HighQualityBicubic;
              g.PixelOffsetMode=PixelOffsetMode.Half;g.DrawImage(cut,new Rectangle(ox,oy,dw,dh),0,0,cw,ch,GraphicsUnit.Pixel);}
            /* Le rééchantillonnage peut recréer un dernier sous-pixel blanc au bord. */
            NettoieLiseres(o);
            o.Save(Path.Combine(dst,fam+"-"+i+".png"),ImageFormat.Png);
            Console.WriteLine(fam+"-"+i+" src="+cw+"x"+ch+" dst="+dw+"x"+dh);
          }
        }
      }
    }
  }
  public static void Run(string tents,string panels,string dst){
    Directory.CreateDirectory(dst);
    var tc=new[]{new Rectangle(20,45,530,440),new Rectangle(535,55,500,445),new Rectangle(1010,15,526,505),new Rectangle(190,450,600,565),new Rectangle(760,450,670,565)};
    /* Les deux premières gardent leur taille validée. Les trois paliers supérieurs
       gagnent exactement 40 % en largeur et en hauteur dans le moteur. */
    Serie(tents,dst,"tente",tc,new[]{130,130,182,182,182},new[]{85,87,120,118,112},null);
    var pc=new[]{new Rectangle(0,245,305,490),new Rectangle(300,245,320,490),new Rectangle(615,245,315,490),new Rectangle(920,230,315,510),new Rectangle(1225,225,311,515)};
    /* Rectangle du panneau de bois portant les trois feuilles dans la planche source. */
    var pn=new[]{new Rectangle(12,372,276,238),new Rectangle(365,371,229,240),new Rectangle(666,389,223,221),new Rectangle(954,374,226,239),new Rectangle(1275,365,233,248)};
    Serie(panels,dst,"panneau",pc,new[]{110,110,110,110,110},new[]{88,88,88,88,88},pn);
  }
}
'@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[CampGrecV2]::Run($Tentes,$Panneaux,$Destination)
