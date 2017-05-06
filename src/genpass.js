import {bitArray, misc} from './sjcl.js';
/**
 * Cuts a bitArray into an array of n-bit integers.
 * @param {bitArray} ba the bitArray to cut.
 * @param {number} bits the number of bits used for each result element.
 * @return {Array<number>}
 */
function cutByBits(ba, bits) {
  let result = [];
  const len = bitArray.bitLength(ba);
  for (let i = 0; i + bits < len; i += bits) {
    const val = bitArray.extract(ba, i, bits);
    result.push(val);
  }
  return result;
}

/**
 * Converts a bitArray into a passcode of specific length consisting of the
 * given charset. This needs length * log2(charset.length) * 2 bits of
 * bytearray on average. The result can be shorter than |length| in case if
 * |ba.length| is not sufficient.
 * @param {bitArray} ba the bitArray to convert.
 * @param {string} charset the list of characters used for the result.
 * @param {number} length the expected output string size.
 * @return {string}
 */
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

/**
 * The hash function used for this program.
 * @param {string} salt the salt string.
 * @param {string} pass the password.
 * @return {bitArray} hash result bitArray. Use passCreator to take string.
 */
function hasher(salt, pass) {
  return misc.pbkdf2(pass, salt, 6000, 1024);
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
 * Adds character set selection node in the form.
 * @param {string} title the title of th character set.
 * @param {string} table the character set table.
 * @return {Element} the added radio input element for the character set.
 */
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
  const salt = document.getElementById('salt').value;
  const password = document.getElementById('password').value;
  const hostname = document.getElementById('host').value;
  const passHash = hasher(salt, password);
  const table = document.forms[0].char.value;
  // FF and 䨺 and ꙮ. Anything you don't type.
  // The character table is also added here. Otherwise passwords made of the
  // same salt/pass/host with different tables are too close to each other.
  const pass = password + '\f\u4A3A' + hostname + '\f\uA66E' + table;
  const code2 = hasher(salt, pass);

  updatePass(document.getElementById('passhash'),
      passCreator(passHash, '123456789abcdefghijkmnprstuvwxyz', kPassSize));
  updatePass(document.getElementById('passparent'),
      passCreator(code2, table, kPassSize));

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
