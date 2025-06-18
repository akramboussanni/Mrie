namespace Mrie.Shared.Modals;

public class PrayerTimesData
{
    public DateTime Fajr { get; set; } = DateTime.MinValue;
    public DateTime Shuruq { get; set; } = DateTime.MinValue;
    public DateTime Dhuhr { get; set; } = DateTime.MinValue;
    public DateTime Asr { get; set; } = DateTime.MinValue;
    public DateTime Maghreb { get; set; } = DateTime.MinValue;
    public DateTime Isha { get; set; } = DateTime.MinValue;
    public string Timezone { get; set; } = string.Empty;

    public PrayerTimesData ToLocalTime()
    {
        Fajr = Fajr.ToLocalTime();
        Shuruq = Shuruq.ToLocalTime();
        Dhuhr =  Dhuhr.ToLocalTime();
        Asr = Asr.ToLocalTime();
        Maghreb = Maghreb.ToLocalTime();
        Isha = Isha.ToLocalTime();
        return this;
    }
}