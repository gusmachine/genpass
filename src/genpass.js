var sjcl = require('./sjcl');
// Converts a bytearray ba into (bits)-bit int array.
function cutByBits(ba, bits) {
  var result = [];
  for (var i = 0; i + bits < ba.length * 8; i += bits) {
    var pos = Math.floor(i / 8);
    var rem = i - pos * 8;
    // take 16 bits from ba[pos]
    var val = ba[pos] << 8;
    if (pos + 1 < ba.length) {
      val |= ba[pos + 1];
    }
    // take rem ~ rem+bits bits from val.
    val >>= 16 - (rem + bits);
    val &= (1<<bits) - 1;
    result.push(val);
  }
  return result;
}

// Converts a bytearray into a passcode of specific length consisting of
// charset.
// This needs ba * log2(charset.length) * 2 bits of bytearray on average.
function passCreator(ba, charset, length) {
  var sigma = charset.length;
  var bits_array = cutByBits(ba, Math.ceil(Math.log2(sigma)));
  var result = '';
  for (var i = 0; result.length < length && i < bits_array.length; i ++) {
    if (bits_array[i] < sigma) {
      result += charset[bits_array[i]];
    }
  }
  return result;
}

function hasher(salt, pass, iterations) {
  return sjcl.codec.bytes.fromBits(
      sjcl.misc.pbkdf2(pass, salt, iterations, 1024));
}

function addPassNode(base, size) {
  var coder = base.appendChild(document.createElement("span"));
  for (var i = 0; i < size; i++) {
    var v = coder.appendChild(document.createElement("code"));
    v.classList.add("el");
    v.appendChild(document.createTextNode((i+1).toString(10)));
  }
}

function updatePass(base, code) {
  var nodes = base.querySelectorAll(".el");
  for (var i = 0; nodes[i]; i++) {
    nodes[i].firstChild.data = code.charAt(i);
  }
}

function addChrChoice(title, table) {
  var base = document.getElementById("chrchoice");
  var radio = base.appendChild(document.createElement("input"));
  radio.type = "radio";
  radio.name = "char";
  radio.value = table;
  var id = "r-" + table;
  radio.id = id;
  var el = base.appendChild(document.createElement("label"));
  el.appendChild(document.createTextNode(title));
  el.htmlFor = id;
  return radio;
}

var kPassSize = 30;

function init() {
  document.getElementById("salt").addEventListener("keyup", upSalt);
  document.getElementById("showsalt").addEventListener(
    "click", function(){changeShown('showsalt', 'salt');});
  document.getElementById("clear").addEventListener("click", clearAllNow);
  document.getElementById("submit").addEventListener("click", calcMain);
  document.getElementById("fm").addEventListener("submit", calcMain);
  document.getElementById("visible").addEventListener(
    "click", function(){changeShown('visible', 'passparent');});

  var s="";
  location.hash.substr(1).split("&").forEach(function(part){
    var pair = part.split("=");
    if (pair[0] == "s") {
      s = decodeURIComponent(pair[1]);
    }
  });
  document.getElementById("salt").value = s;

  var table0 = "0123456789";
  var table1 = "123456789abcdefghijkmnprstuvwxyz";
  var table2 = table1 + "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  var keys = "!#$%&()*+-/<=>?@[]^";
  var table3 = table2 + keys + keys;
  var table4 = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんー";
  addPassNode(document.getElementById("passhash"), 3);
  addPassNode(document.getElementById("passparent"), kPassSize);
  addPassNode(document.getElementById("gauge1"), kPassSize);
  // TODO: move to template.
  addChrChoice("0-9", table0);
  addChrChoice("01ab", table1);
  addChrChoice("01aB", table2).checked = true;
  addChrChoice("01aB%", table3);
  addChrChoice("あ", table4);
  setInterval(interval, 1000);
}

function upSalt() {
  var s = document.getElementById("salt").value;
  location.replace("#s=" + encodeURIComponent(s));
}

var resetCounter = 0;
var resetInitial = 20;

function interval() {
  if (resetCounter > 0) {
    resetCounter -= 1;
    if (resetCounter == 0) {
      clearAll();
    }
    document.getElementById("counter").firstChild.data = resetCounter;
  }
}

function calcMain() {
  var salt = document.getElementById("salt").value;
  var password = document.getElementById("password").value;
  var hostname = document.getElementById("host").value;
  var pass_hash = hasher(salt, password, 6000);
  var table = document.forms[0].char.value;
  // FF and 䨺 and ꙮ. Anything you don't type.
  // The character table is also added here. Otherwise passwords made of the
  // same salt/pass/host with different tables are too close to each other.
  var pass = password + "\f\u4A3A" + hostname + "\f\uA66E" + table;
  var code2 = hasher(salt, pass, 6000);

  updatePass(document.getElementById("passhash"),
      passCreator(pass_hash, "123456789abcdefghijkmnprstuvwxyz", kPassSize));
  updatePass(document.getElementById("passparent"),
      passCreator(code2, table, kPassSize));

  resetCounter = resetInitial;
  return false;
}

function changeShown(buttonName, targetName) {
  var cl = document.getElementById(targetName).classList;
  var checkbox = document.getElementById(buttonName);
  var parentLabel = checkbox.parentElement.classList;
  if (checkbox.checked) {
    cl.remove("hidden");
    parentLabel.add("on");
  } else {
    cl.add("hidden");
    parentLabel.remove("on");
  }
}

function clearAllNow() {
  resetCounter = 1;
  interval();
}

function clearAll() {
  updatePass(document.getElementById("passparent"), "*".repeat(kPassSize));
}

init();
