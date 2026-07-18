param(
  [Parameter(Mandatory=$true)][string]$Action,
  [string]$Match = "",
  [string]$Text = "",
  [long]$Hwnd = 0,
  [int]$CharDelayMs = 120
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class Win32 {
  public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr p);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool f);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public static List<IntPtr> Handles = new List<IntPtr>();
  public static bool Collect(IntPtr h, IntPtr p){ if(IsWindowVisible(h)) Handles.Add(h); return true; }
  public static string Title(IntPtr h){
    int n = GetWindowTextLength(h); if(n==0) return "";
    StringBuilder sb = new StringBuilder(n+1); GetWindowText(h, sb, sb.Capacity); return sb.ToString();
  }
  public static bool ForceForeground(IntPtr h){
    ShowWindow(h, 9); // SW_RESTORE
    uint fgPid; uint fgThread = (uint)GetWindowThreadProcessId(GetForegroundWindow(), out fgPid);
    uint myThread = GetCurrentThreadId();
    uint tgtPid; uint tgtThread = (uint)GetWindowThreadProcessId(h, out tgtPid);
    AttachThreadInput(myThread, fgThread, true);
    AttachThreadInput(myThread, tgtThread, true);
    BringWindowToTop(h);
    SetForegroundWindow(h);
    AttachThreadInput(myThread, tgtThread, false);
    AttachThreadInput(myThread, fgThread, false);
    return GetForegroundWindow() == h;
  }
}
"@

# Make this process DPI-aware so GetWindowRect returns physical pixels that
# match what ddagrab captures (otherwise the crop is off on scaled displays).
[void][Win32]::SetProcessDPIAware()

function Find-Win([string]$sub){
  [Win32]::Handles.Clear()
  $cb = [Win32+EnumProc]{ param($h,$p) [Win32]::Collect($h,$p) }
  [void][Win32]::EnumWindows($cb, [IntPtr]::Zero)
  foreach($h in [Win32]::Handles){
    $t = [Win32]::Title($h)
    if($t -and $t.Contains($sub)){ return [pscustomobject]@{ hwnd=[long]$h; title=$t } }
  }
  return $null
}

switch($Action){
  "find" {
    $w = Find-Win $Match
    if($w){ $w | ConvertTo-Json -Compress } else { "null" }
  }
  "rect" {
    $h = [IntPtr]$Hwnd
    $r = New-Object Win32+RECT
    [void][Win32]::GetWindowRect($h, [ref]$r)
    [pscustomobject]@{ x=$r.L; y=$r.T; w=($r.R-$r.L); h=($r.B-$r.T) } | ConvertTo-Json -Compress
  }
  "focus" {
    $h = [IntPtr]$Hwnd
    $ok = $false
    for($i=0; $i -lt 8 -and -not $ok; $i++){
      $ok = [Win32]::ForceForeground($h)
      if(-not $ok){ Start-Sleep -Milliseconds 200 }
    }
    if($ok){ "ok" } else { "fail" }
  }
  "verify" {
    $h = [IntPtr]$Hwnd
    if([Win32]::GetForegroundWindow() -eq $h){ "ok" } else { "fail" }
  }
  "type" {
    # SAFETY: never type unless the target window is verified foreground for every char.
    $h = [IntPtr]$Hwnd
    if([Win32]::GetForegroundWindow() -ne $h){ Write-Output "fail"; break }
    foreach($ch in $Text.ToCharArray()){
      if([Win32]::GetForegroundWindow() -ne $h){ Write-Output "fail"; return }
      $s = [string]$ch
      if("+^%~(){}[]".Contains($s)){ $s = "{" + $s + "}" }
      [System.Windows.Forms.SendKeys]::SendWait($s)
      Start-Sleep -Milliseconds $CharDelayMs
    }
    Write-Output "ok"
  }
  "keys" {
    $h = [IntPtr]$Hwnd
    if($Hwnd -ne 0 -and [Win32]::GetForegroundWindow() -ne $h){ Write-Output "fail"; break }
    [System.Windows.Forms.SendKeys]::SendWait($Text)
    Write-Output "ok"
  }
}
