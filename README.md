# Unicode Emoji Data

> Your single source of truth for JSON formatted, unicode standard compliant emoji data.

- lightweight, precompiled, easy to parse JSON format with a minimalistic API
- comprehensible for humans by means of [Unicode® Technical Report #51 - UNICODE EMOJI](http://www.unicode.org/reports/tr51/proposed.html)
- straight from the source, compiled from [unicode repository data files](http://unicode.org/Public/emoji/4.0/)
- correct & complete compared against the [unicode emoji list](http://unicode.org/emoji/charts/emoji-list.html)
- up-to-date, supporting unicode emoji versions v4 (stable) and v5 (beta)
- no heavy weight annotations, no [image files or spritesheets](https://github.com/iamcal/emoji-data) included
- internationalized annotations (text-to-speech descriptions and keywords) with extensions provided by the community are available via the [CLDR](http://cldr.unicode.org/) compliant [unicode-emoji-annotations](TODO) module

## Install

`npm install unicode-emoji-data`

## Usage

### CommonJS

```
const unicodeEmojiData = require('unicode-emoji-data');
const emojiData = unicodeEmojiData.emojiDataStable;
const emojiExpanded = unicodeEmojiData.expandEmojiData(emojiData);
```

### ES6/babel

```
import { emojiDataStable, expandEmojiData } from 'unicode-emoji-data';
const emojiData = emojiDataStable;
const emojiExpanded = expandEmojiData(emojiData);
```

## API

Requiring/importing `unicode-emoji-data` yields an object containing emoji data grouped by supported unicode emoji version (`stable` and `beta`) and a function `expand` for expanding said data:
```
{
    stable: [...] // emoji data for the latest unicode emoji stable version (v4)
    beta: [...] // emoji data for the latest unicode emoji beta version (v5)
    expand: function (emojiData) {...} // expands emojiData
}
```

Example of an emoji datum when directly using the raw `stable` or `beta` data:
```
{
  "name": "WHITE UP POINTING INDEX",
  "codepoint": "261D",
  "shiftJis": {
    "kddi": "F6CF",
    "softbank": "F94F"
  },
  "defaultPresentation": "text",
  "presentation": {
    "default": "261D",
    "variation": {
      "text": "261D FE0E",
      "emoji": "261D FE0F"
    }
  },
  "modification": {
    "skin": {
      "type-1-2": {
        "name": "WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-1-2",
        "defaultPresentation": "emoji",
        "presentation": {
          "default": "261D 1F3FB"
        }
      },
      "type-3": {
        "name": "WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-3",
        "defaultPresentation": "emoji",
        "presentation": {
          "default": "261D 1F3FC"
        }
      },
      "type-4": {
        "name": "WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-4",
        "defaultPresentation": "emoji",
        "presentation": {
          "default": "261D 1F3FD"
        }
      },
      "type-5": {
        "name": "WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-5",
        "defaultPresentation": "emoji",
        "presentation": {
          "default": "261D 1F3FE"
        }
      },
      "type-6": {
        "name": "WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-6",
        "defaultPresentation": "emoji",
        "presentation": {
          "default": "261D 1F3FF"
        }
      }
    }
  }
}
```

The `expand` function transforms all given raw entries so that each emoji datum along with each of its skin modifications and combinations (e.g. keycap) get expanded into their own, simplified emoji entries. The sample emoji datum from above representing `WHITE UP POINTING INDEX` would get expanded into the following simplified emoji entries:

```
[
  ...
  {
    name: 'WHITE UP POINTING INDEX',
    sequence: '261D FE0F',
    output: '☝️'
  },
  {
    name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-1-2',
    sequence: '261D 1F3FB',
    output: '☝🏻'
  },
  {
    name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-3',
    sequence: '261D 1F3FC',
    output: '☝🏼'
  },
  {
    name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-4',
    sequence: '261D 1F3FD',
    output: '☝🏽'
  },
  {
    name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-5',
    sequence: '261D 1F3FE',
    output: '☝🏾'
  },
  {
    name: 'WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-6',
    sequence: '261D 1F3FF',
    output: '☝🏿'
  },
  ...
]
```

## License

MIT
