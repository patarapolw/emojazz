import { execSync } from 'child_process'

import AdmZip from 'adm-zip'
import fg from 'fast-glob'
import fs from 'fs-extra'

const NAME = 'emojazz'

export async function makeWindows() {
  const zip = new AdmZip()

  await fg('*.dll', {
    cwd: '../neu',
  }).then((files) => {
    files.map((f) => {
      zip.addLocalFile(`../neu/${f}`, f)
    })
  })

  zip.addLocalFile(`../neu/${NAME}-win.exe`, '', `${NAME}.exe`)

  zip.addLocalFolder('../neu/assets', 'assets')
  zip.addLocalFolder('../neu/public', 'public')

  zip.addLocalFile('../neu/neutralino.config.json')
  zip.addLocalFile('../../LICENSE')
  zip.addLocalFile('../../README.md')

  fs.ensureFileSync(`../neu/dist/${NAME}-win.zip`)
  fs.unlinkSync(`../neu/dist/${NAME}-win.zip`)
  zip.writeZip(`../neu/dist/${NAME}-win.zip`)
}

export async function makeLinux() {
  const zip = new AdmZip()

  zip.addLocalFile(`../neu/${NAME}-linux`, '', NAME)

  zip.addLocalFolder('../neu/assets', 'assets')
  zip.addLocalFolder('../neu/public', 'public')

  zip.addLocalFile('../neu/neutralino.config.json')
  zip.addLocalFile('../../LICENSE')
  zip.addLocalFile('../../README.md')

  zip.addFile(
    `${NAME}.desktop`,
    Buffer.from(
      trimIndent(
        `
  [Desktop Entry]
  Name=Emojazz
  Comment=Jazzy emoji / kaomoji picker
  Exec=./${NAME}
  Terminal=false
  Type=Application
  Categories=Utility;
  `.trim(),
      ),
    ),
  )

  fs.ensureFileSync(`../neu/dist/${NAME}-linux.zip`)
  fs.unlinkSync(`../neu/dist/${NAME}-linux.zip`)
  zip.writeZip(`../neu/dist/${NAME}-linux.zip`)
}

export async function makeMac() {
  execSync(
    `
  rm -rf ../neu/dist/mac_unzip/${NAME}.app
  mkdir -p ../neu/dist/mac_unzip/${NAME}.app/Contents/{MacOS,Resources}
  cp ../neu/${NAME}-mac ../neu/dist/mac_unzip/${NAME}.app/Contents/MacOS/${NAME}
  cp -r ../neu/assets ../neu/dist/mac_unzip/${NAME}.app/Contents/MacOS/assets
  cp -r ../neu/public ../neu/dist/mac_unzip/${NAME}.app/Contents/MacOS/public
  cp ../../LICENSE ../../README.md ../neu/dist/mac_unzip/${NAME}.app/Contents/
  `,
    {
      stdio: 'inherit',
    },
  )

  fs.writeFileSync(
    `../neu/dist/mac_unzip/${NAME}.app/Contents/Info.plist`,
    trimIndent(
      `
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>CFBundleExecutable</key>
      <string>${NAME}</string>
      <key>CFBundleIconFile</key>
      <string>icon.icns</string>
      <key>CFBundleIdentifier</key>
      <string>${
        require('../../neu/neutralino.config.json').applicationId
      }</string>
    </dict>
    </plist>
    `.trim(),
    ),
  )

  const zip = new AdmZip()

  zip.addLocalFolder(`../neu/dist/mac_unzip/${NAME}.app`, `${NAME}.app`)

  fs.ensureFileSync(`../neu/dist/${NAME}-mac.zip`)
  fs.unlinkSync(`../neu/dist/${NAME}-mac.zip`)
  zip.writeZip(`../neu/dist/${NAME}-mac.zip`)
}

function trimIndent(s: string): string {
  const indent = Math.min(
    0,
    ...s
      .split('\n')
      .filter((r) => /[^ \r]/.test(r))
      .map((r) => (/^ +/.exec(r) || [''])[0].length),
  )

  const re = new RegExp('^' + ' '.repeat(indent))

  return s
    .split('\n')
    .map((r) => r.replace(re, '').trimEnd())
    .join('\n')
}

if (require.main === module) {
  execSync(
    `
  yarn build
  `,
    {
      cwd: '../neu',
      stdio: 'inherit',
    },
  )

  makeWindows()
  makeLinux()
  makeMac()
}
