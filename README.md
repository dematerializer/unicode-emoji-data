# Unicode Emoji Data

> Your single source of truth for JSON formatted, unicode standard compliant emoji data.

- lightweight, precompiled, easy to parse JSON format with a minimalistic API
- comprehensible for humans by means of [Unicode® Technical Report #51 - UNICODE EMOJI](http://www.unicode.org/reports/tr51/proposed.html)
- straight from the source, compiled from [unicode repository data files](http://unicode.org/Public/emoji/4.0/)
- correct & complete compared against the [unicode emoji list](http://unicode.org/emoji/charts-beta/emoji-list.html)
- up-to-date, supporting unicode emoji versions 4 (stable) and 5 (beta)
- no heavy weight annotations, no [image files or spritesheets](https://github.com/iamcal/emoji-data) included
- internationalized annotations (text-to-speech descriptions and keywords) with extensions provided by the community are available via the [CLDR](http://cldr.unicode.org/) compliant [unicode-emoji-annotations](TODO) module

## Usage

### CommonJS

```
const unicodeEmojiData = require('unicode-emoji-data');
const emojiData = unicodeEmojiData.stable;
const emojiExpanded = unicodeEmojiData.expand(emojiData);
```

### ES6/babel

```
import unicodeEmojiData from 'unicode-emoji-data';
const emojiData = unicodeEmojiData.stable;
const emojiExpanded = unicodeEmojiData.expand(emojiData);
```

## API

Requiring/importing `unicode-emoji-data` yields an object containing emoji data grouped by supported unicode emoji version (stable and beta) and a function for expanding said data so that skin modifications and combinations (e.g. keycap) of each emoji entry get expanded into their own emoji entries:
```
{
    expand: function (emojiData) {...} // expands emojiData
    stable: [...] // emoji data for the latest stable unicode emoji version (4)
    beta: [...] // emoji data for the latest beta unicode emoji version (5)
}
```

## Data Structure

```
[
  {
    "name": "NUMBER SIGN",
    "codepoint": "0023",
    "defaultPresentation": "text",
    "presentation": {
      "default": "0023",
      "variation": {
        "text": "0023 FE0E",
        "emoji": "0023 FE0F"
      }
    },
    "combination": {
      "keycap": {
        "name": "KEYCAP NUMBER SIGN",
        "defaultPresentation": "emoji",
        "presentation": {
          "default": "0023 20E3",
          "variation": {
            "text": "0023 FE0E 20E3",
            "emoji": "0023 FE0F 20E3"
          }
        }
      }
    }
  },
  ...
  {
    "name": "COPYRIGHT SIGN",
    "codepoint": "00A9",
    "shiftJis": {
      "docomo": "F9D6",
      "kddi": "F774",
      "softbank": "F7EE"
    },
    "defaultPresentation": "text",
    "presentation": {
      "default": "00A9",
      "variation": {
        "text": "00A9 FE0E",
        "emoji": "00A9 FE0F"
      }
    }
  },
  ...
  {
    "name": "WATCH",
    "codepoint": "231A",
    "shiftJis": {
      "docomo": "F9C4",
      "kddi": "F797"
    },
    "defaultPresentation": "emoji",
    "presentation": {
      "default": "231A",
      "variation": {
        "text": "231A FE0E",
        "emoji": "231A FE0F"
      }
    }
  },
  ...
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
  },
  ...
  {
    "name": "REGIONAL INDICATOR SYMBOL LETTER A, REGIONAL INDICATOR SYMBOL LETTER C",
    "defaultPresentation": "emoji",
    "presentation": {
      "default": "1F1E6 1F1E8"
    }
  },
]
```

## Install

`npm install unicode-emoji-data`

## License

[MIT](TODO)

# TODO
- align with latest tr51 revision: http://www.unicode.org/reports/tr51/tr51-8.html#Emoji_Variation_Selector_Notes
- write documentation (https://github.com/noffle/art-of-readme)
