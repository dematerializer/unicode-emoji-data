# Unicode Emoji Data

Your single source of truth for unicode compliant emoji data.
- correct & complete
- up-to-date
- fully tested
- lightweight, precompiled, easily parseable JSON format
- comprehensible for humans by means of [Unicode® Technical Report #51 - UNICODE EMOJI](http://www.unicode.org/reports/tr51)
- includes internationalized annotations (keywords and text-to-speech) provided by [CLDR](http://cldr.unicode.org/)
- no spritesheets

## Install

`npm install unicode-emoji-data`

## Usage

### CommonJS

`const emoji = require('unicode-emoji-data');`

### ES6/babel

`import emoji from 'unicode-emoji-data';`

## Structure

TODO

## License

MIT [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)

# TODO
1) testing (proves the "fully tested" statement)
2) check generated data against tr51 tables to verify data (proves the "correct & complete" statement)
3) emoji.expanded.json -> render each variation, combination, modification as a separate entry, possibly with internationalized tts and keywords
4) write documentation (readme)
bonus: merge in community-defined internationalized short names
bonus: categorize & sort based on CLDR and merged-in community-defined internationalized categorizations

Sort Order & Categorization
incomplete: http://www.unicode.org/repos/cldr/tags/release-30-d02/common/collation/root.xml
deprecated: http://www.unicode.org/Public/6.3.0/ucd/NamesList.txt
OSX proprietary: plutil -convert json -r "/System/Library/Input Methods/CharacterPalette.app/Contents/Resources/Category-Emoji.plist" -o ./Category-Emoji.json
Android proprietary:
https://android.googlesource.com/platform/packages/inputmethods/LatinIME/+/master/java/src/com/android/inputmethod/keyboard/emoji/EmojiCategory.java
https://android.googlesource.com/platform/packages/inputmethods/LatinIME/+/master/java/res/values/emoji-categories.xml
https://android.googlesource.com/platform/packages/inputmethods/LatinIME/+/master/java/res/values-de/strings-talkback-descriptions.xml
