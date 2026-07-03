const id = "EVENT_TTX_RESET_CACHE";
const name = "Tall Text: Reset Tile Cache";
const groups = ["EVENT_GROUP_DIALOGUE"];
const autoLabel = (fetchArg) => {
  return `Tall Text: Reset Tile Cache`;
};
const fields = [
  {
    type: "label",
    label:
      "Forgets all cached tall-character tile pairs. Call this in each scene's On Init (or after anything that reloads background tiles) so stale tiles are not reused.",
  },
];
const compile = (input, helpers) => {
  const { _callNative, _addComment, _addNL } = helpers;
  _addComment("Tall Text: Reset Tile Cache");
  _callNative("ttx_reset_cache");
  _addNL();
};
module.exports = {
  id,
  name,
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: false,
};
