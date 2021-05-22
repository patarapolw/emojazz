// +build !no_fallback

package main

import (
	"github.com/zserge/lorca"
)

func fallback(t cfg, url string) {
	lorca.PromptDownload()
}
