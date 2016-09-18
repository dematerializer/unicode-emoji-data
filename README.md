# Unicode Emoji Data

Your single source of truth for unicode compliant emoji data.
- correct & complete
- up-to-date
- fully tested
- lightweight, precompiled, easily parseable JSON format
- comprehensible for humans by means of [Unicode® Technical Report #51 - UNICODE EMOJI](http://www.unicode.org/reports/tr51)
- includes internationalized annotations (keywords and text-to-speech) provided by [CLDR](http://cldr.unicode.org/)

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
"community-defined" means not only files that are maintained manually in this repo but also data from existing third party projects
1) testing (proves the "fully tested" statement)
2) check generated data against tr51 tables to verify data (proves the "correct & complete" statement)
3) emoji.expanded.json -> render each variation, combination, modification as a separate entry
4) categorize based on CLDR and merged-in community-defined internationalized categorizations
5) sort (where to find data?)
6) merge in community-defined internationalized short names
7) merge in community-defined emoticon equivalents
8) merge in community-defined internationalized tags
9) write documentation (readme)
