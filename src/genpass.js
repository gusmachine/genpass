const sjcl = require('./sjcl');
// Converts a bytearray ba into (bits)-bit int array.
function cutByBits(ba, bits) {
  let result = [];
  for (let i = 0; i + bits < ba.length * 8; i += bits) {
    const pos = Math.floor(i / 8);
    const rem = i - pos * 8;
    // take 16 bits from ba[pos]
    let val = ba[pos] << 8;
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
  const sigma = charset.length;
  const bitsArray = cutByBits(ba, Math.ceil(Math.log2(sigma)));
  let result = '';
  for (let i = 0; result.length < length && i < bitsArray.length; i ++) {
    if (bitsArray[i] < sigma) {
      result += charset[bitsArray[i]];
    }
  }
  return result;
}

function hasher(salt, pass, iterations) {
  return sjcl.codec.bytes.fromBits(
      sjcl.misc.pbkdf2(pass, salt, iterations, 1024));
}

function addPassNode(base, size) {
  let coder = base.appendChild(document.createElement('span'));
  for (let i = 0; i < size; i++) {
    let v = coder.appendChild(document.createElement('code'));
    v.classList.add('el');
    v.appendChild(document.createTextNode((i+1).toString(10)));
  }
}

function updatePass(base, code) {
  let nodes = base.querySelectorAll('.el');
  for (let i = 0; nodes[i]; i++) {
    nodes[i].firstChild.data = code.charAt(i);
  }
}

function addChrChoice(title, table) {
  let base = document.getElementById('chrchoice');
  let radio = base.appendChild(document.createElement('input'));
  radio.type = 'radio';
  radio.name = 'char';
  radio.value = table;
  const id = 'r-' + table;
  radio.id = id;
  let el = base.appendChild(document.createElement('label'));
  el.appendChild(document.createTextNode(title));
  el.htmlFor = id;
  return radio;
}

const kPassSize = 30;

function init() {
  document.getElementById('salt').addEventListener('keyup', upSalt);
  document.getElementById('showsalt').addEventListener(
    'click', function() {
      changeShown('showsalt', 'salt');
    });
  document.getElementById('clear').addEventListener('click', clearAllNow);
  document.getElementById('submit').addEventListener('click', calcMain);
  document.getElementById('fm').addEventListener('submit', calcMain);
  document.getElementById('visible').addEventListener(
    'click', function() {
      changeShown('visible', 'passparent');
    });

  let s = '';
  location.hash.substr(1).split('&').forEach(function(part) {
    const pair = part.split('=');
    if (pair[0] == 's') {
      s = decodeURIComponent(pair[1]);
    }
  });
  document.getElementById('salt').value = s;

  const table0 = '0123456789';
  const table1 = '123456789abcdefghijkmnprstuvwxyz';
  const table2 = table1 + 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  const keys = '!#$%&()*+-/<=>?@[]^';
  const table3 = table2 + keys + keys;
  const table4 = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんー';
  addPassNode(document.getElementById('passhash'), 3);
  addPassNode(document.getElementById('passparent'), kPassSize);
  addPassNode(document.getElementById('gauge1'), kPassSize);
  // TODO: move to template.
  addChrChoice('0-9', table0);
  addChrChoice('01ab', table1);
  addChrChoice('01aB', table2).checked = true;
  addChrChoice('01aB%', table3);
  addChrChoice('あ', table4);
  setInterval(interval, 1000);
}

function upSalt() {
  const s = document.getElementById('salt').value;
  location.replace('#s=' + encodeURIComponent(s));
}

let resetCounter = 0;
const resetInitial = 20;

function interval() {
  if (resetCounter > 0) {
    resetCounter -= 1;
    if (resetCounter == 0) {
      clearAll();
    }
    document.getElementById('counter').firstChild.data = resetCounter;
  }
}

function calcMain() {
  const salt = document.getElementById('salt').value;
  const password = document.getElementById('password').value;
  const hostname = document.getElementById('host').value;
  const passHash = hasher(salt, password, 6000);
  const table = document.forms[0].char.value;
  // FF and 䨺 and ꙮ. Anything you don't type.
  // The character table is also added here. Otherwise passwords made of the
  // same salt/pass/host with different tables are too close to each other.
  const pass = password + '\f\u4A3A' + hostname + '\f\uA66E' + table;
  const code2 = hasher(salt, pass, 6000);

  updatePass(document.getElementById('passhash'),
      passCreator(passHash, '123456789abcdefghijkmnprstuvwxyz', kPassSize));
  updatePass(document.getElementById('passparent'),
      passCreator(code2, table, kPassSize));

  resetCounter = resetInitial;
  return false;
}

function changeShown(buttonName, targetName) {
  let cl = document.getElementById(targetName).classList;
  const checkbox = document.getElementById(buttonName);
  let parentLabel = checkbox.parentElement.classList;
  if (checkbox.checked) {
    cl.remove('hidden');
    parentLabel.add('on');
  } else {
    cl.add('hidden');
    parentLabel.remove('on');
  }
}

function clearAllNow() {
  resetCounter = 1;
  interval();
}

function clearAll() {
  updatePass(document.getElementById('passparent'), '*'.repeat(kPassSize));
}

init();
