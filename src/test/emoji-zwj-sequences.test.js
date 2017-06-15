import fetchMock from 'fetch-mock';
import buildEmojiZwjSequences, { internals } from '../emoji-zwj-sequences';

const {
	defaultUrl,
	zeroWidthJoiner,
	buildZwjEmoji,
} = internals;

const getNameForCodepointMock = (codepoint) => {
	const nameForCodepoint = {
		'1F468': 'MAN',
		'1F680': 'ROCKET',
		'1F3FB': 'EMOJI MODIFIER FITZPATRICK TYPE-1-2',
		'1F3FC': 'EMOJI MODIFIER FITZPATRICK TYPE-3',
		'1F3FD': 'EMOJI MODIFIER FITZPATRICK TYPE-4',
		'1F3FE': 'EMOJI MODIFIER FITZPATRICK TYPE-5',
		'1F3FF': 'EMOJI MODIFIER FITZPATRICK TYPE-6',
	};
	return nameForCodepoint[codepoint];
};

const getEmojiVersionForCodepointMock = () => 4;

const getUnicodeVersionForCodepointMock = () => 8;

const getMetaForModifierNameMock = (modifierName) => {
	const metaForModifierName = {
		'EMOJI MODIFIER FITZPATRICK TYPE-1-2': {
			propKey: 'type-1-2',
			nameExt: 'EMOJI MODIFIER FITZPATRICK TYPE-1-2',
		},
		'EMOJI MODIFIER FITZPATRICK TYPE-3': {
			propKey: 'type-3',
			nameExt: 'EMOJI MODIFIER FITZPATRICK TYPE-3',
		},
		'EMOJI MODIFIER FITZPATRICK TYPE-4': {
			propKey: 'type-4',
			nameExt: 'EMOJI MODIFIER FITZPATRICK TYPE-4',
		},
		'EMOJI MODIFIER FITZPATRICK TYPE-5': {
			propKey: 'type-5',
			nameExt: 'EMOJI MODIFIER FITZPATRICK TYPE-5',
		},
		'EMOJI MODIFIER FITZPATRICK TYPE-6': {
			propKey: 'type-6',
			nameExt: 'EMOJI MODIFIER FITZPATRICK TYPE-6',
		},
	};
	return metaForModifierName[modifierName];
};

const expectedZwjEmoji = [
	{
		name: 'MAN, ROCKET',
		defaultPresentation: 'emoji',
		presentation: {
			default: '1F468 200D 1F680',
		},
		version: 4,
		unicodeVersion: 8,
		modification: {
			skin: {
				'type-1-2': { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-1-2
					name: 'MAN, ROCKET; EMOJI MODIFIER FITZPATRICK TYPE-1-2',
					defaultPresentation: 'emoji',
					presentation: {
						default: '1F468 1F3FB 200D 1F680',
					},
					version: 4,
					unicodeVersion: 8,
				},
				'type-3': { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-3
					name: 'MAN, ROCKET; EMOJI MODIFIER FITZPATRICK TYPE-3',
					defaultPresentation: 'emoji',
					presentation: {
						default: '1F468 1F3FC 200D 1F680',
					},
					version: 4,
					unicodeVersion: 8,
				},
				'type-4': { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-4
					name: 'MAN, ROCKET; EMOJI MODIFIER FITZPATRICK TYPE-4',
					defaultPresentation: 'emoji',
					presentation: {
						default: '1F468 1F3FD 200D 1F680',
					},
					version: 4,
					unicodeVersion: 8,
				},
				'type-5': { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-5
					name: 'MAN, ROCKET; EMOJI MODIFIER FITZPATRICK TYPE-5',
					defaultPresentation: 'emoji',
					presentation: {
						default: '1F468 1F3FE 200D 1F680',
					},
					version: 4,
					unicodeVersion: 8,
				},
				'type-6': { // modifier = EMOJI MODIFIER FITZPATRICK TYPE-6
					name: 'MAN, ROCKET; EMOJI MODIFIER FITZPATRICK TYPE-6',
					defaultPresentation: 'emoji',
					presentation: {
						default: '1F468 1F3FF 200D 1F680',
					},
					version: 4,
					unicodeVersion: 8,
				},
			},
		},
	},
];

describe('emoji-zwj-sequences', () => {
	it('should use a reasonable default url', () => {
		expect(defaultUrl).to.equal('http://unicode.org/Public/emoji/4.0/emoji-zwj-sequences.txt');
	});
	it('should use correct zero width joiner', () => {
		expect(zeroWidthJoiner).to.equal('200D');
	});
	it('should build additional emoji entries from zero width joiner sequences', () => {
		const data = [
			{ sequence: '1F468 200D 1F680', type: 'Emoji_ZWJ_Sequence', description: 'man astronaut', comment: '6.0' },
			{ sequence: '1F468 1F3FB 200D 1F680', type: 'Emoji_ZWJ_Sequence', description: 'man astronaut: light skin tone', comment: '8.0' },
			{ sequence: '1F468 1F3FC 200D 1F680', type: 'Emoji_ZWJ_Sequence', description: 'man astronaut: medium-light skin tone', comment: '8.0' },
			{ sequence: '1F468 1F3FD 200D 1F680', type: 'Emoji_ZWJ_Sequence', description: 'man astronaut: medium skin tone', comment: '8.0' },
			{ sequence: '1F468 1F3FE 200D 1F680', type: 'Emoji_ZWJ_Sequence', description: 'man astronaut: medium-dark skin tone', comment: '8.0' },
			{ sequence: '1F468 1F3FF 200D 1F680', type: 'Emoji_ZWJ_Sequence', description: 'man astronaut: dark skin tone', comment: '8.0' },
		];
		const zwjEmoji = buildZwjEmoji(data, getNameForCodepointMock, getMetaForModifierNameMock, getEmojiVersionForCodepointMock, getUnicodeVersionForCodepointMock);
		expect(zwjEmoji).to.deep.equal(expectedZwjEmoji);
	});
	it('should generate an API', (done) => {
		fetchMock.get('*', `
			1F468 200D 1F680                            ; Emoji_ZWJ_Sequence  ; man astronaut                                                  # 6.0  [1] (👨‍🚀)
			1F468 1F3FB 200D 1F680                      ; Emoji_ZWJ_Sequence  ; man astronaut: light skin tone                                 # 8.0  [1] (👨🏻‍🚀)
			1F468 1F3FC 200D 1F680                      ; Emoji_ZWJ_Sequence  ; man astronaut: medium-light skin tone                          # 8.0  [1] (👨🏼‍🚀)
			1F468 1F3FD 200D 1F680                      ; Emoji_ZWJ_Sequence  ; man astronaut: medium skin tone                                # 8.0  [1] (👨🏽‍🚀)
			1F468 1F3FE 200D 1F680                      ; Emoji_ZWJ_Sequence  ; man astronaut: medium-dark skin tone                           # 8.0  [1] (👨🏾‍🚀)
			1F468 1F3FF 200D 1F680                      ; Emoji_ZWJ_Sequence  ; man astronaut: dark skin tone                                  # 8.0  [1] (👨🏿‍🚀)
		`);
		const step = buildEmojiZwjSequences({
			getNameForCodepoint: getNameForCodepointMock,
			getMetaForModifierName: getMetaForModifierNameMock,
			getEmojiVersionForCodepoint: getEmojiVersionForCodepointMock,
			getUnicodeVersionForCodepoint: getUnicodeVersionForCodepointMock,
		});
		step.next().value.then((content) => { // wait until first yield's promise (mocked fetch) resolves
			const api = step.next(content).value; // manually hand over mocked content to the left side of yield
			expect(api).to.have.all.keys('zeroWidthJoiner', 'zwjEmoji');
			expect(api.zwjEmoji).to.deep.equal(expectedZwjEmoji);
			done();
		});
	});
});
