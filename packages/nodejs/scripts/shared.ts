import S from 'jsonschema-definer'

export const sSearch = S.shape({
  text: S.string(),
  unicode: S.string(),
  description: S.object().additionalProperties(S.string()),
})
