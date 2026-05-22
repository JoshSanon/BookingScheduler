namespace BankTracker.API.Models.DTOs;

public record TransactionDto(
    Guid Id,
    string BasiqTransactionId,
    decimal Amount,
    string Description,
    string? MerchantName,
    DateTime Date,
    string? BasiqCategory,
    string? AiCategory,
    string? UserCategory,
    string EffectiveCategory,
    bool IsUserEdited,
    bool IsPending,
    string Direction,
    Guid BankAccountId,
    string? AccountName,
    string? Institution);

public record UpdateCategoryRequest(string Category);

public record TransactionListResponse(
    List<TransactionDto> Transactions,
    int Total,
    decimal TotalSpent,
    decimal TotalIncome,
    Dictionary<string, decimal> SpendingByCategory);

public record TransactionFilter(
    string? Category = null,
    string? SearchTerm = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    Guid? AccountId = null,
    string? Direction = null,
    int Page = 1,
    int PageSize = 50);
