namespace BankTracker.API.Services;

public interface IClaudeService
{
    Task<string> CategorizeTransactionAsync(
        string description,
        string? merchantName,
        decimal amount,
        string direction,
        IEnumerable<(string Description, string Category)> similarTransactions);

    Task<Dictionary<string, string>> CategorizeTransactionsBatchAsync(
        IEnumerable<(string Id, string Description, string? MerchantName, decimal Amount, string Direction)> transactions);
}
