package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/webview/webview"
	"github.com/zserge/lorca"
	"gopkg.in/yaml.v2"
)

type cfg struct {
	Debug  bool
	Title  string
	Width  int
	Height int
	port   int
	CDN    string
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

	ln, err := net.Listen("tcp", "127.0.0.1:"+strconv.Itoa(t.port))
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()

	go http.Serve(ln, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			switch r.URL.Path {
			case "/api/search":
				b, _ := ioutil.ReadFile(filepath.Join(dir, "search.yaml"))
				w.Write(b)
			case "/api/image":
				b, _ := ioutil.ReadFile(filepath.Join(dir, "image.yaml"))
				w.Write(b)
			}

			return
		}

		if strings.HasPrefix(r.URL.Path, "/img") || strings.HasPrefix(r.URL.Path, "/fonts") {
			p := filepath.Join(dir, strings.ReplaceAll(r.URL.Path[1:], "/", string(os.PathSeparator)))
			_, err := os.Stat(p)
			if err == nil {
				http.ServeFile(w, r, p)
				return
			}

			redirectURL := t.CDN
			length := len(redirectURL)
			if string(redirectURL[length-1]) == "/" {
				redirectURL = redirectURL[:length-1]
			}
			redirectURL = redirectURL + r.URL.Path
			http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
			return
		}

		http.FileServer(http.Dir(filepath.Join(dir, "public"))).ServeHTTP(w, r)
	}))

	fmt.Printf("Listening on %s\n", ln.Addr())

	if lorca.LocateChrome() != "" {
		ui, _ := lorca.New("data:text/html,"+url.PathEscape(fmt.Sprintf(`
		<html>
			<head><title>%s</title></head>
		</html>
		`, t.Title)), "", t.Width, t.Height)
		defer ui.Close()

		ui.Load(fmt.Sprintf("http://%s", ln.Addr()))
		<-ui.Done()
		return
	}

	w := webview.New(t.Debug)
	defer w.Destroy()
	w.SetTitle(t.Title)
	w.SetSize(t.Width, t.Height, webview.HintFixed)
	w.Navigate(fmt.Sprintf("http://%s", ln.Addr()))

	w.Run()
}
