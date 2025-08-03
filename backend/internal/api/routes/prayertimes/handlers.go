package prayertimes

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/akramboussanni/gocode/internal/api"
	"github.com/akramboussanni/gocode/internal/applog"
	"github.com/akramboussanni/gocode/internal/model"
	"github.com/akramboussanni/gocode/internal/utils"
	"github.com/go-chi/chi/v5"
)

// @Summary Get prayer times for today
// @Description Get prayer times for a specific masjid for today
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Param masjidId path string true "Masjid ID"
// @Success 200 {object} model.PrayerTimesData "Prayer times data"
// @Failure 400 {object} api.ErrorResponse "Invalid request"
// @Failure 404 {object} api.ErrorResponse "Masjid not found"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Failure 500 {object} api.ErrorResponse "Internal server error"
// @Router /prayertimes/{masjidId} [get]
func (ptr *PrayerTimesRouter) HandleGetPrayerTime(w http.ResponseWriter, r *http.Request) {
	masjidId := chi.URLParam(r, "masjidId")
	if masjidId == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Masjid ID is required")
		return
	}

	today := time.Now()
	prayerTimes, err := ptr.getPrayerTimesWithCache(masjidId, today.Month(), today.Day())
	if err != nil {
		applog.Error("Failed to fetch prayer times", "error", err, "masjidId", masjidId)
		api.WriteMessage(w, http.StatusInternalServerError, "error", "Failed to fetch prayer times")
		return
	}

	api.WriteJSON(w, http.StatusOK, prayerTimes)
}

// @Summary Get prayer times for specific day
// @Description Get prayer times for a specific masjid and day
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Param masjidId path string true "Masjid ID"
// @Param day path int true "Day of month"
// @Success 200 {object} model.PrayerTimesData "Prayer times data"
// @Failure 400 {object} api.ErrorResponse "Invalid request"
// @Failure 404 {object} api.ErrorResponse "Masjid not found"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Failure 500 {object} api.ErrorResponse "Internal server error"
// @Router /prayertimes/{masjidId}/{day} [get]
func (ptr *PrayerTimesRouter) HandleGetPrayerTimeByDay(w http.ResponseWriter, r *http.Request) {
	masjidId := chi.URLParam(r, "masjidId")
	dayStr := chi.URLParam(r, "day")

	if masjidId == "" || dayStr == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Masjid ID and day are required")
		return
	}

	day, err := strconv.Atoi(dayStr)
	if err != nil {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Invalid day format")
		return
	}

	today := time.Now()
	prayerTimes, err := ptr.getPrayerTimesWithCache(masjidId, today.Month(), day)
	if err != nil {
		applog.Error("Failed to fetch prayer times", "error", err, "masjidId", masjidId, "day", day)
		api.WriteMessage(w, http.StatusInternalServerError, "error", "Failed to fetch prayer times")
		return
	}

	api.WriteJSON(w, http.StatusOK, prayerTimes)
}

// @Summary Get prayer times for specific day and month
// @Description Get prayer times for a specific masjid, day and month
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Param masjidId path string true "Masjid ID"
// @Param day path int true "Day of month"
// @Param month path int true "Month (1-12)"
// @Success 200 {object} model.PrayerTimesData "Prayer times data"
// @Failure 400 {object} api.ErrorResponse "Invalid request"
// @Failure 404 {object} api.ErrorResponse "Masjid not found"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Failure 500 {object} api.ErrorResponse "Internal server error"
// @Router /prayertimes/{masjidId}/{day}/{month} [get]
func (ptr *PrayerTimesRouter) HandleGetPrayerTimeByDayMonth(w http.ResponseWriter, r *http.Request) {
	masjidId := chi.URLParam(r, "masjidId")
	dayStr := chi.URLParam(r, "day")
	monthStr := chi.URLParam(r, "month")

	if masjidId == "" || dayStr == "" || monthStr == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Masjid ID, day and month are required")
		return
	}

	day, err := strconv.Atoi(dayStr)
	if err != nil {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Invalid day format")
		return
	}

	month, err := strconv.Atoi(monthStr)
	if err != nil {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Invalid month format")
		return
	}

	if month < 1 || month > 12 {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Month must be between 1 and 12")
		return
	}

	prayerTimes, err := ptr.getPrayerTimesWithCache(masjidId, time.Month(month), day)
	if err != nil {
		applog.Error("Failed to fetch prayer times", "error", err, "masjidId", masjidId, "day", day, "month", month)
		api.WriteMessage(w, http.StatusInternalServerError, "error", "Failed to fetch prayer times")
		return
	}

	api.WriteJSON(w, http.StatusOK, prayerTimes)
}

// @Summary Get default masjid
// @Description Get the default masjid ID from settings
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Success 200 {string} string "Default masjid ID"
// @Failure 500 {object} api.ErrorResponse "Internal server error"
// @Router /prayertimes/default [get]
func (ptr *PrayerTimesRouter) HandleGetDefaultMasjid(w http.ResponseWriter, r *http.Request) {
	setting, err := ptr.AppSettingsRepo.GetSetting(r.Context(), "default_masjid")
	if err != nil {
		applog.Error("Failed to get default masjid setting", "error", err)
		api.WriteMessage(w, http.StatusInternalServerError, "error", "Failed to get default masjid")
		return
	}

	api.WriteJSON(w, http.StatusOK, setting.Value)
}

// @Summary Change default masjid
// @Description Change the default masjid for prayer times (admin only)
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Security CookieAuth
// @Param request body model.DefaultMasjidRequest true "Default masjid request"
// @Success 200 {object} api.SuccessResponse "Default masjid updated successfully"
// @Failure 400 {object} api.ErrorResponse "Invalid request data"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Router /prayertimes/default-masjid [put]
func (ptr *PrayerTimesRouter) HandleChangeDefaultMasjid(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	// Check if user has admin role
	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	request, err := api.DecodeJSON[model.DefaultMasjidRequest](w, r)
	if err != nil {
		return
	}

	err = ptr.AppSettingsRepo.SetSetting(r.Context(), "default_masjid", request.MasjidID)
	if err != nil {
		applog.Error("Failed to update default masjid", "error", err)
		api.WriteInternalError(w)
		return
	}

	api.WriteMessage(w, http.StatusOK, "message", "Default masjid updated successfully")
}

// @Summary Get available mosques
// @Description Get a list of available mosques for selection
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Success 200 {array} model.MosqueInfo "List of available mosques"
// @Failure 500 {object} api.ErrorResponse "Internal server error"
// @Router /prayertimes/mosques [get]
func (ptr *PrayerTimesRouter) HandleGetAvailableMosques(w http.ResponseWriter, r *http.Request) {
	mosques, err := ptr.MosqueRepo.GetAllMosques(r.Context())
	if err != nil {
		applog.Error("Failed to get mosques", "error", err)
		api.WriteMessage(w, http.StatusInternalServerError, "error", "Failed to get mosques")
		return
	}

	// Convert to MosqueInfo for API compatibility
	mosqueInfos := make([]model.MosqueInfo, len(mosques))
	for i, mosque := range mosques {
		mosqueInfos[i] = model.MosqueInfo{
			ID:       mosque.ID,
			Name:     mosque.Name,
			Country:  mosque.Country,
			City:     mosque.City,
			Timezone: mosque.Timezone,
		}
	}

	api.WriteJSON(w, http.StatusOK, mosqueInfos)
}

// @Summary Validate mosque ID
// @Description Check if a mosque ID is valid and accessible
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Param mosqueId path string true "Mosque ID to validate"
// @Success 200 {object} model.MosqueValidationResponse "Mosque validation result"
// @Failure 400 {object} api.ErrorResponse "Invalid mosque ID"
// @Failure 404 {object} api.ErrorResponse "Mosque not found"
// @Failure 500 {object} api.ErrorResponse "Internal server error"
// @Router /prayertimes/validate/{mosqueId} [get]
func (ptr *PrayerTimesRouter) HandleValidateMosque(w http.ResponseWriter, r *http.Request) {
	mosqueId := chi.URLParam(r, "mosqueId")
	if mosqueId == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Mosque ID is required")
		return
	}

	// Try to fetch prayer times for today to validate the mosque
	today := time.Now()
	_, err := ptr.fetchPrayerTimes(mosqueId, today.Month(), today.Day())

	if err != nil {
		applog.Error("Failed to validate mosque", "error", err, "mosqueId", mosqueId)
		api.WriteJSON(w, http.StatusOK, model.MosqueValidationResponse{
			Valid: false,
			Error: err.Error(),
		})
		return
	}

	api.WriteJSON(w, http.StatusOK, model.MosqueValidationResponse{
		Valid: true,
		Error: "",
	})
}

// @Summary Get mosque information
// @Description Get detailed information about a specific mosque
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Param mosqueId path string true "Mosque ID"
// @Success 200 {object} model.MosqueInfo "Mosque information"
// @Failure 400 {object} api.ErrorResponse "Invalid mosque ID"
// @Failure 404 {object} api.ErrorResponse "Mosque not found"
// @Failure 500 {object} api.ErrorResponse "Internal server error"
// @Router /prayertimes/info/{mosqueId} [get]
func (ptr *PrayerTimesRouter) HandleGetMosqueInfo(w http.ResponseWriter, r *http.Request) {
	mosqueId := chi.URLParam(r, "mosqueId")
	if mosqueId == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Mosque ID is required")
		return
	}

	// Try to fetch prayer times to get mosque info
	today := time.Now()
	prayerTimes, err := ptr.fetchPrayerTimes(mosqueId, today.Month(), today.Day())
	if err != nil {
		applog.Error("Failed to get mosque info", "error", err, "mosqueId", mosqueId)
		api.WriteMessage(w, http.StatusNotFound, "error", "Mosque not found")
		return
	}

	// Create mosque info from prayer times data
	mosqueInfo := model.MosqueInfo{
		ID:       mosqueId,
		Name:     fmt.Sprintf("Masjid %s", mosqueId), // Default name
		Country:  "Unknown",
		City:     "Unknown",
		Timezone: prayerTimes.Timezone,
	}

	api.WriteJSON(w, http.StatusOK, mosqueInfo)
}

// @Summary Create new mosque
// @Description Create a new mosque (admin only)
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Security CookieAuth
// @Param request body model.CreateMosqueRequest true "Mosque creation request"
// @Success 201 {object} model.MosqueInfo "Mosque created successfully"
// @Failure 400 {object} api.ErrorResponse "Invalid request data"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 409 {object} api.ErrorResponse "Mosque already exists"
// @Failure 500 {object} api.ErrorResponse "Internal server error"
// @Router /prayertimes/mosques [post]
func (ptr *PrayerTimesRouter) HandleCreateMosque(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	// Check if user has admin role
	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	request, err := api.DecodeJSON[model.CreateMosqueRequest](w, r)
	if err != nil {
		return
	}

	// Check if mosque already exists
	exists, err := ptr.MosqueRepo.MosqueExists(r.Context(), request.ID)
	if err != nil {
		applog.Error("Failed to check mosque existence", "error", err)
		api.WriteInternalError(w)
		return
	}
	if exists {
		api.WriteMessage(w, http.StatusConflict, "error", "Mosque already exists")
		return
	}

	// Create mosque
	mosque := &model.Mosque{
		ID:       request.ID,
		Name:     request.Name,
		Country:  request.Country,
		City:     request.City,
		Timezone: request.Timezone,
	}

	err = ptr.MosqueRepo.CreateMosque(r.Context(), mosque)
	if err != nil {
		applog.Error("Failed to create mosque", "error", err)
		api.WriteInternalError(w)
		return
	}

	// Return mosque info
	mosqueInfo := model.MosqueInfo{
		ID:       mosque.ID,
		Name:     mosque.Name,
		Country:  mosque.Country,
		City:     mosque.City,
		Timezone: mosque.Timezone,
	}

	api.WriteJSON(w, http.StatusCreated, mosqueInfo)
}

// @Summary Delete mosque
// @Description Delete a mosque by ID (admin only)
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Security CookieAuth
// @Param mosqueId path string true "Mosque ID"
// @Success 200 {object} api.SuccessResponse "Mosque deleted successfully"
// @Failure 400 {object} api.ErrorResponse "Invalid mosque ID"
// @Failure 401 {object} api.ErrorResponse "Unauthorized"
// @Failure 403 {object} api.ErrorResponse "Forbidden - requires admin role"
// @Failure 404 {object} api.ErrorResponse "Mosque not found"
// @Failure 500 {object} api.ErrorResponse "Internal server error"
// @Router /prayertimes/mosques/{mosqueId} [delete]
func (ptr *PrayerTimesRouter) HandleDeleteMosque(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	// Check if user has admin role
	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	mosqueId := chi.URLParam(r, "mosqueId")
	if mosqueId == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Mosque ID is required")
		return
	}

	// Prevent deleting the default mosque
	setting, err := ptr.AppSettingsRepo.GetSetting(r.Context(), "default_masjid")
	if err != nil {
		applog.Error("Failed to get default masjid", "error", err)
		api.WriteInternalError(w)
		return
	}

	if mosqueId == setting.Value {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Cannot delete the default mosque")
		return
	}

	err = ptr.MosqueRepo.DeleteMosque(r.Context(), mosqueId)
	if err != nil {
		applog.Error("Failed to delete mosque", "error", err, "mosqueId", mosqueId)
		api.WriteInternalError(w)
		return
	}

	api.WriteMessage(w, http.StatusOK, "message", "Mosque deleted successfully")
}

func (ptr *PrayerTimesRouter) HandleUpdateMosque(w http.ResponseWriter, r *http.Request) {
	user, ok := utils.UserFromContext(r.Context())
	if !ok {
		applog.Error("Failed to get user from context")
		api.WriteInternalError(w)
		return
	}

	if user.Role != "admin" {
		api.WriteMessage(w, http.StatusForbidden, "error", "Admin role required")
		return
	}

	mosqueId := chi.URLParam(r, "mosqueId")
	if mosqueId == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Mosque ID is required")
		return
	}

	// Check if mosque exists
	exists, err := ptr.MosqueRepo.MosqueExists(r.Context(), mosqueId)
	if err != nil {
		applog.Error("Failed to check if mosque exists", "error", err)
		api.WriteInternalError(w)
		return
	}

	if !exists {
		api.WriteMessage(w, http.StatusNotFound, "error", "Mosque not found")
		return
	}

	// Decode the update request
	var updateRequest model.UpdateMosqueRequest
	if err := json.NewDecoder(r.Body).Decode(&updateRequest); err != nil {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Invalid request body")
		return
	}

	// Validate required fields
	if updateRequest.Name == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Name is required")
		return
	}

	if updateRequest.Country == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "Country is required")
		return
	}

	if updateRequest.City == "" {
		api.WriteMessage(w, http.StatusBadRequest, "error", "City is required")
		return
	}

	// Update the mosque
	err = ptr.MosqueRepo.UpdateMosque(r.Context(), mosqueId, &updateRequest)
	if err != nil {
		applog.Error("Failed to update mosque", "error", err)
		api.WriteInternalError(w)
		return
	}

	api.WriteMessage(w, http.StatusOK, "message", "Mosque updated successfully")
}

func (ptr *PrayerTimesRouter) fetchPrayerTimes(masjidId string, month time.Month, day int) (*model.PrayerTimesData, error) {
	url := fmt.Sprintf("https://mawaqit.net/en/m/%s", masjidId)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch from mawaqit: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("masjid %s not found", masjidId)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("upstream error: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Extract confData from HTML
	re := regexp.MustCompile(`var\s+confData\s*=\s*(\{.*?\});`)
	matches := re.FindStringSubmatch(string(body))
	if len(matches) < 2 {
		return nil, fmt.Errorf("failed to extract confData")
	}

	var confData map[string]interface{}
	if err := json.Unmarshal([]byte(matches[1]), &confData); err != nil {
		return nil, fmt.Errorf("failed to parse confData JSON: %w", err)
	}

	// Extract timezone
	timezone, ok := confData["timezone"].(string)
	if !ok {
		return nil, fmt.Errorf("timezone not found in confData")
	}

	// Extract calendar
	calendar, ok := confData["calendar"].([]interface{})
	if !ok || len(calendar) != 12 {
		return nil, fmt.Errorf("invalid calendar structure")
	}

	monthIndex := int(month) - 1
	if monthIndex < 0 || monthIndex >= 12 {
		return nil, fmt.Errorf("invalid month: %d", month)
	}

	monthData, ok := calendar[monthIndex].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid month data structure")
	}

	dayKey := strconv.Itoa(day)
	dayTimes, ok := monthData[dayKey].([]interface{})
	if !ok || len(dayTimes) < 6 {
		return nil, fmt.Errorf("day %d not found in month %d", day, month)
	}

	// Convert times to strings
	times := make([]string, len(dayTimes))
	for i, t := range dayTimes {
		if timeStr, ok := t.(string); ok {
			times[i] = timeStr
		} else {
			return nil, fmt.Errorf("invalid time format at index %d", i)
		}
	}

	// Parse times and create prayer times data
	prayerTimes := &model.PrayerTimesData{
		Timezone: timezone,
	}

	// Parse times (assuming format HH:mm)
	// Create date in the mosque's timezone
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return nil, fmt.Errorf("invalid timezone: %s", timezone)
	}
	date := time.Date(time.Now().Year(), month, day, 0, 0, 0, 0, loc)

	for i, timeStr := range times {
		if i >= 6 {
			break
		}

		parsedTime, err := time.Parse("15:04", timeStr)
		if err != nil {
			return nil, fmt.Errorf("invalid time format: %s", timeStr)
		}

		// Combine date with time in the mosque's timezone
		prayerTime := time.Date(date.Year(), date.Month(), date.Day(),
			parsedTime.Hour(), parsedTime.Minute(), 0, 0, loc)

		switch i {
		case 0:
			prayerTimes.Fajr = prayerTime
		case 1:
			prayerTimes.Shuruq = prayerTime
		case 2:
			prayerTimes.Dhuhr = prayerTime
		case 3:
			prayerTimes.Asr = prayerTime
		case 4:
			prayerTimes.Maghreb = prayerTime
		case 5:
			prayerTimes.Isha = prayerTime
		}
	}

	return prayerTimes, nil
}

// @Summary Get cache statistics
// @Description Get prayer times cache statistics
// @Tags PrayerTimes
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Cache statistics"
// @Failure 429 {object} api.ErrorResponse "Rate limit exceeded"
// @Router /prayertimes/cache/stats [get]
func (ptr *PrayerTimesRouter) HandleGetCacheStats(w http.ResponseWriter, r *http.Request) {
	stats := ptr.CacheRepo.GetStats()
	api.WriteJSON(w, http.StatusOK, stats)
}

func (ptr *PrayerTimesRouter) getPrayerTimesWithCache(masjidId string, month time.Month, day int) (*model.PrayerTimesData, error) {
	// Create cache key
	cacheKey := model.PrayerTimesCacheKey{
		MasjidID: masjidId,
		Month:    int(month),
		Day:      day,
	}

	// Try to get from cache first
	if cachedData, found := ptr.CacheRepo.GetPrayerTimes(cacheKey); found {
		applog.Info("Prayer times found in cache", "masjidId", masjidId, "month", month, "day", day)
		return cachedData, nil
	}

	// If not in cache, fetch from external API
	applog.Info("Prayer times not found in cache, fetching from external API", "masjidId", masjidId, "month", month, "day", day)
	prayerTimes, err := ptr.fetchPrayerTimes(masjidId, month, day)
	if err != nil {
		return nil, err
	}

	// Cache the result for 1 hour (prayer times don't change frequently)
	ptr.CacheRepo.SetPrayerTimes(cacheKey, prayerTimes, 1*time.Hour)

	return prayerTimes, nil
}
