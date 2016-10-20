import { groupArrayOfObjectsByKey } from './utils';
import englishAnnotations from '../lib/annotations/en.json';
import emojiData from '../lib/emoji.expanded.json';
import countries from 'i18n-iso-countries';
import fs from 'fs';

const matchAnyVariationSelectorOrModifier = /\s(FE0E|FE0F|1F3FB|1F3FC|1F3FD|1F3FE|1F3FF)/g;

const annotationDatumForSequence = groupArrayOfObjectsByKey(englishAnnotations, 'sequence');

const emojiDataMissingAnnotations = emojiData
.map(datum => ({
	normalizedSequence: datum.sequence.replace(matchAnyVariationSelectorOrModifier, ''),
	...datum,
}))
.filter(datum => annotationDatumForSequence[datum.normalizedSequence] == null);

fs.writeFileSync(`community-annotations/en.MISSING.json`, JSON.stringify(emojiDataMissingAnnotations, null, 2));

const regionalIndicatorBaseName = 'REGIONAL INDICATOR SYMBOL LETTER';
const regionalIndicators = emojiDataMissingAnnotations.filter(datum => datum.name.includes(regionalIndicatorBaseName));
const regionalIndicatorsWithIsoCode = regionalIndicators.map(
	datum => ({
		isoCode: datum.name
			.split(',')
			.map(part => part.replace(regionalIndicatorBaseName, '').trim())
			.join(''),
		...datum,
	})
);
const regionalIndicatorAnnotations = regionalIndicatorsWithIsoCode.map(datum => {
	const tts = countries.getName(datum.isoCode, 'en');
	return {
		sequence: datum.normalizedSequence,
		output: datum.output,
		tts: tts ? tts : `TODO: translate iso code '${datum.isoCode}'`,
		keywords: ['flag'],
	};
});

fs.writeFileSync(`community-annotations/en.TODO.json`, JSON.stringify(regionalIndicatorAnnotations, null, 2));
