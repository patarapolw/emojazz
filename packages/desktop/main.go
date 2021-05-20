package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/webview/webview"
	"gopkg.in/yaml.v2"
)

type cfg struct {
	Debug    bool
	Title    string
	Width    int
	Height   int
	port     int
	AssetURL string
}

func main() {
	dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		log.Fatal(err)
	}

	t := func() cfg {
		data, err := ioutil.ReadFile(filepath.Join(dir, "config.yaml"))
		if err != nil {
			panic(err)
		}

		t := cfg{}
		err = yaml.Unmarshal(data, &t)
		if err != nil {
			panic(err)
		}

		return t
	}()

	w := webview.New(t.Debug)
	defer w.Destroy()
	w.SetTitle(t.Title)
	w.SetSize(t.Width, t.Height, webview.HintFixed)

	ln, err := net.Listen("tcp", "127.0.0.1:"+strconv.Itoa(t.port))
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()

	go http.Serve(ln, http.FileServer(http.Dir(filepath.Join(dir, "public"))))

	w.Bind("goLoadSearch", func() map[string]string {
		b, _ := ioutil.ReadFile(filepath.Join(dir, "search.yaml"))
		return map[string]string{
			"result": string(b),
		}
	})

	w.Bind("goLoadImage", func() map[string]string {
		b, _ := ioutil.ReadFile(filepath.Join(dir, "image.yaml"))
		return map[string]string{
			"result": string(b),
			"base":   t.AssetURL,
		}
	})

	fmt.Printf("Listening on %s\n", ln.Addr())
	w.Navigate(fmt.Sprintf("http://%s", ln.Addr()))

	go func() {
		time.Sleep(1000 * time.Millisecond)
	}()

	w.Run()
}
