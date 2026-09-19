import assert from "node:assert/strict";
import test from "node:test";
import {
  countriesForContinent,
  emptyHistoricalFilter,
  toGroupListQuery
} from "./group-list-filters";

test("control relations preserve multiple selections and compose with existing filters", () => {
  const main = {
    keyword: "",
    status: "AVAILABLE",
    folderFilter: "" as const,
    groupType: "" as const,
    availableAdmin: "YES" as const,
    controlRelations: [
      "CONTROLLED_OWNER",
      "CONTROLLED_ADMIN_CREATOR_ABSENT"
    ] as const
  };
  const query = toGroupListQuery(
    { ...main, controlRelations: [...main.controlRelations] },
    emptyHistoricalFilter(),
    1,
    10
  );
  assert.deepEqual(query.controlRelations, main.controlRelations);
  assert.equal(query.availableAdmin, true);
  assert.equal(query.status, "AVAILABLE");
  assert.equal(
    toGroupListQuery(
      { ...main, controlRelations: [] },
      emptyHistoricalFilter(),
      1,
      10
    ).controlRelations,
    undefined
  );
});

test("historical conditions infer historical type and omit invalid numbers", () => {
  const applied = {
    ...emptyHistoricalFilter(),
    continentCode: "ASIA",
    countryIso2: "IN",
    ageDaysMin: 8,
    ageDaysMax: 30,
    memberCountMin: Number.NaN,
    memberCountMax: 200
  };

  assert.deepEqual(
    toGroupListQuery(
      {
        keyword: " 群A ",
        status: "AVAILABLE",
        folderFilter: "UNASSIGNED",
        groupType: "",
        availableAdmin: "YES",
        controlRelations: []
      },
      applied,
      2,
      20
    ),
    {
      page: 2,
      pageSize: 20,
      keyword: "群A",
      status: "AVAILABLE",
      withoutFolder: true,
      groupType: "HISTORICAL",
      availableAdmin: true,
      memberCountMax: 200,
      continentCode: "ASIA",
      countryIso2: "IN",
      ageDaysMin: 8,
      ageDaysMax: 30
    }
  );
});

test("post-control selection keeps shared member range but suppresses historical scope", () => {
  const applied = {
    continentCode: "EUROPE",
    countryIso2: "DE",
    ageDaysMin: 31,
    ageDaysMax: 90,
    memberCountMin: 51,
    memberCountMax: 100
  };
  const query = toGroupListQuery(
    {
      keyword: "",
      status: "",
      folderFilter: "",
      groupType: "POST_CONTROL",
      availableAdmin: "NO",
      controlRelations: []
    },
    applied,
    1,
    10
  );

  assert.equal(query.groupType, "POST_CONTROL");
  assert.equal(query.availableAdmin, false);
  assert.equal(query.memberCountMin, 51);
  assert.equal(query.memberCountMax, 100);
  assert.equal(query.continentCode, undefined);
  assert.equal(query.countryIso2, undefined);
  assert.equal(query.ageDaysMin, undefined);
});

test("country options follow the selected six-continent code", () => {
  const rows = [
    {
      value: "IN",
      iso2: "IN",
      nameZh: "印度",
      phonePrefix: "+91",
      flag: "🇮🇳",
      virtual: false,
      continentCode: "ASIA"
    },
    {
      value: "DE",
      iso2: "DE",
      nameZh: "德国",
      phonePrefix: "+49",
      flag: "🇩🇪",
      virtual: false,
      continentCode: "EUROPE"
    },
    {
      value: "MIXED",
      iso2: null,
      nameZh: "混合（不限国家）",
      phonePrefix: "",
      flag: "🌐",
      virtual: true,
      continentCode: null
    }
  ];
  assert.deepEqual(
    countriesForContinent(rows, "ASIA").map(item => item.iso2),
    ["IN"]
  );
  assert.equal(countriesForContinent(rows, "").length, 2);
});
