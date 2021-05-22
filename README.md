Jazzy emoji / kaomoji picker

## Goals

- Customizability / extendability / personalizability
- Includes Kaomoji
- Works offline / completely free
- Accepts contribution / allows to fork

## Demo

See <https://emojazz.netlify.app>.

## Downloading

- Go to <https://github.com/patarapolw/emojazz/releases>, and download OS-specific zip.
- Oddly, `*.tar` does have CLI utility natively on Windows 10, but not GUI. If you can't unzip, try 7-zip.

## How to customize

- Edit the YAML to however you wanted. Wrong YAML format will crash the app, anyway.
- You can add additional images to `img/`.
- You DO NOT need fonts and images (as they are serve from the CDN), but if you want to be completely offline, get all files from `https://github.com/patarapolw/emojazz/tree/main/packages/nodejs/assets/{fonts,img}`, and put them at `/{fonts,img}`
- Double click the launcher (e.g. `*.exe` in Windows, and `*.app` in macOS)
