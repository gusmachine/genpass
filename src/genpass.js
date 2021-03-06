const scryptAsync = require('scrypt-async');

/**
 * Cuts a Uint8Array into an array of n-bit integers.
 * @param {Uint8Array} ua the Uint8Array to cut.
 * @param {number} bits the number of bits used for each result element.
 * @return {Array<number>}
 */
function cutUint8(ua, bits) {
  let result = [];
  for (let i = 0; i + bits < ua.length * 8; i += bits) {
    const pos = Math.floor(i / 8);
    const rem = i - pos * 8;
    // Take 16 bits from ua[pos].
    let val = ua[pos] << 8;
    if (pos + 1 < ua.length) {
      val |= ua[pos + 1];
    }
    // Take rem ~ rem+bits bits from val.
    val >>= 16 - (rem + bits);
    val &= (1<<bits) - 1;
    result.push(val);
  }
  return result;
}

/**
 * Converts a Uint8Array into a passcode of specific length consisting of the
 * given charset. This needs length * log2(charset.length) * 2 bits of
 * Uint8Array on average. The result can be shorter than |length| in case if
 * |ua.length*8| is not sufficient.
 * @param {Uint8Array} ua the bitArray to convert.
 * @param {string} charset the list of characters used for the result.
 * @param {number} length the expected output string size.
 * @return {string}
 */
function passCreator(ua, charset, length) {
  const sigma = charset.length;
  const bitsArray = cutUint8(ua, Math.ceil(Math.log2(sigma)));
  let result = '';
  for (let i = 0; result.length < length && i < bitsArray.length; i ++) {
    if (bitsArray[i] < sigma) {
      result += charset[bitsArray[i]];
    }
  }
  return result;
}

/**
 * The hash function used for this program.
 * @param {string} salt the salt string.
 * @param {string} pass the password.
 * @return {Promise} Promise that returns Uint8Array.
 */
function hasherPromise(salt, pass) {
  return new Promise(function(resolve, reject) {
    // https://stackoverflow.com/questions/11126315/what-are-optimal-scrypt-work-factors
    // But reduced N by 2.
    // It takes 12 sec with N=2^20, 5 sec with N=2^18,19, on Mac Mini + Chrome.
    // It takes 7 sec on Nexus 6P chrome, 15 sec on iPhone 6 Safari with N=2^18.
    scryptAsync(pass, salt, {
      N: 1<<18,
      r: 8,
      p: 1,
      dkLen: 128,  // 1024 bits.
      encoding: 'binary',
    }, function(derivedKey) {
      resolve(derivedKey);
    });
  });
}

/**
 * Adds DOM nodes for password texts.
 * @param {Element} base the parent DOM element of the password nodes.
 * @param {number} size password length.
 */
function addPassNode(base, size) {
  let coder = base.appendChild(document.createElement('span'));
  for (let i = 0; i < size; i++) {
    let v = coder.appendChild(document.createElement('code'));
    v.classList.add('el');
    v.appendChild(document.createTextNode((i+1).toString(10)));
  }
}

/**
 * Updates the password nodes with the given code.
 * @param {Element} base the parent DOM element of the password nodes.
 * @param {string} code the new password code.
 */
function updatePass(base, code) {
  let nodes = base.querySelectorAll('.el');
  for (let i = 0; nodes[i]; i++) {
    nodes[i].firstChild.data = code.charAt(i);
  }
}

/**
 * Adds radiobutton + label control under |base| element.
 * @param {Element} base the parent element of the controls.
 * @param {string} name the name field of the radiobutton.
 * @param {string} value the value field of the radiobutton.
 * @param {string} labelText the text used for the label.
 * @return {Element} the radiobutton input element.
 */
function addRadioAndLabel(base, name, value, labelText) {
  let radio = base.appendChild(document.createElement('input'));
  radio.type = 'radio';
  radio.name = name;
  radio.value = value;
  const id = 'r-' + name + '-' + value;
  radio.id = id;
  let el = base.appendChild(document.createElement('label'));
  el.appendChild(document.createTextNode(labelText));
  el.htmlFor = id;
  return radio;
}

/**
 * Adds character set selection node in the form.
 * @param {string} title the title of th character set.
 * @param {string} table the character set table.
 * @return {Element} the added radio input element for the character set.
 */
function addChrChoice(title, table) {
  return addRadioAndLabel(
    document.getElementById('chrchoice'), 'char', table, title);
}

/**
 * Adds length selection node in the form.
 * @param {number} length the length choice.
 * @return {Element} the added radio input element for the size.
 */
function addLengthChoice(length) {
  const lenStr = length.toString();
  return addRadioAndLabel(
    document.getElementById('lenBase'), 'length', lenStr, lenStr);
}

const kPassSize = 25;

/**
 * Returns string starting from unicode CP start and ends with end.
 * @param {number} start the smallest unicode codepoint needed.
 * @param {number} end the largest unicode codepoint needed.
 * @return {string}
 */
function stringFromRange(start, end) {
  let r = '';
  for (let i = start; i <= end; i++) {
    r += String.fromCharCode(i);
  }
  return r;
}

/**
 * body.onload equivalent.
 */
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

  // For Safari.
  // Doesn't work on Safari yet, though. It raises NotSupportedError for the
  // following.
  // q = window.crypto.webkitSubtle.importKey(
  //     'raw', new Uint8Array([8]), {name: 'PBKDF2'}, false, ['deriveBits']);
  if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle) {
    window.crypto.subtle = window.crypto.webkitSubtle;
  }

  const table0 = '0123456789';
  const table1 = '123456789abcdefghijkmnprstuvwxyz';
  const table2 = table1 + 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  const keys = '!#$%&()*+-/<=>?@[]^';
  const table3 = table2 + keys + keys;
  addPassNode(document.getElementById('passhash'), 3);
  addPassNode(document.getElementById('passparent'), kPassSize);
  addPassNode(document.getElementById('gauge1'), kPassSize);
  // TODO: move to template.
  addChrChoice('0-9', table0);
  addChrChoice('01ab', table1);
  addChrChoice('01aB', table2).checked = true;
  addChrChoice('01aB%', table3);
  addChrChoice('あ',
    'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんー');
  addChrChoice('☀☁', stringFromRange(0x2600, 0x266f));
  addChrChoice('㍍㌠', stringFromRange(0x3300, 0x3357));
  addLengthChoice(8);
  addLengthChoice(12);
  addLengthChoice(16).checked = true;
  addLengthChoice(20);
  addLengthChoice(24);
  setInterval(interval, 1000);
}

/**
 * Updates URL path by adding the salt string. Called when the salt is updated.
 */
function upSalt() {
  const s = document.getElementById('salt').value;
  location.replace('#s=' + encodeURIComponent(s));
}

let resetCounter = 0;
const resetInitial = 20;

/**
 * Does countdown and resets password when the timer reaches 0. Called by
 * setInterval when the password is shown.
 */
function interval() {
  if (resetCounter > 0) {
    resetCounter -= 1;
    if (resetCounter == 0) {
      updatePass(document.getElementById('passparent'), '*'.repeat(kPassSize));
      document.getElementById('passbox').value = '';
    }
    document.getElementById('counter').firstChild.data = resetCounter;
  }
}

/**
 * The main function to calculate the password. Called when "generate" is
 * clicked.
 * @return {boolean} false to stop event propagation.
 */
function calcMain() {
  const start = performance.now();
  const form = document.forms[0];
  const salt = form.salt.value;
  const password = form.password.value;
  const hostname = form.host.value;
  const passHashP = hasherPromise(salt, password);
  const table = form.char.value;
  // FF and 䨺 and ꙮ. Anything you don't type.
  // The character table is also added here. Otherwise passwords made of the
  // same salt/pass/host with different tables are too close to each other.
  const pass = password + '\f\u4A3A' + hostname + '\f\uA66E' + table;
  const code2P = hasherPromise(salt, pass);

  passHashP.then(function(hash) {
    updatePass(document.getElementById('passhash'),
        passCreator(hash, '123456789abcdefghijkmnprstuvwxyz', kPassSize));
  });
  code2P.then(function(code) {
    const resultPass = passCreator(code, table, kPassSize);
    updatePass(document.getElementById('passparent'), resultPass);
    document.getElementById('passbox').value =
      resultPass.substr(0, parseInt(form.length.value));
    const now = performance.now();
    document.getElementById('dur').firstChild.data = Math.floor(now - start);
  });
  resetCounter = resetInitial;
  return false;
}

/**
 * Changes hidden/shown status of a specific node based on a checkbox value.
 * Called when the checkbox is clicked.
 * @param {string} buttonName the id of the checkbox element.
 * @param {string} targetName the id of the element that is hidden/shown by the
 * checkbox.
 */
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

/**
 * Hides/erases the password. Called by "clear" button clicks.
 */
function clearAllNow() {
  resetCounter = 1;
  interval();
}

init();
