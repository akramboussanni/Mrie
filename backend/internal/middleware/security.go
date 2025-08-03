package middleware

import (
	"net/http"
	"strings"

	"github.com/akramboussanni/gocode/config"
	"github.com/rs/cors"
)

func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		if config.App.TLSEnabled || r.TLS != nil {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;")
		w.Header().Set("Server", "")

		next.ServeHTTP(w, r)
	})
}

func CORSHeaders(next http.Handler) http.Handler {
	var allowedOrigins []string

	if config.App.FrontendCors == "*" {
		allowedOrigins = []string{"*"}
	} else if strings.HasPrefix(config.App.FrontendCors, "*.") {
		domain := strings.TrimPrefix(config.App.FrontendCors, "*.")
		allowedOrigins = []string{
			"https://" + domain,
			"http://" + domain,
		}
		for _, subdomain := range []string{"www", "app", "api", "admin"} {
			allowedOrigins = append(allowedOrigins,
				"https://"+subdomain+"."+domain,
				"http://"+subdomain+"."+domain,
			)
		}
	} else {
		allowedOrigins = []string{config.App.FrontendCors}
	}

	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Requested-With", "X-Recaptcha-Token"},
		AllowCredentials: true,
		MaxAge:           86400, // 24 hours
	})

	return c.Handler(next)
}
