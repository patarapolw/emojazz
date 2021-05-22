//+build !no_fallback

package main

import (
	"github.com/webview/webview"
)

func fallback(t cfg, url string) {
	w := webview.New(t.Debug)
	defer w.Destroy()
	w.SetTitle(t.Title)
	w.SetSize(t.Width, t.Height, webview.HintFixed)
	w.Navigate(url)

	w.Run()
}
