import assert from "node:assert/strict";
import test from "node:test";
import { googleMapsHref, isLegacyHandBuiltGoogleMapsUrl } from "../lib/google-maps.mjs";

test("legacy hand-built place path becomes documented Maps URL search", () => {
  const legacy = "https://www.google.com/maps/place/Onitsuka+Tiger+Namba%2C+1-8-14+Dotonbori%2C+Chuo-ku%2C+Osaka+542-0071/";
  const fixed = googleMapsHref(legacy, "Onitsuka Tiger Namba");
  const url = new URL(fixed);
  assert.equal(url.origin + url.pathname, "https://www.google.com/maps/search/");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("query"), "Onitsuka Tiger Namba, 1-8-14 Dotonbori, Chuo-ku, Osaka 542-0071");
  assert.equal(url.searchParams.has("query_place_id"), false);
});

test("legacy Place-ID bookmark becomes documented query_place_id URL", () => {
  const legacy = "https://www.google.com/maps/place/?q=place_id:ChIJfa-7YQAJAWARlnXKvS6perU";
  const fixed = googleMapsHref(legacy, "Yasaka Shrine");
  const url = new URL(fixed);
  assert.equal(url.pathname, "/maps/search/");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("query"), "Yasaka Shrine");
  assert.equal(url.searchParams.get("query_place_id"), "ChIJfa-7YQAJAWARlnXKvS6perU");
});

test("documented Maps URL is left unchanged", () => {
  const current = "https://www.google.com/maps/search/?api=1&query=Tokyo+Tower&query_place_id=ChIJCewJkL2LGGAR3Qmk0vCTGkg";
  assert.equal(googleMapsHref(current, "Tokyo Tower"), current);
});

test("real copied Google Maps detail URL is not degraded", () => {
  const copied = "https://www.google.com/maps/place/Tokyo+Tower/@35.6585805,139.7454329,17z/data=!4m6!3m5!1s0x0:0x0!8m2!3d35.6585805!4d139.7454329";
  assert.equal(googleMapsHref(copied, "Tokyo Tower"), copied);
});

test("non-Google navigation links remain untouched", () => {
  const amap = "https://uri.amap.com/marker?position=104.066,30.657&name=Chengdu";
  assert.equal(googleMapsHref(amap, "Chengdu"), amap);
});

test("legacy detector catches only the defective project format", () => {
  assert.equal(isLegacyHandBuiltGoogleMapsUrl("https://www.google.com/maps/place/Osaka+Station%2C+Osaka%2C+Japan/"), true);
  assert.equal(isLegacyHandBuiltGoogleMapsUrl("https://www.google.com/maps/place/?q=place_id:abc"), false);
  assert.equal(isLegacyHandBuiltGoogleMapsUrl("https://www.google.com/maps/search/?api=1&query=Osaka+Station"), false);
});
