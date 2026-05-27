using BankTracker.API.Models.DTOs;

namespace BankTracker.API.Services;

public interface IBasiqService
{
    Task<string> CreateUserAsync(string email, string firstName, string lastName, string? mobile);
    Task<(string AuthUrl, DateTime ExpiresAt)> GetAuthLinkAsync(string basiqUserId, string redirectUri);
    Task<List<BasiqAccountData>> GetAccountsAsync(string basiqUserId);
    Task<List<BasiqTransactionData>> GetTransactionsAsync(string basiqUserId, DateTime? fromDate = null);
}
