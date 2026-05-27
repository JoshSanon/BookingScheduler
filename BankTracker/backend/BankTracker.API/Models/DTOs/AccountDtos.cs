namespace BankTracker.API.Models.DTOs;

public record AccountDto(
    Guid Id,
    string BasiqAccountId,
    string Name,
    string? AccountNumber,
    string Type,
    string? Institution,
    decimal Balance,
    decimal? AvailableFunds,
    string Status,
    string Currency,
    DateTime? LastSynced,
    int TransactionCount);

public record AuthLinkResponse(string AuthUrl, DateTime ExpiresAt);

public record SyncResponse(int AccountsUpdated, int TransactionsAdded, int TransactionsUpdated);
