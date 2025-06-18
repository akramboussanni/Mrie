using System.Text.RegularExpressions;

namespace Mrie.Shared.Modals.LabRador.Results;

public class LabRadorResult
{
    public string ErrorsFound { get; set; } = "";
    public string AnalyseResultat { get; set; } = "";
    public string AnalyseDemarche { get; set; } = "";
    public string Conclusion { get; set; } = "";
    public string Calculs { get; set; } = "";
    public LabRadorState State { get; set; }

    public static LabRadorResult? FromString(string text)
    {
        if (text == "NA")
            return null;

        LabRadorResult result = new LabRadorResult();
        string pattern = @"\[\[(MISTAKE_FINDER|ANALYSE_RESULTATS|ANALYSE_DEMARCHES|CONCLUSION|CALCULS)\]\]";
        var regex = new Regex(pattern);
        var matches = regex.Matches(text);

        for (int i = 0; i < matches.Count; i++)
        {
            var start = matches[i].Index + matches[i].Length;
            var end = (i + 1 < matches.Count) ? matches[i + 1].Index : text.Length;
            var sectionName = matches[i].Groups[1].Value;
            var sectionContent = text.Substring(start, end - start).Trim();

            switch (sectionName)
            {
                case "MISTAKE_FINDER":
                    result.ErrorsFound = sectionContent;
                    break;
                case "ANALYSE_RESULTATS":
                    result.AnalyseResultat = sectionContent;
                    break;
                case "ANALYSE_DEMARCHES":
                    result.AnalyseDemarche = sectionContent;
                    break;
                case "CONCLUSION":
                    result.Conclusion = sectionContent;
                    break;
                case "CALCULS":
                    result.Calculs = sectionContent;
                    break;
            }
        }

        return result;
    }
    public static LabRadorResult operator +(LabRadorResult res1, LabRadorResult res2)
    {
        res1.ErrorsFound += res2.ErrorsFound;
        res1.AnalyseResultat += res2.AnalyseResultat;
        res1.AnalyseDemarche += res2.AnalyseDemarche;
        res1.Conclusion +=  res2.Conclusion;
        res1.State = res2.State;
        return res1;
    }
}