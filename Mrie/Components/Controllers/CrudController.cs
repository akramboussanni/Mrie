using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mrie.Data;
using Mrie.Shared.Modals;
using Mrie.Shared.Permissions;

namespace Mrie.Components.Controllers;

[ApiController]
public abstract class CrudController<T, TId> : CrudController<T, TId, T> where T : class
{
    public CrudController(ApplicationDbContext context, UserManager<ApplicationUser> userManager) : base(context, userManager)
    {
    }
}

[ApiController]
public abstract class CrudController<T, TId, TResponse> : MrieController
    where T : class
    where TResponse : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;
    protected readonly UserManager<ApplicationUser> _userManager;

    public CrudController(ApplicationDbContext context, UserManager<ApplicationUser> userManager) : base(context, userManager)
    {
        _context = context;
        _dbSet = context.Set<T>();
        _userManager = userManager;
    }


    // Thank CoPilot for ALL of the documentation.
    // I would never have been able to write this without it.
    // The 2 comments above have also been written by CoPilot.
    #region Holy yap
    /// <summary>
    /// This property indicates whether access tokens are allowed to access the API.
    /// If set to false, the API will only allow access through authenticated users.
    /// </summary>
    protected virtual bool AllowAccessTokens => true;

    /// <summary>
    /// This method is used to strip fields from the input entity before processing it.
    /// </summary>
    /// <remarks>
    /// This method is called by default by <see cref="PreUpdate"/>, <see cref="PreCreate"/>, and <see cref="PreGet"/> if not overriden.
    /// </remarks>
    protected virtual T PreAll(T input) => input;

    /// <summary>
    /// This method is used to strip fields from the input entity before updating it.
    /// It is called in the <see cref="Update"> method to ensure that only the fields that should be updated are modified.
    /// </summary>
    protected virtual T PreUpdate(T input, T original) => PreAll(input);

    /// <summary>
    /// This method is used to strip fields from the input entity before creating it.
    /// It is called in the <see cref="Create"> method to ensure that only the fields that should be set during creation are included.
    /// </summary>
    /// <remarks>If not overridden, it will call <see cref="PreAll">.</remarks>
    protected virtual T PreCreate(T input) => PreAll(input);

    /// <summary>
    /// This method is used to strip fields from the input entity when retrieving it.
    /// It is called in the <see cref="Get"> method to ensure that only the fields that should be returned are included.
    /// </summary>
    /// <remarks>If not overridden, it will call <see cref="PreAll">.</remarks>
    protected virtual T PreGet(T input) => PreAll(input);

    /// <summary>
    /// This method is used to change the query used to retrieve all entities.
    /// It can be overridden to apply additional filters, sorting, or other query modifications.
    /// </summary>
    /// <returns>The <see cref="IQueryable{T}"/> for the entity type.</returns>
    protected virtual IQueryable<T> GetAllQueryable() => _dbSet.AsQueryable();

    /// <summary>
    /// This method is called before the <see cref="Create"> method creates an entity.
    /// It can be overridden to perform additional actions, such as logging or modifying the entity before it is added to the database.
    /// </summary>
    /// <param name="entity">The entity to create.</param>
    protected virtual Task<CreateResponseData<T, TResponse>?> OnCreateAsync(T entity, ApplicationUser? user) => Task.FromResult<CreateResponseData<T, TResponse>?>(null);

    /// <summary>
    /// This method is called after the <see cref="Update"> method updates an entity.
    /// It can be overridden to perform additional actions, such as logging or modifying the entity.
    /// </summary>
    protected virtual Task OnUpdateAsync(T entity, T existing, ApplicationUser? user) => Task.CompletedTask;

    /// <summary>
    /// Gets the required permission for <see cref="GetAll">, <see cref="Create">, <see cref="Update">, and <see cref="Delete"> methods.
    /// If a method-specific permission is not defined, this will be used as a fallback.
    /// </summary>
    /// <remarks>
    /// This does not affect the <see cref="Get"> method, which defaults to <see cref="PermissionType.None"/>.
    /// </remarks>
    protected virtual PermissionType GeneralRequiredPermission => PermissionType.None;
    /// <summary>
    /// If set, this permission is required for the <see cref="Get"> method.
    /// </summary>
    protected virtual PermissionType HttpGetRequiredPermission => PermissionType.None;
    /// <summary>
    /// If set, this permission is required for the <see cref="GetAll"> method.
    /// If not set, the <see cref="GeneralRequiredPermission"> will be used as a fallback.
    /// </summary>
    protected virtual PermissionType HttpGetAllRequiredPermission => PermissionType.None;
    /// <summary>
    /// If set, this permission is required for the <see cref="Post"> method.
    /// If not set, the <see cref="GeneralRequiredPermission"> will be used as a fallback.
    /// </summary>
    protected virtual PermissionType HttpPostRequiredPermission => PermissionType.None;
    /// <summary>
    /// If set, this permission is required for the <see cref="Patch"> method.
    /// If not set, the <see cref="GeneralRequiredPermission"> will be used as a fallback.
    /// </summary>
    protected virtual PermissionType HttpPatchRequiredPermission => PermissionType.None;
    /// <summary>
    /// If set, this permission is required for the <see cref="Delete"> method.
    /// If not set, the <see cref="GeneralRequiredPermission"> will be used as a fallback.
    /// </summary>
    protected virtual PermissionType HttpDeleteRequiredPermission => PermissionType.None;
    #endregion



    protected virtual PermissionType GetPermissionToCheck(PermissionType permission, PermissionType fallback)
    {
        if (permission != PermissionType.None)
            return permission;

        return fallback;
    }

    [HttpGet]
    public virtual async Task<IActionResult> GetAll()
    {
        if (!await HasPermission(GetPermissionToCheck(HttpGetAllRequiredPermission, GeneralRequiredPermission)))
            return Forbid();

        return Ok(await GetAllQueryable().ToListAsync());
    }

    [HttpGet("{id}")]
    public virtual async Task<IActionResult> Get(TId id)
    {
        if (!await HasPermission(GetPermissionToCheck(HttpGetRequiredPermission, PermissionType.None)))
            return Forbid();

        var entity = await _dbSet.FindAsync(id);
        if (entity == null) return NotFound();
        return Ok(entity);
    }

    [HttpPost]
    public virtual async Task<IActionResult> Create([FromBody] T input)
    {
        var (authorized, user) = await UserHasPermission(GetPermissionToCheck(HttpPostRequiredPermission, GeneralRequiredPermission));
        if (!authorized)
            return Forbid();

        input = PreCreate(input);

        CreateResponseData<T, TResponse> result = null;
        try
        {
            result = await OnCreateAsync(input, user);
        }
        catch (OperationRejectedException e)
        {
            return BadRequest(e.Message);
        }
        await _dbSet.AddAsync(input);
        await _context.SaveChangesAsync();

        if (result != null)
            return Ok(result);

        return CreatedAtAction(nameof(Get), new { id = GetId(input) }, input);
    }

    [HttpPatch("{id}")]
    public virtual async Task<IActionResult> Update(TId id, [FromBody] T input)
    {
        var (authorized, user) = await UserHasPermission(GetPermissionToCheck(HttpPatchRequiredPermission, GeneralRequiredPermission));
        if (!authorized) return Forbid();
        var existing = await _dbSet.FindAsync(id);

        if (existing == null)
            return NotFound();

        input = PreUpdate(input, existing);

        try
        {
            await OnUpdateAsync(input, existing, user);
        }
        catch (OperationRejectedException e)
        {
            return BadRequest(e.Message);
        }

        _context.Entry(existing).CurrentValues.SetValues(input);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public virtual async Task<IActionResult> Delete(TId id)
    {
        if (!await HasPermission(GetPermissionToCheck(HttpDeleteRequiredPermission, GeneralRequiredPermission))) return Forbid();
        var entity = await _dbSet.FindAsync(id);

        if (entity == null)
            return NotFound();

        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Despite that this is virtual, you SHOULD override this method to provide a way to get the ID of the entity.
    /// It uses reflection and is very slow. IT WILL cause errors in prod if not overridden.
    /// </summary>
    protected virtual TId GetId(T entity)
    {
        return (TId)entity.GetType().GetProperty("Id")!.GetValue(entity)!;
    }
}
