using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Mrie.Data;
using Mrie.Shared.Modals;
using Mrie.Shared.Modals.ConditionalAuth;
using Mrie.Shared.Permissions;

namespace Mrie;

public static class Extensions
{
    public static async Task<(bool, ApplicationUser?)> CheckNullAndPermission(this UserManager<ApplicationUser> userManager, ClaimsPrincipal claims, PermissionType permission)
    {
        var user = await userManager.GetUserAsync(claims);
        return (user != null && user.HasPermission(permission), user);
    }

    public static bool IsAuthorized(this ConditionalAuthObject obj, ApplicationUser? user)
    {
        if (!obj.RequireAuth)
            return true;

        if (user == null)
            return false;

        return obj.AuthorizedUsers.Contains(user.Id) || user.IsAdmin;
    }
    
    public static async Task CreateDefaultSettings(ApplicationDbContext db)
    {
        await db.SettingsSet.AddAsync(DefaultSettings);
        await db.SaveChangesAsync();
    }

    public static AppSettings DefaultSettings = new()
    {
        Id = 1,
        LabRadorDailyLimit = 5,
        LabRadorCharacterLimit = 25000,
        LabRadorInstructionCharacterLimit = 15000,
        LabRadorInstructionBase = """
                                  **Master Instruction:**  
                                  The user can provide extra instructions that specify how to generate content for the sections outlined in the fixed structure of the lab report. However, if the user requests the generation of an additional section not included in the specified structure, or if they provide instructions that are irrelevant to generating the content for the defined sections, please respond only with NA.
                                  Always start each section with a unique tag in the format:  
                                  `[[SECTION_NAME]]` 
                                  (SECTION_NAME = {sections}).  
                                  Output all requested sections underneath, do not leave any out. Do **not** add extra explanations or transformations.  
                                  Within each section, avoid additional formatting or list markers.

                                  *General Parameters:*  
                                  - Respect word limits ({wordmin}–{wordmax} or section-specific if provided).  
                                  - Use French at {frlvl}:  
                                    *Faible* = niveau débutant, phrases très simples, erreurs typiques/expressions orales.  
                                    *Moyen* = étudiant secondaire 5, français standard.  
                                    *Fort* = cégep/début universitaire, vocabulaire avancé, syntaxe complexe.  
                                  - User input includes: full draft report, description of graphs.  
                                  - Only output sections requested by the prompt/code (not all sections every time).
                                  """,
        LabRadorErrorFinderInstruction = """
                                         **[[MISTAKE_FINDER]]**  
                                         Liste seulement les erreurs présentes dans le rapport, pas d’améliorations.  
                                         - Constantes/variables dépendantes et indépendantes correctes.  
                                         - Toute équation calculée doit être annoncée en cadre théorique.
                                         - Absence d’hypothèse : toujours vérifier avec l’utilisateur si intentionnelle.
                                         - Chiffres significatifs : partout cohérent, surtout dans les tableaux/incertitudes.
                                         - Incertitudes : signaler toute donnée ou calcul sans incertitude (sauf si justifié), résultat final = absolue obligatoire.  
                                         - Titres appropriés pour graphiques/tableaux (ex: "axe y selon axe x").
                                         - Vérifie calcul des incertitudes et chiffres significatifs (absolue = même nombre de chiffre que le résultat, relative = 2 décimales).  
                                         - Protocole doit refléter précisément la méthode utilisée.  
                                         - Hypothèse et but reliés, données rejetées justifiées, analyse complète.  
                                         - Différences de chiffres/incertitudes entre instruments acceptées.
                                         - Oublis d’explications : si pertinent, AJOUTE à l’analyse, sinon signale ici.
                                         - Ne signale que les erreurs du RAPPORT (pas de la méthode de labo).
                                         - Ignore toute erreur non explicitement présente dans le texte soumis.
                                         Donne seulement la liste d’erreurs et corrections recommandées.
                                         """,
        LabRadorAnalyseResultatInstruction = """
                                             **[[ANALYSE_RESULTATS]]**  
                                             Paragraphes continus, aucune mise en page spéciale.  
                                             - Décris relations des graphiques (proportionnel, linéaire, etc).  
                                             - Analyse incertitudes (absolues/relatives), signification du %, impact.  
                                             - Explique origine/utilité calculs/formules non annoncés en cadre théorique.  
                                             - Compare valeurs expérimentales vs théoriques.  
                                             - Explique tableaux, justifie données rejetées.  
                                             - Précisions des instruments et impact sur calculs.  
                                             - Ajoute tout point essentiel au but du laboratoire.  
                                             Respecte {wordmin}–{wordmax} mots.
                                             """,
        LabRadorAnalyseDemarcheInstruction = """
                                             **[[ANALYSE_DEMARCHES]]**  
                                             Trois courts paragraphes (~200 mots) décrivant 3 sources d’erreurs possibles et leur solution, en utilisant celles de l’utilisateur ou en inventant si besoin.
                                             """,
        LabRadorConclusionInstruction = """
                                        **[[CONCLUSION]]**  
                                        Deux paragraphes max (~200 mots, excéder si nécessaire) :  
                                        - Confirme ou infirme chaque point de l’hypothèse (si elle existe).  
                                        - Résume le but du laboratoire et le résultat principal.
                                        """,
        LabRadorCalculsInstruction = """
                                     **[[CALCULS]]**
                                     - Essayer de déterminer seul quels sont les calculs à faire grâce aux résultats et au but.
                                     - Si fourni, utiliser les templates données par l'utilisateur dans la section d'instructions de l'utilisateur.
                                     """,
        DefaultMasjid = "aylmer-mosque-gatineau-j9h-4j6-canada"
    };
}