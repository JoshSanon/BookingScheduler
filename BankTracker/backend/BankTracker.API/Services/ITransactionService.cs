using BankTracker.API.Models.DTOs;

namespace BankTracker.API.Services;

public interface ITransactionService
{
    Task<SyncResponse> SyncAsync(Guid userId);
    Task<TransactionListResponse> GetTransactionsAsync(Guid userId, TransactionFilter filter);
    Task UpdateCategoryAsync(Guid transactionId, Guid userId, string category);
    Task<int> CategorizeUncategorizedAsync(Guid userId);
}
