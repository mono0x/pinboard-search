// http://c4se.hatenablog.com/entry/20100330/1269906760
var roman2hiragana = {
  'a':'あ', 'i':'い', 'u':'う', 'e':'え', 'o':'お',
  'ka':'か', 'ki':'き', 'ku':'く', 'ke':'け', 'ko':'こ',
  'sa':'さ', 'si':'し', 'su':'す', 'se':'せ', 'so':'そ',
  'ta':'た', 'ti':'ち', 'tu':'つ', 'te':'て', 'to':'と', 'chi':'ち', 'tsu':'つ',
  'na':'な', 'ni':'に', 'nu':'ぬ', 'ne':'ね', 'no':'の',
  'ha':'は', 'hi':'ひ', 'hu':'ふ', 'he':'へ', 'ho':'ほ', 'fu':'ふ',
  'ma':'ま', 'mi':'み', 'mu':'む', 'me':'め', 'mo':'も',
  'ya':'や', 'yi':'い', 'yu':'ゆ', 'ye':'いぇ', 'yo':'よ',
  'ra':'ら', 'ri':'り', 'ru':'る', 're':'れ', 'ro':'ろ',
  'wa':'わ', 'wyi':'ゐ', 'wu':'う', 'wye':'ゑ', 'wo':'を',
  'nn':'ん',
  'ga':'が', 'gi':'ぎ', 'gu':'ぐ', 'ge':'げ', 'go':'ご',
  'za':'ざ', 'zi':'じ', 'zu':'ず', 'ze':'ぜ', 'zo':'ぞ', 'ji':'じ',
  'da':'だ', 'di':'ぢ', 'du':'づ', 'de':'で', 'do':'ど',
  'ba':'ば', 'bi':'び', 'bu':'ぶ', 'be':'べ', 'bo':'ぼ',
  'pa':'ぱ', 'pi':'ぴ', 'pu':'ぷ', 'pe':'ぺ', 'po':'ぽ',
  'kya':'きゃ', 'kyu':'きゅ', 'kyo':'きょ',
  'sya':'しゃ', 'syu':'しゅ', 'syo':'しょ',
  'tya':'ちゃ', 'tyi':'ちぃ', 'tyu':'ちゅ', 'tye':'ちぇ', 'tyo':'ちょ', 'cha':'ちゃ', 'chu':'ちゅ', 'che':'ちぇ', 'cho':'ちょ',
  'nya':'にゃ', 'nyi':'にぃ', 'nyu':'にゅ', 'nye':'にぇ', 'nyo':'にょ',
  'hya':'ひゃ', 'hyi':'ひぃ', 'hyu':'ひゅ', 'hye':'ひぇ', 'hyo':'ひょ',
  'mya':'みゃ', 'myi':'みぃ', 'myu':'みゅ', 'mye':'みぇ', 'myo':'みょ',
  'rya':'りゃ', 'ryi':'りぃ', 'ryu':'りゅ', 'rye':'りぇ', 'ryo':'りょ',
  'gya':'ぎゃ', 'gyi':'ぎぃ', 'gyu':'ぎゅ', 'gye':'ぎぇ', 'gyo':'ぎょ',
  'zya':'じゃ', 'zyi':'じぃ', 'zyu':'じゅ', 'zye':'じぇ', 'zyo':'じょ',
  'ja':'じゃ', 'ju':'じゅ', 'je':'じぇ', 'jo':'じょ', 'jya':'じゃ', 'jyi':'じぃ', 'jyu':'じゅ', 'jye':'じぇ', 'jyo':'じょ',
  'dya':'ぢゃ', 'dyi':'ぢぃ', 'dyu':'ぢゅ', 'dye':'ぢぇ', 'dyo':'ぢょ',
  'bya':'びゃ', 'byi':'びぃ', 'byu':'びゅ', 'bye':'びぇ', 'byo':'びょ',
  'pya':'ぴゃ', 'pyi':'ぴぃ', 'pyu':'ぴゅ', 'pye':'ぴぇ', 'pyo':'ぴょ',
  'fa':'ふぁ', 'fi':'ふぃ', 'fe':'ふぇ', 'fo':'ふぉ',
  'fya':'ふゃ', 'fyu':'ふゅ', 'fyo':'ふょ',
  'xa':'ぁ', 'xi':'ぃ', 'xu':'ぅ', 'xe':'ぇ', 'xo':'ぉ', 'la':'ぁ', 'li':'ぃ', 'lu':'ぅ', 'le':'ぇ', 'lo':'ぉ',
  'xya':'ゃ', 'xyu':'ゅ', 'xyo':'ょ',
  'xtu':'っ', 'xtsu':'っ',
  'wi':'うぃ', 'we':'うぇ',
  'va':'ヴぁ', 'vi':'ヴぃ', 'vu':'ヴ', 've':'ヴぇ', 'vo':'ヴぉ'
};

/*
 * roman -> hiragana
 *
 * @param (String) roman:
 * @return (String): hiragana
 */
var r2h = function(roman){
  var hiragana = '', table = roman2hiragana,
      regex = new RegExp((function(table){
        var s='^(?:', key;
        for(key in table){s += key + '|'};
        return s+'(?:n(?![aiueo]|y[aiueo]|$))|'+'([^aiueon])\\1'+')';
      })(table)), result,
      i,l;
  for(i=0,l=roman.length; i<l; ++i){
    if(result = roman.slice(i).match(regex)){
      if(result[0] === 'n'){hiragana += 'ん'}
      else if((/^([^n])\1$/).test(result[0])){hiragana += 'っ'; --i}
      else{hiragana += table[result[0]]};
      i += result[0].length - 1;
    }else{
      hiragana += roman[i]
    };
  };
  return hiragana;
};
