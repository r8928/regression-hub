/** @see {@link lib/__tests__/db/util.test.js} */
export function toClientDoc(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return {
    ...rest,
    _id: _id !== null && _id !== undefined ? String(_id) : _id,
  };
}
