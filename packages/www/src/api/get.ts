import yaml from 'js-yaml'
import S from 'jsonschema-definer'

import { getSearchObject, sSearch } from './shared'

let imageObject: Record<string, string[]>
let imageBase =
  'https://cdn.jsdelivr.net/gh/patarapolw/emojazz/packages/nodejs/assets'
declare const __BaseURL__: string

export async function loadBaseURL() {
  if (typeof imageObject === 'undefined') {
    imageObject = S.object()
      .additionalProperties(S.list(S.string()))
      .ensure(yaml.load(await window.goLoadImage()) as any)

    const config = await window.goLoadConfig()
    imageBase = (
      (config.trim()
        ? (yaml.load(config) as Record<string, any>).assetURL
        : __BaseURL__) || imageBase
    ).replace(/\/$/, '')

    document.head.prepend(
      Object.assign(document.createElement('style'), {
        innerHTML: /* css */ `
      @font-face {
        font-family: 'noto';
        src: url('${imageBase}/fonts/NotoSans-Regular.ttf');
      }
    
      @font-face {
        font-family: 'noto-sc';
        src: url('${imageBase}/fonts/NotoSansCJKsc-Regular.otf');
      }
    
      @font-face {
        font-family: 'noto-tc';
        src: url('${imageBase}/fonts/NotoSansCJKtc-Regular.otf');
      }
    
      @font-face {
        font-family: 'noto-jp';
        src: url('${imageBase}/fonts/NotoSansCJKjp-Regular.otf');
      }
    
      @font-face {
        font-family: 'Noto Color Emoji';
        src: url('${imageBase}/fonts/NotoColorEmoji.ttf');
      }
      `,
      }),
    )
  }

  return imageBase
}

export async function get(inp: { id: string }): Promise<
  | (typeof sSearch.type & {
      images: string[]
    })
  | null
> {
  const searchObject = await getSearchObject()
  const out = searchObject[inp.id]

  if (!out) {
    return null
  }

  await loadBaseURL()

  return {
    ...out,
    images: imageObject[inp.id].map((im) => imageBase + im) || [],
  }
}
