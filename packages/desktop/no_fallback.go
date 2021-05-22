//+build no_fallback

package main

import (
	"os/exec"
	"runtime"
	"syscall"
	"unsafe"

	"github.com/zserge/lorca"
)

func fallback(t cfg, url string) {
	if runtime.GOOS == "windows" {
		user32 := syscall.NewLazyDLL("user32.dll")
		messageBoxW := user32.NewProc("MessageBoxW")
		mbYesNo := 0x00000004
		mbIconQuestion := 0x00000020
		idYes := 6
		ret, _, _ := messageBoxW.Call(0, uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr("No Microsoft Edge installation was found. Would you like to download and install it now?"))),
			uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr("Please update to Microsoft Edge"))), uintptr(uint(mbYesNo|mbIconQuestion)))

		if int(ret) == idYes {
			exec.Command("start", "iexplore", "https://www.microsoft.com/en-us/edge").Run()
		}

		return
	}

	lorca.PromptDownload()
}
