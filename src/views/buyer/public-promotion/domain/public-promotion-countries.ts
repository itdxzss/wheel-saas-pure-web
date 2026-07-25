import type { DateV2Country } from "../../date-v2-preview/domain/date-v2-preview";

interface CountryPhoneLength {
  minLength: number;
  maxLength: number;
}

const countryDialCodeRows = `
AF|+93
AX|+358
AL|+355
DZ|+213
AS|+1-684
AD|+376
AO|+244
AI|+1-264
AQ|+672
AG|+1-268
AR|+54
AM|+374
AW|+297
AC|+247
AU|+61
AT|+43
AZ|+994
BS|+1-242
BH|+973
BD|+880
BB|+1-246
BY|+375
BE|+32
BZ|+501
BJ|+229
BM|+1-441
BT|+975
BO|+591
BQ|+599
BA|+387
BW|+267
BR|+55
IO|+246
VG|+1-284
BN|+673
BG|+359
BF|+226
BI|+257
KH|+855
CM|+237
CA|+1
CV|+238
KY|+1-345
CF|+236
TD|+235
CL|+56
CN|+86
CX|+61
CC|+61
CO|+57
KM|+269
CG|+242
CD|+243
CK|+682
CR|+506
CI|+225
HR|+385
CU|+53
CW|+599
CY|+357
CZ|+420
DK|+45
DJ|+253
DM|+1-767
DO|+1-809
EC|+593
EG|+20
SV|+503
GQ|+240
ER|+291
EE|+372
SZ|+268
ET|+251
FK|+500
FO|+298
FJ|+679
FI|+358
FR|+33
GF|+594
PF|+689
GA|+241
GM|+220
GE|+995
DE|+49
GH|+233
GI|+350
GR|+30
GL|+299
GD|+1-473
GP|+590
GU|+1-671
GT|+502
GG|+44-1481
GN|+224
GW|+245
GY|+592
HT|+509
HN|+504
HK|+852
HU|+36
IS|+354
IN|+91
ID|+62
IR|+98
IQ|+964
IE|+353
IM|+44-1624
IL|+972
IT|+39
JM|+1-876
JP|+81
JE|+44-1534
JO|+962
KZ|+7
KE|+254
KI|+686
XK|+383
KW|+965
KG|+996
LA|+856
LV|+371
LB|+961
LS|+266
LR|+231
LY|+218
LI|+423
LT|+370
LU|+352
MO|+853
MG|+261
MW|+265
MY|+60
MV|+960
ML|+223
MT|+356
MH|+692
MQ|+596
MR|+222
MU|+230
YT|+262
MX|+52
FM|+691
MD|+373
MC|+377
MN|+976
ME|+382
MS|+1-664
MA|+212
MZ|+258
MM|+95
NA|+264
NR|+674
NP|+977
NL|+31
NC|+687
NZ|+64
NI|+505
NE|+227
NG|+234
NU|+683
NF|+672
KP|+850
MK|+389
MP|+1-670
NO|+47
OM|+968
PK|+92
PW|+680
PS|+970
PA|+507
PG|+675
PY|+595
PE|+51
PH|+63
PN|+64
PL|+48
PT|+351
PR|+1-787
QA|+974
RE|+262
RO|+40
RU|+7
RW|+250
BL|+590
SH|+290
KN|+1-869
LC|+1-758
MF|+590
PM|+508
VC|+1-784
WS|+685
SM|+378
ST|+239
SA|+966
SN|+221
RS|+381
SC|+248
SL|+232
SG|+65
SX|+1-721
SK|+421
SI|+386
SB|+677
SO|+252
ZA|+27
GS|+500
KR|+82
SS|+211
ES|+34
LK|+94
SD|+249
SR|+597
SJ|+47
SE|+46
CH|+41
SY|+963
TW|+886
TJ|+992
TZ|+255
TH|+66
TL|+670
TG|+228
TK|+690
TO|+676
TT|+1-868
TA|+290
TN|+216
TR|+90
TM|+993
TC|+1-649
TV|+688
UG|+256
UA|+380
AE|+971
GB|+44
US|+1
UY|+598
VI|+1-340
UZ|+998
VU|+678
VA|+39-06
VE|+58
VN|+84
WF|+681
EH|+212
YE|+967
ZM|+260
ZW|+263
`;

const preferredCountryCodes = [
  "US",
  "IN",
  "AF",
  "AE",
  "AD",
  "AL",
  "DZ",
  "AO",
  "AR",
  "AU",
  "AT",
  "AZ",
  "GB",
  "BR"
];

const knownPhoneLengths: Record<string, CountryPhoneLength> = {
  US: { minLength: 10, maxLength: 10 },
  IN: { minLength: 10, maxLength: 10 },
  AF: { minLength: 9, maxLength: 9 },
  AE: { minLength: 9, maxLength: 9 },
  AD: { minLength: 6, maxLength: 9 },
  AL: { minLength: 8, maxLength: 9 },
  DZ: { minLength: 9, maxLength: 9 },
  AO: { minLength: 9, maxLength: 9 },
  AR: { minLength: 10, maxLength: 11 },
  AU: { minLength: 9, maxLength: 9 },
  AT: { minLength: 10, maxLength: 13 },
  AZ: { minLength: 9, maxLength: 9 },
  GB: { minLength: 10, maxLength: 10 },
  BR: { minLength: 10, maxLength: 11 }
};

const fallbackCountryNames: Record<string, string> = {
  AC: "阿森松岛",
  TA: "特里斯坦-达库尼亚群岛",
  XK: "科索沃"
};

const regionNames = new Intl.DisplayNames(["zh-CN"], { type: "region" });

function resolveCountryName(code: string): string {
  return fallbackCountryNames[code] ?? regionNames.of(code) ?? code;
}

function resolvePhoneLengths(
  code: string,
  dialCode: string
): CountryPhoneLength {
  const knownLengths = knownPhoneLengths[code];
  if (knownLengths) return knownLengths;
  const dialCodeLength = dialCode.replace(/\D/g, "").length;
  return {
    minLength: Math.max(4, 10 - dialCodeLength),
    maxLength: Math.max(4, 15 - dialCodeLength)
  };
}

function createPublicPromotionCountries(): DateV2Country[] {
  const countries = countryDialCodeRows
    .trim()
    .split(/\s+/)
    .map(row => {
      const [code, dialCode] = row.split("|");
      return {
        code,
        name: resolveCountryName(code),
        dialCode,
        ...resolvePhoneLengths(code, dialCode)
      };
    });
  const preferredOrder = new Map(
    preferredCountryCodes.map((code, index) => [code, index])
  );
  return countries.sort((left, right) => {
    const leftOrder = preferredOrder.get(left.code);
    const rightOrder = preferredOrder.get(right.code);
    if (leftOrder !== undefined || rightOrder !== undefined) {
      return (
        (leftOrder ?? Number.MAX_SAFE_INTEGER) -
        (rightOrder ?? Number.MAX_SAFE_INTEGER)
      );
    }
    return left.name.localeCompare(right.name, "zh-CN");
  });
}

export const publicPromotionCountries = createPublicPromotionCountries();

export function countryFlagEmoji(code?: string): string {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode || !/^[A-Z]{2}$/.test(normalizedCode)) return "🌐";
  return [...normalizedCode]
    .map(letter => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
}

export function resolvePublicPromotionCountries(
  targetCountry?: string
): DateV2Country[] {
  const normalizedTarget = targetCountry?.trim().toUpperCase();
  if (!normalizedTarget || normalizedTarget === "MIXED") {
    return publicPromotionCountries;
  }
  const country = publicPromotionCountries.find(
    item => item.code === normalizedTarget
  );
  return country ? [country] : publicPromotionCountries;
}
