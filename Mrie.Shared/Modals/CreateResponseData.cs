namespace Mrie.Shared.Modals;

public class CreateResponseData<T, TData>
    where T : class
    where TData : class
{
    public TData Data { get; set; }
    public T Entity { get; set; }

    public CreateResponseData(T entity, TData data)
    {
        Data = data;
        Entity = entity;
    }
    public CreateResponseData()
    {
    }
}