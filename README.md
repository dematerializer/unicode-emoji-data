# Unicode Emoji Data

> Unicode standard compliant emoji data

- lightweight, precompiled, easy to parse JSON format with a minimalistic API
- comprehensible for humans by means of [Unicode® Technical Report #51 - UNICODE EMOJI](http://www.unicode.org/reports/tr51/)
- straight from the source, compiled directly from [unicode repository data files](http://unicode.org/Public/emoji/4.0/)
- correct & complete compared against the [unicode emoji list](http://unicode.org/emoji/charts/emoji-list.html)
- up-to-date, supporting unicode emoji versions v4 (stable) and v5 (beta)
- no heavy weight annotations, no [image files or spritesheets](https://github.com/iamcal/emoji-data) included
- internationalized annotations (text-to-speech descriptions and keywords) with extensions provided by the community are available via the [CLDR](http://cldr.unicode.org/) compliant [unicode-emoji-annotations (coming soon)](TODO) module

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

Requiring/importing `unicode-emoji-data` gives you the following API to work with:

| API | Signature | Description |
| --- | --- | --- |
| `emojiDataStable` | `[...]` | array of emoji data for the latest stable unicode emoji version (v4) |
| `emojiDataBeta` | `[...]` | array of emoji data for the latest unicode emoji beta version (v5) |
| `expandEmojiData` | `function (emojiData) {...}` | expands `emojiData`, returns an array of objects |

Example of an emoji datum when directly using the raw `emojiDataStable` or `emojiDataBeta` array:
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

The `expandEmojiData` function transforms all given raw entries so that each emoji datum along with each of its skin modifications and combinations (e.g. keycap) get expanded into their own emoji entries. The sample emoji datum from above representing `WHITE UP POINTING INDEX` would get expanded into the following:

```
[
  ...
  {
    <original "WHITE UP POINTING INDEX" base datum>
  },
  {
    "name": "WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-1-2",
    "codepoint": "261D",
    "shiftJis": {
      "kddi": "F6CF",
      "softbank": "F94F"
    },
    "defaultPresentation": "emoji",
    "presentation": {
      "default": "261D 1F3FB"
    }
  },
  {
    "name": "WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-3",
    "codepoint": "261D",
    "shiftJis": {
      "kddi": "F6CF",
      "softbank": "F94F"
    },
    "defaultPresentation": "emoji",
    "presentation": {
      "default": "261D 1F3FC"
    }
  },
  {
    "name": "WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-4",
    "codepoint": "261D",
    "shiftJis": {
      "kddi": "F6CF",
      "softbank": "F94F"
    },
    "defaultPresentation": "emoji",
    "presentation": {
      "default": "261D 1F3FD"
    }
  },
  {
    "name": "WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-5",
    "codepoint": "261D",
    "shiftJis": {
      "kddi": "F6CF",
      "softbank": "F94F"
    },
    "defaultPresentation": "emoji",
    "presentation": {
      "default": "261D 1F3FE"
    }
  },
  {
    "name": "WHITE UP POINTING INDEX; EMOJI MODIFIER FITZPATRICK TYPE-6",
    "codepoint": "261D",
    "shiftJis": {
      "kddi": "F6CF",
      "softbank": "F94F"
    },
    "defaultPresentation": "emoji",
    "presentation": {
      "default": "261D 1F3FF"
    }
  },
  ...
]
```

## Install

`npm install unicode-emoji-data`

## License

[MIT](https://github.com/dematerializer/unicode-emoji-data/blob/master/LICENSE)

## Development

[![Travis](https://img.shields.io/travis/dematerializer/unicode-emoji-data.svg?style=flat-square)](https://travis-ci.org/dematerializer/unicode-emoji-data)
[![Codecov](https://img.shields.io/codecov/c/github/dematerializer/unicode-emoji-data.svg?style=flat-square)](https://codecov.io/gh/dematerializer/unicode-emoji-data)
