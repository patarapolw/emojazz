import S from 'jsonschema-definer'

export const sSearch = S.shape({
  unicode: S.string(),
  description: S.object().additionalProperties(S.string()),
})
