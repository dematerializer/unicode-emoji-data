# Unicode Emoji Data

> Unicode standard compliant emoji data

- lightweight, precompiled, easy to use JSON data with a minimalistic API
- comprehensible for humans by means of [Unicode® Technical Report #51 - UNICODE EMOJI](http://www.unicode.org/reports/tr51/)
- straight from the source, compiled directly from [unicode repository data files](http://unicode.org/Public/emoji/5.0/)
- correct & complete compared against the [unicode emoji list](http://unicode.org/emoji/charts/emoji-list.html)
- up-to-date, supporting the latest beta unicode 10 emoji version 5
- no heavy weight [image files or spritesheets](https://www.npmjs.com/package/emoji-datasource) or annotations included
- internationalized emoji annotations (text-to-speech descriptions and keywords) with extensions provided by the community are available via the unicode [CLDR](http://cldr.unicode.org/) standard compliant [unicode-emoji-annotations](https://www.npmjs.com/package/unicode-emoji-annotations) module

This project aims to preserve emoji data with respect to the original source as closely as possible, retaining concepts and naming conventions of the specification where possible while providing all information in a single carefully designed JSON structure.

*Warning: ~1MB file ahead!* Have a look at [this table to see an example](https://dematerializer.github.io/unicode-emoji-data/emoji-data.html) of what data this library provides.

Check out [emoji-finder](https://www.npmjs.com/package/emoji-finder) to see an example of how this module can be utilized in a real application.

Keep in mind that this library adheres to the unicode standard **proposal**. In reality, vendors implement their support for displaying emoji characters slightly different from one another. It is not the scope of this module to encourage a specific choice of emoji presentation style (especially the use of explicit variation selectors) in order to achieve compatibility with a specific vendor. When displaying emoji characters, do not expect the output you get from using the code point sequences provided by this library to be perfectly compatible with all platforms or systems.

## API

Requiring/importing `unicode-emoji-data` gives you the following API to work with:

- `emojiData`
- `expandEmojiData`

### `emojiData`

```javascript
[..., { /* emoji datum */ }, ...]
```

Array of emoji data for the latest beta unicode emoji version 5.

Example of an emoji datum when directly using the raw `emojiData` array:

```javascript
[
  ...
  {
    name: 'WHITE UP POINTING INDEX',
    codepoint: '261D',
    shiftJis: {
      kddi: 'F6CF',
      softbank: 'F94F'
    },
    defaultPresentation: 'text',
    presentation: {
      default: '261D',
      variation: {
        text: '261D FE0E',
        emoji: '261D FE0F'
      }
    },
    modification: {
      skin: {
        'type-1-2': {
          name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-1-2',
          defaultPresentation: 'emoji',
          presentation: {
            default: '261D 1F3FB'
          }
        },
        'type-3': {
          name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-3',
          defaultPresentation: 'emoji',
          presentation: {
            default: '261D 1F3FC'
          }
        },
        'type-4': {
          name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-4',
          defaultPresentation: 'emoji',
          presentation: {
            default: '261D 1F3FD'
          }
        },
        'type-5': {
          name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-5',
          defaultPresentation: 'emoji',
          presentation: {
            default: '261D 1F3FE'
          }
        },
        'type-6': {
          name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-6',
          defaultPresentation: 'emoji',
          presentation: {
            default: '261D 1F3FF'
          }
        }
      }
    }
  },
  ...
]
```

Properties of an emoji datum explained:

- `name`

  standardized unique unicode name for single code point characters;

  generated compound name for:

  - flags that are combinations of incomplete regional indicator singletons e.g. `REGIONAL INDICATOR SYMBOL LETTER D, REGIONAL INDICATOR SYMBOL LETTER E`

  - ZWJ sequences e.g. `SURFER, FEMALE SIGN`

  - skin-modified emoji e.g. `WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-4`

  - keycap-combined emoji, e.g. `KEYCAP ONE`

- `codepoint` (optional)

  standardized single unicode code point in hexadecimal notation, e.g. `261D`; does not apply to flag or ZWJ emoji

- `shiftJis` (optional)

  equivalent proprietary code points in hexadecimal notation grouped by third party vendors, e.g. `docomo`, `kddi`, `softbank`

- `defaultPresentation`

  gives a hint at which style of appearance (`text` or `emoji`) the (emoji) unicode character is supposed to normally be displayed when not explicitly modified with a variation selector

- `presentation`

  holds presentational possibilities for displaying the (emoji) unicode character in different ways;

  `default` contains a code point or (space separated) sequence of code points for displaying the emoji with the default presentation style defined by the `defaultPresentation` property;

  `variation` is an optional property containing a code point sequence for each variation to explicitly influence the appearance of the emoji (`text` and `emoji` style)

- `modification` (optional)

  holds modification possibilities for displaying the (emoji) unicode character in different ways;

  up to and including unicode emoji version 5 only the fitzpatrick `skin` modifier is defined, with skin types ranging from `type-1-2` and `type-3` up to `type-6`; grouped by those skin types are properties that should override the base properties of the emoji datum in case a skin variation is being applied (e.g. a unicode character should take on an emoji presentation by default when being skin-modified)

- `combination` (optional)

  holds combination possibilities for displaying the (emoji) unicode character in different ways;

  up to and including unicode emoji version 5 only the `keycap` combination is defined; its properties should override the base properties of the emoji datum in case the keycap combination is being applied (e.g. a unicode character should take on an emoji presentation by default when combined with the keycap combining mark)

### `expandEmojiData`

```javascript
function (emojiData) {}
```

Expands `emojiData`, returns an array of objects:

```javascript
[..., { /* emoji datum */ }, ...]
```

The `expandEmojiData` function transforms all given raw entries so that each emoji datum along with each of its skin modifications and combinations (e.g. keycap) get expanded into their own emoji entries.

The purpose of this function is to give you a convenient way of using all the emoji modification and combination variants provided by the raw data in your application without the need to know the details.

The sample emoji datum from above representing `WHITE UP POINTING INDEX` would get expanded into the following separate emoji entries:

```javascript
[
  ...
  {
    /* original 'WHITE UP POINTING INDEX' base datum */
  },
  {
    name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-1-2',
    codepoint: '261D',
    shiftJis: {
      kddi: 'F6CF',
      softbank: 'F94F'
    },
    defaultPresentation: 'emoji',
    presentation: {
      default: '261D 1F3FB'
    }
  },
  {
    name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-3',
    codepoint: '261D',
    shiftJis: {
      kddi: 'F6CF',
      softbank: 'F94F'
    },
    defaultPresentation: 'emoji',
    presentation: {
      default: '261D 1F3FC'
    }
  },
  {
    name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-4',
    codepoint: '261D',
    shiftJis: {
      kddi: 'F6CF',
      softbank: 'F94F'
    },
    defaultPresentation: 'emoji',
    presentation: {
      default: '261D 1F3FD'
    }
  },
  {
    name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-5',
    codepoint: '261D',
    shiftJis: {
      kddi: 'F6CF',
      softbank: 'F94F'
    },
    defaultPresentation: 'emoji',
    presentation: {
      default: '261D 1F3FE'
    }
  },
  {
    name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-6',
    codepoint: '261D',
    shiftJis: {
      kddi: 'F6CF',
      softbank: 'F94F'
    },
    defaultPresentation: 'emoji',
    presentation: {
      default: '261D 1F3FF'
    }
  },
  ...
]
```

## Usage

### CommonJS

```javascript
const unicodeEmojiData = require('unicode-emoji-data');
const emojiData = unicodeEmojiData.emojiData;
const emojiExpanded = unicodeEmojiData.expandEmojiData(emojiData);
```

### ES6/babel

```javascript
import { emojiData, expandEmojiData } from 'unicode-emoji-data';
const emojiExpanded = expandEmojiData(emojiData);
```

### Example: printing out all emoji

```javascript
import { emojiData, expandEmojiData } from 'unicode-emoji-data';
import punycode from 'punycode'; // npm install punycode

const expandedEmojiData = expandEmojiData(emojiData);
expandedEmojiData.forEach((datum) => {
  const sequence = datum.presentation.default;
  const numericCodePointSequence = sequence.split(' ').map(
    codePoint => parseInt(codePoint, 16)
  );
  const output = punycode.ucs2.encode(numericCodePointSequence);
  console.log(output);
});
```

## Install

Beta unicode 10 emoji 5 data:
<br />
`npm install unicode-emoji-data@next`

Stable unicode 9 emoji 4 data:
<br />
`npm install unicode-emoji-data`

## License

[MIT](https://github.com/dematerializer/unicode-emoji-data/blob/master/LICENSE)

## Development

### Status

[![Travis](https://img.shields.io/travis/dematerializer/unicode-emoji-data.svg?style=flat-square)](https://travis-ci.org/dematerializer/unicode-emoji-data)
[![Codecov](https://img.shields.io/codecov/c/github/dematerializer/unicode-emoji-data.svg?style=flat-square)](https://codecov.io/gh/dematerializer/unicode-emoji-data)
