import assert from "node:assert/strict";
import test from "node:test";

import { formatBirthCode, parseBirthCode } from "../lib/birth-code.mjs";

test("parses gender-prefixed compact birth input and defaults seconds to zero", () => {
  const parsed = parseBirthCode("0201903010856");
  assert.equal(parsed.sex, "female");
  assert.equal(parsed.sexCode, "0");
  assert.equal(parsed.solarTime, "2019-03-01 08:56:00");
});

test("accepts the documented hour-minute separator and male code", () => {
  const parsed = parseBirthCode("1+1992031514:30");
  assert.equal(parsed.sex, "male");
  assert.equal(parsed.code, "1199203151430");
});

test("formats picker values back to the shared compact input protocol", () => {
  assert.equal(formatBirthCode("1992-03-15T14:30", "male"), "1199203151430");
  assert.equal(formatBirthCode("2019-03-01 08:56", "female"), "0201903010856");
});

test("rejects malformed, impossible, and out-of-range birth codes", () => {
  assert.throws(() => parseBirthCode("201903010856"), /0 或 1/);
  assert.throws(() => parseBirthCode("0201902300856"), /阳历日期不存在/);
  assert.throws(() => parseBirthCode("0099901010000"), /1000–2100/);
});
