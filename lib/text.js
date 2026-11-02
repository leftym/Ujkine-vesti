'use strict';
// Serbian text helpers: Cyrillic -> Latin for display, and a "fold" form for matching.

const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z', и: 'i', ј: 'j',
  к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's',
  т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š',
};

function toLatin(s) {
  return String(s || '').replace(/[Ѐ-ӿ]/g, (ch) => {
    const lo = ch.toLowerCase();
    const m = CYR[lo];
    if (!m) return ch;
    return ch === lo ? m : m[0].toUpperCase() + m.slice(1);
  });
}

// lowercase, Latin, no diacritics: "Šampion Đoković" -> "sampion djokovic"
function fold(s) {
  return toLatin(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'dj');
}

// fold + collapse everything non-alphanumeric to single spaces
function tokens(s) {
  return fold(s).replace(/[^a-z0-9]+/g, ' ').trim();
}

module.exports = { toLatin, fold, tokens };
