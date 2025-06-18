using System.Globalization;
using System.Net;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.RegularExpressions;
using HtmlAgilityPack;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Mrie.Data;
using Mrie.Shared.Modals;
using TimeZoneConverter;

namespace Mrie.Controllers.PrayerTimes;

[ApiController]
[Route("api/v2/prayertimes")]
public class PrayerTimesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly HttpClient _http;

    public PrayerTimesController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, HttpClient http)
    {
        _context = context;
        _userManager = userManager;
        _http = http;
    }

    [HttpGet("{masjidId}")]
    public async Task<ActionResult<PrayerTimesData>> GetPrayerTime(string masjidId)
    {
        var today = DateTime.UtcNow;
        return await FetchPrayerTime(masjidId, today.Month, today.Day);
    }

    [HttpGet("{masjidId}/{day}")]
    public async Task<ActionResult<PrayerTimesData>> GetPrayerTime(string masjidId, int day)
        => await FetchPrayerTime(masjidId, DateTime.UtcNow.Month, day);

    [HttpGet("{masjidId}/{day}/{month}")]
    public async Task<ActionResult<PrayerTimesData>> GetPrayerTime(string masjidId, int day, int month)
        => await FetchPrayerTime(masjidId, month, day);

    [HttpGet("default")]
    public async Task<ActionResult> GetDefaultMasjid()
    {
        var settings = await _context.GetSettingsAsync();
        return Ok(settings.DefaultMasjid);
    }

    public async Task<ActionResult<PrayerTimesData>> FetchPrayerTime(string masjidId, int month, int day)
    {
        var client = _http;
        var url = $"https://mawaqit.net/en/m/{masjidId}";
        using var resp = await client.GetAsync(url);

        if (resp.StatusCode == HttpStatusCode.NotFound)
            return NotFound($"{masjidId} not found");

        if (resp.StatusCode != HttpStatusCode.OK)
            return StatusCode((int)resp.StatusCode, "Upstream error");

        var html = await resp.Content.ReadAsStringAsync();
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        var scriptNode = doc.DocumentNode
            .SelectSingleNode("//script[contains(text(), 'var confData')]");
        if (scriptNode == null)
            return StatusCode(500, "Script containing confData not found");

        var m = Regex.Match(
            scriptNode.InnerText,
            @"var\s+confData\s*=\s*(\{.*?\});",
            RegexOptions.Singleline
        );
        if (!m.Success)
            return StatusCode(500, $"Failed to extract confData JSON for {masjidId}");

        var jsonPayload = m.Groups[1].Value;

        try
        {
            using var confData = JsonDocument.Parse(jsonPayload);
            var root = confData.RootElement;

            if (!root.TryGetProperty("timezone", out var timezone))
                return StatusCode(500, "Timezone not found in confData");

            if (!root.TryGetProperty("calendar", out var calendar))
                return StatusCode(500, "Calendar not found in confData");

            if (calendar.ValueKind != JsonValueKind.Array || calendar.GetArrayLength() != 12)
                return StatusCode(500, "Calendar structure invalid");

            var monthIndex = month - 1; // because array index starts at 0
            if (monthIndex < 0 || monthIndex >= 12)
                return BadRequest("Invalid month value");

            var monthObj = calendar[monthIndex];

            string dayKey = day.ToString();
            if (!monthObj.TryGetProperty(dayKey, out var dayArray))
                return StatusCode(404, $"Day {day} not found in month {month}");

            if (dayArray.ValueKind != JsonValueKind.Array || dayArray.GetArrayLength() < 6)
                return StatusCode(500, "Invalid prayer times structure");

            string tz = timezone.GetString();
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                // Windows timezones r really weird, so we need to convert IANA to Windows
                if (!TZConvert.TryIanaToWindows(tz, out tz))
                    return StatusCode(500, "Invalid timezone (not client's fault). Please report this to developer :)");
            }
            var times = dayArray.EnumerateArray().Select(x => x.GetString()).ToArray();
            TimeZoneInfo tzInfo = TimeZoneInfo.FindSystemTimeZoneById(tz);

            PrayerTimesData data = new();
            try
            {
                data.Fajr = TimeStringToUtc(times[0], tzInfo);
                data.Shuruq = TimeStringToUtc(times[1], tzInfo);
                data.Dhuhr = TimeStringToUtc(times[2], tzInfo);
                data.Asr = TimeStringToUtc(times[3], tzInfo);
                data.Maghreb = TimeStringToUtc(times[4], tzInfo);
                data.Isha = TimeStringToUtc(times[5], tzInfo);
                data.Timezone = tz;
            }
            catch (Exception e)
            {
                return StatusCode(500, $"Error scraping prayer times from mawaqit: {e.Message}");
            }

            return Ok(data);
        }
        catch (JsonException)
        {
            return StatusCode(500, "Invalid JSON in confData");
        }
    }

    public static DateTime TimeStringToUtc(string time, TimeZoneInfo tz, DateTime? date = null)
    {
        if (!TimeSpan.TryParseExact(time, "hh\\:mm", CultureInfo.InvariantCulture, out var timeSpan))
            throw new FormatException("Invalid time format. Use HH:mm.");

        // Use provided date or today
        var localDate = date ?? DateTime.Today;

        // Create DateTime from date + time
        var localDateTime = new DateTime(
            localDate.Year, localDate.Month, localDate.Day,
            timeSpan.Hours, timeSpan.Minutes, 0,
            DateTimeKind.Unspecified
        );

        // Get offset and convert to UTC
        var offset = tz.GetUtcOffset(localDateTime);
        var dto = new DateTimeOffset(localDateTime, offset);
        return dto.UtcDateTime;
    }
}