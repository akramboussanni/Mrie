package prayertimes

import (
	"net/http"
	"time"

	"github.com/akramboussanni/gocode/internal/middleware"
	"github.com/akramboussanni/gocode/internal/repo"
	"github.com/go-chi/chi/v5"
)

type PrayerTimesRouter struct {
	UserRepo        *repo.UserRepo
	TokenRepo       *repo.TokenRepo
	AppSettingsRepo *repo.AppSettingsRepo
	CacheRepo       *repo.CacheRepo
	MosqueRepo      *repo.MosqueRepo
}

func NewPrayerTimesRouter(userRepo *repo.UserRepo, tokenRepo *repo.TokenRepo, appSettingsRepo *repo.AppSettingsRepo, cacheRepo *repo.CacheRepo, mosqueRepo *repo.MosqueRepo) http.Handler {
	ptr := &PrayerTimesRouter{UserRepo: userRepo, TokenRepo: tokenRepo, AppSettingsRepo: appSettingsRepo, CacheRepo: cacheRepo, MosqueRepo: mosqueRepo}
	r := chi.NewRouter()

	r.Use(middleware.MaxBytesMiddleware(1 << 20))

	// 30/min
	r.Group(func(r chi.Router) {
		middleware.AddRatelimit(r, 30, 1*time.Minute)
		r.Get("/{masjidId}", ptr.HandleGetPrayerTime)
		r.Get("/{masjidId}/{day}", ptr.HandleGetPrayerTimeByDay)
		r.Get("/{masjidId}/{day}/{month}", ptr.HandleGetPrayerTimeByDayMonth)
		r.Get("/default", ptr.HandleGetDefaultMasjid)
		r.Get("/cache/stats", ptr.HandleGetCacheStats)
		r.Get("/mosques", ptr.HandleGetAvailableMosques)
		r.Get("/validate/{mosqueId}", ptr.HandleValidateMosque)
		r.Get("/info/{mosqueId}", ptr.HandleGetMosqueInfo)
	})

	// 10/min + auth (admin only)
	r.Group(func(r chi.Router) {
		middleware.AddRatelimit(r, 10, 1*time.Minute)
		middleware.AddAuth(r, ptr.UserRepo, ptr.TokenRepo)
		r.Put("/default-masjid", ptr.HandleChangeDefaultMasjid)
		r.Post("/mosques", ptr.HandleCreateMosque)
		r.Put("/mosques/{mosqueId}", ptr.HandleUpdateMosque)
		r.Delete("/mosques/{mosqueId}", ptr.HandleDeleteMosque)
	})

	return r
}
