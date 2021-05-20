package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/webview/webview"
)

func main() {
	debug := false
	w := webview.New(debug)
	defer w.Destroy()
	w.SetTitle("Emojazz emoji / kaomoji picker")
	w.SetSize(600, 800, webview.HintNone)

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()

	dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		log.Fatal(err)
	}

	go http.Serve(ln, http.FileServer(http.Dir(filepath.Join(dir, "public"))))

	w.Bind("goLoadSearch", func() string {
		b, _ := ioutil.ReadFile(filepath.Join(dir, "search.yaml"))
		return string(b)
	})

	w.Bind("goLoadImage", func() string {
		b, _ := ioutil.ReadFile(filepath.Join(dir, "image.yaml"))
		return string(b)
	})

	fmt.Printf("Listening on %s\n", ln.Addr())
	w.Navigate(fmt.Sprintf("http://%s", ln.Addr()))

	go func() {
		time.Sleep(1000 * time.Millisecond)
	}()

	w.Run()
}
