import fetch from 'node-fetch';
import promisify from 'es6-promisify';
import xm2js from 'xml2js';
import punycode from 'punycode';
import leftPad from 'left-pad';

const parseXml = promisify(xm2js.parseString);
const defaultBaseUrl = 'http://unicode.org/repos/cldr/tags/latest/common/annotations';
const defaultLanguages = ['af', 'am', 'ar', 'as', 'az', 'bg', 'bn', 'ca', 'cs', 'da', 'de', 'el', 'en', 'en_GB', 'es', 'es_419', 'et', 'fa', 'fi', 'fil', 'fr', 'ga', 'gu', 'he', 'hi', 'hr', 'hu', 'hy', 'id', 'is', 'it', 'ja', 'ka', 'kk', 'km', 'kn', 'ko', 'ky', 'lo', 'lt', 'lv', 'mk', 'ml', 'mn', 'mr', 'ms', 'my', 'nb', 'ne', 'nl', 'or', 'pa', 'pl', 'pt', 'pt_PT', 'ro', 'ru', 'si', 'sk', 'sl', 'sq', 'sr', 'sv', 'sw', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 'uz', 'vi', 'zh', 'zh_Hant'];

function buildAnnotationForSequence(data) {
	const matchBrackets = /[\[\]\{\}]/g;
	return data.ldml.annotations[0].annotation.reduce((annotationForSeq, annotation) => {
		const extAnnotationForSeq = annotationForSeq;
		const emoji = annotation.$.cp.replace(matchBrackets, '');
		const seq = punycode.ucs2.decode(emoji);
		const seqHex = seq.map(cp => leftPad(cp.toString(16), 4, 0).toUpperCase()).join(' ');
		extAnnotationForSeq[seqHex] = {
			tts: annotation.$.tts == null ? undefined : annotation.$.tts,
			keywords: annotation._ == null ? undefined : annotation._.split(';').map(kw => kw.trim()),
		};
		return extAnnotationForSeq;
	}, {});
}

export const internals = {
	defaultBaseUrl,
	defaultLanguages,
	buildAnnotationForSequence,
};

export default function* CldrAnnotations({ baseUrl = defaultBaseUrl, languages = defaultLanguages }) {
	const annotationForSequenceForLanguage = {};
	for (let i = 0; i < languages.length; i += 1) {
		const language = languages[i];
		const content = yield fetch(`${baseUrl}/${language}.xml`).then(res => res.text());
		const data = yield parseXml(content);
		annotationForSequenceForLanguage[language] = buildAnnotationForSequence(data);
	}
	return { // API
		annotationForSequenceForLanguage,
		getAnnotationForSequenceForLanguage: (sequence, language) => annotationForSequenceForLanguage[language][sequence],
	};
}
