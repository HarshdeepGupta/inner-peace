param(
  [Parameter(Mandatory=$true)][long]$Hwnd,
  [Parameter(Mandatory=$true)][string]$Dir,
  [double]$Seconds = 9,
  [int]$Fps = 12
)
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public class Cap {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint flags);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  static bool _dpi = false;
  public static void Save(IntPtr h, string file){
    if(!_dpi){ SetProcessDPIAware(); _dpi = true; }
    RECT r; GetWindowRect(h, out r);
    int w = r.R-r.L, ht = r.B-r.T;
    if(w<=0||ht<=0) return;
    using(Bitmap bmp = new Bitmap(w, ht)){
      using(Graphics g = Graphics.FromImage(bmp)){
        IntPtr hdc = g.GetHdc();
        PrintWindow(h, hdc, 2); // PW_RENDERFULLCONTENT
        g.ReleaseHdc(hdc);
      }
      bmp.Save(file, ImageFormat.Png);
    }
  }
}
"@

New-Item -ItemType Directory -Force $Dir | Out-Null
$h = [IntPtr]$Hwnd
$frameMs = [int](1000 / $Fps)
$total = [int]($Seconds * $Fps)
$sw = [System.Diagnostics.Stopwatch]::StartNew()
for($i=0; $i -lt $total; $i++){
  $target = $i * $frameMs
  $wait = $target - $sw.ElapsedMilliseconds
  if($wait -gt 0){ Start-Sleep -Milliseconds $wait }
  $file = Join-Path $Dir ("frame_{0:D5}.png" -f $i)
  [Cap]::Save($h, $file)
}
"captured $total frames"
