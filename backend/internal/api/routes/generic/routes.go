package generic

import (
	"net/http"
	"time"

	"github.com/akramboussanni/gocode/internal/middleware"
	"github.com/akramboussanni/gocode/internal/repo"
	"github.com/go-chi/chi/v5"
)

type GenericRouter struct {
	UserRepo        *repo.UserRepo
	TokenRepo       *repo.TokenRepo
	AppSettingsRepo *repo.AppSettingsRepo
}

func NewGenericRouter(userRepo *repo.UserRepo, tokenRepo *repo.TokenRepo, appSettingsRepo *repo.AppSettingsRepo) http.Handler {
	gr := &GenericRouter{UserRepo: userRepo, TokenRepo: tokenRepo, AppSettingsRepo: appSettingsRepo}
	r := chi.NewRouter()

	r.Use(middleware.MaxBytesMiddleware(1 << 20))

	// 30/min + auth
	r.Group(func(r chi.Router) {
		middleware.AddRatelimit(r, 30, 1*time.Minute)
		middleware.AddAuth(r, gr.UserRepo, gr.TokenRepo)
		r.Get("/users", gr.HandleGetAllUsers)
		r.Get("/users/{id}", gr.HandleGetUser)
		r.Post("/users", gr.HandleCreateUser)
		r.Delete("/users/{id}", gr.HandleDeleteUser)
	})

	// 15/min + auth
	r.Group(func(r chi.Router) {
		middleware.AddRatelimit(r, 15, 1*time.Minute)
		middleware.AddAuth(r, gr.UserRepo, gr.TokenRepo)
		r.Get("/permissions/{permission}", gr.HandleGetPermission)
		r.Patch("/permissions", gr.HandleUpdatePermissions)
		r.Patch("/permissions/user", gr.HandleUpdateUserPermissions)
	})

	// 10/min + auth
	r.Group(func(r chi.Router) {
		middleware.AddRatelimit(r, 10, 1*time.Minute)
		middleware.AddAuth(r, gr.UserRepo, gr.TokenRepo)
		r.Get("/settings", gr.HandleGetSettings)
	})

	return r
}
